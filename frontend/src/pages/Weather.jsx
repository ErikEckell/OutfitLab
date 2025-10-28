import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import fetchWeather from "../api/weatherApi";
import "./Weather.css";

/**
 * Cambia este valor si quieres otra ciudad por defecto.
 * Puedes setearlo desde .env con VITE_DEFAULT_CITY.
 */
const DEFAULT_CITY =
  import.meta.env.VITE_DEFAULT_CITY; //|| "Santiago, CL";

function outfitAdvice(tempC) {
  const numeric =
    typeof tempC === "string" ? Number.parseFloat(tempC) : tempC;
  if (numeric == null || Number.isNaN(numeric)) {
    return "Check your connection and try again.";
  }
  if (numeric >= 28) {
    return "Light fabrics, sleeveless tops, shorts and sandals.";
  }
  if (numeric >= 22) {
    return "Short-sleeved tops and a light jacket. Jeans work well.";
  }
  if (numeric >= 16) {
    return "Long-sleeved top or light sweater. Jeans or chinos.";
  }
  if (numeric >= 10) {
    return "Sweater plus jacket. Consider boots or closed shoes.";
  }
  return "Coat, scarf, warm layers and thermal pants.";
}

const Weather = () => {
  const [location, setLocation] = useState({
    city: DEFAULT_CITY,
    source: "default",
    ts: Date.now(),
  });
  const [loading, setLoading] = useState(false);
  const [wx, setWx] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!("geolocation" in navigator)) {
      console.warn("Geolocation is not available. Showing default city.");
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        const { latitude, longitude } = position.coords;
        setLocation({
          latitude,
          longitude,
          source: "geolocation",
          reverseGeocode: false,
          ts: Date.now(),
        });
      },
      (geoError) => {
        if (cancelled) return;
        console.error("Geolocation failed:", geoError);
        let readable = "Could not determine your location.";
        if (geoError.code === 1) {
          readable = "Location permission denied.";
        } else if (geoError.code === 2) {
          readable = "Location data is unavailable.";
        } else if (geoError.code === 3) {
          readable = "Location request timed out.";
        }
        setLocation({
          city: DEFAULT_CITY,
          source: "default",
          ts: Date.now(),
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5 * 60 * 1000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const requestInput = (() => {
      const hasCoords =
        typeof location?.latitude === "number" &&
        Number.isFinite(location.latitude) &&
        typeof location?.longitude === "number" &&
        Number.isFinite(location.longitude);

      if (hasCoords) {
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          ...(typeof location.reverseGeocode === "boolean"
            ? { reverseGeocode: location.reverseGeocode }
            : {}),
        };
      }

      if (typeof location?.city === "string") {
        const trimmed = location.city.trim();
        if (trimmed) {
          return trimmed;
        }
      }

      return null;
    })();

    if (requestInput == null) {
      setWx(null);
      setError("We do not have a valid location to show weather data.");
      return () => {
        cancelled = true;
      };
    }

    const loadWeather = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchWeather(requestInput);
        if (cancelled) return;
        if (data) {
          setWx(data);
          return;
        }

        if (location?.source !== "default" && requestInput !== DEFAULT_CITY) {
          setLocation({
            city: DEFAULT_CITY,
            source: "default",
            ts: Date.now(),
          });
          setWx(null);
          return;
        }

        setWx(null);
        setError("No weather data found for this location.");
      } catch (err) {
        if (cancelled) return;
        console.error("Weather fetch failed:", err);
        setWx(null);
        setError("Could not load weather data.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [location]);

  const loadingPlaceholder = "...";
  const tempDisplay =
    loading ? loadingPlaceholder : wx?.temp != null ? `${wx.temp}\u00B0C` : "--";
  const minToShow = wx?.tempMinObserved ?? wx?.tempMinForecast ?? null;
  const maxToShow = wx?.tempMaxObserved ?? wx?.tempMaxForecast ?? null;
  const adviceTemp = wx?.temp != null ? wx.temp : null;
  const cityLabel =
    wx?.label ??
    (location.city ? location.city : "Current location");

  return (
    <Layout>
      <section className="weather-screen">
        {/* Titulo principal */}
        <h2 className="wx-title">WeatherLab</h2>
        <p className="wx-subtitle">So you are never chilly or sweaty</p>

        {/* Hoy */}
        <h3 className="wx-section-title">Today&apos;s Temperature</h3>

        {/* Icono clima + temperatura grande */}
        <div className="wx-hero">
          <div className="wx-icon">{"\u2600"}</div>
          <div className="wx-temp">{tempDisplay}</div>
        </div>

        {/* Min / Max */}
        <div className="wx-minmax">
          <div className="wx-min">
            <div className="wx-minmax-number">
              {loading
                ? loadingPlaceholder
                : minToShow != null
                ? `${minToShow}\u00B0C`
                : "--"}
            </div>
            <div className="wx-minmax-label">
              {wx?.tempMinObserved != null ? "Observed Min" : "Forecast Min"}
            </div>
          </div>
          <div className="wx-max">
            <div className="wx-minmax-number">
              {loading
                ? loadingPlaceholder
                : maxToShow != null
                ? `${maxToShow}\u00B0C`
                : "--"}
            </div>
            <div className="wx-minmax-label">
              {wx?.tempMaxObserved != null ? "Observed Max" : "Forecast Max"}
            </div>
          </div>
        </div>

        {/* Recomendacion de outfit */}
        <h4 className="wx-reco-title">What we recommend you wear</h4>
        <p className="wx-reco-text">
          {loading ? "Calculating outfit advice..." : outfitAdvice(adviceTemp)}
        </p>

        {/* Galeria simple (placeholders) */}
        <div className="wx-gallery">
          <div className="wx-card">Look 1</div>
          <div className="wx-card">Look 2</div>
          <div className="wx-card">Look 3</div>
        </div>

        {/* CTA */}
        <button className="wx-cta" type="button">
          Start Mixing Outfits!
        </button>
      </section>
    </Layout>
  );
};

export default Weather;
