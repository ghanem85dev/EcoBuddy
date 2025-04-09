import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { AuthContext } from "../../commun/context/AuthContext";
import Entreprise from './Entreprise';
import ManagedSites from "./ManagedSites";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const getFirstDayOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  return date;
};

const getTodayDate = () => {
  return new Date();
};

const HistoricalConsumption = ({responsable=false}) => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(() => getFirstDayOfMonth());
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

  const getPeriodType = (start, end) => {
    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'day';
    if (diffDays <= 30) return 'week';
    if (diffDays <= 90) return 'month';
    if (diffDays <= 365) return 'quarter';
    return 'year';
  };

  const fetchConsumptionData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      let endpoint;
      let params = {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        period_type: getPeriodType(startDate, endDate)
      };
  
      if (responsable) {
        endpoint = `http://localhost:8000/consommation/historique-managed-site/${selectedSite}/${idUser}`;
        if (selectedSite === "0") {
          params.aggregate = "true";
        }
      } else {
        endpoint = selectedSite !== "0" 
          ? `http://localhost:8000/consommation/historique-site/${selectedSite}/${idUser}`
          : `http://localhost:8000/consommation/historique-entreprise/${selectedEntreprise}/${idUser}`;
      }
  
      console.log("Envoi de la requête à:", endpoint, "avec params:", params);
      const response = await axios.get(endpoint, { params });
      
      console.log("Réponse reçue:", response.data); // Ajout pour le débogage
      
      // Modification ici - vérifier si response.data est null ou undefined
      if (!response.data) {
        throw new Error("Réponse invalide de l'API");
      }
  
      // Modification ici - accepter un tableau vide comme réponse valide
      const formattedData = Array.isArray(response.data) 
        ? response.data.map(item => ({
            date: item.date || item.period,
            consumption: parseFloat(item.consumption || item.value || item.consommation || 0)
          }))
        : [];
  
      console.log("Données formatées:", formattedData);
      setConsumptionData(formattedData);
      
      // Modification ici - ne pas définir d'erreur si le tableau est vide
      if (formattedData.length === 0) {
        setError(null); // Effacer toute erreur précédente
      }
      
    } catch (error) {
      console.error("Erreur détaillée:", error);
      setError(error.response?.data?.message || error.message || "Erreur lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  };
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateForInput = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      date = new Date();
    }
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchConsumptionData();
  }, [startDate, endDate, selectedSite, selectedEntreprise, idUser]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#333',
          font: {
            weight: 'bold'
          }
        }
      },
      tooltip: {
        backgroundColor: '#0078B8',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw} kWh`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#666'
        },
        title: {
          display: true,
          text: getPeriodType(startDate, endDate) === 'day' ? 'Jours' : 
                getPeriodType(startDate, endDate) === 'week' ? 'Semaines' :
                getPeriodType(startDate, endDate) === 'month' ? 'Mois' :
                getPeriodType(startDate, endDate) === 'quarter' ? 'Trimestres' : 'Années',
          color: '#666'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: '#666',
          callback: (value) => `${value} kWh`
        }
      }
    }
  };

  const data = {
    labels: consumptionData.map(item => item.date),
    datasets: [
      {
        label: 'Consommation (kWh)',
        data: consumptionData.map(item => item.consumption),
        borderColor: '#0078B8',
        backgroundColor: 'rgba(0, 120, 184, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#0078B8',
        pointBorderColor: '#fff',
        pointHoverRadius: 5,
        borderWidth: 2
      }
    ]
  };

  const handleStartDateChange = (e) => {
    setStartDate(new Date(e.target.value));
  };

  const handleEndDateChange = (e) => {
    setEndDate(new Date(e.target.value));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center py-8 text-blue-600 font-semibold">
          Chargement des données...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center py-8 text-red-500 font-semibold">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800"></h2>
        
        <div className="w-full md:w-auto">
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de début :</label>
          <input
            type="date"
            value={formatDateForInput(startDate)}
            onChange={handleStartDateChange}
            className="w-full p-2 border border-gray-300 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500"
            max={formatDateForInput(endDate)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin :</label>
          <input
            type="date"
            value={formatDateForInput(endDate)}
            onChange={handleEndDateChange}
            className="w-full p-2 border border-gray-300 text-gray-900 rounded-md focus:ring-blue-500 focus:border-blue-500"
            min={formatDateForInput(startDate)}
            max={formatDateForInput(getTodayDate())}
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="h-80" style={{ position: 'relative' }}>
          {consumptionData.length > 0 ? (
            <Line data={data} options={options} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Aucune donnée disponible pour la période sélectionnée</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          Affichage des données du {formatDate(startDate)} au {formatDate(endDate)}
          {selectedSite !== "0" && (
            <span> - Site: {localStorage.getItem("selectedSiteName")}</span>
          )}
          {selectedEntreprise !== "0" && (
            <span> - Entreprise: {localStorage.getItem("selectedEntrepriseName")}</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default HistoricalConsumption;