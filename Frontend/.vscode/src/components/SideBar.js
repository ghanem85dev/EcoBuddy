import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiBell, FiMessageSquare, FiAlertTriangle } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import { TbHomeBolt, TbDeviceAnalytics } from "react-icons/tb";
import { IoBarChartSharp, IoTimerSharp, IoNotifications, IoGameControllerOutline, IoSettings } from "react-icons/io5";
import { MdDeviceThermostat } from "react-icons/md";
import { LuThermometerSun } from "react-icons/lu";
import { FaMoneyCheckAlt } from "react-icons/fa";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);

  // Gestion du clic extérieur pour fermer la sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    localStorage.removeItem("userToken"); // Supprimer le token utilisateur
    navigate("/login"); // Redirection vers la page de connexion
  };

  return (
    <div className="relative">
      {/* Sidebar Toggle (Icône du menu hamburger) */}
      <div className="cursor-pointer p-2" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <span className="block w-8 h-1 bg-black mb-1 rounded"></span>
        <span className="block w-8 h-1 bg-black mb-1 rounded"></span>
        <span className="block w-8 h-1 bg-black rounded"></span>
      </div>

      {/* Fond de flou si la sidebar est ouverte */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-transform duration-300 z-50 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 p-5`}
      >
        {/* Logo et bouton de fermeture */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center bg-gray-100 p-2 rounded-lg">
            <TbHomeBolt size={27} className="mr-2 text-orange-500" />
            <p className="text-lg font-bold uppercase">EnergyHub+</p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="text-gray-500 text-xl"
            aria-label="Fermer la sidebar"
          >
            ✖
          </button>
        </div>

        {/* Menu de navigation */}
        <nav>
          <ul className="flex flex-col gap-4 text-sm">
            <li className="flex items-center gap-4">
              <IoBarChartSharp size={20} />
              <Link to="/dashboard" className="text-gray-500 hover:text-[#fb923c]">Tableau de bord</Link>
            </li>
            <li className="flex items-center gap-4">
              <IoTimerSharp size={20} />
              <Link to="/realtime" className="text-gray-500 hover:text-[#fb923c]">Consommation en temps réel</Link>
            </li>
            <li className="flex items-center gap-4">
              <TbDeviceAnalytics size={20} />
              <Link to="/devices" className="text-gray-500 hover:text-[#fb923c]">Appareils détectés</Link>
            </li>
            <li className="flex items-center gap-4">
              <MdDeviceThermostat size={20} />
              <Link to="/energy" className="text-gray-500 hover:text-[#fb923c]">Consommation d'énergie</Link>
            </li>
            <li className="flex items-center gap-4">
              <LuThermometerSun size={20} />
              <Link to="/solar" className="text-gray-500 hover:text-[#fb923c]">Simulateur solaire</Link>
            </li>
            <li className="flex items-center gap-4">
              <IoNotifications size={20} />
              <Link to="/notifications" className="text-gray-500 hover:text-[#fb923c]">Notifications</Link>
            </li>
            <li className="flex items-center gap-4">
              <FiAlertTriangle size={20} />
              <Link to="/alerts" className="text-gray-500 hover:text-[#fb923c]">Historique des alertes</Link>
            </li>
            <li className="flex items-center gap-4">
              <FaMoneyCheckAlt size={20} />
              <Link to="/payments" className="text-gray-500 hover:text-[#fb923c]">Gestion des paiements</Link>
            </li>
            <li className="flex items-center gap-4">
              <IoGameControllerOutline size={20} />
              <Link to="/gamification" className="text-gray-500 hover:text-[#fb923c]">Gamification</Link>
            </li>
            <li className="flex items-center gap-4">
              <IoSettings size={19} />
              <Link to="/settings" className="text-gray-500 hover:text-[#fb923c]">Paramètres</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
