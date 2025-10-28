from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status,viewsets, filters, permissions
# SimpleJWT helper
from rest_framework_simplejwt.tokens import RefreshToken
from PIL import Image
import io, uuid
from .models import Style
from .serializers import StyleSerializer
from .serializers import RegisterSerializer
from .serializers import LoginSerializer
from .models import Photo, ClothingItem,Outfit
from .serializers import PhotoSerializer, ClothingItemCreateSerializer,ClothingItemDetailSerializer,OutfitCreateSerializer,OutfitSerializer,OutfitListSerializer
from .models import User
from .models import Weather
from django.shortcuts import get_object_or_404
from django.utils.dateparse import parse_date
from django.conf import settings
from .serializers import WeatherSerializer
from rest_framework.pagination import PageNumberPagination
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.db import transaction
from outfit_planner import generate_outfit_recommendation



class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200
@api_view(['GET'])
def hello(request):
    return Response({"message": "Hello from Django!"})

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Valida credenciales y devuelve tokens JWT (access + refresh) junto con datos públicos del usuario.
        Frontend debe guardar el access token y usarlo en Authorization header.
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # buscar usuario por email y validar password (mantén tu lógica)
        user = get_object_or_404(User, email=email)
        if not user.check_password(password):
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        # Generar tokens JWT para el usuario
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response({
            "user": {
                "id": user.id,
                "email": user.email,
                "name": getattr(user, "name", None),
            },
            "access": access_token,
            "refresh": refresh_token,
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Registra usuario y devuelve tokens JWT (auto-login).
        """
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generar tokens JWT para el usuario recién creado (auto-login)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        return Response({
            "user": {
                "id": user.id,
                "email": user.email,
                "name": getattr(user, "name", None),
            },
            "access": access_token,
            "refresh": refresh_token,
        }, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Requiere Authorization: Bearer <access_token>.
    Devuelve info del usuario autenticado (current user).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "name": getattr(user, "name", None),
        })
class WeatherViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list: GET /api/weather/  -> list weather entries (paginated)
    retrieve: GET /api/weather/{pk}/ -> details for a single weather entry
    Supports query params:
      - date_from=YYYY-MM-DD
      - date_to=YYYY-MM-DD
      - condition=partly%20cloudy   (exact match, case-insensitive)
      - min_temp=10
      - max_temp=30
      - ordering=temperature or ordering=-date
      - page, page_size
    """
    queryset = Weather.objects.all().order_by("-date")
    serializer_class = WeatherSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # date range
        date_from = params.get("date_from")
        date_to = params.get("date_to")
        if date_from:
            d = parse_date(date_from)
            if d:
                qs = qs.filter(date__gte=d)
        if date_to:
            d = parse_date(date_to)
            if d:
                qs = qs.filter(date__lte=d)

        # condition (case-insensitive contains or exact):
        condition = params.get("condition")
        if condition:
            # use icontains for flexible matching
            qs = qs.filter(conditions__icontains=condition)

        # temperature range
        min_temp = params.get("min_temp")
        max_temp = params.get("max_temp")
        if min_temp is not None:
            try:
                qs = qs.filter(temperature__gte=float(min_temp))
            except ValueError:
                pass
        if max_temp is not None:
            try:
                qs = qs.filter(temperature__lte=float(max_temp))
            except ValueError:
                pass

        # ordering
        ordering = params.get("ordering")  # e.g. "temperature" or "-date"
        if ordering:
            # validate basic field names to avoid injection
            allowed = {"date","temperature","feels_like","humidity","wind","cloudiness","uv_index","created_at"}
            key = ordering.lstrip("-")
            if key in allowed:
                qs = qs.order_by(ordering)

        return qs
class SmallPagination(PageNumberPagination):
    page_size = 30
    page_size_query_param = "page_size"
    max_page_size = 200

class StyleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Style.objects.all().order_by("name")
    serializer_class = StyleSerializer
    pagination_class = SmallPagination

    # permite ?search=casual (busca en name) y ?event_type=work
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "event_type"]
    ordering_fields = ["name", "id"]
DEFAULT_PERMISSIONS = []

class PhotoCreateAndAttachView(APIView):
    permission_classes = DEFAULT_PERMISSIONS

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        assign_item = request.data.get("assign_item")  # opcional

        if not uploaded_file:
            return Response({"detail":"No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Validaciones
        allowed = getattr(settings, "ALLOWED_IMAGE_TYPES", ("image/jpeg","image/png","image/webp"))
        max_size = getattr(settings, "MAX_UPLOAD_SIZE", 5 * 1024 * 1024)
        if uploaded_file.content_type not in allowed:
            return Response({"detail":"Tipo de archivo no permitido"}, status=status.HTTP_400_BAD_REQUEST)
        if uploaded_file.size > max_size:
            return Response({"detail":"Archivo demasiado grande"}, status=status.HTTP_400_BAD_REQUEST)

        # Crear Photo
        photo = Photo()
        photo.original_name = uploaded_file.name
        photo.content_type = uploaded_file.content_type
        photo.size = uploaded_file.size

        try:
            # filename seguro
            ext = uploaded_file.name.split('.')[-1] if '.' in uploaded_file.name else ''
            filename = f"{uuid.uuid4().hex}{('.' + ext) if ext else ''}"
            photo.file.save(filename, uploaded_file, save=False)
            photo.save()
        except Exception as e:
            return Response({"detail":"Error guardando archivo","error":str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Generar thumbnail (intenta; no crítico)
        try:
            with default_storage.open(photo.file.name, "rb") as f:
                img = Image.open(f)
                img = img.convert("RGB")
                img.thumbnail((400,400))
                thumb_io = io.BytesIO()
                img.save(thumb_io, format="JPEG", quality=85)
                thumb_name = f"thumb_{uuid.uuid4().hex}.jpg"
                photo.thumbnail.save(thumb_name, ContentFile(thumb_io.getvalue()), save=True)
        except Exception as e:
            # loggear si hace falta
            print("Thumbnail failed:", e)

        # Asociar a ClothingItem si se pidió
        if assign_item:
            try:
                item = ClothingItem.objects.get(pk=int(assign_item))
                photo.clothing_items.add(item) if False else None  # (no usamos M2M) -> en este diseño usamos FK en ClothingItem
                # Asignar FK
                item.photo = photo
                item.save(update_fields=["photo","updated_at"])
            except ClothingItem.DoesNotExist:
                # devolvemos la foto creada y aviso
                serializer = PhotoSerializer(photo, context={"request": request})
                return Response({"photo": serializer.data, "warning": f"ClothingItem {assign_item} no existe; foto creada sin asociar"}, status=status.HTTP_201_CREATED)

        serializer = PhotoSerializer(photo, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ClothingItemPhotoUpload(APIView):
    """
    POST /api/clothing-items/<item_id>/upload-photo/
    - multipart/form-data con 'file' (obligatorio) y opcionales:
        last_used (YYYY-MM-DD), height (float), width (float),
        formality (string), main_color (string),
        secondary_colors (puede repetirse: secondary_colors=red&secondary_colors=blue)
    - Requiere Authorization: Bearer <access_token>.
    - Verifica que request.user sea el owner del ClothingItem.
    - Crea Photo, genera thumbnail, asigna item.photo y actualiza campos opcionales.
    - Devuelve ClothingItem serializado.
    """
    permission_classes = DEFAULT_PERMISSIONS

    def post(self, request, item_id):
        item = get_object_or_404(ClothingItem, pk=item_id)

        # 1) Verificar propietario (evitar que cualquiera reasigne fotos)
        if item.user_id != request.user.id:
            return Response({"detail": "No permission to modify this item."}, status=status.HTTP_403_FORBIDDEN)

        # 2) Archivo
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"detail":"No file provided (field 'file')"}, status=status.HTTP_400_BAD_REQUEST)

        # 3) Validaciones básicas
        allowed = getattr(settings, "ALLOWED_IMAGE_TYPES", ("image/jpeg","image/png","image/webp"))
        max_size = getattr(settings, "MAX_UPLOAD_SIZE", 5 * 1024 * 1024)
        if uploaded_file.content_type not in allowed:
            return Response({"detail":"Tipo de archivo no permitido"}, status=status.HTTP_400_BAD_REQUEST)
        if uploaded_file.size > max_size:
            return Response({"detail":"Archivo demasiado grande"}, status=status.HTTP_400_BAD_REQUEST)

        # 4) Crear Photo
        photo = Photo()
        photo.original_name = uploaded_file.name
        photo.content_type = uploaded_file.content_type
        photo.size = uploaded_file.size
        ext = uploaded_file.name.split('.')[-1] if '.' in uploaded_file.name else ''
        filename = f"{uuid.uuid4().hex}{('.' + ext) if ext else ''}"
        try:
            photo.file.save(filename, uploaded_file, save=False)
            photo.save()
        except Exception as e:
            return Response({"detail":"Error guardando archivo", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 5) Generar thumbnail (intento; no crítico)
        try:
            with default_storage.open(photo.file.name, "rb") as f:
                img = Image.open(f)
                img = img.convert("RGB")
                img.thumbnail((400,400))
                thumb_io = io.BytesIO()
                img.save(thumb_io, format="JPEG", quality=85)
                thumb_name = f"thumb_{uuid.uuid4().hex}.jpg"
                photo.thumbnail.save(thumb_name, ContentFile(thumb_io.getvalue()), save=True)
        except Exception as e:
            # log si querés; no abortar
            print("Thumbnail failed:", e)

        # 6) Asignar photo al item
        # (podés borrar/archivar la anterior aquí si lo deseas)
        item.photo = photo

        # 7) Actualizar campos opcionales si vinieron en request.POST
        # (vienen como strings; convertimos cuando es necesario)
        data = request.POST  # para multipart, los campos no-file están en request.POST
        modified = False
        if "last_used" in data:
            try:
                item.last_used = datetime.strptime(data.get("last_used"), "%Y-%m-%d").date()
                modified = True
            except Exception:
                pass  # ignorar conversión inválida (podés reportar error si prefieres)
        if "height" in data:
            try:
                item.height = float(data.get("height"))
                modified = True
            except Exception:
                pass
        if "width" in data:
            try:
                item.width = float(data.get("width"))
                modified = True
            except Exception:
                pass
        if "formality" in data:
            item.formality = data.get("formality")
            modified = True
        if "main_color" in data:
            item.main_color = data.get("main_color")
            modified = True
        # secondary_colors puede recibirse repetido en form-data
        # ej: secondary_colors=red&secondary_colors=blue
        sec_colors = request.POST.getlist("secondary_colors")
        if sec_colors:
            item.secondary_colors = sec_colors
            modified = True

        # 8) Guardar item (photo ya creado)
        save_fields = ["photo", "updated_at"]
        if modified:
            # incluir campos actualizados en save
            # simplificamos pidiendo item.save() completo (hogar de performance si querés update_fields)
            item.save()
        else:
            item.save(update_fields=save_fields)

        # 9) Devolver item serializado
        serializer = ClothingItemCreateSerializer(item, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ClothingItemDetail(APIView):
    permission_classes = DEFAULT_PERMISSIONS

    def get(self, request, item_id):
        item = get_object_or_404(ClothingItem, pk=item_id)
        serializer = ClothingItemDetailSerializer(item, context={"request": request})
        return Response(serializer.data)
class UserClothingItemsList(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        items = ClothingItem.objects.filter(user=request.user).select_related("photo")
        serializer = ClothingItemDetailSerializer(items, many=True, context={"request": request})
        return Response(serializer.data)
class ClothingItemCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # asigna request.user automáticamente
    print("entre")
    def post(self, request, *args, **kwargs):
        serializer = ClothingItemCreateSerializer(data=request.data, context={"request": request, "user": request.user})
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                item = serializer.save()
        except Exception as e:
            return Response({"detail":"Error creating item","error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        out = ClothingItemCreateSerializer(item, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)
class OutfitCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = OutfitCreateSerializer(data=request.data, context={"request": request, "user": request.user})
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                outfit = serializer.save()
        except Exception as e:
            return Response({"detail": "Error creating outfit", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        out = OutfitSerializer(outfit, context={"request": request})
        return Response(out.data, status=status.HTTP_201_CREATED)
    



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommend_outfit(request):
    """
    Endpoint que recomienda un outfit basado en el clima y prendas del usuario.
    Devuelve solo los IDs de las prendas recomendadas.
    """
    user = request.user

    # Obtener prendas del usuario
    clothing_items = ClothingItem.objects.filter(user=user)

    # Check for tops and bottoms with case-insensitive matching and also check type names
    has_top = clothing_items.filter(
        type__category__iexact="Top"
    ).exists() or clothing_items.filter(
        type__name__icontains="shirt"
    ).exists() or clothing_items.filter(
        type__name__icontains="t-shirt"
    ).exists()

    has_bottom = clothing_items.filter(
        type__category__iexact="Bottom"
    ).exists() or clothing_items.filter(
        type__name__icontains="pants"
    ).exists() or clothing_items.filter(
        type__name__icontains="jeans"
    ).exists()

    # Debug info
    total_items = clothing_items.count()
    print(f"User {user.id} has {total_items} items total")
    if total_items > 0:
        # Show what we have
        for item in clothing_items:
            print(f"Item {item.id}: type={item.type.name}, category={item.type.category}")

    if not has_top or not has_bottom:
        return Response(
            {"detail": "You need at least one top and one bottom.", 
             "debug": {"total_items": total_items, "has_top": has_top, "has_bottom": has_bottom}},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = ClothingItemDetailSerializer(clothing_items, many=True)
    clothing_data = serializer.data  # esta es la lista de dicts como tu GET

    # Obtener clima actual (puedes ajustar esto según tu modelo Weather)
    # Aquí se toma el último registro del usuario
    weather_qs = Weather.objects.all().order_by("-date")
    if weather_qs.exists():
        latest_weather = weather_qs.first()
        weather_info = f"{latest_weather.conditions}, {latest_weather.temperature}°F"
    else:
        weather_info = "Sunny, 75°F"  # fallback

    # Llamar a la función de recomendación
    recommended_ids = generate_outfit_recommendation(weather_info, clothing_data)
    print(f"Recommended IDs: {recommended_ids}")
    return Response({"recommended_ids": recommended_ids})

class OutfitListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Traer solo los outfits del usuario autenticado
        outfits = Outfit.objects.filter(user=request.user).prefetch_related(
            "clothing_items__photo", "clothing_items__type"
        )
        serializer = OutfitListSerializer(outfits, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

"""
Vistas y comportamiento

PhotoCreateAndAttachView (POST /api/photos/):
- Recibe multipart/form-data con:
    - file (obligatorio): archivo de imagen
    - assign_item (opcional): id del ClothingItem a asociar
- Pasos:
    1) Validar que existió 'file'
    2) Validar content-type (ALLOWED_IMAGE_TYPES) y tamaño (MAX_UPLOAD_SIZE)
    3) Crear Photo: guardar metadata (original_name, content_type, size)
    4) photo.file.save(...) -> almacena el archivo en el storage configurado
    5) Intentar generar thumbnail (no crítico; errores se registran pero no abortan)
    6) Si assign_item fue enviado:
         - buscar ClothingItem (404 si no existe?)
         - asignar item.photo = photo y guardar
    7) Devolver PhotoSerializer(photo)

ClothingItemPhotoUpload (POST /api/clothing-items/<id>/upload-photo/):
- Recibe multipart/form-data con: file
- Pasos:
    1) Validaciones (igual que arriba)
    2) Crear Photo y thumbnail
    3) Asignar item.photo = photo (reemplaza la referencia)
    4) Guardar item y devolver ClothingItemSerializer(item)

ClothingItemDetail (GET /api/clothing-items/<id>/):
- Devuelve la representación del ClothingItem con nested Photo
- Útil para el frontend que renderiza la prenda con su imagen

Consideraciones de seguridad:
- permissions: usar IsAuthenticated/IsOwner según necesidad; para pruebas AllowAny.
- protección CSRF: si usas session auth y fetch con cookies, pasar credentials.
- Validar MIME no solo por uploaded_file.content_type — opcionalmente intentar
  abrir la imagen con Pillow (Image.open) y validar formato.
- No ejecutar comandos shell con nombres de archivos.

Manejo de errores:
- Si fallo al guardar -> devolver 500 con mensaje controlado
- Si thumbnail falla -> loggear y devolver 201/200 (no crítico)

Estrategias para evitar fotos huérfanas:
- Al reasignar photo a un item: opcionalmente eliminar la Photo anterior (si nadie más
  la referencia) -> implementar helper que verifique referencias y borre el archivo
  y la fila.
- Cron o management command para eliminar photos sin relaciones.
"""
