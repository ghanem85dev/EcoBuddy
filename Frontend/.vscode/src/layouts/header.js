import React from "react";
import { useNavigate } from "react-router-dom";
import { GoSun } from "react-icons/go";
import { FaRegMoon, FaRegBell } from "react-icons/fa";
import { FiChevronsLeft } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import profileImg from "../assets/profile-image.jpg";
import PropTypes from "prop-types";
import { useTheme } from "../context/ThemeContext";

export const Header = ({ collapsed, setCollapsed, idUser }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleToggleSidebar = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed);
    }
  };

  const headerBgColor = theme === "light" ? "bg-white" : "bg-slate-900";
  const textColor = theme === "light" ? "text-gray-800" : "text-white";
  const iconColor = theme === "light" ? "text-gray-500" : "text-gray-300";
  const borderColor = theme === "light" ? "border-gray-300" : "border-gray-700";
  const focusRingColor = theme === "light" ? "focus:ring-blue-300" : "focus:ring-blue-500";

  return (
    <header
      className={`fixed top-0 z-50 flex h-[60px] items-center justify-between 
        ${headerBgColor} px-4 shadow-md transition-all duration-300 
        ${collapsed ? "w-full pl-14" : "left-[280px] w-[calc(100%-280px)]"} 
        rounded-lg`}  // Ajustement de la largeur en fonction de la sidebar
  
    >
      {/* Bouton pour ouvrir/fermer la sidebar */}
      <button
        className="absolute left-6 btn-ghost size-10 z-50"
        onClick={handleToggleSidebar}
      >
        <FiChevronsLeft className={`transform transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
      </button>

      {/* Barre de recherche */}
      <div className="flex items-center gap-x-3 pl-20">
        <div className={`input flex items-center gap-2 border ${borderColor} rounded-lg px-3 py-2 dark:${borderColor}`}>
          <FaSearch className={`${iconColor}`} />
          <input
            type="text"
            placeholder="Search..."
            className={`w-full bg-transparent ${textColor} focus:outline-none ${focusRingColor}`}
          />
        </div>
      </div>

      {/* Icônes et profil */}
      <div className="flex items-center gap-x-3 ml-[16px]"> {/* Ajouté ml-[16px] */}
        <button className="btn-ghost size-10" onClick={toggleTheme}>
          {theme === "light" ? <FaRegMoon size={20} className={`${iconColor}`} /> : <GoSun size={20} className={`${iconColor}`} />}
        </button>
        <button className="btn-ghost size-10">
          <FaRegBell size={20} className={`${iconColor}`} />
        </button>
        <button className="size-10 overflow-hidden rounded-full" onClick={() => navigate(`/UserSettings/${idUser}`)}>
          <img src={profileImg} alt="profile" className="size-full object-cover" />
        </button>
      </div>
    </header>
  );
};

Header.propTypes = {
  collapsed: PropTypes.bool,
  setCollapsed: PropTypes.func,
  idUser: PropTypes.string,
};
