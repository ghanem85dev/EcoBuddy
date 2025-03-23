import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logoEnergy from "../../assets/logoEnergy.png";

const Navbar = () => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <nav className="relative z-50 bg-[#0e457f] h-[70px] flex items-center shadow-md w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto flex justify-between items-center h-full px-6"
      >
        {/* Logo */}
        <div className="flex items-center">
          <img src={logoEnergy} alt="Logo Energy" className="w-[180px] h-auto" />
        </div>

        {/* Menu Centré avec sous-menus */}
        <div className="flex items-center gap-6 ml-auto mr-6">
          {/* Particuliers */}
          <div className="relative">
            <button
              onMouseEnter={() => toggleMenu("particuliers")}
              className="text-white font-semibold hover:text-gray-300 transition"
            >
              Particuliers
            </button>
            {openMenu === "particuliers" && (
              <div
                className="absolute left-0 mt-2 w-56 bg-white text-[#0e457f] shadow-lg rounded-lg p-2"
                onMouseEnter={() => setOpenMenu("particuliers")}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <Link to="/offres-energie" className="block px-4 py-2 hover:bg-gray-200">
                  Nos offres d'énergie
                </Link>
                <Link to="/devis-energie" className="block px-4 py-2 hover:bg-gray-200">
                  Devis d'énergie
                </Link>
                <Link to="/vehicules-electriques" className="block px-4 py-2 hover:bg-gray-200">
                  Nos offres véhicules électriques
                </Link>
                <Link to="/panneaux-solaires" className="block px-4 py-2 hover:bg-gray-200">
                  Panneaux solaires
                </Link>
                <Link to="/fan-club" className="block px-4 py-2 hover:bg-gray-200">
                  Fan Club
                </Link>
                <Link to="/question/particulier" className="block px-4 py-2 hover:bg-gray-200">
                  FAQ
                </Link>
                <Link to="/contact" className="block px-4 py-2 hover:bg-gray-200">
                  Contact
                </Link>
              </div>
            )}
          </div>

          {/* Entreprises */}
          <div className="relative">
            <button
              onMouseEnter={() => toggleMenu("entreprises")}
              className="text-white font-semibold hover:text-gray-300 transition"
            >
              Entreprises
            </button>
            {openMenu === "entreprises" && (
              <div
                className="absolute left-0 mt-2 w-56 bg-white text-[#0e457f] shadow-lg rounded-lg p-2"
                onMouseEnter={() => setOpenMenu("entreprises")}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <Link to="/blog-entreprises" className="block px-4 py-2 hover:bg-gray-200">
                  Blog Entreprises
                </Link>
                <Link to="/question/collectivité" className="block px-4 py-2 hover:bg-gray-200">
                  FAQ Entreprises
                </Link>
              </div>
            )}
          </div>

          {/* Collectivités */}
          <div className="relative">
            <button
              onMouseEnter={() => toggleMenu("collectivites")}
              className="text-white font-semibold hover:text-gray-300 transition"
            >
              Collectivités
            </button>
            {openMenu === "collectivites" && (
              <div
                className="absolute left-0 mt-2 w-56 bg-white text-[#0e457f] shadow-lg rounded-lg p-2"
                onMouseEnter={() => setOpenMenu("collectivites")}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <Link to="/collectivites-info" className="block px-4 py-2 hover:bg-gray-200">
                  Informations Collectivités
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Actions à droite */}
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-[#0e457f] bg-white px-5 py-2 rounded-full font-semibold hover:bg-gray-200 transition"
          >
            Se connecter
          </Link>
          <Link
            to="/signup"
            className="text-[#0e457f] bg-white px-5 py-2 rounded-full font-semibold hover:bg-gray-200 transition"
          >
            S'inscrire
          </Link>
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;

