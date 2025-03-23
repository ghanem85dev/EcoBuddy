import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext"; // Importer le hook pour obtenir le thème

const Gamification = () => {
  const [points, setPoints] = useState(1500);
  const progressPercentage = (points / 2000) * 100;

  const { theme } = useTheme(); // Utilisation du thème actuel

  // Définition des couleurs selon le thème
  const bgColor = theme === "light" ? "from-blue-800 to-blue-400" : "from-indigo-800 to-indigo-500"; // Couleurs de fond dépendent du thème
  const progressBarColor = theme === "light" ? "bg-blue-600" : "bg-indigo-600"; // Couleur de la barre de progression
  const textColor = theme === "light" ? "text-white" : "text-gray-200"; // Couleur du texte selon le thème
  const shadowColor = theme === "light" ? "shadow-xl" : "shadow-lg"; // Ombre plus douce pour le mode sombre

  return (
    <div className={`h-[100px] w-full bg-gradient-to-r ${bgColor} p-6 ${shadowColor} rounded-3xl text-white border border-gray-300 flex flex-col justify-center`}>
      <p className={`${textColor} text-sm mb-2`}>
        Points accumulés : <strong>{points}</strong>
      </p>
      <div className="w-full bg-blue-300 h-4 rounded-full shadow-inner">
        <div
          className={`h-4 rounded-full ${progressBarColor} shadow-md transition-all duration-500 ease-in-out`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className={`${textColor} mt-3 text-sm`}>
        {progressPercentage.toFixed(1)}% vers le prochain badge
      </p>
    </div>
  );
};

export default Gamification;
