import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useTheme } from "../context/ThemeContext"; // Importer le hook pour obtenir le thème

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ConsumptionComparisonByCategory = ({ idUser }) => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { theme } = useTheme(); // Utilisation du thème actuel

  // Définir les couleurs en fonction du thème
  const tableHeaderBgColor = theme === "light" ? "bg-blue-600" : "bg-gray-800"; // Fond de l'entête du tableau
  const tableRowBgColor = theme === "light" ? "bg-white" : "bg-gray-900"; // Fond des lignes du tableau
  const textColor = theme === "light" ? "text-gray-800" : "text-gray-200"; // Couleur du texte
  const barColor1 = theme === "light" ? "#4F46E5" : "#6366F1"; // Couleur de la première barre
  const barColor2 = theme === "light" ? "#9333EA" : "#8B5CF6"; // Couleur de la deuxième barre
  const barBorderColor = theme === "light" ? "#312E81" : "#4B0082"; // Bordure des barres
  const headerTextColor = theme === "light" ? "text-white" : "text-gray-200"; // Couleur du texte des en-têtes

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
        backgroundColor: index % 2 === 0 ? barColor1 : barColor2, 
        borderColor: barBorderColor,
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
      legend: { position: 'top', labels: { color: headerTextColor } },
      tooltip: { backgroundColor: barColor1, titleColor: "#FFF", bodyColor: "#FFF" },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: headerTextColor, font: { weight: "bold" } } },
      y: { ticks: { color: headerTextColor, font: { weight: "bold" } } },
    },
  };

  return (
    <div className={`bg-[#1a2e45] shadow-lg rounded-2xl p-6 text-white`}>
      <h2 className={`text-xl font-semibold ${theme === "light" ? "text-blue-300" : "text-purple-400"} mb-4`}>Comparaison de Consommation par Catégorie</h2>
      <div className="w-full h-64">
        <Bar data={data} options={options} />
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className={`${tableHeaderBgColor} ${headerTextColor}`}>
            <tr>
              <th className="p-3">Catégorie</th>
              {residences.map((residence, index) => (
                <th key={index} className="p-3">{residence}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((categorie, index) => (
              <tr key={index} className={`border-b border-gray-700 hover:bg-gray-800 transition duration-300 ${tableRowBgColor}`}>
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
