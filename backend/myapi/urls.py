from django.urls import path , include
from . import views
from .views import RegisterView, LoginView
from rest_framework.routers import DefaultRouter
from .views import WeatherViewSet, StyleViewSet
from .views import PhotoCreateAndAttachView, ClothingItemPhotoUpload, ClothingItemDetail,CurrentUserView,UserClothingItemsList,ClothingItemCreateView,OutfitCreateView,OutfitListView
from .views import recommend_outfit

router = DefaultRouter()
router.register(r"weather", WeatherViewSet, basename="weather")
router.register(r"styles", StyleViewSet, basename="styles")
urlpatterns = [
    path('hello/', views.hello, name='hello'),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/me/", CurrentUserView.as_view(), name="current-user"),
    path("", include(router.urls)),
    path("photos/", PhotoCreateAndAttachView.as_view(), name="photos-create"),
    path("clothing-items/<int:item_id>/upload-photo/", ClothingItemPhotoUpload.as_view(), name="upload-clothing-photo"),
    path("clothing-items/<int:item_id>/", ClothingItemDetail.as_view(), name="clothingitem-detail"),
    path("clothing-items/me/", UserClothingItemsList.as_view(), name="clothingitems-me"),
    path("clothing-items/create/", ClothingItemCreateView.as_view(), name="clothingitem-create"),
    path("recommend-outfit/", recommend_outfit, name="recommend-outfit"),
    path("outfits/create", OutfitCreateView.as_view(), name="outfit-create"),
    path("outfits/", OutfitListView.as_view(), name="outfit-list"),
]
"""
EJEMPLO DE USO REGISTER
const registerUser = async () => {
  const data = {
    email: "test@example.com",
    name: "Diego",
    password: "Abc1234!"
  };

  const response = await fetch("http://127.0.0.1:8000/api/auth/register/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  console.log(result);
  EJEMPLO DE USO LOGIN
  const loginUser = async () => {
  const data = {
    email: "test@example.com",
    password: "Abc1234!"
  };

  const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  console.log(result);
};  
};
"""
# Comentarios de ruta (para pegar al lado de urlpatterns)
# path("photos/") -> crea Photo; opcionalmente asocia al ClothingItem via assign_item
# path("clothing-items/<id>/upload-photo/") -> sube y asigna foto directamente al item
# path("clothing-items/<id>/") -> obtiene el item con nested photo info
#
# Elegir rutas:
# - Usa /photos/ cuando quieres manejar fotos como recursos independientes
# - Usa /clothing-items/<id>/upload-photo/ cuando el flujo del UI es "editar item -> subir foto"
"""
ejemplo de traer prendas
async function fetchMyItems() {
  // Intenta coger access desde localStorage
  const access = localStorage.getItem('accessToken') || (JSON.parse(localStorage.getItem('outfitlabUser') || 'null')?.access); MUY IMPORTANTE PASAR EL TOKEN
  if (!access) throw new Error('No access token found. Log in first.');

  const res = await fetch('http://localhost:8000/api/clothing-items/me/', {
    headers: { Authorization: `Bearer ${access}` }
  });

  if (res.status === 401) {
    throw new Error('Unauthorized — token inválido o expirado');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error fetching items');
  }
  const items = await res.json();
  return items; // array de ClothingItem
}
ejemplo de uso para mostrarlas con miniaturas
import React, { useEffect, useState } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

function MyClothingItemsList({ onUnauthorized }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // helper para obtener access token (soporta ambos formatos)
  const getAccess = () => {
    return localStorage.getItem('accessToken')
      || (JSON.parse(localStorage.getItem('outfitlabUser') || 'null')?.access)
      || null;
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const access = getAccess();
        if (!access) throw new Error('No access token. Please login.');

        const res = await fetch(`${API_BASE}/clothing-items/me/`, {
          headers: { Authorization: `Bearer ${access}` },
        });

        if (res.status === 401) {
          // opcional: callback para forzar re-login
          if (onUnauthorized) onUnauthorized();
          throw new Error('Unauthorized — please login again');
        }

        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error((payload && payload.detail) || 'Failed to fetch items');
        }

        const data = await res.json();
        if (!mounted) return;
        setItems(data);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Unexpected error');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [onUnauthorized]);

  if (loading) return <div>Loading items…</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!items.length) return <div>No tienes prendas aún.</div>;

  return (
    <div className="my-items-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>
      {items.map(item => {
        const photo = item.photo || null;
        // posible campo file_url o file, thumbnail_url o thumbnail
        const thumb = photo?.thumbnail_url || photo?.thumbnail || photo?.file_url || photo?.file || null;
        return (
          <div key={item.id} className="item-card" style={{ border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
              {thumb ? (
                // usa <img loading="lazy"> para performance
                <img src={thumb} alt={`photo-${item.id}`} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} loading="lazy" />
              ) : (
                <div style={{ color: '#999' }}>No image</div>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong>{item.type?.name || `Type #${item.type || ''}`}</strong>
              <div style={{ fontSize: 13, color: '#666' }}>{item.formality || ''}</div>
              <div style={{ marginTop: 6 }}>
                <small>Main color: {item.main_color || '—'}</small>
              </div>
              <div style={{ marginTop: 6 }}>
                <small>Last used: {item.last_used || '—'}</small>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MyClothingItemsList;
ejemplo de lo que trae el get
curl -X GET "http://localhost:8000/api/clothing-items/me/" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzYwMTg5OTI5LCJpYXQiOjE3NjAxODkwMjksImp0aSI6IjI4YWQzMmM3Mzc4NTQ4MGNiMWU4YzYyMjQyZDk2MWJlIiwidXNlcl9pZCI6IjEifQ.wC4sQpE217LygVl96rtwzSC_nBDYA9zr0LlWfbnO46k"
[{"id":1,"type":{"id":1,"name":"T-shirt","category":"Top"},"last_used":"2025-10-02","height":1.0,"width":1.0,"formality":"casual","main_color":"blue","secondary_colors":[],"photo":{"id":2,"file":"http://localhost:8000/media/uploads/clothing/7c1e56508e1841e392e7dadc8be2d3b2.jpg","thumbnail":"http://localhost:8000/media/uploads/clothing/thumbnails/thumb_0d4eb17916c34e34ab63f94e4997578d.jpg","original_name":"WhatsApp Image 2024-11-06 at 16.49.02_6fcc0059.jpg"},"user":{"id":1,"email":"dnlagos@miuandes.cl","name":"Diego Lagos"}},{"id":2,"type":{"id":1,"name":"T-shirt","category":"Top"},"last_used":"2025-10-07","height":1.0,"width":2.0,"formality":"formal","main_color":"blue","secondary_colors":["white","verde","rojo"],"photo":{"id":3,"file":"http://localhost:8000/media/uploads/clothing/40be730a529946368eecad08c966b62a.jpg","thumbnail":"http://localhost:8000/media/uploads/clothing/thumbnails/thumb_f7fe743b44c246e7ba49c70968d6e72f.jpg","original_name":"57ea21b65eb9a70616bc24947f533c77.jpg"},"user":{"id":1,"email":"dnlagos@miuandes.cl","name":"Diego Lagos"}},{"id":3,"type":{"id":1,"name":"T-shirt","category":"Top"},"last_used":"2025-09-29","height":1.0,"width":1.0,"formality":"formal","main_color":"azul","secondary_colors":[],"photo":{"id":4,"file":"http://localhost:8000/media/uploads/clothing/1a84f496c68e43ebbdec1ea8b0f3231b.png","thumbnail":"http://localhost:8000/media/uploads/clothing/thumbnails/thumb_5d61e32f69d143f9b1b705b8ceea9e55.jpg","original_name":"Imagen circuito resistencias.png"},"user":{"id":1,"email":"dnlagos@miuandes.cl","name":"Diego Lagos"}}]

Nuevas rutas

/api/outfits
EJEMPLO CON CURL
curl -X POST "http://localhost:8000/api/outfits/create" \
  -H "Authorization: Bearer <TU_TOKEN_AQUI>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Outfit de verano",
    "clothing_ids": [10, 11, 12]
  }'
import axios from "axios";

async function createOutfit() {
  try {
    const token = localStorage.getItem("authToken"); // tu JWT o session token

    const payload = {
      name: "Outfit de invierno",
      clothing_item_ids: [5, 9, 12] // IDs de prendas existentes
    };

    const response = await axios.post(
      "http://localhost:8000/outfits/create/",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`, // JWT
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Outfit creado:", response.data);
  } catch (error) {
    console.error("❌ Error creando outfit:", error.response?.data || error);
  }
}

createOutfit();
EJEMPLO DEL CUERPO QUE SE ENVIA
{
  "name": "Outfit de invierno",
  "clothing_item_ids": [5, 9, 12]
}
EJEMPLO DE RESPUESTA
{
  "id": 4,
  "name": "Outfit de invierno",
  "user": { "id": 1, "email": "diego@example.com", "name": "Diego" },
  "clothing_items": [
    { "id": 5, "type": { "name": "Chaqueta" }, "main_color": "negro" },
    { "id": 9, "type": { "name": "Pantalón" }, "main_color": "gris" },
    { "id": 12, "type": { "name": "Bufanda" }, "main_color": "rojo" }
  ]
}


GET api/outfits/

import axios from "axios";

async function getUserOutfits() {
  try {
    const token = localStorage.getItem("authToken");

    const response = await axios.get("http://localhost:8000/outfits/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("👕 Outfits del usuario:", response.data);
  } catch (error) {
    console.error("❌ Error obteniendo outfits:", error.response?.data || error);
  }
}

getUserOutfits();
"""