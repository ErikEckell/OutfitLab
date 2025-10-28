// src/components/TopLayout.jsx
import React from "react";
import TopBar from "./TopBar";
import "./Layout.css"; // Reutilizamos el mismo estilo base

const TopLayout = ({
  children,
  className = "",
  contentClassName = "",
  shellClassName = "",
}) => {
  const containerClasses = ["app-container", className]
    .filter(Boolean)
    .join(" ");

  const contentClasses = ["app-content", "app-content--no-navbar", contentClassName]
    .filter(Boolean)
    .join(" ");

  const shellClasses = ["device-shell", shellClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClasses}>
      <div className={containerClasses}>
        <TopBar />
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
};

export default TopLayout;
