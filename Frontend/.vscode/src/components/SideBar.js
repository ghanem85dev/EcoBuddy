
import React from "react";
import { Link } from "react-router-dom";
import { TbHomeBolt } from "react-icons/tb";
import { IoBarChartSharp, IoTimerSharp, IoNotifications, IoGameControllerOutline, IoSettingsOutline } from "react-icons/io5";
import { TbDeviceAnalytics } from "react-icons/tb";
import { MdDeviceThermostat } from "react-icons/md";
import { LuThermometerSun } from "react-icons/lu";
import { FiAlertTriangle } from "react-icons/fi";
import { FaMoneyCheckAlt } from "react-icons/fa";

const Sidebar = () => {
  return (
    <div className="sidebar-container w-64 bg-white text-black h-screen flex flex-col p-4">
      {/* Titre ou Logo */}
      <div className="sidebar-logo flex items-center mb-8" style={{ backgroundColor: "#F3F6F9", padding: "8px", borderRadius: "8px" }}>
        <TbHomeBolt size={27} className="mr-2" />
        <p className="text-lg font-bold uppercase">My <span className="text-secondary">EnergyHub+</span></p>
      </div>
      
      {/* Contenu de la sidebar */}
      <div className="w-60 bg-white text-black p-5">
  {/* Menu de navigation */}
  <ul className="flex flex-col gap-5 text-sm">
    <li className="flex items-center gap-3">
      <IoBarChartSharp size={20} />
      <Link to="/dashboard" className="text-gray-500 hover:text-[#fb923c]">
        Tableau de bord
      </Link>
    </li>
    <li className="flex items-center gap-3">
      <IoTimerSharp size={20} />
      <Link to="/realtime" className="text-gray-500 hover:text-[#fb923c]">
        Consommation en temps réel
      </Link>
    </li>
    <li className="flex items-center gap-3">
      <TbDeviceAnalytics size={20} />
      <Link to="/devices" className="text-gray-500 hover:text-[#fb923c]">
        Appareils détectés
      </Link>
    </li>
    <li className="flex items-center gap-3">
      <MdDeviceThermostat size={20} />
      <Link to="/energy" className="text-gray-500 hover:text-[#fb923c]">
        Consommation d'énergie
      </Link>
    </li>
    <li className="flex items-center gap-3">
      <LuThermometerSun size={20} />
      <Link to="/solar" className="text-gray-500 hover:text-[#fb923c]">
        Simulateur solaire
      </Link>
    </li>
    <li className="flex items-center gap-3">
      <IoNotifications size={20} />
      <Link to="/notifications" className="text-gray-500 hover:text-[#fb923c]">
        Notifications
      </Link>
    </li>
    <li className="flex items-center gap-3">
      <FiAlertTriangle size={20} />
      <Link to="/alerts" className="text-gray-500 hover:text-[#fb923c]">
        Historique des alertes
      </Link>
    </li>
    <li className="flex items-center gap-3">
      <FaMoneyCheckAlt size={20} />
      <Link to="/payments" className="text-gray-500 hover:text-[#fb923c]">
        Gestion des paiements
      </Link>
    </li>
    <li className="flex items-center gap-3">
      <IoGameControllerOutline size={20} />
      <Link to="/gamification" className="text-gray-500 hover:text-[#fb923c]">
        Gamification
      </Link>
    </li>
    <li className="flex items-center gap-3">
      <IoSettingsOutline size={19} />
      <Link to="/settings" className="text-gray-500 hover:text-[#fb923c]">
        Paramètres
      </Link>
    </li>
  </ul>
</div>




    </div>
  );
};

export default Sidebar;