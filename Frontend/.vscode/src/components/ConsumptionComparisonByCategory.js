import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ConsumptionComparisonByCategory = ({ idUser }) => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConsumptionData = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/Comparison/category/${idUser}`);
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

  if (loading) return <div className="text-blue-400 font-semibold">Chargement...</div>;
  if (error) return <div className="text-purple-400 font-semibold">{error}</div>;

  const residences = [...new Set(consumptionData.map(item => item.siteNom))];
  const categories = [...new Set(consumptionData.map(item => item.categorie))];

  const consumptionByResidence = residences.map(residence => {
    const categoriesForResidence = categories.map(categorie => {
      const totalConsumption = consumptionData
        .filter(item => item.siteNom === residence && item.categorie === categorie)
        .reduce((acc, item) => acc + item.consommation, 0);
      return { categorie, totalConsumption };
    });
    return { residence, categories: categoriesForResidence };
  });

  const data = {
    labels: categories,
    datasets: consumptionByResidence.map((residence, index) => {
      return {
        label: residence.residence,
        data: residence.categories.map(item => item.totalConsumption),
        backgroundColor: index % 2 === 0 ? "#4F46E5" : "#9333EA", 
        borderColor: "#312E81",
        borderWidth: 1,
        borderRadius: 10,
        barThickness: 40,
      };
    }),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#cbd5e1' } },
      tooltip: { backgroundColor: "#4F46E5", titleColor: "#FFF", bodyColor: "#FFF" },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#cbd5e1", font: { weight: "bold" } } },
      y: { ticks: { color: "#cbd5e1", font: { weight: "bold" } } },
    },
  };

  return (
    <div className="bg-[#1a2e45] shadow-lg rounded-2xl p-6 text-white">
      <h2 className="text-xl font-semibold text-blue-300 mb-4">Comparaison de Consommation par Catégorie</h2>
      <div className="w-full h-64">
        <Bar data={data} options={options} />
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#4F46E5] text-white">
            <tr>
              <th className="p-3">Catégorie</th>
              {residences.map((residence, index) => (
                <th key={index} className="p-3">{residence}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((categorie, index) => (
              <tr key={index} className="border-b border-gray-700 hover:bg-gray-800 transition duration-300">
                <td className="p-3">{categorie}</td>
                {consumptionByResidence.map((residence, residenceIndex) => {
                  const categoryData = residence.categories.find(item => item.categorie === categorie);
                  return (
                    <td key={residenceIndex} className="p-3 font-semibold text-purple-300">
                      {categoryData ? categoryData.totalConsumption : 0} kWh
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsumptionComparisonByCategory;
