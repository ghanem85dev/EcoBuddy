import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { AuthContext } from "../../commun/context/AuthContext";
import Entreprise from './Entreprise';
import ManagedSites from './ManagedSites';
import { motion } from "framer-motion";

ChartJS.register(ArcElement, Tooltip, Legend);

const getFirstDayOfPreviousMonth = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  date.setDate(1);
  return date;
};

const getTodayDate = () => {
  return new Date();
};

const ConsommationCategorieEntreprise = ({responsable=false}) => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => getFirstDayOfPreviousMonth());
  const [endDate, setEndDate] = useState(() => getTodayDate());
  const [selectedSite, setSelectedSite] = useState(localStorage.getItem("selectedSite") || "0");
  const [selectedEntreprise, setSelectedEntreprise] = useState(localStorage.getItem("selectedEntreprise") || "0");
  const { idUser } = useContext(AuthContext);

  const handleSiteSelect = (siteId) => {
    setSelectedSite(siteId);
    localStorage.setItem("selectedSite", siteId);
  };

  const handleEntrepriseSelect = (entrepriseId) => {
    setSelectedEntreprise(entrepriseId);
    localStorage.setItem("selectedEntreprise", entrepriseId);
  };

  const fetchConsumptionData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      let endpoint;
      const params = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      };
  
      if (responsable) {
        endpoint = `http://localhost:8000/consommation/categorie-responsable/${selectedSite}/${idUser}`;
        
      } else {
        endpoint = `http://localhost:8000/Consommation/categorie-entreprise/${selectedSite}/${selectedEntreprise}/${idUser}`;
      }
  
      const response = await axios.get(endpoint, { params });
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Format de données invalide");
      }
  
      setConsumptionData(response.data);
    } catch (error) {
      console.error("Erreur:", error);
      setError(error.response?.data?.detail || error.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkStorageChange = () => {
      const newSite = localStorage.getItem("selectedSite") || "0";
      const newEntreprise = localStorage.getItem("selectedEntreprise") || "0";
      if (newSite !== selectedSite || newEntreprise !== selectedEntreprise) {
        setSelectedSite(newSite);
        setSelectedEntreprise(newEntreprise);
      }
    };

    fetchConsumptionData();
    window.addEventListener("storage", checkStorageChange);
    return () => window.removeEventListener("storage", checkStorageChange);
  }, [startDate, endDate, selectedSite, selectedEntreprise, idUser]);

  const handleStartDateChange = (e) => {
    setStartDate(new Date(e.target.value));
  };

  const handleEndDateChange = (e) => {
    setEndDate(new Date(e.target.value));
  };

  // Préparation des données pour le graphique
  const categories = [...new Set(consumptionData.map(item => item.categorie))];
  const colorPalette = [
    "#001952", "#043775", "#0078B8","#00B6DA", "#93E1F0", 
    "#12769E", "#1E40AF"
  ];

  const data = {
    labels: categories,
    datasets: [{
      label: 'Consommation (kWh)',
      data: categories.map(categorie => {
        const categoryData = consumptionData.find(item => item.categorie === categorie);
        return categoryData ? categoryData.consommation : 0;
      }),
      backgroundColor: colorPalette,
      borderColor: "#1E3A8A",
      borderWidth: 1,
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top', 
        labels: { 
          color: '#1E3A8A',
          font: { weight: 'bold' }
        } 
      },
      tooltip: { 
        backgroundColor: "#0078B8", 
        titleColor: "#FFF", 
        bodyColor: "#FFF",
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} kWh (${percentage}%)`;
          }
        }
      },
    },
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-blue-600 font-semibold">Chargement en cours...</div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-red-500 font-semibold">{error}</div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl rounded-2xl p-6 border border-blue-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-blue-900"></h2>
        
        {/* Sélecteur d'entreprise et site */}
        <motion.div 
          className="w-full md:w-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {responsable ? (
                      <ManagedSites 
                        idUser={idUser}
                        onSiteSelect={handleSiteSelect}
                      />
                    ) : (
                      <Entreprise 
                        idUser={idUser} 
                        onSiteSelect={handleSiteSelect}
                        onEntrepriseSelect={handleEntrepriseSelect}
                      />
                    )}
        </motion.div>
      </div>

      {/* Sélecteurs de date */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-blue-100">
        <div className="flex-1">
          <label className="block text-blue-700 font-medium mb-1">Date de début :</label>
          <input
            type="date"
            value={startDate.toISOString().split('T')[0]}
            onChange={handleStartDateChange}
            className="w-full bg-blue-50 text-blue-900 p-2 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex-1">
          <label className="block text-blue-700 font-medium mb-1">Date de fin :</label>
          <input
            type="date"
            value={endDate.toISOString().split('T')[0]}
            onChange={handleEndDateChange}
            className="w-full bg-blue-50 text-blue-900 p-2 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Graphique */}
        <div className="flex-1 bg-white p-4 rounded-xl shadow-md border border-blue-100">
  <div style={{ position: 'relative', height: '350px', width: '100%' }}>
    <Pie 
      data={data} 
      options={{
        ...options,
        maintainAspectRatio: false,
        responsive: true
      }} 
    />
  </div>
</div>

        {/* Tableau */}
        <div className="flex-1 bg-white p-4 rounded-xl shadow-md border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Détails par catégorie</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0078B8] text-white">
                <tr>
                  <th className="p-3 font-semibold rounded-tl-lg">Catégorie</th>
                  <th className="p-3 font-semibold rounded-tr-lg">Consommation (kWh)</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((categorie, index) => {
                  const categoryData = consumptionData.find(item => item.categorie === categorie);
                  const consumption = categoryData ? categoryData.consommation : 0;
                  const total = consumptionData.reduce((acc, item) => acc + item.consommation, 0);
                  const percentage = total > 0 ? Math.round((consumption / total) * 100) : 0;
                  
                  return (
                    <tr key={index} className={`border-b border-blue-100 ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                      <td className="p-3 text-blue-900">{categorie}</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <span className="font-bold text-blue-700 mr-2">{consumption} kWh</span>
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {categories.length > 0 && (
                  <tr className="bg-[#0078B8] text-white font-bold">
                    <td className="p-3 rounded-bl-lg">Total</td>
                    <td className="p-3 rounded-br-lg">
                      {consumptionData.reduce((acc, item) => acc + item.consommation, 0)} kWh
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsommationCategorieEntreprise;