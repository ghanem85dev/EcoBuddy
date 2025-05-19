import React from 'react';
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../commun/context/AuthContext";
import {
  FaTachometerAlt,
  FaPlug,
  FaComments,
  FaBuilding,
  FaMedal,
  FaTools,
  FaUser,
  FaTrophy,
  FaSignOutAlt,
  FaUsers,
  FaHome,
  FaQuestionCircle
} from 'react-icons/fa';
import { FiSend } from 'react-icons/fi';

const Sidebar = () => {
  const { role, logout } = useContext(AuthContext); // Ajout de la fonction logout du contexte
  const navigate = useNavigate();

  // Couleur en fonction du rôle
  const activeColor = '#2DBDAC' 

  // Définition des menus avec leurs routes
  const menuParticulier = [
    { Icon: FaTachometerAlt, label: 'Tableau de bord', path: '/particulier/dashboard', active: true },
    { Icon: FaBuilding, label: 'Sites', path: '/particulier/sites' },
    { Icon: FaPlug, label: 'Appareils', path: '/particulier/appareils' },
    { Icon: FaComments, label: 'EnergyChat', path: '/chatbot' },
    { Icon: FaMedal, label: 'Gamification', path: '/particulier/gamification' },
    { Icon: FaTrophy, label: 'Defis', path: '/particulier/defis' },
    { Icon: FiSend, label: 'Invitations', path: '/particulier/invitation' }
  ];

  const menuEntreprise = [
    { Icon: FaTachometerAlt, label: 'Tableau de bord', path: '/entreprise/dashboard', active: true },
    { Icon: FaTools, label: 'Entreprises', path: '/entreprise/entreprises' },
    { Icon: FaBuilding, label: 'Sites', path: '/entreprise/sites' },
    { Icon: FaMedal, label: 'Gamification', path: '/entreprise/gamification' },
    { Icon: FaTrophy, label: 'Defis', path: '/entreprise/defis' },
    { Icon: FaComments, label: 'Support', path: '/question/entreprise' },
  ];

  const menuAdmin = [
    { Icon: FaTachometerAlt, label: 'Tableau de bord', path: '/admin/dashboard', active: true },
    { Icon: FaUsers, label: 'Utilisateurs', path: '/admin/utilisateurs' },
    { Icon: FaHome, label: 'Résidences', path: '/admin/residences' },
    { Icon: FaBuilding, label: 'Entreprises', path: '/admin/entreprises' },
    { Icon: FaTools, label: 'Locaux des entreprises', path: '/admin/sites' },
    { Icon: FaTrophy, label: 'Défis', path: '/admin/defis' },
    { Icon: FaQuestionCircle, label: 'FAQ', path: '/admin/faq' },
  ];

  const getMenuItems = () => {
    switch(role) {
      case 'particulier':
        return menuParticulier;
      case 'entreprise':
        return menuEntreprise;
      case 'admin':
        return menuAdmin;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleNavigation = (path) => {
    navigate(path);
  };

  // Fonction de déconnexion
  const handleLogout = () => {
    logout(); // Appel de la fonction logout du contexte
    navigate('/login'); // Redirection vers la page de login
  };

  // Vérifie si la route est active
  const isActive = (path) => {
    return window.location.pathname === path;
  };

  return (
    <div className="w-60 h-screen bg-white border-r px-6 py-6 flex flex-col">
      {/* Logo */}
      <div 
        className="text-2xl font-bold mb-10 select-none cursor-pointer"
        onClick={() => navigate('/')}
      >
        <span className="text-black">My</span>
        <span  style={{ color: activeColor }}>EnergyHub</span>
      </div>

      {/* Main Menu */}
      <div className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              className={
                `flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${
                  isActive(item.path) 
                    ? 'text-white' 
                    : 'text-[#3D4A5C] hover:bg-gray-100'
                }`
              }
              style={isActive(item.path) ? { backgroundColor: activeColor } : {}}
            >
              <span className="text-lg"><item.Icon /></span>
              <span className="text-base font-semibold">{item.label}</span>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="border-t my-6"></div>

        {/* Other Menu */}
        <ul className="space-y-2">
          <li
            onClick={() => handleNavigation('/profile')}
            className={
              `flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition ${
                isActive('/profile') 
                  ? 'text-white' 
                  : 'text-[#3D4A5C] hover:bg-gray-100'
              }`
            }
            style={isActive('/profile') ? { backgroundColor: activeColor } : {}}
          >
            <span className="text-lg"><FaUser /></span>
            <span className="text-base font-semibold">Profile</span>
          </li>
          
          <li
            onClick={handleLogout} // Utilisation de la fonction handleLogout
            className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition text-[#3D4A5C] hover:bg-gray-100"
          >
            <span className="text-lg"><FaSignOutAlt /></span>
            <span className="text-base font-semibold">Déconnexion</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export { Sidebar };