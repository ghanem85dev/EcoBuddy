import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { GoSun } from "react-icons/go";
import { useTheme } from "../../commun/context/ThemeContext";
import { FaRegMoon } from "react-icons/fa";
import { FiChevronsLeft } from "react-icons/fi";

export const AdminNavbar = ({ collapsed, setCollapsed, idUser }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleToggleSidebar = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed);
    }
  };

  const headerBgColor = theme === "light" ? "bg-white" : "bg-slate-900";
  const iconColor = theme === "light" ? "text-gray-500" : "text-gray-300";

  return (
    <div className={`fixed top-0 z-50 flex h-[60px] items-center justify-between 
      ${headerBgColor} px-4 shadow-md transition-all duration-300 
      ${collapsed ? "w-full pl-14" : "left-[280px] w-[calc(100%-280px)]"} 
      rounded-lg`}>
      <div className="flex justify-between w-full">
        {/* Sidebar Toggle & Search */}
        <div className="flex items-center">
          <button className="btn-ghost size-10 z-50" onClick={handleToggleSidebar}>
            <FiChevronsLeft className={`transform transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <div className="search-container flex-1 max-w-md ml-4">
            <input 
              type="text" 
              placeholder="Search" 
              className="search-input w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>

        {/* Icons & Profile */}
        <div className="flex items-center justify-between gap-x-4">
          <button className="btn-ghost size-10 flex items-center justify-center" onClick={toggleTheme}>
            {theme === "light" ? <FaRegMoon size={20} className={iconColor} /> : <GoSun size={20} className={iconColor} />}
          </button>

          {/* Notifications & Messages */}
          <button className="messenger-btn relative">
            <span className="text-xl">💬</span>
          </button>
          <button className="notification-btn relative">
            <span className="text-xl">🔔</span>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">2</span>
          </button>

          {/* Profil */}
          <div className="profile-container flex items-center gap-2">
            <img
              src="https://th.bing.com/th/id/R.848b893b43c813691190b8324cb8ace4?rik=V21wYc0FSlE8vQ&pid=ImgRaw&r=0"
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover"
              onClick={() => navigate(`/UserSettings/${idUser}`)}
              style={{ cursor: "pointer" }}
            />
            <span className="profile-name hidden md:inline">Grace Stanley</span>
          </div>
        </div>
      </div>
    </div>
  );
};

AdminNavbar.propTypes = {
  collapsed: PropTypes.bool,
  setCollapsed: PropTypes.func,
  idUser: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};