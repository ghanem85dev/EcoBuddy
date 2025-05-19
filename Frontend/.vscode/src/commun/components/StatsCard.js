import React, { useState, useEffect } from 'react';
import { Info, ArrowUp, ArrowDown } from 'react-feather';
import { TbHome, TbDeviceAnalytics } from "react-icons/tb";
import { PiBuilding } from "react-icons/pi";
import { useNavigate } from "react-router-dom";

const StatsCard = ({ idUser, type = "customers", role }) => {
  const [total, setTotal] = useState(0);
  const [percentageIncrease, setPercentageIncrease] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getConfig = () => {
    switch (type.toLowerCase()) {
      // Anciens types
      case 'appareil':
      case 'appareils':
        return {
          title: 'Total appareils',
          endpoint: `http://localhost:8000/totalAppareils/${idUser}`,
          icon: <TbDeviceAnalytics className="text-white" />,
          path: "/particulier/appareils"
        };
      case 'entreprise':
      case 'entreprises':
        return {
          title: 'Total entreprises',
          endpoint: `http://localhost:8000/entreprises/totalEntreprises/${idUser}`,
          icon: <PiBuilding className="text-white" />,
          path: "/entreprises"
        };
      case 'site':
      case 'sites':
        return {
          title: 'Total sites',
          endpoint: `http://localhost:8000/totalSites/${idUser}`,
          icon: <TbHome className="text-white" />,
          path: "/particulier/sites"
        };
      
      // Nouveaux types
      case 'demande residence':
      case 'residences':
        return {
          title: 'Dem. résidences',
          endpoint: `http://localhost:8000/stats/pending/residences`,
          icon: <TbHome className="text-white" />,
          path: "/stats/pending/residences"
        };
      case 'demande local':
      case 'locaux':
        return {
          title: 'Dem. locaux',
          endpoint: `http://localhost:8000/stats/pending/sites`,
          icon: <PiBuilding className="text-white" />,
          path: "/stats/pending/sites"
        };
      case 'demande entreprise':
      case 'demandes entreprises':
        return {
          title: 'Dem. entreprises',
          endpoint: `http://localhost:8000/entreprises/stats/pending`,
          icon: <TbDeviceAnalytics className="text-white" />,
          path: "/entreprises/stats/pending"
        };
      default:
        return {
          title: 'Total',
          endpoint: `http://localhost:8000/total/${idUser}`,
          icon: <TbDeviceAnalytics className="text-white" />,
          path: "/"
        };
    }
  };

  const { title, endpoint, icon, path } = getConfig();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        const data = await response.json();
        setTotal(data.total || 0);
        setPercentageIncrease(data.percentageIncrease || 0);
      } catch (err) {
        setError(err.message);
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [idUser, endpoint]);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] w-40">
        <div className="animate-pulse">
          <div className="h-10 w-10 bg-gray-100 rounded-lg dark:bg-gray-800"></div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-3/4 bg-gray-100 rounded"></div>
            <div className="h-5 w-1/2 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] w-40 text-red-500 text-xs">
        Erreur: {error}
      </div>
    );
  }

  const isPositive = percentageIncrease >= 0;
  const ArrowIcon = isPositive ? ArrowUp : ArrowDown;
  const handleNavigation = () => {
    navigate(path);
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] ${role === 'entreprise' ? 'w-[28rem]' : 'w-64'} h-32 flex items-center`}>
      {/* Icône avec fond noir et icône blanche */}
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-2 flex items-center justify-center ${role === 'entreprise' ? 'mr-8 ml-4' : 'mr-4'}`}>
        <div className="text-black dark:text-black" style={{ fontSize: '40px', color: 'black' }}>
          {React.cloneElement(icon, { color: 'black' })}
        </div>
      </div>

      {/* Contenu textuel centré */}
      <div className={`flex flex-col justify-center ${role === 'entreprise' ? 'ml-8' : ''}`}>
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
          {title}
        </span>
        <div className={`${role === 'entreprise' ? 'pl-12' : 'pl-8'}`}>
          <h4 className="font-extrabold text-gray-800 text-2xl dark:text-white mb-2">
            {total.toLocaleString()}
          </h4>
        </div>
        <div className={`${role === 'entreprise' ? 'pl-6' : 'pl-2'}`}>
          <button
            className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium bg-[#F36D8F] text-white hover:bg-gray-300 focus:outline-none transition-colors duration-200 w-20"
            onClick={handleNavigation}
          >
            <span className="flex items-center">
              Détails
              <Info className="size-3 ml-1" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;