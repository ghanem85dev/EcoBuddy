import React, { forwardRef, useState, useContext, useEffect, useMemo } from "react";
import {
  IoBarChartSharp,
  IoTimerSharp,
  IoNotifications,
  IoGameControllerOutline,
  IoSettings,
  IoBusiness,
  IoHelpCircleOutline
} from "react-icons/io5";
import { useLocation } from "react-router-dom";
import { TbDeviceAnalytics } from "react-icons/tb";
import { MdDeviceThermostat } from "react-icons/md";
import { LuThermometerSun } from "react-icons/lu";
import { FaMoneyCheckAlt, FaUserPlus } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { LogOutIcon } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import "../styles/Sidebar.css";
import { IoLocationSharp } from "react-icons/io5";

export const adminLinks = [
  {
    links: [
      {
        label: "Tableau de bord",
        icon: IoBarChartSharp,
        path: "/admin/dashboard"
      },
      { 
        label: "Entreprises", 
        icon: IoBusiness, 
        path: "/admin/entrepriseSettings"
      },
      { 
        label: "Locaux", 
        icon: IoLocationSharp, 
        path: "/admin/Sites-settings"
      },
      { 
        label: "FAQ", 
        icon: IoHelpCircleOutline, 
        path: "/admin/question"
      },
    ],
  },
];

export const navbarLinks = [
  {
    links: [
      {
        label: "Tableau de bord",
        icon: IoBarChartSharp,
        path: (role) => role === "entreprise" ? "/dashboard/entreprise" : "/dashboard",
      },
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

export const entrepriseLinks = [
  {
    links: [
      { 
        label: "Entreprises et locaux", 
        icon: IoBusiness, 
        path: "/listEntreprises" 
      },
      { 
        label: "Sites gérés", 
        icon: IoLocationSharp, 
        path: "/dashboard/responsable" 
      },
    ],
  },
];

const Sidebar = forwardRef(({ collapsed, activePage, setActivePage }, ref) => {
  const { theme } = useTheme();
  const { role, user } = useContext(AuthContext);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const navigate = useNavigate();
  const location = useLocation();

  const getSidebarColors = () => {
    if (!role) return { main: "#5a75d7", secondary: "#3e53a0" };
    
    switch(role) {
      case "entreprise":
        return { main: "#0078B8", secondary: "#0069A1" };
      case "admin":
        return { main: "#5784BA", secondary: "#4a76b8" };
      default:
        return { main: "#5a75d7", secondary: "#3e53a0" };
    }
  };

  const colors = useMemo(() => getSidebarColors(), [role]);

  const getFilteredLinks = () => {
    if (!role) return [];
    
    let links = [...navbarLinks];
    
    if (role === "admin") {
      links = [...adminLinks];
    } else if (role === "entreprise") {
      const entrepriseLinksWithId = entrepriseLinks.map(section => ({
        ...section,
        links: section.links.map(link => ({
          ...link,
          path: link.path === "/listEntreprises" 
            ? `/listEntreprises` 
            : link.path
        }))
      }));
      links = [...entrepriseLinksWithId, ...links];
    }
    
    return links;
  };

  const filteredLinks = useMemo(() => getFilteredLinks(), [role]);
  const allLinks = filteredLinks.flatMap((section) => section.links);

  useEffect(() => {
    if (!role) return;
    
    const currentPath = location.pathname;
    const matchingLink = allLinks.find(link => {
      const linkPath = typeof link.path === 'function' ? link.path(role) : link.path;
      return currentPath === linkPath;
    });
    
    if (matchingLink) {
      setActivePage(matchingLink.label);
    }
  }, [location.pathname, role, allLinks, setActivePage]);

  const handleSetActivePage = (page) => {
    if (setActivePage) {
      setActivePage(page);
    }
  };

  const handleNavigation = (item) => {
    handleSetActivePage(item.label);
    const path = typeof item.path === 'function' ? item.path(role) : item.path;
    navigate(path);
  };

  useEffect(() => {
    if (!activePage && allLinks.length > 0) {
      handleSetActivePage(allLinks[0].label);
    }
  }, [allLinks]);

  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  if (!role) return null;

  return (
    <div className={`sidebar ${!collapsed ? "collapsed-sidebar" : ""} ${role}-role`} ref={ref}>
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
        <ul 
          className={`sidebar-icons ${collapsed ? "collapsed-sidebar-icons" : ""}`}
          style={{ backgroundColor: colors.main }}
        >
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

        {!collapsed && (
          <ul 
            className="sidebar-title"
            style={{ backgroundColor: colors.secondary }}
          >
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