import React, { forwardRef, useState, useContext, useEffect } from "react";
import {
  IoBarChartSharp,
  IoTimerSharp,
  IoNotifications,
  IoGameControllerOutline,
  IoSettings,
} from "react-icons/io5";
import { TbDeviceAnalytics } from "react-icons/tb";
import { MdDeviceThermostat } from "react-icons/md";
import { LuThermometerSun } from "react-icons/lu";
import { FaMoneyCheckAlt, FaUserPlus } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { NavLink, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { LogOutIcon } from "lucide-react";
import { AuthContext } from "../context/AuthContext"; // Import du contexte d'authentification
import "../styles/Sidebar.css";

// Définition des liens du sidebar
export const navbarLinks = [
  {
    links: [
      { label: "Tableau de bord", icon: IoBarChartSharp, path: "/dashboard" },
      { label: "Consommation", icon: IoTimerSharp, path: "/realtime" },
      { label: "Appareils connectés", icon: TbDeviceAnalytics, path: "/devices" },
    ],
  },
  {
    links: [
      { label: "Suivi énergétique", icon: MdDeviceThermostat, path: "/energy" },
      { label: "Simulateur solaire", icon: LuThermometerSun, path: "/solar" },
    ],
  },
  {
    links: [
      { label: "Notifications", icon: IoNotifications, path: "/notifications" },
      { label: "Alertes & Historique", icon: FiAlertTriangle, path: "/alerts" },
      { label: "Paiements", icon: FaMoneyCheckAlt, path: "/payments" },
      { label: "Invitations", icon: FaUserPlus, path: "/invite" },
      { label: "Gamification", icon: IoGameControllerOutline, path: "/gamification" },
      { label: "Paramètres généraux", icon: IoSettings, path: "/settings" },
      { label: "Logout", icon: LogOutIcon, path: "/logout" },
    ],
  },
];

// Liens spécifiques pour les administrateurs
export const adminLinks = [
  {
    links: [
      { label: "Gestion des utilisateurs", icon: FaUserPlus, path: "/admin/users" },
      { label: "Gestion des paiements", icon: FaMoneyCheckAlt, path: "/admin/payments" },
    ],
  },
];

const Sidebar = forwardRef(({ collapsed, activePage, setActivePage }, ref) => {
  const { theme } = useTheme();
  const { role } = useContext(AuthContext); // Récupération du rôle utilisateur
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const navigate = useNavigate();

  // Filtrer les liens en fonction du rôle
  const filteredLinks = role === "admin" ? [...navbarLinks, ...adminLinks] : navbarLinks;
  const allLinks = filteredLinks.flatMap((section) => section.links);

  // Gestion de l'activation des pages
  const handleSetActivePage = (page) => {
    if (setActivePage) {
      setActivePage(page);
    }
  };

  const handleNavigation = (item) => {
    handleSetActivePage(item.label);
    navigate(item.path);
  };

  useEffect(() => {
    if (!activePage) {
      handleSetActivePage("Tableau de bord");
    }
  }, []);

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  return (
    <div className={`sidebar ${!collapsed ? "collapsed-sidebar" : ""}`} ref={ref}>
      {/* HEADER SIDEBAR */}
      {!collapsed ? (
        <div className="sb-logo-icon-titles">
          <div className="sb-logo">
            <div className="sidebar-header">
              <div className="sidebar-logo">
                <span>My</span>
              </div>
              {!collapsed && <h2 className="sidebar-title">EnergyHub</h2>}
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden"></div>
      )}

      {/* NAVIGATION */}
      <nav className="sidebar-nav-icons">
        <ul className={`sidebar-icons ${collapsed ? "collapsed-sidebar-icons" : ""}`}>
          {allLinks.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <button
                  onClick={() => handleNavigation(item)}
                  className={`sidebar-nav-button ${activePage === item.label ? "active" : ""}`}
                >
                  <div className="icon-line text-white">
                    <Icon className={`side-bar-icon ${collapsed ? "side-bar-icon-collapsed" : ""}`} />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Titres avec labels */}
        {!collapsed ? (
          <ul className="sidebar-title">
            {allLinks.map((item, index) => (
              <li className="last-title" key={index}>
                <button
                  onClick={() => handleNavigation(item)}
                  className={`sidebar-nav-button ${activePage === item.label ? "active-title" : ""}`}
                >
                  <span className="menu-text">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="hidden"></ul>
        )}
      </nav>
    </div>
  );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
  activePage: PropTypes.string,
  setActivePage: PropTypes.func.isRequired,
};

Sidebar.defaultProps = {
  collapsed: false,
  activePage: "Tableau de bord",
  setActivePage: () => {},
};

export { Sidebar };
