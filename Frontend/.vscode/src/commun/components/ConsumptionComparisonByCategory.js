import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ConsumptionComparisonByCategory = ({ idUser }) => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const fetchConsumptionData = async () => {
    try {
      console.log("Fetching data with dates:", startDate, endDate);
      const response = await axios.get(`http://localhost:8000/Comparison/category/${idUser}`, {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
      });
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
  }, [idUser, startDate, endDate]);

  if (loading) return <div className="text-blue-400 font-semibold">Chargement...</div>;
  if (error) return <div className="text-purple-400 font-semibold">{error}</div>;

  const residences = [...new Set(consumptionData.map(item => item.siteNom))];
  const categories = [...new Set(consumptionData.map(item => item.categorie))];

  const handleStartDateChange = (e) => {
    const date = new Date(e.target.value);
    console.log("Date de début sélectionnée :", date);
    setStartDate(date);
  };

  const handleEndDateChange = (e) => {
    const date = new Date(e.target.value);
    console.log("Date de fin sélectionnée :", date);
    setEndDate(date);
  };

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
      <div className="flex space-x-4 mb-4">
        <div className="flex flex-col">
          <label className="text-blue-200">Date de début :</label>
          <input
            type="date"
            value={startDate.toISOString().split('T')[0]}
            onChange={handleStartDateChange}
            className="bg-[#0F172A] text-white p-2 rounded-md border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-blue-200">Date de fin :</label>
          <input
            type="date"
            value={endDate.toISOString().split('T')[0]}
            onChange={handleEndDateChange}
            className="bg-[#0F172A] text-white p-2 rounded-md border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>
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
