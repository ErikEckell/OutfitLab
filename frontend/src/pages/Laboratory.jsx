import React from "react";
import Layout from "../components/Layout";
import "./Laboratory.css";

const Laboratory = () => {
  const username = "Username"; // TODO: reemplazar cuando el dato esté disponible

  return (
    <Layout>
      <section className="lab-screen">
        <header className="lab-header">
          <div className="lab-header__icon" aria-hidden="true">
            🧪
          </div>
          <h2 className="lab-title">Style Laboratory</h2>
          <p className="lab-subtitle">A space tailored to you</p>
        </header>

        <div className="lab-greeting">
          <h3 className="lab-hello">
            Hi {username}! <br />
            Where should we start?
          </h3>
        </div>

        <section className="lab-section">
          <header className="lab-section__header">
            <h4 className="lab-section__title">Create Outfit from Scratch</h4>
            <span className="lab-section__action" aria-hidden="true">
              ✂️
            </span>
          </header>

          <div className="lab-grid">
            <div className="lab-grid__piece lab-grid__piece--left" />
            <div className="lab-grid__piece lab-grid__piece--mid" />
            <div className="lab-grid__piece lab-grid__piece--right" />
          </div>
        </section>

        <section className="lab-section lab-section--mixology">
          <header className="lab-section__header">
            <h4 className="lab-section__title">Outfit Mixology</h4>
            <span className="lab-section__action" aria-hidden="true">
              🧫
            </span>
          </header>

          <p className="lab-mix-desc">
            We create outfits for you based on your style and preferences!
          </p>

          <div className="lab-mix-card" />
        </section>
      </section>
    </Layout>
  );
};

export default Laboratory;
