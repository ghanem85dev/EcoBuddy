import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTheme } from "../context/ThemeContext"; // Importer le hook pour obtenir le thème

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ConsumptionComparison = ({ idUser }) => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { theme } = useTheme(); // Utilisation du thème actuel

  // Définir les couleurs en fonction du thème
  const tableHeaderBgColor = theme === "light" ? "bg-blue-600" : "bg-gray-800"; // Fond de l'entête du tableau
  const tableRowBgColor = theme === "light" ? "bg-white" : "bg-gray-900"; // Fond des lignes du tableau
  const textColor = theme === "light" ? "text-gray-800" : "text-gray-200"; // Couleur du texte
  const barColor = theme === "light" ? "#2563eb" : "#3b82f6"; // Couleur de la barre du graphique
  const barBorderColor = theme === "light" ? "#1e40af" : "#1e3a8a"; // Bordure de la barre

  // Fonction pour récupérer les données périodiquement
  const fetchConsumptionData = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/Comparison/user/${idUser}`);
      setConsumptionData(response.data);
    } catch (error) {
      console.error("Erreur API :", error);
      setError("Impossible de récupérer les données de consommation.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idUser) {
      fetchConsumptionData();
      const interval = setInterval(fetchConsumptionData, 5000);
      return () => clearInterval(interval);
    }
  }, [idUser]);

  if (loading) return <div className={`${textColor} font-semibold`}>Chargement...</div>;
  if (error) return <div className="text-red-500 font-semibold">{error}</div>;

  // Extraction des données pour le graphique
  const labels = consumptionData.map(item => item.nomResidance);
  const consommation = consumptionData.map(item => item.consommation);

  const data = {
    labels,
    datasets: [
      {
        label: "Consommation (kWh)",
        data: consommation,
        backgroundColor: [barColor],
        borderColor: barBorderColor,
        borderWidth: 1,
        borderRadius: 10,
        barThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => `${context.raw} kWh` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor } },
      y: { ticks: { color: textColor, callback: (value) => `${value} kWh` } },
    },
  };

  return (
    <div className={`card col-span-1 md:col-span-2 lg:col-span-3 p-4 ${textColor}`}>
      <div className="grid grid-cols-2 gap-4">
        {/* Graphique */}
        <div className="card p-4 shadow-lg rounded-lg">
          <div className="card-header">
            <p className="card-title">Graphique de Consommation</p>
          </div>
          <div className="card-body h-64">
            <Bar data={data} options={options} />
          </div>
        </div>

        {/* Tableau */}
        <div className="card p-4 shadow-lg rounded-lg">
          <div className="card-header">
            <p className="card-title">Détails de Consommation</p>
          </div>
          <div className="card-body overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className={tableHeaderBgColor}>
                <tr>
                  <th className="p-3 text-white">Résidence</th>
                  <th className="p-3 text-white">Consommation (kWh)</th>
                </tr>
              </thead>
              <tbody>
                {consumptionData.map((item, index) => (
                  <tr key={index} className={`${tableRowBgColor} border-b border-gray-200 hover:bg-gray-100 transition duration-300`}>
                    <td className="p-3">{item.nomResidance}</td>
                    <td className="p-3 font-semibold text-blue-600">{item.consommation} kWh</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsumptionComparison;
