import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import "./Home.css";

const Home = () => {
  const [mixes, setMixes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    // Evitar múltiples ejecuciones
    if (isInitialized) {
      console.log("useEffect already initialized, skipping...");
      return;
    }
    
    let isCancelled = false;
    
    const fetchAIMixes = async () => {
      setLoading(true);
      try {
        // If user is logged in, try to fetch a recommended outfit from backend.
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const API_BASE = "http://127.0.0.1:8000/api";

        if (token) {
          console.log("Found token, making recommendation request...");
          // Primary call: ask backend for a recommended outfit
          const res = await fetch(`${API_BASE}/recommend-outfit/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          console.log("Recommendation response status:", res.status);

          if (res.ok) {
            const json = await res.json();
            console.log("Recommendation response:", json);

            // Detect array of IDs in a few possible shapes
            let ids = [];
            if (Array.isArray(json)) ids = json;
            else if (Array.isArray(json.outfit)) ids = json.outfit;
            else if (Array.isArray(json.items)) ids = json.items;
            else if (Array.isArray(json.recommendation)) ids = json.recommendation;
            else if (Array.isArray(json.recommended_ids)) ids = json.recommended_ids;

            console.log("Extracted IDs:", ids);

            // If we got ids, fetch each ClothingItem detail to obtain image URLs
            if (ids.length > 0) {
              const imagePromises = ids.map(async (id) => {
                try {
                  console.log(`Fetching item ${id}...`);
                  const r = await fetch(`${API_BASE}/clothing-items/${id}/`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  
                  if (!r.ok) {
                    console.log(`Failed to fetch item ${id}: ${r.status} ${r.statusText}`);
                    return null;
                  }
                  
                  const item = await r.json();
                  console.log(`Item ${id} data:`, item);
                  
                  // Try several possible paths for the photo URL
                  const photo = item.photo || item.photo_detail || null;
                  if (!photo) {
                    console.log(`No photo found for item ${id}`);
                    return null;
                  }
                  
                  console.log(`Photo object for item ${id}:`, photo);
                  
                  const imageUrl = (
                    photo.file_url || 
                    photo.thumbnail_url || 
                    photo.file || 
                    photo.thumbnail || 
                    (photo.file && (photo.file.startsWith("http") ? photo.file : `http://127.0.0.1:8000${photo.file}`))
                  );
                  
                  console.log(`Final image URL for item ${id}:`, imageUrl);
                  return imageUrl;
                } catch (e) {
                  console.error(`Error fetching clothing item ${id}:`, e);
                  return null;
                }
              });

              const images = (await Promise.all(imagePromises)).filter(Boolean);
              console.log("Final images array:", images);
              
              // Build a single mix object that contains the outfit images
              if (images.length > 0 && !isCancelled) {
                console.log("Setting recommended outfit with images:", images);
                setMixes([{ id: "recommended", images }]);
                setHasRecommendations(true);
                setIsInitialized(true);
                return;
              } else {
                console.log("No images found, showing fallback message");
                setMixes([{ 
                  id: "no-images", 
                  message: "Items found but no images available" 
                }]);
                setHasRecommendations(true);
                setIsInitialized(true);
                return;
              }
            }
          } else if (res.status === 400) {
            // User doesn't have enough clothes for recommendations
            const errorData = await res.json().catch(() => ({}));
            console.log("Not enough clothes for recommendation:", errorData);
            
            // Show a special message for users without enough clothes
            setMixes([{ 
              id: "no-clothes", 
              message: "Add some clothes to your closet to get AI recommendations!" 
            }]);
            setHasRecommendations(true);
            setIsInitialized(true);
            return;
          } else if (res.status === 401) {
            // Token expired or invalid - user needs to login again
            console.log("Authentication failed - token may be expired");
            
            // Clear the invalid token
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("currentUser");
            
            // Show login message
            setMixes([{ 
              id: "need-login", 
              message: "Please log in to see personalized outfit recommendations" 
            }]);
            setHasRecommendations(true);
            setIsInitialized(true);
            return;
          } else {
            console.log("Failed to get recommendation:", res.status);
          }
        } else {
          console.log("No token found in localStorage");
        }

        // Only show fallback if we haven't already set recommendations
        if (!hasRecommendations && !isInitialized) {
          console.log("Falling back to placeholder images");
          const data = [
            { id: 1, imgUrl: "https://via.placeholder.com/180x250?text=Outfit+1" },
            { id: 2, imgUrl: "https://via.placeholder.com/180x250?text=Outfit+2" },
            { id: 3, imgUrl: "https://via.placeholder.com/180x250?text=Outfit+3" },
          ];
          setMixes(data);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to fetch AI mixes:", error);
        // Only show fallback on error if we haven't already set recommendations
        if (!hasRecommendations && !isInitialized) {
          const data = [
            { id: 1, imgUrl: "https://via.placeholder.com/180x250?text=Outfit+1" },
            { id: 2, imgUrl: "https://via.placeholder.com/180x250?text=Outfit+2" },
            { id: 3, imgUrl: "https://via.placeholder.com/180x250?text=Outfit+3" },
          ];
          setMixes(data);
          setIsInitialized(true);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };
    
    // Add small delay to prevent multiple rapid calls
    const timeoutId = setTimeout(fetchAIMixes, 100);
    
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, []); // Ejecutar solo una vez al montar el componente

  const quickActions = [
    {
      id: "closet",
      label: "My Closet",
      path: "/closet",
      icon: (
        <svg
          className="home-action__icon-svg"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M32 14c-3.3 0-6 2.7-6 6 0 2.3 1.5 4.3 3.6 5l2.4.8v3.1L12.7 42c-1.4.8-.8 2.9.8 2.9h37c1.6 0 2.2-2.1.8-2.9L32 28.9V25.8l2.5-.8c2-0.7 3.5-2.7 3.5-5 0-3.3-2.7-6-6-6z"
            fill="none"
            stroke="#7d7d7d"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      id: "laboratory",
      label: "Laboratory",
      path: "/laboratory",
      icon: (
        <svg
          className="home-action__icon-svg"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M24 12h16m-4 0v18l11 17H17l11-17V12"
            fill="none"
            stroke="#7d7d7d"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 34h16"
            fill="none"
            stroke="#7d7d7d"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="28" cy="28" r="2" fill="#7d7d7d" />
          <circle cx="36" cy="30" r="1.8" fill="#7d7d7d" />
        </svg>
      ),
    },
    {
      id: "weather",
      label: "Weather",
      path: "/weather",
      icon: (
        <svg
          className="home-action__icon-svg"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="32"
            cy="32"
            r="10"
            fill="none"
            stroke="#7d7d7d"
            strokeWidth="3"
          />
          <path
            d="M32 14v6M32 44v6M18 32h-6M52 32h6M22 22l-4-4M46 46l4 4M46 18l4-4M18 46l-4 4"
            fill="none"
            stroke="#7d7d7d"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <Layout>
      <section className="home-container">
        <div className="home-actions">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="home-action"
              onClick={() => navigate(action.path)}
            >
              <span className="home-action__icon" aria-hidden="true">
                {action.icon}
              </span>
              <span className="home-action__label">{action.label}</span>
            </button>
          ))}
        </div>
        <h2 className="home-subtitle">Laboratory Mixes of The day</h2>
        {loading ? (
          <p className="home-loading">🧠 Generating outfits with AI...</p>
        ) : (
          <div className="home-mix-grid">
            {mixes.map((mix) => (
              <div key={mix.id} className="home-mix-card">
                {/* Special message when user doesn't have enough clothes */}
                {mix.message ? (
                  <div style={{ 
                    width: 180, 
                    height: 180, 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed #ccc',
                    borderRadius: 8,
                    background: '#f9f9f9',
                    padding: 16,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: 8 }}>👔</div>
                    <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.3 }}>
                      {mix.message}
                    </div>
                    <button 
                      onClick={() => navigate("/closet")}
                      style={{
                        marginTop: 8,
                        padding: '6px 12px',
                        fontSize: '10px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                    >
                      Go to Closet
                    </button>
                  </div>
                ) : mix.images ? (
                  /* If mix contains multiple images (recommended outfit), render them inside a square 2x2 */
                  <div className="outfit-square" style={{ 
                    width: 180, 
                    height: 180, 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gridTemplateRows: '1fr 1fr', 
                    gap: 2,
                    border: '2px solid #e0e0e0',
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}>
                    {console.log("Rendering outfit with images:", mix.images)}
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} style={{ overflow: 'hidden', position: 'relative' }}>
                        {mix.images[i] ? (
                          <img
                            src={mix.images[i]}
                            alt={`piece-${i}`}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover', 
                              display: 'block' 
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: '100%', 
                            height: '100%', 
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: '#999'
                          }}>
                            {i < mix.images.length ? '' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <img
                    src={mix.imgUrl}
                    alt={`AI Outfit ${mix.id}`}
                    className="home-mix-image"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Home;
