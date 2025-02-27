import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

const ConsumptionComparison = ({ idUser }) => {
  const [consumptionData, setConsumptionData] = useState([]); // État pour les données de consommation
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fonction pour récupérer les données de consommation par maison
  const fetchConsumptionData = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/Comparison/user/${idUser}`);
      setConsumptionData(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
      setError("Impossible de récupérer les données de consommation. Vérifiez l'API.");
    } finally {
      setLoading(false);
    }
  };

  // Utiliser useEffect pour effectuer le fetch au chargement du composant
  useEffect(() => {
    if (idUser) {
      fetchConsumptionData();
    }
  }, [idUser]); // Relancer l'appel API si userId change

  // Affichage pendant le chargement des données
  if (loading) {
    return <div>Chargement...</div>;
  }

  // Gestion des erreurs
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // Extraire les informations nécessaires pour le graphique et le tableau
  const labels = consumptionData.map(item => item.nomResidance); // Liste des maisons
  const consommation = consumptionData.map(item => item.consommation); // Consommation pour chaque maison

  // Calculer la consommation moyenne
  const avgConsumption = consommation.length > 0
    ? consommation.reduce((acc, curr) => acc + curr, 0) / consommation.length
    : 0;

  // Configuration du graphique
  const data = {
    labels: labels,
    datasets: [
      {
        label: 'Consommation énergétique (kWh)',
        data: consommation,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <h2 className="font-bold text-xl mb-4">Comparatif de consommation par site</h2>
      
      {/* Affichage du graphique */}
      <Bar data={data} />

      {/* Tableau des consommations */}
      <table className="table-auto w-full mt-6">
        <thead>
          <tr>
            <th className="px-4 py-2">Nom de la résidence</th>
            <th className="px-4 py-2">Consommation (kWh)</th>
            </tr>
        </thead>
        <tbody>
          {consumptionData.map((item, index) => {
            const difference = item.consommation - avgConsumption;
            return (
              <tr key={index}>
                <td className="px-4 py-2">{item.nomResidance}</td>
                <td className="px-4 py-2">{item.consommation}</td>
                  </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ConsumptionComparison;