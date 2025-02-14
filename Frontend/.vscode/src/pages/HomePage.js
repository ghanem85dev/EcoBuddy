
import React, { useState, useEffect } from "react";
import RealTimeConsumption from "../components/RealTimeConsumption";
import DevicesDetected from "../components/DevicesDetected";
import Gamification from "../components/Gamification";
import { MdDashboard } from "react-icons/md";
import { FiCalendar } from "react-icons/fi";

const Home = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Mise à jour de l'heure toutes les secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval); // Nettoyage de l'intervalle au démontage du composant
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Titre + Date/Heure */}
      <div className="flex items-center justify-between mb-6">
        {/* Titre */}
        <div className="flex items-center text-gray-800 text-2xl font-semibold">
          <MdDashboard className="text-orange-500 text-3xl mr-2" />
          <span>Tableau de Bord</span>
        </div>

        {/* Date et Heure */}
        <div className="flex items-center space-x-2 text-orange-500 text-sm">
          <FiCalendar className="text-orange-500 text-lg" />
          <span>
  {currentDateTime.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}{" "}
  - {currentDateTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
</span>

        </div>
      </div>

      {/* Disposition en grille */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consommation en Temps Réel - Grand graphique */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Consommation en Temps Réel</h3>
          <RealTimeConsumption />
        </div>

        {/* Conteneur pour les 2 cartes empilées à droite */}
        <div className="flex flex-col gap-6">
          {/* Appareils Détectés */}
          <div className="bg-white shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Appareils Détectés</h3>
            <DevicesDetected />
          </div>

          {/* Gamification */}
          <div className="bg-white shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Gamification</h3>
            <Gamification />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
