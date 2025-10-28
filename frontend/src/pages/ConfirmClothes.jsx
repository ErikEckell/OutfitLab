import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import "./ConfirmClothes.css";

const ConfirmClothes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const items = location.state?.items || [];

  const [showSuccess, setShowSuccess] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [showMethod, setShowMethod] = useState(false);

  const handleYes = () => {
    setShowSuccess(true);
    setTimeout(() => navigate("/closet"), 1000);
  };

  const handleNo = () => setShowRetry(true);
  const retryYes = () => {
    setShowRetry(false);
    setShowMethod(true);
  };
  const retryNo = () => navigate("/home");
  const uploadCamera = () => navigate("/camera");
  const uploadFile = () => navigate("/byfiles");

  return (
    <Layout>
      <div className="confirm-screen">
        <h2 className="confirm-title">We could recognize these clothes</h2>

        <div className="items-grid">
          {items.length === 0 ? (
            <div className="placeholder">
              <p>Detected clothes will appear here 👕👖👗</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={idx} className="item-card">
                <img src={item.imageUrl} alt={item.name || "Clothing item"} />
                <p>{item.name || "Unnamed item"}</p>
              </div>
            ))
          )}
        </div>

        <div className="confirm-buttons">
          <button className="popup-btn" onClick={handleYes}>
            ✅ Yes
          </button>
          <button className="popup-btn" onClick={handleNo}>
            ❌ No
          </button>
        </div>

        {/* POPUP ÉXITO */}
        {showSuccess && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h3>✅ Prendas añadidas con éxito!</h3>
            </div>
          </div>
        )}

        {/* POPUP REINTENTO */}
        {showRetry && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h3>Do you want to try again?</h3>
              <button className="popup-btn" onClick={retryYes}>
                Yes
              </button>
              <button className="popup-btn" onClick={retryNo}>
                No
              </button>
            </div>
          </div>
        )}

        {/* POPUP MÉTODO SUBIDA */}
        {showMethod && (
          <div className="popup-overlay">
            <div className="popup-content">
              <h3>Select upload method</h3>
              <button className="popup-btn" onClick={uploadCamera}>
                📸 Camera
              </button>
              <button className="popup-btn" onClick={uploadFile}>
                📁 File
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ConfirmClothes;
