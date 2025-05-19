import React, { useEffect, useState } from "react";
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
import { useTheme } from "../context/ThemeContext";

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

const MonthlyConsumption = ({ idUser }) => {
  const [data, setData] = useState({ labels: [], datasets: [] });
  const [residences, setResidences] = useState([]);
  const [selectedResidences, setSelectedResidences] = useState(["0"]);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [totalConsumptions, setTotalConsumptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  // New color palette
  const colors = {
    primary: "#2DBDAC",
    secondary: "#F36D8F",
    accent: "#17B3DE",
    dark: {
      background: "#1E293B",
      card: "#0F172A",
      text: "#E2E8F0",
      muted: "#94A3B8"
    },
    light: {
      background: "#FFFFFF",
      card: "#F8FAFC",
      text: "#1E293B",
      muted: "#64748B"
    }
  };

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

  useEffect(() => {
    const fetchResidences = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/user-sites/${idUser}`);
        setResidences(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des résidences:", error);
      }
    };

    fetchResidences();
  }, [idUser]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const displayMonths = generateDisplayMonths(startDate, endDate);
        const newDatasets = [];
        const newTotals = {};
        
        // Color sequence for datasets
        const colorSequence = [colors.primary, colors.secondary, colors.accent];
        
        for (const [index, residenceId] of selectedResidences.entries()) {
          const url = residenceId === "0"
            ? `http://localhost:8000/api/consumption/${idUser}?start=${startDate}&end=${endDate}`
            : `http://localhost:8000/Consommation/site/${residenceId}?start=${startDate}&end=${endDate}`;

          const response = await axios.get(url);
          const apiData = response.data.values || [];
          
          const values = apiData.length === displayMonths.length 
            ? apiData 
            : [...apiData, ...Array(Math.max(0, displayMonths.length - apiData.length)).fill(0)];

          const total = values.reduce((sum, val) => sum + val, 0);
          
          const residenceName = residenceId === "0" 
            ? "All Residences" 
            : residences.find(r => String(r.idSite) === String(residenceId))?.nom || `Residence ${residenceId}`;
          
          newTotals[residenceId] = total;
          
          const colorIndex = index % colorSequence.length;
          const mainColor = colorSequence[colorIndex];
          const isDark = theme === "dark";
          
          newDatasets.push({
            label: residenceName,
            data: values.slice(0, displayMonths.length),
            borderColor: mainColor,
            backgroundColor: isDark 
              ? `${mainColor}40` // 25% opacity in dark mode
              : `${mainColor}20`, // 12% opacity in light mode
            pointBackgroundColor: mainColor,
            pointBorderColor: isDark ? colors.dark.card : colors.light.card,
            fill: 'origin',
            tension: 0.4,
            pointHoverRadius: 6,
            pointRadius: 4,
            borderWidth: 2,
            pointHoverBorderWidth: 2
          });
        }
        
        setData({
          labels: displayMonths.map(m => m.withYear),
          datasets: newDatasets
        });
        setTotalConsumptions(newTotals);
      } catch (error) {
        console.error("Erreur API :", error);
        setError("Failed to load consumption data");
      } finally {
        setLoading(false);
      }
    };

    if (selectedResidences.length > 0 && residences.length > 0) {
      fetchData();
    }
  }, [idUser, selectedResidences, startDate, endDate, residences, theme]);

  const handleResidenceChange = (index, value) => {
    const newSelected = [...selectedResidences];
    
    if (value === "0") {
      setSelectedResidences(["0"]);
      return;
    }
    
    if (index >= newSelected.length) {
      if (newSelected.length >= 3) return; // Limit to 3 residences
      newSelected.push(value);
    } else {
      newSelected[index] = value;
      
      if (value === "0") {
        setSelectedResidences(["0"]);
        return;
      }
    }
    
    const uniqueSelected = [...new Set(newSelected)];
    
    if (uniqueSelected.includes("0") && uniqueSelected.length > 1) {
      setSelectedResidences(["0"]);
    } else {
      setSelectedResidences(uniqueSelected);
    }
  };

  const addResidenceSelector = () => {
    if (selectedResidences.length < 3 && !selectedResidences.includes("0")) {
      setSelectedResidences([...selectedResidences, residences[0]?.idSite || "0"]);
    }
  };

  const removeResidenceSelector = (index) => {
    if (selectedResidences.length > 1) {
      const newSelected = [...selectedResidences];
      newSelected.splice(index, 1);
      setSelectedResidences(newSelected);
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
      alert("The date range should not exceed 6 months");
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
  };

  const currentTheme = theme === "dark" ? colors.dark : colors.light;

  return (
    <div 
      className="rounded-xl shadow-lg overflow-hidden"
      style={{
        backgroundColor: currentTheme.card,
        border: `1px solid ${theme === 'dark' ? '#1E293B' : '#E2E8F0'}`
      }}
    >
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: currentTheme.text }}>
              Monthly Energy Consumption
            </h2>
            <p className="text-sm" style={{ color: currentTheme.muted }}>
              {new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - 
              {new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto">
            {/* Date pickers row */}
            <div className="flex gap-2 items-center">
              <input
                type="month"
                className="px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 text-sm transition-all"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`,
                  color: currentTheme.text,
                  focusRingColor: colors.primary,
                  outline: 'none'
                }}
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                max={getMaxMonth()}
              />
              <span className="text-sm" style={{ color: currentTheme.muted }}>to</span>
              <input
                type="month"
                className="px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 text-sm transition-all"
                style={{
                  backgroundColor: currentTheme.background,
                  border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`,
                  color: currentTheme.text,
                  focusRingColor: colors.primary,
                  outline: 'none'
                }}
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                max={getMaxMonth()}
              />
            </div>
          </div>
        </div>
        
        {/* Residence selectors */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {selectedResidences.map((residenceId, index) => (
              <div key={index} className="flex-1 min-w-0 flex gap-2 items-center">
                <select 
                  className="w-full px-3 py-2 rounded-lg shadow-sm focus:outline-none focus:ring-2 text-sm transition-all"
                  style={{
                    backgroundColor: currentTheme.background,
                    border: `1px solid ${theme === 'dark' ? '#334155' : '#CBD5E1'}`,
                    color: currentTheme.text,
                    focusRingColor: colors.primary
                  }}
                  value={residenceId}
                  onChange={(e) => handleResidenceChange(index, e.target.value)}
                >
                  <option value="0">All Residences</option>
                  {residences.map((residence) => (
                    <option key={residence.idSite} value={String(residence.idSite)}>
                      {residence.nom}
                    </option>
                  ))}
                </select>
                
                {selectedResidences.length > 1 && (
                  <button 
                    onClick={() => removeResidenceSelector(index)}
                    className="flex-shrink-0 p-2 rounded-full hover:bg-opacity-10 hover:bg-red-500 transition-colors"
                    style={{ color: colors.secondary }}
                    aria-label="Remove residence"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            
            {selectedResidences.length < 3 && !selectedResidences.includes("0") && (
              <button 
                onClick={addResidenceSelector}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: colors.primary,
                  backgroundColor: `${colors.primary}10`,
                  border: `1px dashed ${colors.primary}`
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add Residence
              </button>
            )}
          </div>
        </div>
        
        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {selectedResidences.map((residenceId, index) => {
            const colorIndex = index % 3;
            const bgColor = [colors.primary, colors.secondary, colors.accent][colorIndex];
            
            return (
              <div 
                key={index} 
                className="p-4 rounded-lg shadow transition-all hover:shadow-md"
                style={{
                  backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                  borderLeft: `4px solid ${bgColor}`
                }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: currentTheme.muted }}>
                  {residenceId === "0" ? "All Residences" : residences.find(r => String(r.idSite) === String(residenceId))?.nom || `Residence ${residenceId}`}
                </p>
                <p className="text-2xl font-bold" style={{ color: currentTheme.text }}>
                  {(totalConsumptions[residenceId] || 0).toLocaleString('en-US')} kWh
                </p>
                <p className="text-sm" style={{ color: currentTheme.muted }}>
                  ${((totalConsumptions[residenceId] || 0) * 0.2516).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Chart area */}
      <div className="px-6 pb-6 pt-2" style={{ height: '400px' }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div 
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" 
              style={{ 
                borderTopColor: colors.primary,
                borderBottomColor: `${colors.primary}30`
              }}
            ></div>
          </div>
        ) : error ? (
          <div 
            className="flex justify-center items-center h-full rounded-lg"
            style={{
              backgroundColor: `${colors.secondary}10`,
              border: `1px solid ${colors.secondary}30`,
              color: colors.secondary
            }}
          >
            <div className="text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          </div>
        ) : (
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: selectedResidences.length > 1,
                  position: 'top',
                  labels: {
                    color: currentTheme.text,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                      weight: '500'
                    }
                  }
                },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  backgroundColor: currentTheme.card,
                  titleColor: colors.primary,
                  bodyColor: currentTheme.text,
                  borderColor: theme === 'light' ? '#E2E8F0' : '#334155',
                  borderWidth: 1,
                  padding: 12,
                  boxPadding: 4,
                  usePointStyle: true,
                  callbacks: {
                    label: (context) => {
                      const value = context.raw || 0;
                      const label = context.dataset.label || '';
                      return `${label}: ${value.toLocaleString('en-US')} kWh ($${(value * 0.2516).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
                    },
                    labelColor: (context) => {
                      return {
                        borderColor: 'transparent',
                        backgroundColor: context.dataset.borderColor,
                        borderRadius: 4
                      };
                    }
                  },
                },
              },
              scales: {
                x: {
                  grid: {
                    display: false,
                    drawBorder: false
                  },
                  ticks: {
                    color: currentTheme.muted,
                    font: {
                      weight: '500'
                    }
                  },
                },
                y: {
                  beginAtZero: true,
                  grid: {
                    color: theme === 'dark' ? '#334155' : '#E2E8F0',
                    drawBorder: false,
                  },
                  ticks: {
                    color: currentTheme.muted,
                    callback: (value) => `${value.toLocaleString('en-US')} kWh`,
                    font: {
                      weight: '500'
                    }
                  },
                },
              },
              interaction: {
                intersect: false,
                mode: 'index'
              },
              elements: {
                line: {
                  tension: 0.4
                },
                point: {
                  hoverRadius: 8,
                  hoverBorderWidth: 2
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MonthlyConsumption;