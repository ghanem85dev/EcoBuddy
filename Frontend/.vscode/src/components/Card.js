import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Card = ({ title, children, onDelete, onToggle }) => {
  const { userId } = useContext(AuthContext); // Récupération de l'ID utilisateur depuis le contexte

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 transition-all duration-300 hover:shadow-xl">
      {/* Affichage de l'ID utilisateur en haut de la carte */}
      
      <h3 className="text-xl font-semibold text-gray-700 mb-4">{title}</h3>
      {children}

      <div className="mt-4 flex justify-between">
        {/* Bouton de bascule (si présent) */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition duration-300"
          >
            Modifier
          </button>
        )}

        {/* Bouton de suppression */}
        {onDelete && (
          <button
            onClick={onDelete}
            className="bg-red-500 text-white px-4 py-2 rounded-xl hover:bg-red-600 transition duration-300"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
};

export default Card;