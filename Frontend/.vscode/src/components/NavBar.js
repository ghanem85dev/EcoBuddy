import React from "react";
import { Link } from "react-router-dom"; // Ajout de Link pour la navigation
import { IoMdMenu } from "react-icons/io";
import { motion } from "framer-motion";
import logoEnergy from "../assets/logoEnergy.png";

const Navbar = () => {
  return (
    <nav className="relative z-20 bg-[#0e457f] h-[60px] flex items-center shadow-md">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="container flex justify-between items-center h-full px-6"
      >
        {/* Logo section */}
        <div>
          <img
            src={logoEnergy}
            alt="Logo Energy"
            style={{ width: "200px", height: "auto" }} // Taille ajustée pour plus d’équilibre
          />
        </div>

        {/* Menu section */}
        <div className="hidden lg:flex items-center gap-6">
          <Link
            to="/login"
            className="bg-white text-[#0e457f] px-5 py-2.5 text-base font-semibold rounded-full shadow-md 
                       hover:bg-[#0e457f] hover:text-white transition duration-300"
          >
            Se connecter
          </Link>
        </div>

        {/* Mobile Hamburger menu section */}
        <div className="lg:hidden text-white">
          <IoMdMenu className="text-2xl cursor-pointer" />
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;
/*import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiBell, FiMessageSquare } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import { TbHomeBolt } from "react-icons/tb";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // Gestion du clic extérieur pour fermer le menu déroulant
  useEffect(() => {
    const handleClickOutside = (event) => {
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
    <div className="w-full bg-gray-50 shadow-md p-4 flex items-center justify-between">
      {/* Sidebar Toggle (Menu Hamburger) */
      /*<div
        className="cursor-pointer flex flex-col space-y-1"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
     
       
      </div>

     
      /*<div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
        <TbHomeBolt size={25} className="text-orange-500" />
        <p className="text-md font-bold uppercase">EnergyHub+</p>
      </div>

  
<div className="flex items-center gap-6">
 
  <div className="flex items-center bg-white rounded-lg shadow-sm w-48 px-3">
    <input
      type="text"
      placeholder="Search"
      className="text-orange-500 flex-1 px-3 py-1 rounded-l-lg text-sm focus:outline-none"
      aria-label="Search"
    />
    <button className="bg-orange-500 px-3 py-1 rounded-r-lg text-white" aria-label="Search button">
      <FiSearch size={16} />
    </button>
  </div>


  <div className="relative cursor-pointer px-2">
    
    <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs rounded-full px-1">
      
    </span>
  </div>

 
  <div className="relative cursor-pointer px-2">
    <FiMessageSquare className="text-black text-xl" aria-label="Messages" />
    <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs rounded-full px-1">
      2
    </span>
  </div>

  
  <div className="relative px-2" ref={menuRef}>
    <div
      className="text-black text-xl cursor-pointer"
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      aria-label="Profile menu"
    >
      <CgProfile />
    </div>
  </div>
</div>


       
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg border z-50">
              <ul className="py-2">
                <li>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profil
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200"
                  >
                    Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
    
    
  );
};

export default Navbar*/