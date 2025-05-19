import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { AuthContext } from "../../commun/context/AuthContext";
import { motion } from "framer-motion";

ChartJS.register(ArcElement, Tooltip, Legend);

const UsersByRoleChart = () => {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const { idUser } = useContext(AuthContext);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('http://localhost:8000/users/count-by-role');
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Format de données invalide");
      }

      setUsersData(response.data);
    } catch (error) {
      console.error("Erreur:", error);
      setError(error.response?.data?.detail || error.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  // Palette de couleurs harmonieuse
  const colorPalette = [
    '#2DBDAC', // Teal
    
    '#A7E0E0', // Pink
    '#17B3DE', // Blue
    '#FFA630', // Orange
    '#A78BFA', // Purple
    '#93E1F0', // Light Blue
    '#12769E', // Dark Blue
  ];

  const data = {
    labels: usersData.map(item => item.role),
    datasets: [{
      label: 'Nombre d\'utilisateurs',
      data: usersData.map(item => item.count),
      backgroundColor: colorPalette,
      borderColor: '#fff',
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverOffset: 10,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'right', 
        labels: { 
          color: '#4B5563',
          font: { 
            family: 'Inter, sans-serif',
            size: 12,
            weight: '500'
          },
          padding: 20,
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
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} utilisateurs (${percentage}%)`;
          }
        }
      },
    },
    onClick: (_, elements) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        setHoveredItem(index);
      }
    },
  };

  if (loading) return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center items-center h-64"
    >
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
    </motion.div>
  );

  if (error) return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-6 rounded-lg shadow-lg"
    >
      <div className="text-red-500 font-semibold text-center py-10">{error}</div>
    </motion.div>
  );

  const totalUsers = usersData.reduce((acc, item) => acc + item.count, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-lg rounded-xl overflow-hidden p-6"
    >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Répartition des utilisateurs par rôle</h2>
          <p className="text-sm text-gray-500">Nombre d'utilisateurs selon leur rôle dans l'application</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <span className="text-sm text-gray-500">Total:</span>
          <span className="font-semibold">{totalUsers} utilisateurs</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Graphique - prend toute la largeur sur mobile, 1/2 sur desktop */}
        <div className="w-full lg:w-1/2 h-80 relative">
          <Pie data={data} options={options} />
        </div>

        {/* Tableau - prend toute la largeur sur mobile, 1/2 sur desktop */}
        <div className="w-full lg:w-1/2">
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pourcentage</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersData.map((item, index) => {
                  const percentage = Math.round((item.count / totalUsers) * 100);
                  const isHovered = hoveredItem === index || hoveredItem === null;
                  const color = colorPalette[index % colorPalette.length];
                  
                  return (
                    <motion.tr 
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: isHovered ? 1 : 0.6,
                        backgroundColor: isHovered ? '#f9fafb' : '#fff'
                      }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setHoveredItem(index)}
                      onMouseLeave={() => setHoveredItem(null)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-3 w-3 rounded-full" style={{ backgroundColor: color }}></div>
                          <div className="ml-2 text-sm font-medium text-gray-900">{item.role}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">{percentage}%</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: color
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{totalUsers}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UsersByRoleChart;