import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ConsumptionComparison = ({ idUser }) => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const interval = setInterval(fetchConsumptionData, 5000); // Met à jour toutes les 5s
      return () => clearInterval(interval); // Nettoyage de l'intervalle lors du démontage
    }
  }, [idUser]);

  if (loading) return <div className="text-blue-600 font-semibold">Chargement...</div>;
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
        backgroundColor: ["#003366", "#0055A4", "#007FFF", "#4A90E2"],
        borderColor: "#002244",
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
      tooltip: { backgroundColor: "#003366", titleColor: "#FFF", bodyColor: "#FFF" },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#003366", font: { weight: "bold" } } },
      y: { ticks: { color: "#003366", font: { weight: "bold" } } },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-xl font-semibold text-[#003366] mb-4">Comparaison de Consommation</h2>

      {/* Graphique */}
      <div className="w-full h-64">
        <Bar data={data} options={options} />
      </div>

      {/* Tableau */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#003366] text-white">
            <tr>
              <th className="p-3">Résidence</th>
              <th className="p-3">Consommation (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {consumptionData.map((item, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-100 transition duration-300">
                <td className="p-3">{item.nomResidance}</td>
                <td className="p-3 font-semibold text-[#003366]">{item.consommation} kWh</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsumptionComparison;
