import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoSun } from "react-icons/go";
import { FaRegMoon, FaRegBell } from "react-icons/fa";
import { FiChevronsLeft } from "react-icons/fi";
import { ChevronDown } from "lucide-react";
import PropTypes from "prop-types";
import { useTheme } from "../context/ThemeContext";
import "../styles/Header.css";

export const Header = ({ collapsed, setCollapsed, idUser }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("ENG");

  const handleToggleSidebar = () => {
    if (setCollapsed) {
      setCollapsed(!collapsed);
    }
  };

  const languages = [
    { code: "ENG", label: "English" },
    { code: "ESP", label: "Spanish" },
    { code: "FRA", label: "French" },
  ];

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.code);
    setIsOpen(false); // Ferme le menu après sélection
  };

  const headerBgColor = theme === "light" ? "bg-white" : "bg-slate-900";
  const iconColor = theme === "light" ? "text-gray-500" : "text-gray-300";

  return (
    <header
      className={`fixed top-0 z-50 flex h-[60px] items-center justify-between 
      ${headerBgColor} px-4 shadow-md transition-all duration-300 
      ${collapsed ? "w-full pl-14" : "left-[280px] w-[calc(100%-280px)]"} 
      rounded-lg`}
    >
      <div className="flex justify-between w-full">
        {/* Sidebar Toggle & Search */}
        <div className="flex items-center">
          <button className="btn-ghost size-10 z-50" onClick={handleToggleSidebar}>
            <FiChevronsLeft className={`transform transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
          <div className="search-container flex-1 max-w-md">
            <input type="text" placeholder="Search" className="search-input w-full" />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        {/* Icons & Profile */}
        <div className="flex items-center justify-between gap-x-4">
          <button className="btn-ghost size-10 flex items-center justify-center" onClick={toggleTheme}>
            {theme === "light" ? <FaRegMoon size={20} className={iconColor} /> : <GoSun size={20} className={iconColor} />}
          </button>

          {/* Sélecteur de langue */}
          <div className="language-selector">
            <button className="language-selector-button" onClick={() => setIsOpen(!isOpen)}>
              <span>{selectedLanguage}</span>
              <ChevronDown className="chevron-icon" />
            </button>
            {isOpen && (
              <ul className="language-dropdown">
                {languages.map((language) => (
                  <li key={language.code} className="language-option" onClick={() => handleLanguageSelect(language)}>
                    {language.label} ({language.code})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Notifications & Messages */}
          <button className="messenger-btn">
            <span className="message-icon">💬</span>
          </button>
          <button className="notification-btn">
            <span className="bell-icon">🔔</span>
            <span className="notification-badge">2</span>
          </button>

          {/* Profil */}
          <div className="profile-container">
            <img
              src="https://th.bing.com/th/id/R.848b893b43c813691190b8324cb8ace4?rik=V21wYc0FSlE8vQ&pid=ImgRaw&r=0"
              alt="Profile"
              className="profile-img"
              onClick={() => navigate(`/UserSettings/${idUser}`)} // Redirection
              style={{ cursor: "pointer" }} // Indique que c'est cliquable
            />
            <span className="profile-name">Grace Stanley</span>
          </div>

        
        </div>
      </div>
    </header>
  );
};

Header.propTypes = {
  collapsed: PropTypes.bool,
  setCollapsed: PropTypes.func,
  idUser: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // Accepte string ou number
};
