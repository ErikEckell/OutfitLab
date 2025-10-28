from django.db import models
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.dispatch import receiver
from django.db.models.signals import post_delete
import uuid
import os
# Create your models here.
class MyUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)

# Modelo User actualizado
class User(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[
            ('M', 'Male'),
            ('F', 'Female'),
            ('Other', 'Other'),
        ],
        null=True,
        blank=True
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    password = models.CharField(max_length=128)  # hashed password

    USERNAME_FIELD = "email"       # campo usado para login
    REQUIRED_FIELDS = ["name"]     # campos obligatorios para superuser

    objects = MyUserManager()

    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self.save(update_fields=["password"])

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.email
class ClothingType(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField(blank=True, null=True)       # e.g., shirt, pants, jacket
    category = models.TextField(blank=True, null=True)   # e.g., top, bottom, accessory

    class Meta:
        db_table = "clothing_type"

    def __str__(self):
        return self.name or f"ClothingType {self.id}"



def clothing_upload_to_dummy(instance, filename):
    # solo por compatibilidad si necesitas algo
    return f"uploads/clothing/{uuid.uuid4().hex}.jpg"

class ClothingItem(models.Model):
    id = models.AutoField(primary_key=True)
    type = models.ForeignKey("myapi.ClothingType", on_delete=models.CASCADE, related_name="items", db_column="type_id")
    user = models.ForeignKey("myapi.User", on_delete=models.CASCADE, related_name="clothing_items", db_column="user_id")
    photo = models.ForeignKey("myapi.Photo", on_delete=models.SET_NULL, null=True, blank=True, related_name="clothing_items", db_column="photo_id")
    last_used = models.DateField(blank=True, null=True)
    height = models.FloatField(blank=True, null=True)
    width = models.FloatField(blank=True, null=True)
    formality = models.TextField(blank=True, null=True)
    main_color = models.TextField(blank=True, null=True)
    secondary_colors = ArrayField(models.TextField(), blank=True, default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "clothing_item"

    def __str__(self):
        return f"ClothingItem {self.id} ({self.type})"

    @property
    def photo_url(self):
        """Devuelve la URL pública o None."""
        if not self.photo:
            return None
        try:
            return self.photo.file.url
        except Exception:
            from django.core.files.storage import default_storage
            return default_storage.url(self.photo.file.name)

class Style(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.TextField(blank=True, null=True)
    # Postgres JSONB field
    color_palette = models.JSONField(blank=True, null=True)
    event_type = models.TextField(blank=True, null=True)  # e.g., wedding, work, party

    class Meta:
        db_table = "style"

    def __str__(self):
        return self.name or f"Style {self.id}"


class StyleClothing(models.Model):
    # join table (many-to-many)
    style = models.ForeignKey("myapi.Style", on_delete=models.CASCADE, db_column="style_id", related_name="style_clothing")
    clothing = models.ForeignKey("myapi.ClothingItem", on_delete=models.CASCADE, db_column="clothing_id", related_name="clothing_styles")

    class Meta:
        db_table = "style_clothing"
        unique_together = (("style", "clothing"),)

    def __str__(self):
        return f"StyleClothing style={self.style_id} clothing={self.clothing_id}"


class Preference(models.Model):
    # user preferences for styles (many-to-many)
    style = models.ForeignKey("myapi.Style", on_delete=models.CASCADE, db_column="style_id", related_name="preferences")
    user = models.ForeignKey("myapi.User", on_delete=models.CASCADE, db_column="user_id", related_name="preferences")

    class Meta:
        db_table = "preference"
        unique_together = (("style", "user"),)

    def __str__(self):
        return f"Preference user={self.user_id} style={self.style_id}"


class Weather(models.Model):
    id = models.AutoField(primary_key=True)
    date = models.DateField(blank=True, null=True)
    temperature = models.FloatField(blank=True, null=True)
    feels_like = models.FloatField(blank=True, null=True)
    humidity = models.FloatField(blank=True, null=True)
    wind = models.FloatField(blank=True, null=True)
    conditions = models.TextField(blank=True, null=True)            # sunny, rainy, snowy...
    precipitation_prob = models.FloatField(blank=True, null=True, validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    cloudiness = models.IntegerField(blank=True, null=True)         # percent
    uv_index = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "weather"

    def __str__(self):
        return f"Weather {self.date} ({self.conditions})"


class WeatherClothing(models.Model):
    clothing = models.ForeignKey("myapi.ClothingItem", on_delete=models.CASCADE, db_column="clothing_id", related_name="weather_links")
    weather = models.ForeignKey("myapi.Weather", on_delete=models.CASCADE, db_column="weather_id", related_name="clothing_links")

    class Meta:
        db_table = "weather_clothing"
        unique_together = (("clothing", "weather"),)

    def __str__(self):
        return f"WeatherClothing clothing={self.clothing_id} weather={self.weather_id}"
def photo_upload_to(instance, filename):
    ext = filename.split('.')[-1] if '.' in filename else ''
    return f"uploads/clothing/{uuid.uuid4().hex}{('.' + ext) if ext else ''}"

class Photo(models.Model):
    id = models.AutoField(primary_key=True)
    file = models.ImageField(upload_to=photo_upload_to)
    original_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(null=True, blank=True)
    thumbnail = models.ImageField(upload_to="uploads/clothing/thumbnails/", blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "photo"

    def __str__(self):
        return f"Photo {self.id} ({self.original_name or self.file.name})"


class Outfit(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=200, blank=True, null=True)
    user = models.ForeignKey(
        "myapi.User",
        on_delete=models.CASCADE,
        related_name="outfits",
        db_column="user_id"
    )

    # relación many-to-many explícita usando tabla intermedia
    clothing_items = models.ManyToManyField(
        "myapi.ClothingItem",
        through="myapi.OutfitClothing",
        through_fields=("outfit", "clothing"),
        related_name="outfits"
    )

    class Meta:
        db_table = "outfit"

    def __str__(self):
        return self.name or f"Outfit {self.id}"


class OutfitClothing(models.Model):
    """
    Tabla intermedia mínima. Cada vez que se borre una fila de esta tabla
    (es decir, se remueva una prenda del outfit), la señal post_delete
    eliminará el outfit entero.
    """
    outfit = models.ForeignKey(
        "myapi.Outfit",
        on_delete=models.CASCADE,
        db_column="outfit_id",
        related_name="outfit_links"
    )
    clothing = models.ForeignKey(
        "myapi.ClothingItem",
        on_delete=models.CASCADE,
        db_column="clothing_id",
        related_name="outfit_links"
    )

    class Meta:
        db_table = "outfit_clothing"
        unique_together = (("outfit", "clothing"),)

    def __str__(self):
        return f"OutfitClothing outfit={self.outfit_id} clothing={self.clothing_id}"


# -------------------------
# Señal: si se elimina una fila de OutfitClothing (p. ej. se quita la prenda
# del outfit o se borra la prenda), eliminamos el Outfit entero.
# -------------------------
@receiver(post_delete, sender=OutfitClothing)
def delete_outfit_when_item_removed(sender, instance, **kwargs):
    """
    Cuando una relación outfit<->clothing se elimina, eliminamos el outfit.
    Uso .filter(...).delete() para evitar excepción si ya fue borrado por otra llamada.
    """
    outfit_id = getattr(instance, "outfit_id", None)
    if outfit_id is None:
        return
    # Si el outfit aún existe, lo borramos (esto a su vez borrará las filas restantes
    # de outfit_clothing; los post_delete posteriores no harán nada porque el outfit ya no existirá).
    from django.apps import apps
    OutfitModel = apps.get_model("myapi", "Outfit")
    if OutfitModel.objects.filter(pk=outfit_id).exists():
        OutfitModel.objects.filter(pk=outfit_id).delete()