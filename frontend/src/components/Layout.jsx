import React from "react";
import TopBar from "./TopBar";
import Navbar from "./Navbar";
import "./Layout.css";

const Layout = ({
  children,
  showTopBar = true,
  showNavbar = true,
  className = "",
  contentClassName = "",
  shellClassName = "",
}) => {
  const containerClasses = [
    "app-container",
    !showTopBar && "app-container--no-topbar",
    !showNavbar && "app-container--no-navbar",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const contentClasses = [
    "app-content",
    !showTopBar && "app-content--no-topbar",
    !showNavbar && "app-content--no-navbar",
    contentClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const shellClasses = ["device-shell", shellClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClasses}>
      <div className={containerClasses}>
        {showTopBar && <TopBar />}
        <div className={contentClasses}>{children}</div>
        {showNavbar && <Navbar />}
      </div>
    </div>
  );
};

export default Layout;
