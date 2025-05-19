import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { format, subMonths, eachMonthOfInterval, eachQuarterOfInterval, eachWeekOfInterval, eachDayOfInterval } from 'date-fns';

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

const ConsommationEntreprisesChart = ({ userId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(getFirstDayOfPreviousMonth());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [periodLabel, setPeriodLabel] = useState('mois');
  const [periodData, setPeriodData] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // D'abord, déterminer les périodes à requêter
      const periods = determinePeriods(startDate, endDate);
      
      // Ensuite, faire les requêtes pour chaque période
      const periodRequests = periods.map(period => 
        axios.get(`http://localhost:8000/consommation/entreprise/${userId}`, {
          params: {
            start_date: format(period.start, 'yyyy-MM-dd'),
            end_date: format(period.end, 'yyyy-MM-dd'),
          }
        })
      );
      
      const responses = await Promise.all(periodRequests);
      
      // Structurer les données pour le graphique
      const formattedData = formatDataForChart(responses, periods);
      
      setData(formattedData);
      setPeriodData(generateChartData(formattedData));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const determinePeriods = (start, end) => {
    const diffInTime = end.getTime() - start.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
    
    let periods = [];
    
    if (diffInDays > 365) { // Années
      setPeriodLabel('années');
      const years = [];
      for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
        periods.push({
          label: year.toString(),
          start: new Date(year, 0, 1),
          end: new Date(year, 11, 31)
        });
      }
    } 
    else if (diffInDays > 90) { // Trimestres
      setPeriodLabel('trimestres');
      const quarters = eachQuarterOfInterval({ start, end });
      for (let i = 0; i < quarters.length; i++) {
        const quarterStart = quarters[i];
        const quarterEnd = i < quarters.length - 1 
          ? new Date(quarters[i + 1].getTime() - 1)
          : end;
        
        const quarter = Math.floor(quarterStart.getMonth() / 3) + 1;
        periods.push({
          label: `T${quarter} ${quarterStart.getFullYear()}`,
          start: quarterStart,
          end: quarterEnd
        });
      }
    }
    else if (diffInDays > 30) { // Mois
      setPeriodLabel('mois');
      const months = eachMonthOfInterval({ start, end });
      for (let i = 0; i < months.length; i++) {
        const monthStart = months[i];
        const monthEnd = i < months.length - 1 
          ? new Date(months[i + 1].getTime() - 1)
          : end;
        
        periods.push({
          label: `${(monthStart.getMonth() + 1).toString().padStart(2, '0')}/${monthStart.getFullYear()}`,
          start: monthStart,
          end: monthEnd
        });
      }
    }
    else if (diffInDays > 7) { // Semaines
      setPeriodLabel('semaines');
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      for (let i = 0; i < weeks.length; i++) {
        const weekStart = weeks[i];
        const weekEnd = i < weeks.length - 1 
          ? new Date(weeks[i + 1].getTime() - 1)
          : end;
        
        periods.push({
          label: `Semaine ${getWeekNumber(weekStart)}, ${weekStart.getFullYear()}`,
          start: weekStart,
          end: weekEnd
        });
      }
    }
    else { // Jours
      setPeriodLabel('jours');
      const days = eachDayOfInterval({ start, end });
      for (let day of days) {
        periods.push({
          label: format(day, 'yyyy-MM-dd'),
          start: day,
          end: day
        });
      }
    }
    
    return periods;
  };

  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const formatDataForChart = (responses, periods) => {
    const entreprisesMap = new Map();
    
    responses.forEach((response, index) => {
      const period = periods[index];
      
      if (response.data && response.data.entreprises) {
        response.data.entreprises.forEach(entreprise => {
          if (!entreprisesMap.has(entreprise.entreprise_id)) {
            entreprisesMap.set(entreprise.entreprise_id, {
              id: entreprise.entreprise_id,
              nom: entreprise.entreprise_nom,
              data: Array(periods.length).fill(0),
              nombre_sites: entreprise.nombre_sites,
              nombre_appareils: entreprise.nombre_appareils
            });
          }
          
          const entrepriseData = entreprisesMap.get(entreprise.entreprise_id);
          entrepriseData.data[index] = entreprise.consommation_totale;
        });
      }
    });
    
    return {
      periods: periods.map(p => p.label),
      entreprises: Array.from(entreprisesMap.values())
    };
  };

  const generateChartData = (formattedData) => {
    return {
      labels: formattedData.periods,
      datasets: formattedData.entreprises.map((entreprise, index) => ({
        label: entreprise.nom,
        data: entreprise.data,
        backgroundColor: getChartColors(index),
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 4,
        barThickness: 40,
      }))
    };
  };

  const getChartColors = (index) => {
    const colors = [
      '#17B3DE', '#3ab7a8', '#2a9d8f', '#1a8276', '#0e665b', // Nuances de vert
      '#0E7490', '#1E40AF', '#3730A3', '#5B21B6', '#7C3AED'  // Autres couleurs conservées
    ];
    return colors[index % colors.length];
  };

  const handleStartDateChange = (e) => {
    setStartDate(new Date(e.target.value));
  };

  const handleEndDateChange = (e) => {
    setEndDate(new Date(e.target.value));
  };

  useEffect(() => {
    fetchData();
  }, [userId, startDate, endDate]);

  if (loading) return <div className="text-[#17B3DE] font-semibold">Chargement...</div>;
  if (error) return <div className="text-red-500 font-semibold">{error}</div>;
  if (!data) return <div className="text-gray-500 font-semibold">Aucune donnée disponible</div>;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#000',
          font: {
            weight: 'bold'
          },
          padding: 20,
          boxWidth: 12,
        }
      },
      tooltip: {
        backgroundColor: "#FFF",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 10,
        boxShadow: "0px 0px 5px rgba(0,0,0,0.1)",
        usePointStyle: true,
        callbacks: {
          title: function(context) {
            return `Période: ${context[0].label}`;
          },
          label: function(context) {
            const entreprise = data.entreprises.find(e => e.nom === context.dataset.label);
            return [
              `${context.dataset.label}: ${context.raw.toFixed(2)} kWh`,
              `Sites: ${entreprise.nombre_sites}`,
              `Appareils: ${entreprise.nombre_appareils}`
            ];
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
          color: "#666",
          font: {
            weight: "bold"
          }
        },
        title: {
          display: true,
          text: `Données groupées par ${periodLabel}`,
          color: '#666',
          font: {
            weight: 'bold'
          }
        }
      },
      y: {
        grid: {
          color: "#eee",
          drawBorder: false,
        },
        ticks: {
          color: "#666",
          font: {
            weight: "bold"
          },
          callback: function(value) {
            return value + ' kWh';
          }
        },
        title: {
          display: true,
          text: 'Consommation (kWh)',
          color: '#666',
          font: {
            weight: 'bold'
          }
        }
      },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl p-10 text-gray-800 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Consommation par entreprise</h2>
        <div className="flex space-x-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Date de début :</label>
            <input
              type="date"
              value={format(startDate, 'yyyy-MM-dd')}
              onChange={handleStartDateChange}
              className="bg-gray-50 text-gray-800 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">Date de fin :</label>
            <input
              type="date"
              value={format(endDate, 'yyyy-MM-dd')}
              onChange={handleEndDateChange}
              className="bg-gray-50 text-gray-800 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="w-full h-[330px] mb-5">
        {periodData.labels && periodData.labels.length > 0 ? (
          <Bar data={periodData} options={options} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Aucune donnée à afficher pour cette période
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsommationEntreprisesChart;