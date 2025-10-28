from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import validate_email
from django.db import transaction
from .models import User
from .models import Weather
from .models import Style
from .models import Photo, ClothingItem,ClothingType, Outfit, OutfitClothing


class StyleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Style
        fields = ["id", "name", "color_palette", "event_type"]
        read_only_fields = fields
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "name", "password", "password_confirm", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_email(self, value):
        validate_email(value)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value.lower()

    def validate(self, attrs):
        pw = attrs.get("password")
        pw2 = attrs.pop("password_confirm", None)
        if pw != pw2:
            raise serializers.ValidationError({"password_confirm": "Password confirmation does not match."})
        validate_password(pw)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        # create user (this saves and assigns a PK)
        with transaction.atomic():
            user = User.objects.create(**validated_data)
            # now user has a PK, safe to call set_password which does save(update_fields=['password'])
            user.set_password(password)
        return user



class WeatherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Weather
        fields = [
            "id",
            "date",
            "temperature",
            "feels_like",
            "humidity",
            "wind",
            "conditions",
            "precipitation_prob",
            "cloudiness",
            "uv_index",
            "created_at",
        ]
        read_only_fields = fields
from rest_framework import serializers
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import io, uuid
from PIL import Image

from .models import Photo, ClothingItem

# -----------------------
# PhotoSerializer (mejorado)
# -----------------------
class PhotoSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    # relación inversa: lista de clothing item ids que referencian esta foto
    clothing_items = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Photo
        fields = ["id", "file", "file_url", "thumbnail_url", "original_name", "content_type", "size", "uploaded_at", "clothing_items"]
        read_only_fields = ["id", "file_url", "thumbnail_url", "uploaded_at", "clothing_items"]

    def get_file_url(self, obj):
        if not obj.file:
            return None
        try:
            return obj.file.url
        except Exception:
            return default_storage.url(obj.file.name)

    def get_thumbnail_url(self, obj):
        if not obj.thumbnail:
            return None
        try:
            return obj.thumbnail.url
        except Exception:
            return default_storage.url(obj.thumbnail.name)


# -----------------------------
# ClothingItemSerializer (lectura)
# -----------------------------
class ClothingItemCreateSerializer(serializers.ModelSerializer):
    # campo para recibir archivo en multipart/form-data
    photo_file = serializers.ImageField(write_only=True, required=False, allow_null=True)
    secondary_colors = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = ClothingItem
        fields = [
            "id",
            "type",
            "last_used",
            "height",
            "width",
            "formality",
            "main_color",
            "secondary_colors",
            "photo_file",
        ]
        read_only_fields = ["id"]

    def _create_photo_from_file(self, uploaded_file):
        """Crea Photo, guarda archivo y genera thumbnail. Retorna Photo."""
        photo = Photo()
        photo.original_name = uploaded_file.name
        photo.content_type = uploaded_file.content_type
        photo.size = uploaded_file.size

        ext = uploaded_file.name.split('.')[-1] if '.' in uploaded_file.name else ''
        filename = f"{uuid.uuid4().hex}{('.' + ext) if ext else ''}"
        photo.file.save(filename, uploaded_file, save=False)
        photo.save()

        # generar thumbnail (no crítico)
        try:
            with default_storage.open(photo.file.name, "rb") as f:
                img = Image.open(f)
                img = img.convert("RGB")
                img.thumbnail((400, 400))
                thumb_io = io.BytesIO()
                img.save(thumb_io, format="JPEG", quality=85)
                thumb_name = f"thumb_{uuid.uuid4().hex}.jpg"
                photo.thumbnail.save(thumb_name, ContentFile(thumb_io.getvalue()), save=True)
        except Exception:
            # loguear si tenés logger; no abortar
            pass

        return photo

    def create(self, validated_data):
        # poppear photo_file si vino
        uploaded_file = validated_data.pop("photo_file", None)

        # el user debe venir inyectado por la view en context o la view hará serializer.save(user=request.user)
        request_user = self.context.get("user") or (self.context.get("request").user if self.context.get("request") else None)

        # crear ClothingItem sin la photo aun
        item = ClothingItem.objects.create(user=request_user, **validated_data)

        # si vino archivo, crear Photo y asignar
        if uploaded_file:
            photo = self._create_photo_from_file(uploaded_file)
            item.photo = photo
            item.save(update_fields=["photo", "updated_at"])

        return item
class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = ["id", "file", "thumbnail", "original_name"]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name"]

# serializer para ClothingType
class ClothingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClothingType
        fields = ["id", "name", "category"]  # incluye los campos que quieras mostrar

# serializer detalle de ClothingItem
class ClothingItemDetailSerializer(serializers.ModelSerializer):
    photo = PhotoSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    type = ClothingTypeSerializer(read_only=True)  # nested type
    secondary_colors = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        model = ClothingItem
        fields = [
            "id",
            "type",
            "last_used",
            "height",
            "width",
            "formality",
            "main_color",
            "secondary_colors",
            "photo",
            "user"
        ]

class OutfitCreateSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    clothing_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False
    )

    def validate_clothing_ids(self, value):
        # quitar duplicados manteniendo orden
        seen = set()
        uniq = []
        for v in value:
            if v not in seen:
                seen.add(v)
                uniq.append(v)
        return uniq

    def validate(self, attrs):
        request_user = self.context.get("user") or (self.context.get("request").user if self.context.get("request") else None)
        clothing_ids = attrs.get("clothing_ids", [])
        # verificar que todas las prendas existan y pertenezcan al usuario
        items = list(ClothingItem.objects.filter(pk__in=clothing_ids, user=request_user))
        if len(items) != len(clothing_ids):
            found_ids = {i.pk for i in items}
            missing = [str(i) for i in clothing_ids if i not in found_ids]
            raise serializers.ValidationError({"clothing_ids": f"Algunas prendas no existen o no pertenecen al usuario: {', '.join(missing)}"})
        # guardar items en contexto para evitar reconsultas
        self.context["validated_items"] = items
        return attrs

    def create(self, validated_data):
        request_user = self.context.get("user") or (self.context.get("request").user if self.context.get("request") else None)
        clothing_ids = validated_data.pop("clothing_ids")

        # crear outfit y las filas intermedias en una transacción
        with transaction.atomic():
            outfit = Outfit.objects.create(user=request_user, name=validated_data.get("name"))
            # recuperar objetos en el orden original de clothing_ids
            items_map = {i.pk: i for i in self.context.get("validated_items", [])}
            oc_objs = []
            for pos, cid in enumerate(clothing_ids):
                item = items_map[cid]
                oc_objs.append(OutfitClothing(outfit=outfit, clothing=item))
            OutfitClothing.objects.bulk_create(oc_objs)
        return outfit


class OutfitSerializer(serializers.ModelSerializer):
    clothing_ids = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Outfit
        fields = ["id", "name", "user_id", "clothing_ids"]

    def get_clothing_ids(self, obj):
        # devolver lista de ids en la relación actual
        return list(obj.clothing_items.values_list("id", flat=True))
class OutfitListSerializer(serializers.ModelSerializer):
    clothing_items = ClothingItemDetailSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Outfit
        fields = ["id", "name", "user", "clothing_items"]
"""
Serializers explicados

PhotoSerializer:
- Devuelve file_url (mediante obj.file.url) y thumbnail_url.
- file es writeable (permite multipart upload en browsable API), pero
  file_url es read-only.

ClothingItemSerializer:
- photo: nested PhotoSerializer read-only (para que GET incluya metadata)
- photo_id: campo write-only que permite asignar una foto existente al crear/editar
  (ej. {"photo_id": 5}).

Notas:
- Mantener read_only_fields para campos que no deben modificarse desde el cliente
  (id, created_at, uploaded_at).
- Si quieres soportar creación de Photo desde el mismo payload que crea el item,
  implementa create()/update() para manejar nested writes — en este diseño preferimos
  endpoints separados (claridad).
"""