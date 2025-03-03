import React from "react";
import { useNavigate } from "react-router-dom"; // Import de la navigation
import Navbar from "../components/NavBar";
import Blob from "../assets/blob.svg";
import HeroPng from "../assets/hero.png";
import { motion } from "framer-motion";

// Fonction d'animation FadeUp
export const FadeUp = (delay) => {
  return {
    initial: { opacity: 0, y: 50 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, duration: 0.5, delay: delay, ease: "easeInOut" },
    },
  };
};

const Hero = () => {
  const navigate = useNavigate(); // Initialisation de la navigation

  return (
    <section className="bg-[#A7E6F7] overflow-hidden relative">
      <Navbar />
      <div className="container grid grid-cols-1 md:grid-cols-2 min-h-[700px]">
        
        {/* Texte principal */}
        <div className="flex flex-col justify-center py-14 md:py-0 relative z-20">
          <div className="text-center md:text-left space-y-10 lg:max-w-[550px] px-6">
            
            {/* Titre principal */}
            <motion.h1
              variants={FadeUp(0.6)}
              initial="initial"
              animate="animate"
              className="text-4xl lg:text-6xl font-bold tracking-tight leading-tight text-gray-900"
            >
              Maîtrisez votre consommation{" "}
              <span className="text-[#0e457f]">d’énergie</span> et réduisez vos coûts
            </motion.h1>

            {/* Sous-titre */}
            <p className="mt-4 text-lg text-gray-600 max-w-2xl">
              Surveillez en temps réel votre consommation énergétique et optimisez vos dépenses grâce à notre plateforme intelligente.
            </p>

            {/* Bouton d'Action */}
            <motion.button
              className="mt-6 bg-[#0e457f] text-white py-3 px-6 text-lg font-medium rounded-full shadow-md hover:bg-[#0c3a68] transition"
              onClick={() => navigate("/login")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Découvrir la solution
            </motion.button>
          </div>
        </div>

        {/* Hero Image */}
        <div className="flex justify-center items-center relative">
          <div className="relative w-full flex justify-center">
            
   

<motion.img
  initial={{ x: -50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
  src={Blob}
  alt="Background Shape"
  className="absolute -top-[300px] w-[850px] md:w-[850px] z-[2]" // Ajustement : Réduction de taille + déplacement plus haut
/>

<motion.img
  initial={{ x: 50, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.6, delay: 0.4, ease: "easeInOut" }}
  src={HeroPng}
  alt="Hero"
  className="w-[320px] xl:w-[400px] relative z-10 drop-shadow"
  style={{ transform: "translateY(-160px)" }} // Ajustement pour équilibrer
/>




         
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
