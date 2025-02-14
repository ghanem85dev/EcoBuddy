
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiSearch, FiBell, FiMessageSquare } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    localStorage.removeItem("userToken"); // Supprimer le token utilisateur
    navigate("/login"); // Redirection vers la page de connexion
  };

  return (
    <div className="w-full bg-gray-50 shadow-md p-4 flex items-center justify-between">
      {/* Menu Icon */}
      <div className="flex items-center">
        <FiMenu className="text-orange-500 text-2xl cursor-pointer" />
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white rounded-lg shadow-sm w-1/2">
        <input
          type="text"
          placeholder="Search"
          className="text-orange-500 flex-1 px-4 py-2 rounded-l-lg focus:outline-none"
        />
        <button className="bg-orange-500 p-2 rounded-r-lg text-white">
          <FiSearch size={23} />
        </button>
      </div>

      {/* Notifications and Profile */}
      <div className="flex items-center gap-6 relative">
        {/* Notification Icon */}
        <div className="relative">
          <FiBell className="text-black text-2xl cursor-pointer" />
          <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs rounded-full px-1">
            2
          </span>
        </div>

        {/* Message Icon */}
        <div className="relative">
          <FiMessageSquare className="text-black text-2xl cursor-pointer" />
          <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs rounded-full px-1">
            2
          </span>
        </div>

        {/* Profile Icon & Dropdown Menu */}
        <div className="relative">
          {/* Icône Profil */}
          <div
            className="text-black text-2xl cursor-pointer"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <CgProfile />
          </div>

          {/* Menu déroulant */}
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
      </div>
    </div>
  );
};

export default Navbar;
