import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./CameraScreen.css";

const CameraScreen = ({ itemId, token }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const activeStream = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ---------- INICIAR CÁMARA ----------
  const startCamera = async () => {
    try {
      if (activeStream.current) {
        activeStream.current.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      activeStream.current = mediaStream;
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("❌ Error accediendo a la cámara:", err);
      alert("No se pudo acceder a la cámara. Verifica permisos.");
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (activeStream.current)
        activeStream.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // ---------- SUBIR FOTO AL BACKEND ----------
  async function uploadPhotoToItem(itemId, file, token = null) {
    const fd = new FormData();
    fd.append("file", file);
    if (itemId) fd.append("assign_item", itemId);

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`http://localhost:8000/api/photos/`, {
      method: "POST",
      headers,
      body: fd,
      credentials: "include",
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error("Upload failed: " + errorText);
    }

    return res.json();
  }

  async function fetchItem(itemId, token = null) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`/api/clothing-items/${itemId}/`, {
      headers,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Fetch failed: " + (await res.text()));
    return res.json();
  }

  // ---------- CAPTURAR FOTO ----------
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");
    setPhoto(imageData);
    setIsPreview(true);
  };

  // ---------- REINTENTAR ----------
  const retakePhoto = () => {
    setIsPreview(false);
    setPhoto(null);
    startCamera();
  };

  // ---------- ACEPTAR Y SUBIR FOTO ----------
  const acceptPhoto = async () => {
    try {
      setLoading(true);

      // ---------- Redirigir a pantalla de carga ----------
      navigate("/loading", {
        state: {
          message: "Identifying your clothes...",
          redirectTo: "/confirm-clothes",
          actionType: "photo_upload",
        },
      });

      // ---------- Preparar archivo ----------
      const res = await fetch(photo);
      const blob = await res.blob();
      const file = new File([blob], `photo_${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // ---------- Subir al backend ----------
      const response = await uploadPhotoToItem(itemId, file, token);
      console.log("✅ Imagen subida correctamente:", response);

      if (itemId) {
        const updatedItem = await fetchItem(itemId, token);
        console.log("📦 Item actualizado:", updatedItem);
      }

      setIsPreview(false);
      setPhoto(null);
      startCamera();
    } catch (err) {
      console.error("❌ Error subiendo foto:", err);
      alert("Error al subir la foto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- INTERFAZ ----------
  return (
    <Layout>
      <section className="camera-screen">
        {!isPreview ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-feed"
            />
            <canvas ref={canvasRef} className="hidden-canvas" />
            <button className="capture-btn" onClick={takePhoto}>
              📸
            </button>
          </>
        ) : (
          <div className="photo-result">
            <img src={photo} alt="Captured" className="captured-photo" />
            <div className="photo-options">
              <button className="retake-btn" onClick={retakePhoto}>
                🔁 Reintentar
              </button>
              <button className="accept-btn" onClick={acceptPhoto} disabled={loading}>
                {loading ? "⏳ Subiendo..." : "✅ Aceptar"}
              </button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default CameraScreen;
