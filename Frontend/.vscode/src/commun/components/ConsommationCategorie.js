import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const getFirstDayOfPreviousMonth = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setDate(1);
  return date;
};

const getTodayDate = () => {
  return new Date();
};

const ConsommationCategorie = () => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => getFirstDayOfPreviousMonth());
  const [endDate, setEndDate] = useState(() => getTodayDate());
  const [selectedResidence, setSelectedResidence] = useState(localStorage.getItem("selectedResidence") || "0");

  const fetchConsumptionData = async () => {
    try {
      const endpoint = `http://localhost:8000/Consommation/categorie/${selectedResidence}`;
  
      const params = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      };
  
      console.log("Dates envoyées au backend :", params); // Debugging
  
      const response = await axios.get(endpoint, { params });
      setConsumptionData(response.data);
    } catch (error) {
      console.error("Erreur API :", error);
      setError("Impossible de récupérer les données de consommation. Veuillez vérifier les dates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedResidence(localStorage.getItem("selectedResidence") || "0");
    const checkResidenceChange = () => {
      const newResidence = localStorage.getItem("selectedResidence") || "0";
      if (newResidence !== selectedResidence) {
        setSelectedResidence(newResidence);
        fetchConsumptionData();
      }
    };
    fetchConsumptionData();

    const interval = setInterval(checkResidenceChange, 500);
    

    window.addEventListener("storage", checkResidenceChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkResidenceChange);
    };
  }, [startDate, endDate, selectedResidence]);

  if (loading) return <div className="text-blue-400 font-semibold">Chargement...</div>;
  if (error) return <div className="text-purple-400 font-semibold">{error}</div>;

  const categories = [...new Set(consumptionData.map(item => item.categorie))];

  const handleStartDateChange = (e) => {
    const date = new Date(e.target.value);
    setStartDate(date);
  };

  const handleEndDateChange = (e) => {
    const date = new Date(e.target.value);
    setEndDate(date);
  };

  // Préparer les données pour la pie chart
  const data = {
    labels: categories,
    datasets: [
      {
        label: 'Consommation (kWh)',
        data: categories.map(categorie => {
          const categoryData = consumptionData.find(item => item.categorie === categorie);
          return categoryData ? categoryData.consommation : 0;
        }),
        backgroundColor: [
          "#4F46E5",
          "#9333EA",
          "#1E40AF",
          "#6D28D9",
          "#3730A3",
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#cbd5e1' } },
      tooltip: { backgroundColor: "#4F46E5", titleColor: "#FFF", bodyColor: "#FFF" },
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

      {/* Centrer uniquement le graphique */}
      <div className="flex justify-center">
        <div className="w-full max-w-lg h-64"> {/* Ajustez la largeur maximale ici */}
          <Pie data={data} options={options} />
        </div>
      </div>

      {/* Tableau aligné à gauche */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#4F46E5] text-white">
            <tr>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Consommation (kWh)</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((categorie, index) => {
              const categoryData = consumptionData.find(item => item.categorie === categorie);
              return (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-800 transition duration-300">
                  <td className="p-3">{categorie}</td>
                  <td className="p-3 font-semibold text-purple-300">
                    {categoryData ? categoryData.consommation : 0} kWh
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsommationCategorie