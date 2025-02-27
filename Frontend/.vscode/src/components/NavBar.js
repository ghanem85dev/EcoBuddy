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
