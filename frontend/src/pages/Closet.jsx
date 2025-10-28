import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./Closet.css";

const Closet = () => {
  const username = "Username"; // TODO: reemplazar con el valor real cuando esté disponible
  const categories = ["Accesories", "Bags", "Tops", "Bottoms", "Shoes"];
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);

  const onAddClothes = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const handleCameraUpload = () => {
    navigate("/camera");
    closePopup();
  };

  const handleFileUpload = () => {
    navigate("/byfiles");
    closePopup();
  };

  const onDidYouRemove = () => {
    console.log("Did you get rid of anything? -> Content");
  };

  return (
    <Layout>
      <section className="closet-screen">
        <div className="closet-header">
          <h2 className="closet-greet">
            {username}, welcome back to your Closet
          </h2>
          <button
            className="closet-add-btn"
            type="button"
            onClick={onAddClothes}
          >
            <span className="plus">+</span>
            Add Clothes?
          </button>
        </div>

       {showPopup && (
          <div className="popup-overlay" onClick={closePopup}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
              <h3>Add Clothes</h3>
              <button onClick={handleCameraUpload} className="popup-btn">
                📸 Upload via Camera
              </button>
              <button onClick={handleFileUpload} className="popup-btn">
                📁 Upload via File
              </button>
              <button onClick={closePopup} className="popup-close-btn">
                ✖ Close
              </button>
            </div>
          </div>
        )}


        <h3 className="closet-question">What are you looking for?</h3>

        <div className="closet-wardrobe">
          <svg
            className="closet-wardrobe__svg"
            viewBox="0 0 413 440"
            role="img"
            aria-label="Open closet illustration"
          >
            <rect
              x="6"
              y="16"
              width="401"
              height="408"
              rx="4"
              stroke="#6B6B6B"
              strokeWidth="10"
              fill="none"
            />
            <path
              d="M10 40 L10 400 L90 380 L90 60 Z"
              stroke="#6B6B6B"
              strokeWidth="10"
              fill="none"
            />
            <path
              d="M403 40 L403 400 L323 380 L323 60 Z"
              stroke="#6B6B6B"
              strokeWidth="10"
              fill="none"
            />
            {[100, 160, 220, 280, 340].map((y) => (
              <rect
                key={y}
                x="105"
                y={y}
                width="203"
                height="44"
                rx="6"
                stroke="#6B6B6B"
                strokeWidth="8"
                fill="none"
              />
            ))}
          </svg>

          <ul className="closet-shelves">
            {categories.map((category) => (
              <li key={category} className="closet-shelves__item">
                {category}
              </li>
            ))}
          </ul>
        </div>

        <div className="closet-color">
          <h4 className="color-title">Or maybe look by color?</h4>
          <div className="color-box">
            <div className="color-knob" />
          </div>
        </div>

        <div className="closet-footer">
          <p className="did-you-remove">Did you get rid of anything?</p>
          <button
            className="content-btn"
            type="button"
            onClick={onDidYouRemove}
          >
            Content
          </button>
        </div>
      </section>
    </Layout>
  );
};

export default Closet;
