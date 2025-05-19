// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { GoSun } from "react-icons/go";
// import { FaRegMoon } from "react-icons/fa";
// import { FiChevronsLeft } from "react-icons/fi";
// import { ChevronDown } from "lucide-react";
// import PropTypes from "prop-types";
// import { useTheme } from "../context/ThemeContext";
// import axios from 'axios';
// import "../styles/Header.css";

// export const Header = ({ collapsed, setCollapsed, idUser }) => {
//   const navigate = useNavigate();
//   const { theme, toggleTheme } = useTheme();
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedLanguage, setSelectedLanguage] = useState("ENG");
//   const [alerts, setAlerts] = useState([]);
//   const [showAlerts, setShowAlerts] = useState(false);
//   const [unreadCount, setUnreadCount] = useState(0);

//   // Déclaration correcte des fonctions avec const
//   const getUserAlerts = async (idUser) => {
//     try {
//       const response = await axios.get(`http://localhost:8000/alertes/user/${idUser}`);
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching alerts:', error);
//       return [];
//     }
//   };

//   const markAlertsAsRead = async (idUser) => {
//     try {
//       const response = await axios.post(`http://localhost:8000/alertes/${idUser}/marquer-comme-vues`);
//       return response.data;
//     } catch (error) {
//       console.error('Error marking alerts as read:', error);
//       throw error;
//     }
//   };

//   const getUnreadAlertsCount = async (idUser) => {
//     try {
//       const response = await axios.get(`http://localhost:8000/alertes/non-vues/${idUser}`);
//       console.log(response.data)
//       return response.data;
//     } catch (error) {
//       console.error('Error fetching unread alerts count:', error);
//       return 0;
//     }
//   };

//   const handleToggleSidebar = () => {
//     if (setCollapsed) {
//       setCollapsed(!collapsed);
//     }
//   };

//   useEffect(() => {
//     const fetchUnreadCount = async () => {
//       try {
//         const count = await getUnreadAlertsCount(idUser);
//         setUnreadCount(count.alertes_non_vues);
//         console.log(count.alertes_non_vues)
//       } catch (error) {
//         console.error("Failed to fetch unread alerts count", error);
//       }
//     };

//     fetchUnreadCount();
//   }, [idUser]);

//   useEffect(() => {
//     const fetchAlerts = async () => {
//       if (showAlerts) {
//         try {
//           const alertsData = await getUserAlerts(idUser);
//           setAlerts(alertsData);
//         } catch (error) {
//           console.error("Failed to fetch alerts", error);
//         }
//       }
//     };

//     fetchAlerts();
//   }, [showAlerts, idUser]);

//   const handleAlertClick = async () => {
//     const newShowState = !showAlerts;
//     setShowAlerts(newShowState);

//     if (newShowState && unreadCount > 0) {
//       try {
//         await markAlertsAsRead(idUser);
//         setUnreadCount(0);
//       } catch (error) {
//         console.error("Failed to mark alerts as read", error);
//       }
//     }
//   };

//   const headerBgColor = theme === "light" ? "bg-white" : "bg-slate-900";
//   const iconColor = theme === "light" ? "text-gray-500" : "text-gray-300";

//   return (
//     <header
//       className={`fixed top-0 z-50 flex h-[60px] items-center justify-between 
//       ${headerBgColor} px-4 shadow-md transition-all duration-300 
//       ${collapsed ? "w-full pl-14" : "left-[280px] w-[calc(100%-280px)]"} 
//       rounded-lg`}
//     >
//       <div className="flex justify-between w-full">
//         {/* Sidebar Toggle & Search */}
//         <div className="flex items-center">
//           <button className="btn-ghost size-10 z-50" onClick={handleToggleSidebar}>
//             <FiChevronsLeft className={`transform transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
//           </button>
//           <div className="search-container flex-1 max-w-md">
//             <input type="text" placeholder="Search" className="search-input w-full" />
//             <span className="search-icon">🔍</span>
//           </div>
//         </div>

//         {/* Icons & Profile */}
//         <div className="flex items-center justify-between gap-x-4">
//           <button className="btn-ghost size-10 flex items-center justify-center" onClick={toggleTheme}>
//             {theme === "light" ? <FaRegMoon size={20} className={iconColor} /> : <GoSun size={20} className={iconColor} />}
//           </button>

//           {/* Notifications */}
//           <div className="relative">
//             <button 
//               className="notification-btn relative" 
//               onClick={handleAlertClick}
//             >
//               <span className="bell-icon">🔔</span>
//               {unreadCount > 0 && (
//                 <span className="notification-badge">{unreadCount}</span>
//               )}
//             </button>

//             {/* Popup des alertes */}
//             {showAlerts && (
//   <div className={`absolute right-0 mt-2 w-72 rounded-md shadow-lg py-1 
//     ${theme === "light" ? "bg-white" : "bg-slate-800"} 
//     ring-1 ring-black ring-opacity-5 z-50`}
//   >
//     <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
//       <h3 className="text-lg font-medium">Alertes</h3>
//     </div>
//     <div className="max-h-60 overflow-y-auto">
//       {alerts.length > 0 ? (
//         alerts.map((alert) => (
//           <div 
//             key={alert.idAlerte} 
//             className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 
//               ${!alert.vu ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
//           >
//             <p className="text-sm">
//               {alert.categorie_alert_id === 1 
//                 ? "Vous avez dépassé votre budget maximal de ce mois." 
//                 : alert.message || "Nouvelle alerte"}
//             </p>
//             <p className="text-xs text-gray-500 dark:text-gray-400">
//               {new Date(alert.date_alerte).toLocaleString()}
//             </p>
//           </div>
//         ))
//       ) : (
//         <div className="px-4 py-2 text-center text-sm text-gray-500">
//           Aucune alerte
//         </div>
//       )}
//     </div>
    
//   </div>
// )}
//           </div>

//           {/* Profil */}
//           <div className="profile-container">
//             <img
//               src="https://th.bing.com/th/id/R.848b893b43c813691190b8324cb8ace4?rik=V21wYc0FSlE8vQ&pid=ImgRaw&r=0"
//               alt="Profile"
//               className="profile-img"
//               onClick={() => navigate(`/UserSettings/${idUser}`)}
//               style={{ cursor: "pointer" }}
//             />
//             <span className="profile-name">Grace Stanley</span>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// Header.propTypes = {
//   collapsed: PropTypes.bool,
//   setCollapsed: PropTypes.func,
//   idUser: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
// };

import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';
import { AuthContext } from "../../commun/context/AuthContext";

function Header() {
  const { idUser } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  // Define all your functions BEFORE they're used in effects
  const getUserAlerts = async (idUser) => {
    try {
      const response = await axios.get(`http://localhost:8000/alertes/user/${idUser}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
  };

  const markAlertsAsRead = async (idUser) => {
    try {
      const response = await axios.post(`http://localhost:8000/alertes/${idUser}/marquer-comme-vues`);
      return response.data;
    } catch (error) {
      console.error('Error marking alerts as read:', error);
      throw error;
    }
  };

  const getUnreadAlertsCount = async (idUser) => {
    try {
      const response = await axios.get(`http://localhost:8000/alertes/non-vues/${idUser}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unread alerts count:', error);
      return 0;
    }
  };

  // Now the effects can safely use these functions
  useEffect(() => {
    if (idUser) {
      setLoading(false);
    }
  }, [idUser]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await getUnreadAlertsCount(idUser);
        setUnreadCount(count.alertes_non_vues);
      } catch (error) {
        console.error('Failed to fetch unread alerts count', error);
      }
    };

    if (idUser) {
      fetchUnreadCount();
    }
  }, [idUser]);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (showAlerts && idUser) {
        try {
          const alertsData = await getUserAlerts(idUser);
          setAlerts(alertsData);
        } catch (error) {
          console.error('Failed to fetch alerts', error);
        }
      }
    };

    fetchAlerts();
  }, [showAlerts, idUser]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Chargement...</div>;
  }

  const handleAlertClick = async () => {
    const newShowState = !showAlerts;
    setShowAlerts(newShowState);

    if (newShowState && unreadCount > 0) {
      try {
        await markAlertsAsRead(idUser);
        setUnreadCount(0);
      } catch (error) {
        console.error('Failed to mark alerts as read', error);
      }
    }
  };

  return (
    <div className="w-full h-20 px-6 flex items-center justify-between border-b bg-white">
      {/* Search bar */}
      <div className="flex-1 max-w-md">
        <input
          type="text"
          placeholder="Search"
          className="w-full px-4 py-2 rounded-xl border border-[#2DBDAC] focus:outline-none text-sm"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6 relative">
        {/* Notifications */}
        <div className="relative">
          <button onClick={handleAlertClick}>
            <FaBell className="text-gray-600 text-xl cursor-pointer" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#2DBDAC] text-white rounded-full text-xs px-1.5">
                {unreadCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div
              className={`absolute right-0 mt-2 w-72 rounded-md shadow-lg py-1 z-50 ${
                theme === 'light' ? 'bg-white' : 'bg-slate-800'
              } ring-1 ring-black ring-opacity-5`}
            >
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium">Alertes</h3>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <div
                      key={alert.idAlerte}
                      className={`px-4 py-2 border-b border-gray-200 dark:border-gray-700 ${
                        !alert.vu ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                    >
                      <p className="text-sm">
                        {alert.categorie_alert_id === 1
                          ? 'Vous avez dépassé votre budget maximal de ce mois.'
                          : alert.message || 'Nouvelle alerte'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(alert.date_alerte).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-center text-sm text-gray-500">
                    Aucune alerte
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile image */}
        <img
          src="https://i.pravatar.cc/40?img=5"
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover border-2 border-[#2DBDAC]"
        />
      </div>
    </div>
  );
}

Header.propTypes = {
  idUser: PropTypes.number.isRequired,
};

export { Header };