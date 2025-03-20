import React, { forwardRef, useState } from "react";
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
import "../styles/Sidebar.css";
import { LogOutIcon } from "lucide-react";

// Navbar links
export const navbarLinks = [
  {
    links: [
      { label: "Tableau de bord", icon: IoBarChartSharp, path: "/dashboard" },
      {
        label: "Consommation",
        icon: IoTimerSharp,
        path: "/realtime",
      },
      {
        label: "Appareils connectés",
        icon: TbDeviceAnalytics,
        path: "/devices",
      },
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
      {
        label: "Gamification",
        icon: IoGameControllerOutline,
        path: "/gamification",
      },
      { label: "Paramètres généraux", icon: IoSettings, path: "/settings" },
      { label: "Logout", icon: LogOutIcon, path: "/logout" },
    ],
  },
];

// Sidebar component
const Sidebar = forwardRef(
  (
    { collapsed, activePage, setActivePage, isOpenSidebar, setIsOpenSidebar },
    ref
  ) => {
    const { theme } = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(collapsed);
    const navigate = useNavigate();

    // Flatten the nested navbarLinks structure for rendering
    const allLinks = navbarLinks.flatMap((section) => section.links);

    // Handle active page changes and propagate to parent if needed
    const handleSetActivePage = (page) => {
      setActivePage(page);
      if (setActivePage) {
        setActivePage(page);
      }
    };

    const handleNavigation = (item) => {
      handleSetActivePage(item.label);
      navigate(item.path); // Make sure to import navigate from react-router-dom
    };

    // Use effect to initialize default active page
    React.useEffect(() => {
      if (!activePage) {
        handleSetActivePage("Tableau de bord");
      }
    }, []);

    React.useEffect(() => {
      setIsCollapsed(collapsed);
    }, [collapsed]);

    return (
      <div
        className={`sidebar ${!collapsed ? "collapsed-sidebar" : ""}`}
        ref={ref}
      >
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
            className={`sidebar-icons ${
              collapsed
                ? "collapsed-sidebar-icons"
                : "sidebar-nav-icons sidebar-icons"
            }`}
          >
            {allLinks.map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={index}>
                  <button
                    onClick={() => handleSetActivePage(item.label)}
                    className={`sidebar-nav-button ${
                      activePage === item.label ? "active" : ""
                    }`}
                  >
                  <div className="icon-line text-white">
                      <Icon
                        className={`side-bar-icon ${
                          !collapsed ? "side-bar-icon" : "side-bar-icon-collapsed"
                        }`}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Title with labels */}
          {!collapsed ? (
            <ul className="sidebar-title">
              {allLinks.map((item, index) => (
                <li className="last-title" key={index}>
                  <button
                    onClick={() => handleSetActivePage(item.label)}
                    className={`sidebar-nav-button ${
                      activePage === item.label ? "active-title" : ""
                    }`}
                  >
                    <span className="menu-text">{item.label}</span>

                    <div
                      className={`sidebar-nav-button ${
                        activePage === item.label ? "curved-border" : ""
                      }`}
                    ></div>
                    <div
                      className={`sidebar-nav-button ${
                        activePage === item.label ? "curved-border2" : ""
                      }`}
                    ></div>
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
  }
);

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
  collapsed: PropTypes.bool,
  activePage: PropTypes.string,
  setActivePage: PropTypes.func,
  isOpenSidebar: PropTypes.bool,
  setIsOpenSidebar: PropTypes.func,
};

export { Sidebar };