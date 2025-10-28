import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TopLayout from "../components/TopLayout";
import "./Loading.css";

const Loading = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Datos recibidos desde navigate()
  const message = location.state?.message || "Working for you...";
  const redirectTo = location.state?.redirectTo || "/";
  const actionType = location.state?.actionType || "default";

  // ✅ Tiempo configurable por tipo de acción
  const loadingTimes = {
    photo_upload: 5000,
    file_upload: 5000,
    ai_outfit: 7000, // cuando se implemente generación IA
    default: 4000,
  };

  const delay = loadingTimes[actionType] || loadingTimes.default;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(redirectTo);
    }, delay);

    return () => clearTimeout(timer);
  }, [navigate, redirectTo, delay]);

  return (
    <TopLayout>
      <section className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner-track"></div>
          <div className="spinner-active"></div>
        </div>
        <p className="loading-text">{message}</p>
      </section>
    </TopLayout>
  );
};

export default Loading;
