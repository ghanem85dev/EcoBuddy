import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from "chart.js";
import { useTheme } from "../../commun/context/ThemeContext";

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
);

const RealTimeConsumptionEntreprise = ({ idUser }) => {
  // États pour les données
  const [monthlyData, setMonthlyData] = useState({ labels: [], datasets: [] });
  const [weeklyData, setWeeklyData] = useState({ labels: [], datasets: [] });
  const [enterprises, setEnterprises] = useState([]);
  const [sites, setSites] = useState([]);
  
  // États pour les sélections
  const [selectedEnterprise, setSelectedEnterprise] = useState("");
  const [selectedSites, setSelectedSites] = useState([]);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  
  // États pour l'UI
  const [totalConsumptions, setTotalConsumptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(null);
  
  // Références et thème
  const { theme } = useTheme();
  const chartRef = useRef(null);

  // Fonctions utilitaires
  function getMaxMonth() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  }

  function getDefaultStartDate() {
    const date = new Date();
    date.setMonth(date.getMonth() - 5);
    return formatMonth(date);
  }

  function getDefaultEndDate() {
    return formatMonth(new Date());
  }

  function formatMonth(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function generateDisplayMonths(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const months = [];
    
    while (startDate <= endDate) {
      months.push({
        short: startDate.toLocaleString('default', { month: 'short' }),
        withYear: startDate.toLocaleString('default', { month: 'short', year: 'numeric' })
      });
      startDate.setMonth(startDate.getMonth() + 1);
    }
    
    return months;
  }

  // Effets pour charger les données
  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/entreprises/user/${idUser}`);
        setEnterprises(response.data);
        if (response.data.length > 0) {
          setSelectedEnterprise(response.data[0].idEntreprise);
        }
      } catch (error) {
        console.error("Error loading enterprises:", error);
      }
    };
    fetchEnterprises();
  }, [idUser]);

  useEffect(() => {
    const fetchSites = async () => {
      if (!selectedEnterprise) return;
      try {
        const response = await axios.get(`http://localhost:8000/sites/entreprise/${selectedEnterprise}`);
        setSites(response.data);
        if (response.data.length > 0) {
          setSelectedSites([String(response.data[0].idSite)]);
        }
      } catch (error) {
        console.error("Error loading sites:", error);
      }
    };
    fetchSites();
  }, [selectedEnterprise]);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!selectedEnterprise || selectedSites.length === 0) return;
      
      setLoading(true);
      setError(null);
      setViewMode('monthly');
      setSelectedMonth(null);
      
      try {
        const displayMonths = generateDisplayMonths(startDate, endDate);
        const newDatasets = [];
        const newTotals = {};
        
        for (const siteId of selectedSites) {
          const url = `http://localhost:8000/Consommation/site/${siteId}?start=${startDate}&end=${endDate}`;
          const response = await axios.get(url);
          const apiData = response.data.values || [];
          
          const values = apiData.length === displayMonths.length 
            ? apiData 
            : [...apiData, ...Array(Math.max(0, displayMonths.length - apiData.length)).fill(0)];

          const total = values.reduce((sum, val) => sum + val, 0);
          const siteName = sites.find(s => String(s.idSite) === String(siteId))?.nom || `Site ${siteId}`;
          
          newTotals[siteId] = total;
          
          newDatasets.push({
            label: siteName,
            data: values.slice(0, displayMonths.length),
            borderColor: siteId === selectedSites[0] 
              ? (theme === "light" ? "#17B3DE" : "#4FC1E9") 
              : "#888888",
            backgroundColor: siteId === selectedSites[0] 
              ? (theme === "light" ? "rgba(23, 179, 222, 0.2)" : "rgba(79, 193, 233, 0.3)")
              : "rgba(136, 136, 136, 0.2)",
            pointBackgroundColor: siteId === selectedSites[0] 
              ? (theme === "light" ? "#0E8EB4" : "#17B3DE")
              : "#666666",
            fill: 'origin',
            tension: 0.4,
            pointBorderColor: "#fff",
            pointHoverRadius: 6,
            pointRadius: 4,
            borderWidth: siteId === selectedSites[0] ? 3 : 2,
          });
        }
        
        setMonthlyData({
          labels: displayMonths.map(m => m.withYear),
          datasets: newDatasets
        });
        setTotalConsumptions(newTotals);
      } catch (error) {
        console.error("API Error:", error);
        setError("Failed to load consumption data");
      } finally {
        setLoading(false);
      }
    };

    if (selectedEnterprise && selectedSites.length > 0 && sites.length > 0) {
      fetchMonthlyData();
    }
  }, [selectedEnterprise, selectedSites, startDate, endDate, sites, theme]);

  // Fonctions pour gérer les interactions
  const fetchWeeklyData = async (siteId, monthDate) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/Consommation/site/${siteId}/weekly?month=${monthDate}`
      );
      
      const weeks = response.data;
      const labels = weeks.map(week => `Week ${week.week_number}`);
      const values = weeks.map(week => week.consumption);
      
      const siteName = sites.find(s => String(s.idSite) === String(siteId))?.nom || `Site ${siteId}`;
      
      return {
        labels,
        datasets: [{
          label: `${siteName} (${monthDate})`,
          data: values,
          borderColor: theme === "light" ? "#17B3DE" : "#4FC1E9",
          backgroundColor: theme === "light" ? "rgba(23, 179, 222, 0.2)" : "rgba(79, 193, 233, 0.3)",
          pointBackgroundColor: theme === "light" ? "#0E8EB4" : "#17B3DE",
          fill: 'origin',
          tension: 0.4,
          pointBorderColor: "#fff",
          pointHoverRadius: 6,
          pointRadius: 4,
          borderWidth: 3,
        }],
        weekDetails: weeks.map(week => ({
          period: `${week.start_date} to ${week.end_date}`,
          consumption: week.consumption
        }))
      };
    } catch (error) {
      console.error("Error loading weekly data:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleChartClick = async (event) => {
    if (!chartRef.current || viewMode === 'weekly') return;

    const chart = chartRef.current;
    const points = chart.getElementsAtEventForMode(
      event,
      'nearest',
      { intersect: true },
      false
    );

    if (points.length) {
      const firstPoint = points[0];
      const datasetIndex = firstPoint.datasetIndex;
      const index = firstPoint.index;
      
      const siteId = selectedSites[datasetIndex];
      const monthLabel = monthlyData.labels[index];
      const monthDate = new Date(monthLabel);
      const formattedMonth = formatMonth(monthDate);

      setSelectedMonth(monthLabel);
      setLoading(true);

      const weeklyChartData = await fetchWeeklyData(siteId, formattedMonth);
      if (weeklyChartData) {
        setWeeklyData(weeklyChartData);
        setViewMode('weekly');
      }
    }
  };

  const handleBackToMonthly = () => {
    setViewMode('monthly');
    setSelectedMonth(null);
  };

  const handleEnterpriseChange = (e) => {
    setSelectedEnterprise(e.target.value);
    setSelectedSites([]);
    setViewMode('monthly');
    setSelectedMonth(null);
  };

  const handleSiteChange = (index, value) => {
    const newSelected = [...selectedSites];
    if (index >= newSelected.length) {
      if (newSelected.length >= 2) return;
      newSelected.push(value);
    } else {
      newSelected[index] = value;
    }
    setSelectedSites(newSelected);
    setViewMode('monthly');
    setSelectedMonth(null);
  };

  const addSiteSelector = () => {
    if (selectedSites.length < 2) {
      const availableSite = sites.find(site => 
        !selectedSites.includes(String(site.idSite)))
      if (availableSite) {
        setSelectedSites([...selectedSites, String(availableSite.idSite)]);
      }
    }
  };

  const removeSiteSelector = (index) => {
    if (selectedSites.length > 1) {
      const newSelected = [...selectedSites];
      newSelected.splice(index, 1);
      setSelectedSites(newSelected);
      setViewMode('monthly');
      setSelectedMonth(null);
    }
  };

  const handleDateChange = (type, value) => {
    const maxMonth = getMaxMonth();
    const newDate = new Date(value);
    const otherDate = type === 'start' ? new Date(endDate) : new Date(startDate);
    
    if (value > maxMonth) {
      alert("You cannot select a future month");
      return;
    }
    
    const diffMonths = (otherDate.getFullYear() - newDate.getFullYear()) * 12 + 
                      (otherDate.getMonth() - newDate.getMonth());
    
    if (Math.abs(diffMonths) > 6) {
      alert("The date range cannot exceed 6 months");
      return;
    }
    
    if (type === 'start' && newDate > otherDate) {
      alert("Start date must be before end date");
      return;
    }
    
    if (type === 'end' && newDate < otherDate) {
      alert("End date must be after start date");
      return;
    }
    
    if (type === 'start') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
    setViewMode('monthly');
    setSelectedMonth(null);
  };

  // Configuration des couleurs selon le thème
  const chartColors = theme === "light" 
    ? { 
        textColor: "#1e293b",
        gridColor: "rgba(203, 213, 225, 0.3)",
        totalTextColor: "#64748b",
        focusRingColor: "#17B3DE",
        spinnerColor: "#17B3DE"
      }
    : { 
        textColor: "#e5e7eb",
        gridColor: "rgba(55, 65, 81, 0.3)",
        totalTextColor: "#9ca3af",
        focusRingColor: "#4FC1E9",
        spinnerColor: "#4FC1E9"
      };

  return (
    <div className="card col-span-1 md:col-span-2 lg:col-span-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="card-header p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Enterprise Consumption</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {viewMode === 'monthly' ? (
              `${new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
              ${new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
            ) : (
              `Weekly view for ${selectedMonth}`
            )}
          </p>
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
          {/* Enterprise selector */}
          <div className="w-full">
            <select
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B3DE] dark:focus:ring-[#4FC1E9] text-sm text-gray-700 dark:text-gray-200"
              value={selectedEnterprise}
              onChange={handleEnterpriseChange}
            >
              {enterprises.map((enterprise) => (
                <option key={enterprise.idEntreprise} value={enterprise.idEntreprise}>
                  {enterprise.nom}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date pickers */}
          <div className="flex gap-2 items-center">
            <input
              type="month"
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B3DE] dark:focus:ring-[#4FC1E9] text-sm text-gray-700 dark:text-gray-200"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
              max={getMaxMonth()}
              disabled={viewMode === 'weekly'}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">to</span>
            <input
              type="month"
              className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B3DE] dark:focus:ring-[#4FC1E9] text-sm text-gray-700 dark:text-gray-200"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
              max={getMaxMonth()}
              disabled={viewMode === 'weekly'}
            />
          </div>
          
          {/* Site selectors */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="flex-1 min-w-0">
              <select 
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B3DE] dark:focus:ring-[#4FC1E9] text-sm text-gray-700 dark:text-gray-200"
                value={selectedSites[0] || ""}
                onChange={(e) => handleSiteChange(0, e.target.value)}
                disabled={!selectedEnterprise || sites.length === 0 || viewMode === 'weekly'}
              >
                {sites.length > 0 ? (
                  sites.map((site) => (
                    <option key={site.idSite} value={String(site.idSite)}>
                      {site.nom}
                    </option>
                  ))
                ) : (
                  <option value="">No sites available</option>
                )}
              </select>
            </div>
    
            {selectedSites.length > 1 && (
              <div className="flex-1 min-w-0 flex gap-2">
                <select 
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#17B3DE] dark:focus:ring-[#4FC1E9] text-sm text-gray-700 dark:text-gray-200"
                  value={selectedSites[1] || ""}
                  onChange={(e) => handleSiteChange(1, e.target.value)}
                  disabled={!selectedEnterprise || sites.length === 0 || viewMode === 'weekly'}
                >
                  {sites.filter(site => !selectedSites.includes(String(site.idSite))).map((site) => (
                    <option key={site.idSite} value={String(site.idSite)}>
                      {site.nom}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => removeSiteSelector(1)}
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-red-500"
                  aria-label="Remove site"
                  disabled={viewMode === 'weekly'}
                >
                  ×
                </button>
              </div>
            )}
          </div>
    
          {selectedSites.length < 2 && selectedSites.length < sites.length && viewMode === 'monthly' && (
            <button 
              onClick={addSiteSelector}
              className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 self-start"
              disabled={!selectedEnterprise || sites.length === 0}
            >
              + Add another site
            </button>
          )}
        </div>
      </div>
      
      <div className="card-body p-4 pt-0"> 
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
              style={{ 
                borderTopColor: chartColors.spinnerColor,
                borderBottomColor: chartColors.spinnerColor
              }}
            ></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64 text-red-500">
            {error}
          </div>
        ) : !selectedEnterprise ? (
          <div className="flex justify-center items-center h-64 text-gray-500">
            Please select an enterprise to view consumption data
          </div>
        ) : sites.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-gray-500">
            No sites available for selected enterprise
          </div>
        ) : (
          <>
            {viewMode === 'weekly' && (
              <div className="mb-4 flex justify-between items-center">
                <button 
                  onClick={handleBackToMonthly}
                  className="flex items-center text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  ← Back to monthly view
                </button>
                <h3 className="text-lg font-semibold">
                  {weeklyData.datasets[0].label}
                </h3>
                <div></div>
              </div>
            )}

            <div className="mb-4 flex flex-wrap gap-3">
              {selectedSites.map((siteId, index) => (
                <div key={index} className="flex-1 min-w-[180px]">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {(totalConsumptions[siteId] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh
                  </p>
                  <p className={`text-sm ${chartColors.totalTextColor}`}>
                    {sites.find(s => String(s.idSite) === String(siteId))?.nom || `Site ${siteId}`}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="h-72 relative">
              <Line
                ref={chartRef}
                data={viewMode === 'monthly' ? monthlyData : weeklyData}
                onClick={handleChartClick}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        color: chartColors.textColor,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20
                      }
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                      backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                      titleColor: theme === 'light' ? '#111827' : '#f3f4f6',
                      bodyColor: theme === 'light' ? '#374151' : '#d1d5db',
                      borderColor: theme === 'light' ? '#e5e7eb' : '#4b5563',
                      borderWidth: 1,
                      callbacks: {
                        label: (context) => {
                          const value = context.raw || 0;
                          const label = context.dataset.label.split('(')[0].trim();
                          return `${label}: ${value.toFixed(2)} kWh ($${(value * 0.2516).toFixed(2)})`;
                        },
                        afterLabel: (context) => {
                          if (viewMode === 'weekly' && weeklyData.weekDetails) {
                            return `Period: ${weeklyData.weekDetails[context.dataIndex].period}`;
                          }
                          return null;
                        }
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        color: chartColors.textColor,
                        maxRotation: viewMode === 'weekly' ? 45 : 0,
                        autoSkip: true,
                        maxTicksLimit: viewMode === 'weekly' ? 8 : 12
                      },
                    },
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: chartColors.gridColor,
                        drawBorder: false,
                      },
                      ticks: {
                        color: chartColors.textColor,
                        callback: (value) => `${value.toLocaleString('en-US')} kWh`,
                      },
                    },
                  },
                  elements: {
                    line: {
                      tension: 0.4,
                    },
                    point: {
                      hoverRadius: 8,
                    },
                  },
                  onClick: viewMode === 'monthly' ? handleChartClick : undefined,
                  interaction: {
                    mode: 'nearest',
                    intersect: true
                  }
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RealTimeConsumptionEntreprise;