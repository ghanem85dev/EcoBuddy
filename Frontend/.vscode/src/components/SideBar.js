import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiAlertTriangle } from "react-icons/fi";
import { TbHomeBolt, TbDeviceAnalytics } from "react-icons/tb";
import { IoBarChartSharp, IoTimerSharp, IoNotifications, IoGameControllerOutline, IoSettings } from "react-icons/io5";
import { MdDeviceThermostat } from "react-icons/md";
import { LuThermometerSun } from "react-icons/lu";
import { FaMoneyCheckAlt } from "react-icons/fa";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {/* Bouton Menu */}
      <div className="cursor-pointer p-2" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        <FiMenu size={30} className="text-[#003366]" />
      </div>

      {/* Overlay foncé quand le sidebar est ouvert */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full overflow-y-auto bg-white text-[#003366] shadow-lg transition-transform duration-300 z-50 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-80 p-6 rounded-r-xl`}
      >
        {/* Titre et bouton de fermeture */}
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center">
            <TbHomeBolt size={35} className="text-[#4A90E2] mr-3" />
            <p className="text-xl font-bold">EnergyHub+</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-[#003366] text-2xl" aria-label="Fermer la sidebar">
            ✖
          </button>
        </div>

        {/* Navigation */}
        <nav>
          <ul className="flex flex-col gap-4 text-md">
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <IoBarChartSharp size={22} />
              <Link to="/dashboard">Tableau de bord</Link>
            </li>
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <IoTimerSharp size={22} />
              <Link to="/realtime">Consommation en temps réel</Link>
            </li>
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <TbDeviceAnalytics size={22} />
              <Link to="/devices">Appareils détectés</Link>
            </li>
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <MdDeviceThermostat size={22} />
              <Link to="/energy">Consommation d'énergie</Link>
            </li>
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <LuThermometerSun size={22} />
              <Link to="/solar">Simulateur solaire</Link>
            </li>
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <IoNotifications size={22} />
              <Link to="/notifications">Notifications</Link>
            </li>
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <FiAlertTriangle size={22} />
              <Link to="/alerts">Historique des alertes</Link>
            </li>
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <FaMoneyCheckAlt size={22} />
              <Link to="/payments">Gestion des paiements</Link>
            </li>
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <IoGameControllerOutline size={22} />
              <Link to="/gamification">Gamification</Link>
            </li>
            <li className="flex items-center gap-4 hover:bg-[#4A90E2] hover:text-white p-3 rounded-lg cursor-pointer transition-all">
              <IoSettings size={22} />
              <Link to="/settings">Paramètres</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
