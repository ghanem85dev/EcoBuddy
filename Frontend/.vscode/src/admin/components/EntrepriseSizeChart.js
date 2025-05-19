import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

ChartJS.register(ArcElement, Tooltip, Legend);

const EntrepriseSizeChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      borderColor: '#fff',
      borderWidth: 1,
    }]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEntreprises, setTotalEntreprises] = useState(0);

  // Palette de couleurs harmonieuse
  const colorPalette = [
    '#2DBDAC', // Teal
    '#17B3DE', // Blue
    'rgba(243, 109, 143, 0.7)', // Pink
    '#FFA630', // Orange
    '#A7E0E0', // Purple
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:8000/entreprises/stats/taille');
        
        const sizes = response.data;
        const total = sizes.reduce((sum, item) => sum + item.count, 0);
        
        setChartData({
          labels: sizes.map(item => item.taille),
          datasets: [{
            data: sizes.map(item => item.count),
            backgroundColor: colorPalette.slice(0, sizes.length),
            borderColor: '#fff',
            borderWidth: 1,
          }]
        });
        
        setTotalEntreprises(total);
        setLoading(false);
      } catch (err) {
        console.error("Erreur API :", err);
        setError("Impossible de récupérer les statistiques par taille");
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
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter, sans-serif',
            size: 12
          }
        }
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
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = Math.round((value / totalEntreprises) * 100);
            return `${label}: ${value} entreprises (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-red-500 font-semibold text-center py-10">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Répartition par taille d'entreprise</h2>
          <p className="text-sm text-gray-500">Nombre d'entreprises selon leur taille</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <span className="text-sm text-gray-500">Total:</span>
          <span className="font-semibold">{totalEntreprises} entreprises</span>
        </div>
      </div>

      {/* Graphique seul en haut */}
      <div className="w-full h-64 mb-8">
        <Doughnut data={chartData} options={options} />
      </div>
      
      {/* Tableau en dessous */}
      <div className="w-full">
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taille</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pourcentage</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chartData.labels.map((label, index) => {
                const count = chartData.datasets[0].data[index];
                const percentage = Math.round((count / totalEntreprises) * 100);
                const color = chartData.datasets[0].backgroundColor[index];
                
                return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
                        <div className="ml-2 text-sm font-medium text-gray-900">{label}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{percentage}%</td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{totalEntreprises}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EntrepriseSizeChart;