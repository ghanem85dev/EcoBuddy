import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { TbHome, TbClock, TbCheck, TbX } from "react-icons/tb";
import { PiBuilding } from "react-icons/pi";

const ApprobationStatsCard = ({ type = "residences" }) => {
  const [stats, setStats] = useState({
    total: 0,
    en_attente: 0,
    approuvees: 0,
    rejetees: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Configuration en fonction du type
  const getConfig = () => {
    switch (type.toLowerCase()) {
      case 'local':
      case 'locaux':
        return {
          title: 'Locaux',
          endpoint: 'http://localhost:8000/stats/locaux',
          icon: <PiBuilding size={24} />,
          color: '#D3D3D3'
        };
      case 'entreprise':
      case 'entreprises':
        return {
          title: 'Entreprises',
          endpoint: 'http://localhost:8000/entreprises/stats/approbation',
          icon: <PiBuilding size={24} />,
          color: '#D3D3D3'
        };
      case 'residence':
      case 'residences':
      default:
        return {
          title: 'Résidences',
          endpoint: 'http://localhost:8000/stats/residences',
          icon: <TbHome size={24} />,
          color: '#D3D3D3'
        };
    }
  };

  const { title, endpoint, icon, color } = getConfig();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des statistiques');
        }
        const data = await response.json();
        console.log(data)
        setStats(data);
      } catch (err) {
        setError(err.message);
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [type, endpoint]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 w-full text-red-500">
        Erreur: {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden w-full">
      {/* En-tête de la carte */}
      <div className={`px-6 py-4 ${color} flex items-center`}>
        <div className="mr-3">
          {React.cloneElement(icon, { className: "text-current" })}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      {/* Contenu principal */}
      <div className="p-6">
        {/* Total */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total</span>
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
        </div>

        {/* Stats détaillées */}
        <div className="grid grid-cols-3 gap-4">
          {/* En attente */}
          <StatItem 
            icon={<TbClock className="text-yellow-500" />}
            label="En attente"
            value={stats.en_attente}
            bgColor="bg-yellow-50"
          />

          {/* Approuvées */}
          <StatItem 
            icon={<TbCheck className="text-green-500" />}
            label="Approuvées"
            value={stats.approuvees}
            bgColor="bg-green-50"
          />

          {/* Rejetées */}
          <StatItem 
            icon={<TbX className="text-red-500" />}
            label="Rejetées"
            value={stats.rejetees}
            bgColor="bg-red-50"
          />
        </div>
      </div>
    </div>
  );
};

// Composant pour chaque item de statistique
const StatItem = ({ icon, label, value, bgColor }) => {
  return (
    <div className={`p-4 rounded-lg ${bgColor}`}>
      <div className="flex items-center mb-2">
        <div className="mr-2">
          {icon}
        </div>
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
};

export default ApprobationStatsCard;