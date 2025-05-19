import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const getFirstDayOfPreviousMonth = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  date.setDate(1);
  return date;
};

const getTodayDate = () => {
  return new Date();
};

const ComparisonRange = ({ userId, userRole }) => {
  const [startDate, setStartDate] = useState(() => getFirstDayOfPreviousMonth());
  const [endDate, setEndDate] = useState(() => getTodayDate());
  const [error, setError] = useState(null);
  const [consumptionData, setConsumptionData] = useState(null);
  const [residences, setResidences] = useState([]);
  const [appareils, setAppareils] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [selectedAppareil, setSelectedAppareil] = useState("");
  const [periodData, setPeriodData] = useState([]);
  const [loadingResidences, setLoadingResidences] = useState(true);
  const [loadingAppareils, setLoadingAppareils] = useState(false);
  const [entreprises, setEntreprises] = useState([]);
  const [selectedEntreprise, setSelectedEntreprise] = useState("");
  const [loadingEntreprises, setLoadingEntreprises] = useState(true);
  const [activePeriod, setActivePeriod] = useState("3months"); // "1month", "3months", "6months", "custom"

  // Couleurs harmonieuses
  const primaryColor = "#2DBDAC";
  const secondaryColor = "#F36D8F";
  const accentColor = "#17B3DE";
  const darkColor = "#1E293B";
  const lightColor = "#F8FAFC";

  useEffect(() => {
    if (userRole === "entreprise") {
      fetchEntreprises();
    } else {
      fetchResidences();
    }
    setStartDate(getFirstDayOfPreviousMonth());
    setEndDate(getTodayDate());
  }, [userId, userRole]);

  const fetchEntreprises = async () => {
    try {
      setLoadingEntreprises(true);
      const response = await fetch(`http://localhost:8000/entreprises/user/${userId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setEntreprises(data);
        
        if (data.length > 0) {
          setSelectedEntreprise(data[0].idEntreprise);
          fetchResidences(data[0].idEntreprise);
        }
      } else {
        console.error("La réponse de l'API n'est pas un tableau:", data);
        setEntreprises([]);
      }
      
      setLoadingEntreprises(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des entreprises", err);
      setLoadingEntreprises(false);
    }
  };

  const fetchResidences = async (entrepriseId = null) => {
    try {
      setLoadingResidences(true);
      let url = "";
      
      if (userRole === "entreprise" && entrepriseId) {
        url = `http://localhost:8000/sites/entreprise/${entrepriseId}`;
      } else {
        url = `http://localhost:8000/user-sites/${userId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      const approvedResidences = userRole === "entreprise" ? data : data.filter((site) => site.statut_approbation === "approve");
      setResidences(approvedResidences);
      
      if (approvedResidences.length > 0) {
        setSelectedSite(approvedResidences[0].idSite);
        fetchAppareils(approvedResidences[0].idSite);
      } else {
        setSelectedSite("");
        setAppareils([]);
      }
      
      setLoadingResidences(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des résidences", err);
      setLoadingResidences(false);
    }
  };

  const fetchAppareils = async (residenceId) => {
    try {
      setLoadingAppareils(true);
      const response = await axios.get(`http://localhost:8000/appareils/${residenceId}`);
      setAppareils(response.data);
      
      if (response.data.length > 0) {
        setSelectedAppareil(response.data[0].idAppareil);
      } else {
        setSelectedAppareil("");
      }
      
      setLoadingAppareils(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des appareils", err);
      setLoadingAppareils(false);
    }
  };

  const handleEntrepriseChange = (e) => {
    const entrepriseId = e.target.value;
    setSelectedEntreprise(entrepriseId);
    setSelectedSite("");
    setSelectedAppareil("");
    if (entrepriseId) {
      fetchResidences(entrepriseId);
    } else {
      setResidences([]);
      setAppareils([]);
    }
  };

  const handleResidenceChange = (e) => {
    const residenceId = e.target.value;
    setSelectedSite(residenceId);
    setSelectedAppareil("");
    if (residenceId) {
      fetchAppareils(residenceId);
    } else {
      setAppareils([]);
    }
  };

  const handlePeriodChange = (period) => {
    const today = new Date();
    const newStartDate = new Date();
    
    switch (period) {
      case "1month":
        newStartDate.setMonth(today.getMonth() - 1);
        break;
      case "3months":
        newStartDate.setMonth(today.getMonth() - 3);
        break;
      case "6months":
        newStartDate.setMonth(today.getMonth() - 6);
        break;
      case "custom":
        // Ne rien faire, l'utilisateur sélectionnera manuellement
        break;
      default:
        newStartDate.setMonth(today.getMonth() - 3);
    }
    
    setStartDate(period !== "custom" ? newStartDate : startDate);
    setEndDate(period !== "custom" ? today : endDate);
    setActivePeriod(period);
  };

  const fetchComparisonData = async () => {
    if (!startDate || !endDate || !selectedAppareil || !selectedSite) {
      setError("Veuillez sélectionner une date, une résidence et un appareil.");
      return;
    }

    try {
      const url = `http://localhost:8000/Comparison/range/${userId}/${selectedSite}/${selectedAppareil}`;

      const startDateISO = startDate instanceof Date && !isNaN(startDate) ? startDate.toISOString().split('T')[0] : null;
      const endDateISO = endDate instanceof Date && !isNaN(endDate) ? endDate.toISOString().split('T')[0] : null;

      if (!startDateISO || !endDateISO) {
        setError("Dates invalides.");
        return;
      }

      const response = await axios.get(url, {
        params: {
          start_date: startDateISO,
          end_date: endDateISO,
        },
      });

      if (response.data && Object.keys(response.data).length > 0) {
        setConsumptionData(response.data);
        setError(null);
        calculatePeriods(startDate, endDate, response.data);
      } else {
        setConsumptionData(null);
        setError("Aucune donnée disponible pour cette période.");
      }
    } catch (err) {
      setError("Veuillez sélectionner une période valide.");
      console.error("API Error:", err);
    }
  };

  const calculatePeriods = (startDate, endDate, data) => {
    const diffInTime = endDate.getTime() - startDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
  
    let periods = [];
    
    const formattedData = {};
    for (const [key, value] of Object.entries(data)) {
      formattedData[key] = value.consumption;
    }

    if (diffInDays > 365) {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      for (let year = startYear; year <= endYear; year++) {
        const yearConsumption = Object.entries(formattedData)
          .filter(([key]) => key.includes(year.toString()))
          .reduce((sum, [, value]) => sum + value, 0);
        periods.push({ label: year.toString(), consumption: yearConsumption });
      }
    } 
    else if (diffInDays > 90) {
      const startQuarter = Math.floor(startDate.getMonth() / 3) + 1;
      const endQuarter = Math.floor(endDate.getMonth() / 3) + 1;
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        const firstQuarter = year === startYear ? startQuarter : 1;
        const lastQuarter = year === endYear ? endQuarter : 4;
        
        for (let quarter = firstQuarter; quarter <= lastQuarter; quarter++) {
          const quarterLabel = `T${quarter} ${year}`;
          const consumption = formattedData[quarterLabel] || 0;
          periods.push({ label: quarterLabel, consumption });
        }
      }
    }
    else if (diffInDays > 30) {
      const startMonth = startDate.getMonth() + 1;
      const endMonth = endDate.getMonth() + 1;
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        const firstMonth = year === startYear ? startMonth : 1;
        const lastMonth = year === endYear ? endMonth : 12;
        
        for (let month = firstMonth; month <= lastMonth; month++) {
          const monthLabel = `${month.toString().padStart(2, '0')}/${year}`;
          const consumption = formattedData[monthLabel] || 0;
          periods.push({ label: monthLabel, consumption });
        }
      }
    } 
    else if (diffInDays > 7) {
      const startWeek = getWeekNumber(startDate);
      const endWeek = getWeekNumber(endDate);
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      
      for (let year = startYear; year <= endYear; year++) {
        const firstWeek = year === startYear ? startWeek : 1;
        const lastWeek = year === endYear ? endWeek : getWeekNumber(new Date(year, 11, 31));
        
        for (let week = firstWeek; week <= lastWeek; week++) {
          const weekLabel = `Semaine ${week}, ${year}`;
          const consumption = formattedData[weekLabel] || 0;
          periods.push({ label: weekLabel, consumption });
        }
      }
    } 
    else {
      for (let day = 0; day <= diffInDays; day++) {
        const dayDate = new Date(startDate.getTime() + day * 24 * 3600 * 1000);
        const formattedDate = dayDate.toISOString().split('T')[0];
        const consumption = formattedData[formattedDate] || 0;
        periods.push({ label: formattedDate, consumption });
      }
    }
  
    setPeriodData(periods);
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  useEffect(() => {
    fetchComparisonData();
  }, [startDate, endDate, selectedAppareil, selectedSite]);

  const chartData = {
    labels: periodData.map(period => period.label),
    datasets: [
      {
        label: 'Consommation (kWh)',
        data: periodData.map(period => period.consumption),
        backgroundColor: primaryColor,
        hoverBackgroundColor: "#1DA895",
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 30,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkColor,
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
        backgroundColor: lightColor,
        titleColor: darkColor,
        bodyColor: darkColor,
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
            <h2 className="text-xl font-bold text-gray-800">Analyse de consommation</h2>
            <p className="text-sm text-gray-500">Comparaison par période et appareil</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => handlePeriodChange("1month")}
                className={`px-3 py-1 text-sm font-medium rounded-l-lg ${activePeriod === "1month" ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                1 mois
              </button>
              <button
                onClick={() => handlePeriodChange("3months")}
                className={`px-3 py-1 text-sm font-medium ${activePeriod === "3months" ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                3 mois
              </button>
              <button
                onClick={() => handlePeriodChange("6months")}
                className={`px-3 py-1 text-sm font-medium ${activePeriod === "6months" ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                6 mois
              </button>
              <button
                onClick={() => handlePeriodChange("custom")}
                className={`px-3 py-1 text-sm font-medium rounded-r-lg ${activePeriod === "custom" ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Personnalisé
              </button>
            </div>
          </div>
        </div>

        {activePeriod === "custom" && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="w-full bg-gray-50 text-gray-800 text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="w-full bg-gray-50 text-gray-800 text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {userRole === "entreprise" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
              <select
                value={selectedEntreprise}
                onChange={handleEntrepriseChange}
                className="w-full bg-gray-50 text-gray-800 text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
              >
                <option value="">Sélectionnez une entreprise</option>
                {loadingEntreprises ? (
                  <option disabled>Chargement...</option>
                ) : (
                  Array.isArray(entreprises) && entreprises.map((entreprise) => (
                    <option key={entreprise.idEntreprise} value={entreprise.idEntreprise}>
                      {entreprise.nom}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Résidence</label>
            <select
              value={selectedSite}
              onChange={handleResidenceChange}
              disabled={userRole === "entreprise" && !selectedEntreprise}
              className="w-full bg-gray-50 text-gray-800 text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
            >
              <option value="">Sélectionnez une résidence</option>
              {loadingResidences ? (
                <option disabled>Chargement...</option>
              ) : (
                residences.map((residence) => (
                  <option key={residence.idSite} value={residence.idSite}>
                    {residence.nom}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Appareil</label>
            <select
              value={selectedAppareil}
              onChange={(e) => setSelectedAppareil(e.target.value)}
              disabled={!selectedSite || loadingAppareils}
              className="w-full bg-gray-50 text-gray-800 text-sm p-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
            >
              <option value="">Sélectionnez un appareil</option>
              {loadingAppareils ? (
                <option disabled>Chargement...</option>
              ) : (
                appareils.map((appareil) => (
                  <option key={appareil.idAppareil} value={appareil.idAppareil}>
                    {appareil.nom}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 text-sm text-pink-700 bg-pink-100 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="w-full h-80 bg-gray-50 rounded-xl p-4">
          {periodData.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {selectedSite && selectedAppareil ? "Aucune donnée disponible pour cette période" : "Sélectionnez une résidence et un appareil"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparisonRange;