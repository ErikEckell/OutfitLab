import React, { useState, useEffect, useMemo } from "react";
import Layout from "../components/Layout";
import "./Profile.css";
import { getCurrentUser, getUserClothingItems } from "../api";

const RAW_API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const API_BASE_URL = RAW_API_BASE.replace(/\/+$/, "");
const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api$/, "");

const resolveMediaUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const base = MEDIA_BASE_URL || API_BASE_URL;
  const normalizedBase = base.endsWith("/")
    ? base.slice(0, -1)
    : base;
  const normalizedPath = path.startsWith("/")
    ? path.slice(1)
    : path;

  return `${normalizedBase}/${normalizedPath}`;
};

const readStoredUser = () => {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch (error) {
    console.warn("Unable to parse stored user:", error);
    return null;
  }
};

const Profile = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(() => readStoredUser());
  const [clothingItems, setClothingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colorPreferences, setColorPreferences] = useState(["FF9FC2", "606CE6"]);
  const [garmentPreferences, setGarmentPreferences] = useState(["Skirts", "Sneakers"]);
  const [weatherPreference, setWeatherPreference] = useState("Medium");
  const [newColor, setNewColor] = useState("");
  const [newGarment, setNewGarment] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        const clothingData = await getUserClothingItems();

        if (!mounted) return;
        setUser(currentUser);
        setClothingItems(Array.isArray(clothingData) ? clothingData : []);

        if (typeof window !== "undefined") {
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }
      } catch (error) {
        if (!mounted) return;
        console.error("Error fetching user data:", error);
        setClothingItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserData();
    return () => { mounted = false; };
  }, []);

  const profileImageUrl = useMemo(() => {
    if (!user) return null;

    const explicit =
      user.profile_image ||
      user.profileImage ||
      user.avatar ||
      user.avatar_url ||
      (user.photo && typeof user.photo === "string" ? user.photo : null);

    const fromObject =
      !explicit && user.photo && typeof user.photo === "object"
        ? user.photo.file_url || user.photo.file || null
        : null;

    const resolvedExplicit = resolveMediaUrl(explicit || fromObject);
    if (resolvedExplicit) {
      return resolvedExplicit;
    }

    if (user.name) {
      const encodedName = encodeURIComponent(user.name);
      return `https://ui-avatars.com/api/?name=${encodedName}&background=FF9FC2&color=ffffff`;
    }

    if (user.email) {
      const encodedEmail = encodeURIComponent(user.email);
      return `https://ui-avatars.com/api/?name=${encodedEmail}&background=FF9FC2&color=ffffff`;
    }

    return null;
  }, [user]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [profileImageUrl]);

  const userInitial = useMemo(() => {
    if (user?.name) {
      const trimmed = user.name.trim();
      if (trimmed) {
        return trimmed.charAt(0).toUpperCase();
      }
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  }, [user]);

  const handleAddColor = () => {
    if (newColor.trim() && !colorPreferences.includes(newColor.trim())) {
      setColorPreferences([...colorPreferences, newColor.trim()]);
      setNewColor("");
    }
  };

  const handleRemoveColor = (colorToRemove) => {
    setColorPreferences(colorPreferences.filter(color => color !== colorToRemove));
  };

  const handleAddGarment = () => {
    if (newGarment.trim() && !garmentPreferences.includes(newGarment.trim())) {
      setGarmentPreferences([...garmentPreferences, newGarment.trim()]);
      setNewGarment("");
    }
  };

  const handleRemoveGarment = (garmentToRemove) => {
    setGarmentPreferences(garmentPreferences.filter(garment => garment !== garmentToRemove));
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const renderProfile = () => (
    <div className="profile-main">
      <div className="user-info-section">
        <h2>My Profile</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="user-details">
            <p><strong>Name:</strong> {user?.name || "N/A"}</p>
            <p><strong>Email:</strong> {user?.email || "N/A"}</p>
          </div>
        )}
      </div>

      <div className="outfits-section">
        <h2>My Outfits</h2>
        {loading ? (
          <div className="loading">Loading outfits...</div>
        ) : clothingItems.length === 0 ? (
          <div className="no-outfits">
            <p>No tienes prendas aun.</p>
          </div>
        ) : (
          <div
            className="my-items-grid"
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            }}
          >
            {clothingItems.map((item) => {
              const photo = item.photo || null;
              const thumbCandidate =
                photo?.thumbnail_url ||
                photo?.thumbnail ||
                photo?.file_url ||
                photo?.file ||
                null;
              const thumb = resolveMediaUrl(thumbCandidate);

              return (
                <div
                  key={item.id}
                  className="item-card"
                  style={{
                    border: "1px solid #eee",
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      height: 160,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#fafafa",
                    }}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`photo-${item.id}`}
                        style={{
                          maxHeight: "100%",
                          maxWidth: "100%",
                          objectFit: "contain",
                        }}
                        loading="lazy"
                        onError={(e) => {
                          console.error("Image failed to load:", thumb, e);
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.nextSibling;
                          if (fallback) {
                            fallback.style.display = "block";
                          }
                        }}
                      />
                    ) : null}
                    <div
                      style={{
                        color: "#999",
                        display: thumb ? "none" : "block",
                      }}
                    >
                      {photo ? `photo-${item.id}` : "No image"}
                    </div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <strong>{item.type?.name || `Type #${item.type || ""}`}</strong>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      {item.formality || ""}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <small>Main color: {item.main_color || "--"}</small>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <small>Last used: {item.last_used || "--"}</small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="preferences-content">
      <p className="preferences-subtitle">You can change your preferences here</p>
      
      <div className="preference-section">
        <h3>Color preferences:</h3>
        <div className="input-container">
          <input
            type="text"
            placeholder="Add color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddColor)}
            className="preference-input"
          />
        </div>
        <div className="preferences-list">
          {colorPreferences.map((color, index) => (
            <span key={index} className="preference-tag color-tag">
              {color}
              <button 
                onClick={() => handleRemoveColor(color)}
                className="remove-btn"
              >
                x
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="preference-section">
        <h3>Garment preferences:</h3>
        <div className="input-container">
          <input
            type="text"
            placeholder="Add garment"
            value={newGarment}
            onChange={(e) => setNewGarment(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, handleAddGarment)}
            className="preference-input"
          />
        </div>
        <div className="preferences-list">
          {garmentPreferences.map((garment, index) => (
            <span key={index} className="preference-tag garment-tag">
              {garment}
              <button 
                onClick={() => handleRemoveGarment(garment)}
                className="remove-btn"
              >
                x
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="preference-section">
        <h3>Weather preferences:</h3>
        <p className="weather-question">How much do you want your outfits to adapt to the weather?</p>
        <div className="weather-options">
          {["Low", "Medium", "High"].map((option) => (
            <button
              key={option}
              className={`weather-btn ${weatherPreference === option ? "active" : ""}`}
              onClick={() => setWeatherPreference(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="tab-content">
      <p>Account settings coming soon...</p>
    </div>
  );

  const renderSettings = () => (
    <div className="tab-content">
      <p>Settings coming soon...</p>
    </div>
  );

  return (
    <Layout>
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {profileImageUrl && !avatarFailed ? (
              <img
                src={profileImageUrl}
                alt={user?.name ? `Foto de ${user.name}` : "Foto de perfil"}
                className="profile-avatar-img"
                loading="lazy"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className="avatar-icon">{userInitial}</span>
            )}
          </div>
          <div className="profile-info">
            <h1>{user?.name || "My Profile"}</h1>
            <p>This is your unique space</p>
            {user?.email && (
              <p className="profile-info-email">{user.email}</p>
            )}
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`tab-btn ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            Preferences
          </button>
          <button
            className={`tab-btn ${activeTab === "account" ? "active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            Account
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
        </div>

        <div className="profile-content">
          {activeTab === "profile" && renderProfile()}
          {activeTab === "preferences" && renderPreferences()}
          {activeTab === "account" && renderAccount()}
          {activeTab === "settings" && renderSettings()}
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
