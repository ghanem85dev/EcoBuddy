import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import { format } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SitesByCategoryChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Nombre de sites',
      data: [],
      backgroundColor: '#2DBDAC',
      borderColor: '#2DBDAC',
      borderWidth: 0,
      borderRadius: 4, // Réduit le bord arrondi
    }]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/stats/categories', {
          
        });
        
        const categories = response.data;
        const labels = categories.map(item => item.categorie);
        const counts = categories.map(item => item.count);
        
        setChartData({
          labels,
          datasets: [{
            label: 'Nombre de sites',
            data: counts,
            backgroundColor: '#2DBDAC',
            borderColor: '#2DBDAC',
            borderWidth: 0,
            borderRadius: 2,
            categoryPercentage: 0.4, // Contrôle la largeur des barres par rapport à l'espace disponible
            barPercentage: 0.8,      // Contrôle la largeur des barres dans leur catégorie
          }]
        });
        setLoading(false);
      } catch (err) {
        console.error("Erreur API :", err);
        setError("Impossible de récupérer les statistiques par catégorie");
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#FFF',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
        callbacks: {
          label: function(context) {
            return `${context.raw} sites`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#F3F4F6",
          drawBorder: false,
        },
        ticks: {
          color: "#6B7280",
          precision: 0
        },
        title: {
          display: true,
          text: 'Nombre de sites',
          color: '#666',
          font: {
            weight: 'bold'
          }
        }
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "#6B7280"
        },
        title: {
          display: true,
          text: 'Catégories de sites',
          color: '#666',
          font: {
            weight: 'bold'
          }
        }
      }
    },
    // Ajustements pour des barres plus fines
    barThickness: 30, // Définit une épaisseur fixe pour les barres
    maxBarThickness: 32, // Épaisseur maximale
  };

  if (loading) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-10 text-gray-800 w-full">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-lg rounded-2xl p-10 text-gray-800 w-full">
        <div className="text-red-500 font-semibold text-center py-10">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-2xl p-10 text-gray-800 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Répartition des sites par catégorie</h2>
      </div>

      <div className="w-full h-[330px] mb-5">
        {chartData.labels && chartData.labels.length > 0 ? (
          <Bar 
            data={chartData} 
            options={options}
            height={330}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Aucune donnée à afficher pour cette période
          </div>
        )}
      </div>
    </div>
  );
};

export default SitesByCategoryChart;