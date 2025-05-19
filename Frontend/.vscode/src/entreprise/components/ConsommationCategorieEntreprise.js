import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { AuthContext } from "../../commun/context/AuthContext";
import ManagedSites from './ManagedSites';

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

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
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
  const [periodData, setPeriodData] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [sites, setSites] = useState([]);
  const [loadingEntreprises, setLoadingEntreprises] = useState(false);
  const [loadingSites, setLoadingSites] = useState(false);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' or 'table'

  // Couleurs harmonieuses avec les teintes demandées
  const colorPalette = ['#17B3DE', '#2DBDAC', '#F36D8F', '#4A90E2', '#7C5AC2', '#FFA630'];
  const gradientColors = [
    'linear-gradient(135deg, #17B3DE 0%, #2DBDAC 100%)',
    'linear-gradient(135deg, #F36D8F 0%, #FF8E6E 100%)',
    'linear-gradient(135deg, #4A90E2 0%, #7C5AC2 100%)'
  ];

  const fetchEntreprises = async () => {
    try {
      setLoadingEntreprises(true);
      const response = await axios.get(`http://localhost:8000/entreprises/user/${idUser}`);
      const approvedEntreprises = response.data.filter(entreprise => entreprise.statut_approbation === "approve");
      setEntreprises(approvedEntreprises);
    } catch (error) {
      console.error("Erreur lors de la récupération des entreprises:", error);
    } finally {
      setLoadingEntreprises(false);
    }
  };

  const fetchSites = async (entrepriseId) => {
    try {
      setLoadingSites(true);
      const response = await axios.get(`http://localhost:8000/sites/entreprise/${entrepriseId}`);
      const approvedSites = response.data.filter(site => site.statut_approbation === "approve");
      setSites(approvedSites);
    } catch (error) {
      console.error("Erreur lors de la récupération des sites:", error);
    } finally {
      setLoadingSites(false);
    }
  };

  const handleSiteSelect = (siteId) => {
    const newValue = siteId.toString();
    setSelectedSite(newValue);
    localStorage.setItem("selectedSite", newValue);
  };

  const handleEntrepriseSelect = (entrepriseId) => {
    const newValue = entrepriseId.toString();
    setSelectedEntreprise(newValue);
    localStorage.setItem("selectedEntreprise", newValue);
    setSelectedSite("0"); // Reset site selection when enterprise changes
    localStorage.removeItem("selectedSite");
    
    if (entrepriseId !== "0") {
      fetchSites(entrepriseId);
    } else {
      setSites([]);
    }
  };

  const fetchConsumptionData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      let endpoint;
      const params = {
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        split_period: true
      };
  
      if (responsable) {
        endpoint = `http://localhost:8000/consommation/categorie-responsable/${selectedSite}/${idUser}`;
      } else {
        endpoint = `http://localhost:8000/Consommation/categorie-entreprise/${selectedSite}/${selectedEntreprise}/${idUser}`;
      }
  
      const response = await axios.get(endpoint, { params });
      
      if (!response.data) {
        throw new Error("Format de données invalide");
      }

      if (Array.isArray(response.data.periods)) {
        setPeriodData(response.data.periods);
        setConsumptionData(response.data.total || []);
      } else {
        setConsumptionData(response.data);
        setPeriodData([]);
      }
    } catch (error) {
      console.error("Erreur:", error);
      setError(error.response?.data?.detail || error.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (idUser && !responsable) {
      fetchEntreprises();
    }
  }, [idUser, responsable]);

  useEffect(() => {
    if (selectedEntreprise !== "0" && !responsable) {
      fetchSites(selectedEntreprise);
    }
  }, [selectedEntreprise, responsable]);

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

  const categories = [...new Set(consumptionData.map(item => item.categorie))];
  
  // Préparer les données pour le graphique
  const chartData = {
    labels: categories,
    datasets: [{
      label: 'Consommation (kWh)',
      data: categories.map(categorie => {
        const categoryData = consumptionData.find(item => item.categorie === categorie);
        return categoryData ? categoryData.consommation : 0;
      }),
      backgroundColor: colorPalette,
      borderColor: 'transparent',
      borderWidth: 0,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#4B5563',
          font: {
            family: 'Inter, sans-serif',
            weight: '500'
          },
          padding: 20,
          boxWidth: 12,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: "#FFF",
        titleColor: "#111827",
        bodyColor: "#4B5563",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        padding: 12,
        boxShadow: "0px 2px 8px rgba(0,0,0,0.1)",
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value.toLocaleString()} kWh (${percentage}%)`;
          }
        }
      },
    },
    cutout: '60%',
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#17B3DE]"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with title and controls */}
      <div className="px-6 py-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Consommation par catégorie</h2>
          <p className="text-sm text-gray-500 mt-1">
            Du {startDate.toLocaleDateString()} au {endDate.toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="start-date" className="text-sm text-gray-600 whitespace-nowrap">De :</label>
            <input
              id="start-date"
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={handleStartDateChange}
              className="bg-gray-50 text-gray-800 text-sm rounded-md border border-gray-300 focus:border-[#17B3DE] focus:ring-[#17B3DE] px-3 py-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="end-date" className="text-sm text-gray-600 whitespace-nowrap">À :</label>
            <input
              id="end-date"
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={handleEndDateChange}
              className="bg-gray-50 text-gray-800 text-sm rounded-md border border-gray-300 focus:border-[#17B3DE] focus:ring-[#17B3DE] px-3 py-2"
            />
          </div>
          
          {responsable ? (
            <ManagedSites 
              idUser={idUser}
              onSiteSelect={handleSiteSelect}
              minimalStyle={true}
              className="min-w-[200px]"
            />
          ) : (
            <div className="flex gap-3">
              <select
                value={selectedEntreprise}
                onChange={(e) => handleEntrepriseSelect(e.target.value)}
                className="bg-gray-50 text-gray-800 text-sm rounded-md border border-gray-300 focus:border-[#17B3DE] focus:ring-[#17B3DE] px-3 py-2 min-w-[150px]"
                disabled={loadingEntreprises}
              >
                <option value="0">Toutes les entreprises</option>
                {entreprises.map((entreprise) => (
                  <option key={entreprise.idEntreprise} value={entreprise.idEntreprise}>
                    {entreprise.nom}
                  </option>
                ))}
              </select>
              
              {selectedEntreprise !== "0" && (
                <select
                  value={selectedSite}
                  onChange={(e) => handleSiteSelect(e.target.value)}
                  className="bg-gray-50 text-gray-800 text-sm rounded-md border border-gray-300 focus:border-[#17B3DE] focus:ring-[#17B3DE] px-3 py-2 min-w-[150px]"
                  disabled={loadingSites || sites.length === 0}
                >
                  <option value="0">Tous les sites</option>
                  {sites.map((site) => (
                    <option key={site.idSite} value={site.idSite}>
                      {site.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs for view selection */}
      <div className="px-6 pt-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'chart' ? 'text-[#17B3DE] border-b-2 border-[#17B3DE] bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Vue graphique
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'table' ? 'text-[#17B3DE] border-b-2 border-[#17B3DE] bg-blue-50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Vue tableau
          </button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="p-6">
        {activeTab === 'chart' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Répartition par catégorie</h3>
              <div className="h-80">
                <Pie data={chartData} options={chartOptions} />
              </div>
            </div>
            
            {/* Summary Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Détails par catégorie</h3>
              {categories.map((categorie, index) => {
                const categoryData = consumptionData.find(item => item.categorie === categorie);
                const consumption = categoryData ? categoryData.consommation : 0;
                const total = consumptionData.reduce((sum, item) => sum + item.consommation, 0);
                const percentage = total > 0 ? Math.round((consumption / total) * 100) : 0;
                
                return (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-800">{categorie}</span>
                      <span className="font-semibold text-gray-900">{consumption.toLocaleString()} kWh</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${percentage}%`,
                          background: colorPalette[index % colorPalette.length]
                        }}
                      ></div>
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-gray-500">
                      <span>{percentage}% du total</span>
                      <span>Moyenne: {(consumption / periodData.length).toFixed(2)} kWh/période</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    {periodData.map((period, index) => (
                      <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                      </th>
                    ))}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((categorie, catIndex) => {
                    const totalConsumption = consumptionData.find(item => item.categorie === categorie)?.consommation || 0;
                    
                    return (
                      <tr key={catIndex} className={catIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: colorPalette[catIndex % colorPalette.length] }}
                            ></div>
                            {categorie}
                          </div>
                        </td>
                        
                        {periodData.map((period, periodIndex) => {
                          const periodCatData = period.data.find(d => d.categorie === categorie);
                          const periodConsumption = periodCatData ? periodCatData.consommation : 0;
                          
                          return (
                            <td key={periodIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <span className="mr-2">{periodConsumption.toLocaleString()} kWh</span>
                                <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="h-1.5 rounded-full" 
                                    style={{ 
                                      width: `${(periodConsumption / (totalConsumption || 1)) * 100}%`,
                                      backgroundColor: colorPalette[catIndex % colorPalette.length]
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {totalConsumption.toLocaleString()} kWh
                        </td>
                      </tr>
                    );
                  })}
                  
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">Total</td>
                    {periodData.map((period, index) => (
                      <td key={index} className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {period.data.reduce((sum, item) => sum + item.consommation, 0).toLocaleString()} kWh
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {consumptionData.reduce((acc, item) => acc + item.consommation, 0).toLocaleString()} kWh
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsommationCategorieEntreprise;