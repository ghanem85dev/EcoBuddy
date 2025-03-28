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

  // Préparation des données pour le graphique
  const roles = usersData.map(item => item.role);
  const counts = usersData.map(item => item.count);
  
  const colorPalette = [
    "#001952", "#043775", "#0078B8", "#00B6DA", "#93E1F0", 
    "#12769E", "#1E40AF"
  ];

  const data = {
    labels: roles,
    datasets: [{
      label: 'Nombre d\'utilisateurs',
      data: counts,
      backgroundColor: colorPalette,
      borderColor: "#1E3A8A",
      borderWidth: 1,
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { 
        position: 'top', 
        labels: { 
          color: '#1E3A8A',
          font: { weight: 'bold' }
        } 
      },
      tooltip: { 
        backgroundColor: "#0078B8", 
        titleColor: "#FFF", 
        bodyColor: "#FFF",
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
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-blue-600 font-semibold">Chargement en cours...</div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-red-500 font-semibold">{error}</div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl rounded-2xl p-6 border border-blue-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-blue-900">Répartition des utilisateurs par rôle</h2>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Graphique */}
        <div className="flex-1 bg-white p-4 rounded-xl shadow-md border border-blue-100">
          <div style={{ position: 'relative', height: '350px', width: '100%' }}>
            <Pie 
              data={data} 
              options={{
                ...options,
                maintainAspectRatio: false,
                responsive: true
              }} 
            />
          </div>
        </div>

        {/* Tableau */}
        <div className="flex-1 bg-white p-4 rounded-xl shadow-md border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Détails par rôle</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0078B8] text-white">
                <tr>
                  <th className="p-3 font-semibold rounded-tl-lg">Rôle</th>
                  <th className="p-3 font-semibold rounded-tr-lg">Nombre d'utilisateurs</th>
                </tr>
              </thead>
              <tbody>
                {usersData.map((item, index) => {
                  const total = usersData.reduce((acc, item) => acc + item.count, 0);
                  const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                  
                  return (
                    <tr key={index} className={`border-b border-blue-100 ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'}`}>
                      <td className="p-3 text-blue-900">{item.role}</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <span className="font-bold text-blue-700 mr-2">{item.count} utilisateurs</span>
                          <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {usersData.length > 0 && (
                  <tr className="bg-[#0078B8] text-white font-bold">
                    <td className="p-3 rounded-bl-lg">Total</td>
                    <td className="p-3 rounded-br-lg">
                      {usersData.reduce((acc, item) => acc + item.count, 0)} utilisateurs
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsersByRoleChart;