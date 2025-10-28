import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const items = [
  { icon: "🏠", label: "Home", path: "/home" },
  { icon: "👕", label: "My Closet", path: "/closet" },
  { icon: "⚗️", label: "Laboratory", path: "/laboratory" },
  { icon: "☀️", label: "Weather", path: "/weather" },
  { icon: "👤", label: "My Profile", path: "/profile" },
];

const Navbar = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    if (!path) {
      console.info("No path provided for navigation.");
      return;
    }

    navigate(path);
  };

  return (
    <div className="navbar">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className="nav-item"
          onClick={() => handleNavigation(item.path)}
        >
          <span aria-hidden="true">{item.icon}</span>
          <p>{item.label}</p>
        </button>
      ))}
    </div>
  );
};

export default Navbar;
