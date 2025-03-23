import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const getFirstDayOfPreviousMonth = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  date.setDate(1);
  return date;
};

const getTodayDate = () => {
  return new Date();
};

const ComparisonRange = ({ userId }) => {
  const [startDate, setStartDate] = useState(() => getFirstDayOfPreviousMonth());
  const [endDate, setEndDate] = useState(() => getTodayDate());
  const [error, setError] = useState(null);
  const [consumptionData, setConsumptionData] = useState(null);
  const [appareils, setAppareils] = useState([]);
  const [selectedResidence, setSelectedResidence] = useState(localStorage.getItem("selectedResidence") || "0");
  const [selectedAppareil, setSelectedAppareil] = useState("");
  const [periodData, setPeriodData] = useState([]);

  useEffect(() => {
    setSelectedResidence(localStorage.getItem("selectedResidence") || "0");
    const checkResidenceChange = () => {
      const newResidence = localStorage.getItem("selectedResidence") || "0";
      if (newResidence !== selectedResidence) {
        setSelectedResidence(newResidence);
        fetchAppareils(); // Rafraîchir immédiatement
      }
    };
    fetchAppareils();
    setStartDate(getFirstDayOfPreviousMonth());
    setEndDate(getTodayDate());
    const interval = setInterval(checkResidenceChange, 500);
    window.addEventListener("storage", checkResidenceChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkResidenceChange);
    };
  }, [userId, selectedResidence]);

  const fetchAppareils = async () => {
    try {
      const url = selectedResidence === "0"
        ? `http://localhost:8000/appareils/user/${userId}`
        : `http://localhost:8000/appareils/${selectedResidence}`;
      
      const response = await axios.get(url);
      setAppareils(response.data);
    } catch (err) {
      console.error("Erreur lors de la récupération des appareils", err);
    }
  };

  const fetchComparisonData = async () => {
    if (!startDate || !endDate || !selectedAppareil) {
      setError("Veuillez sélectionner une date et un appareil.");
      return;
    }

    try {
      const url = `http://localhost:8000/Comparison/range/${userId}/${selectedResidence}/${selectedAppareil}`;

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
      setError("Veuillez sélectionner une periode valide.");
      console.error("API Error:", err);
    }
  };

  const calculatePeriods = (startDate, endDate, data) => {
    const diffInTime = endDate.getTime() - startDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
  
    let periods = [];
    
    // Comparer par année
    if (diffInDays > 365) {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      for (let year = startYear; year <= endYear; year++) {
        const consumption = data[year] ? data[year].consumption : 0;
        periods.push({ label: year, consumption });
      }
    } 
    // Comparer par mois
    else if (diffInDays > 30) {
      const startMonth = startDate.getMonth();
      const endMonth = endDate.getMonth();
      for (let month = startMonth; month <= endMonth; month++) {
        const monthLabel = `${month + 1}/${startDate.getFullYear()}`;
        const consumption = data[monthLabel] ? data[monthLabel].consumption : 0;
        periods.push({ label: monthLabel, consumption });
      }
    } 
    // Comparer par semaine
    else if (diffInDays > 7) {
      const startWeek = Math.floor((startDate.getTime() - new Date(startDate.getFullYear(), 0, 1).getTime()) / (1000 * 3600 * 24 * 7));
      const endWeek = Math.floor((endDate.getTime() - new Date(endDate.getFullYear(), 0, 1).getTime()) / (1000 * 3600 * 24 * 7));
      for (let week = startWeek; week <= endWeek; week++) {
        const weekLabel = `Semaine ${week + 1}, ${startDate.getFullYear()}`;
        const consumption = data[weekLabel] ? data[weekLabel].consumption : 0;
        periods.push({ label: weekLabel, consumption });
      }
    } 
    // Comparer par jour
    else {
      for (let day = 0; day <= diffInDays; day++) {
        const dayDate = new Date(startDate.getTime() + day * 24 * 3600 * 1000);
        const formattedDate = dayDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
        const consumption = data[formattedDate] ? data[formattedDate].consumption : 0;
        periods.push({ label: formattedDate, consumption });
      }
    }
  
    setPeriodData(periods);
  };
  

  useEffect(() => {
    fetchComparisonData();
  }, [startDate, endDate, selectedAppareil]);

  const chartData = {
    labels: periodData.map(period => period.label),
    datasets: [
      {
        label: 'Consommation (kWh)',
        data: periodData.map(period => period.consumption),
        backgroundColor: '#4F46E5',
        borderColor: '#312E81',
        borderWidth: 1,
        borderRadius: 10,
        barThickness: 40,
      },
    ],
  };

  const chartOptions = {
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
    <div className="bg-[#1a2e45] text-white p-6 rounded-2xl shadow-lg">
      <h2 className="text-xl font-semibold text-blue-300 mb-4">
      </h2>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-blue-200">Date de début :</label>
          <input
            type="date"
            value={startDate.toISOString().split('T')[0]}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="bg-[#0F172A] text-white p-2 rounded-md border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-blue-200">Date de fin :</label>
          <input
            type="date"
            value={endDate.toISOString().split('T')[0]}
            onChange={(e) => setEndDate(new Date(e.target.value))}
            className="bg-[#0F172A] text-white p-2 rounded-md border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-blue-200">Appareil :</label>
          <select
            value={selectedAppareil}
            onChange={(e) => setSelectedAppareil(e.target.value)}
            className="bg-[#0F172A] text-white p-2 rounded-md border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {appareils.map((appareil) => (
              <option key={appareil.idAppareil} value={appareil.idAppareil}>
                {appareil.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="text-red-500 font-semibold">{error}</div>}

      

      <div className="w-full h-64 mt-6">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ComparisonRange;