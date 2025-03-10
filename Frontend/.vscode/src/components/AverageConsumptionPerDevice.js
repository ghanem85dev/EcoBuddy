import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AverageConsumptionPerDevice = ({ userId }) => {
  const [averageConsumption, setAverageConsumption] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const siteId = localStorage.getItem('selectedResidence');

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
    return <div>Chargement des données...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Consommation Moyenne par Appareil</h2>
      {averageConsumption.length === 0 ? (
        <p>Aucune donnée trouvée pour la consommation moyenne des appareils.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Appareil</th>
              <th>Consommation Moyenne (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {averageConsumption.map((item, index) => (
              <tr key={index}>
                <td>{item.appareil}</td>
                <td>{item.average_consumption.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AverageConsumptionPerDevice;