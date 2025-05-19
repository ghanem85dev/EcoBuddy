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
  const [selectedResidences, setSelectedResidences] = useState([]);
  const [allResidences, setAllResidences] = useState([]);
  const [showResidenceModal, setShowResidenceModal] = useState(false);
  const [activeTab, setActiveTab] = useState('day'); // 'day', 'week', 'month'

  const fetchConsumptionData = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/Comparison/site/category/${idUser}`, {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
      });
      setConsumptionData(response.data);
      
      const residences = [...new Set(response.data.map(item => item.siteNom))];
      setAllResidences(residences);
      
      if (selectedResidences.length === 0 && residences.length > 0) {
        setSelectedResidences(residences.slice(0, 3));
      }
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
  }, [idUser, startDate, endDate, activeTab]);

  const handleResidenceSelection = (residences) => {
    setSelectedResidences(residences);
    setShowResidenceModal(false);
  };

  const handleDateRangeChange = (range) => {
    const now = new Date();
    const newStartDate = new Date();
    
    switch (range) {
      case 'week':
        newStartDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        newStartDate.setMonth(now.getMonth() - 1);
        break;
      default: // day
        newStartDate.setDate(now.getDate() - 1);
    }
    
    setStartDate(newStartDate);
    setEndDate(now);
    setActiveTab(range);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="text-red-500 font-semibold text-center py-10">{error}</div>
    </div>
  );

  const categories = [...new Set(consumptionData.map(item => item.categorie))];
  const filteredData = consumptionData.filter(item => selectedResidences.includes(item.siteNom));

  const consumptionByResidence = selectedResidences.map(residence => {
    const categoriesForResidence = categories.map(categorie => {
      const totalConsumption = filteredData
        .filter(item => item.siteNom === residence && item.categorie === categorie)
        .reduce((acc, item) => acc + item.consommation, 0);
      return { categorie, totalConsumption };
    });
    return { residence, categories: categoriesForResidence };
  });

  // Nouvelle palette de couleurs harmonieuse
  const colorPalette = ['#2DBDAC', '#F36D8F', '#17B3DE', '#FFA630', '#A78BFA'];
  const hoverColorPalette = ['#1DA895', '#D45D7F', '#0A9BCE', '#E89520', '#9674F0'];

  const data = {
    labels: categories,
    datasets: consumptionByResidence.map((residence, index) => ({
      label: residence.residence,
      data: residence.categories.map(item => item.totalConsumption),
      backgroundColor: colorPalette[index % colorPalette.length],
      hoverBackgroundColor: hoverColorPalette[index % hoverColorPalette.length],
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 6,
      barThickness: 30,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#4B5563',
          font: {
            family: 'Inter, sans-serif',
            weight: '600',
            size: 12
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
        boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} kWh`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            family: 'Inter, sans-serif',
            weight: "500"
          }
        }
      },
      y: {
        grid: {
          color: "#F3F4F6",
          drawBorder: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            family: 'Inter, sans-serif',
            weight: "500"
          },
          callback: function(value) {
            return `${value} kWh`;
          }
        }
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Comparaison par catégorie</h2>
            <p className="text-sm text-gray-500">Consommation énergétique par type d'équipement</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => handleDateRangeChange('day')}
                className={`px-3 py-1 text-sm font-medium rounded-l-lg ${activeTab === 'day' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                24h
              </button>
              <button
                onClick={() => handleDateRangeChange('week')}
                className={`px-3 py-1 text-sm font-medium ${activeTab === 'week' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Semaine
              </button>
              <button
                onClick={() => handleDateRangeChange('month')}
                className={`px-3 py-1 text-sm font-medium rounded-r-lg ${activeTab === 'month' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Mois
              </button>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="bg-gray-50 text-gray-800 text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={endDate.toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="bg-gray-50 text-gray-800 text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowResidenceModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200"
                title="Changer les résidences affichées"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>Filtrer</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full h-80">
          <Bar data={data} options={options} />
        </div>
      </div>

      {showResidenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Sélection des résidences</h3>
              <button 
                onClick={() => setShowResidenceModal(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">Sélectionnez jusqu'à 3 résidences à comparer</p>
            
            <div className="max-h-64 overflow-y-auto mb-4 border border-gray-200 rounded-lg divide-y divide-gray-200">
              {allResidences.map(residence => (
                <label key={residence} className={`flex items-center p-3 transition-colors ${selectedResidences.includes(residence) ? 'bg-teal-50' : 'hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={selectedResidences.includes(residence)}
                    onChange={(e) => {
                      if (e.target.checked && selectedResidences.length < 3) {
                        setSelectedResidences([...selectedResidences, residence]);
                      } else if (!e.target.checked) {
                        setSelectedResidences(selectedResidences.filter(r => r !== residence));
                      }
                    }}
                    className="h-4 w-4 border-gray-300 rounded focus:ring-teal-500 text-teal-600"
                    disabled={selectedResidences.length >= 3 && !selectedResidences.includes(residence)}
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">{residence}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowResidenceModal(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowResidenceModal(false)}
                className="px-4 py-2 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
              >
                Valider ({selectedResidences.length}/3)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumptionComparisonByCategory;