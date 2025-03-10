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
      const interval = setInterval(fetchConsumptionData, 5000);
      return () => clearInterval(interval);
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
        backgroundColor: ["#2563eb"],
        borderColor: "#1e40af",
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
      x: { grid: { display: false }, ticks: { color: "#475569" } },
      y: { ticks: { color: "#475569", callback: (value) => `${value} kWh` } },
    },
  };

  return (
    <div className="card col-span-1 md:col-span-2 lg:col-span-3 p-4">
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
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-3">Résidence</th>
                  <th className="p-3">Consommation (kWh)</th>
                </tr>
              </thead>
              <tbody>
                {consumptionData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200 hover:bg-gray-100 transition duration-300">
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
