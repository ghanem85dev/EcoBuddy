import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from "../commun/context/ThemeContext"; // Importer le hook pour obtenir le thème

const AverageConsumptionPerDevice = ({ userId }) => {
  const [averageConsumption, setAverageConsumption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const siteId = localStorage.getItem('selectedResidence');
  const { theme } = useTheme(); // Utilisation du thème actuel

  // Définir les couleurs en fonction du thème
  const tableHeaderBgColor = theme === "light" ? "bg-gray-200" : "bg-gray-800"; // Fond du header de tableau
  const tableRowBgColor = theme === "light" ? "bg-white" : "bg-gray-900"; // Fond des lignes du tableau
  const textColor = theme === "light" ? "text-gray-800" : "text-gray-200"; // Couleur du texte

  useEffect(() => {
    // Fonction pour récupérer la consommation moyenne par appareil
    const fetchAverageConsumption = async () => {
      if (!siteId) {
        setError('Aucune résidence sélectionnée.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:8000/Comparison/average_per_device/${userId}/${siteId}`);
        if (response.data && Array.isArray(response.data)) {
          setAverageConsumption(response.data);
        } else {
          setError('Données invalides reçues.');
        }
        setLoading(false);
      } catch (err) {
        console.error('Erreur API:', err);  // Affiche l'erreur exacte dans la console
        setError('Erreur lors de la récupération des données');
        setLoading(false);
      }
    };

    // Appel de la fonction de récupération des données
    fetchAverageConsumption();
  }, [userId, siteId]);

  if (loading) {
    return <div className={`${textColor}`}>Chargement des données...</div>;
  }

  if (error) {
    return <div className={`${textColor}`}>{error}</div>;
  }

  return (
    <div className={`p-4 ${textColor}`}>
      <h2 className="text-xl font-semibold mb-4">Consommation Moyenne par Appareil</h2>
      {averageConsumption.length === 0 ? (
        <p>Aucune donnée trouvée pour la consommation moyenne des appareils.</p>
      ) : (
        <table className="min-w-full">
          <thead className={tableHeaderBgColor}>
            <tr>
              <th className="py-2 px-4 text-left">Appareil</th>
              <th className="py-2 px-4 text-left">Consommation Moyenne (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {averageConsumption.map((item, index) => (
              <tr key={index} className={tableRowBgColor}>
                <td className="py-2 px-4">{item.appareil}</td>
                <td className="py-2 px-4">{item.average_consumption.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AverageConsumptionPerDevice;
