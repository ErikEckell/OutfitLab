import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TopBar.css";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const TopBar = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await fetch(`${API_BASE_URL}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
    } catch (error) {
      console.warn(
        "Logout request failed, clearing local session anyway.",
        error
      );
    } finally {
      localStorage.removeItem("outfitlabUser");
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, navigate]);

  const handleLogoClick = () => {
    navigate("/home");
  };

  return (
    <div className="topbar">
      <h1 className="topbar-title clickable" onClick={handleLogoClick}>
        Outfit<span>Lab</span>
      </h1>
      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-logout-button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
};

export default TopBar;