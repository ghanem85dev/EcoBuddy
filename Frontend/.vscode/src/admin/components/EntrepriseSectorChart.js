import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EntrepriseSectorChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Nombre d\'entreprises',
        data: [],
        backgroundColor: 'rgba(45, 189, 172, 0.7)',
        borderColor: 'rgba(45, 189, 172, 1)',
        borderWidth: 1,
      },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/entreprises/by-sector`);
      
      const data = response.data;
      const labels = data.map(item => item.sector_name);
      const counts = data.map(item => item.entreprise_count);
      
      setChartData({
        labels,
        datasets: [
          {
            ...chartData.datasets[0],
            data: counts,
          },
        ],
      });
      setLoading(false);
    } catch (err) {
      console.error("Erreur API :", err);
      setError("Impossible de récupérer les données des entreprises par secteur.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Palette de couleurs harmonieuse
  const colorPalette = [
    'rgba(45, 189, 172, 0.7)',  // Teal
    'rgba(243, 109, 143, 0.7)', // Pink
    'rgba(23, 179, 222, 0.7)',  // Blue
    '#a8a7a7',  // Orange
    '#A7E0E0', // Purple
  ];

  const hoverColorPalette = [
    'rgba(45, 189, 172, 1)',
    'rgba(243, 109, 143, 1)',
    'rgba(23, 179, 222, 1)',
    '#a8a7a7',
    '#A7E0E0',
  ];

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        ...chartData.datasets[0],
        backgroundColor: colorPalette,
        hoverBackgroundColor: hoverColorPalette,
        borderColor: 'transparent',
        borderWidth: 0,
        borderRadius: 6,
        barThickness: 30,
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#FFF",
        titleColor: "#111827",
        bodyColor: "#4B5563",
        borderColor: "#E5E7EB",
        borderWidth: 1,
        padding: 12,
        boxShadow: "0px 2px 10px rgba(0,0,0,0.1)",
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw} entreprises`;
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
          precision: 0
        }
      },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Répartition des entreprises par secteur</h2>
            <p className="text-sm text-gray-500">Nombre d'entreprises selon leur secteur d'activité</p>
          </div>
          
         
        </div>

        <div className="w-full h-80">
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default EntrepriseSectorChart;