import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const MonthlyConsumptionIndicator = ({ idUser }) => {
  const [maxConsumption, setMaxConsumption] = useState(20000); // 20k par défaut
  const [currentConsumption, setCurrentConsumption] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    const fetchConsumptionData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/consumption/${idUser}/current`);
        
        setMaxConsumption(response.data.max_consumption);
        setCurrentConsumption(response.data.current_consumption);
        
        const calculatedPercentage = (response.data.current_consumption / response.data.max_consumption) * 100;
        setPercentage(calculatedPercentage.toFixed(2));
        
        setLoading(false);
      } catch (err) {
        setError("Erreur lors du chargement des données");
        setLoading(false);
      }
    }

    fetchConsumptionData();
    const interval = setInterval(fetchConsumptionData, 60000); // Rafraîchissement toutes les minutes

    return () => clearInterval(interval);
  }, [idUser]);

  if (loading) return <div className="text-center py-8">Chargement en cours...</div>;
  if (error) return <div className="text-center text-red-500 py-8">{error}</div>;

  const formatNumber = (num) => {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 0
    }).format(num)} kWh`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-8 w-full h-auto min-h-[90px] flex flex-col">
      <div className="text-center mb-1">
        <h2 className="text-2xl font-bold text-[#2DBDAC] mb-1">Objectif Mensuel</h2>
        <p className="text-md text-gray-500">Objectif fixé pour chaque mois</p>
      </div>
      
      <div className="flex-grow flex flex-col justify-between">
        {/* Section du graphique circulaire */}
        <div className="flex justify-center my-7">
          <div style={{ width: 160, height: 160 }}>
            <CircularProgressbar
              value={percentage}
              text={`${percentage}%`}
              styles={buildStyles({
                pathColor: percentage > 75 ? '#0D6B8F' : '#17B3DE', // Bleu foncé si >75%, bleu clair sinon
                textColor: '#111827',
                trailColor: '#E5E7EB',
                textSize: '24px',
                pathTransitionDuration: 0.5,
              })}
            />
          </div>
        </div>

        {/* Date actuelle */}
        <div className="text-center mb-2">
          <span className="text-sm text-[#F36D8F]">
            {new Intl.DateTimeFormat('fr-FR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }).format(new Date())}
          </span>
        </div>
        
        {/* Message d'état */}
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <p className="text-md text-gray-700 leading-relaxed">
            Vous avez consommé <strong>{formatNumber(currentConsumption)}</strong> ce mois-ci.
            <br />
            {percentage > 100 && (
              <span className="block mt-2 text-red-600 font-medium">
                C'est <strong>au-dessus</strong> de votre objectif. Réduisez votre consommation !
              </span>
            )}
            {percentage > 75 && percentage <= 100 && (
              <span className="block mt-2 text-[#0D6B8F] font-medium"> {/* Utilisation du bleu foncé */}
                Vous vous approchez de votre objectif. Pensez à optimiser votre consommation.
              </span>
            )}
            {percentage <= 75 && (
              <span className="block mt-2 text-[#17B3DE] font-medium"> {/* Utilisation du bleu clair */}
                C'est <strong>en dessous</strong> de votre objectif. Continuez comme ça !
              </span>
            )}
          </p>
        </div>
        
        {/* Comparaison actuel/objectif */}
        <div className="flex justify-between w-full bg-gray-50 rounded-lg p-2">
          <div className="text-center">
            <p className="text-xs text-[#F36D8F]">Actuel</p>
            <p className="text-lg font-bold text-gray-800">{formatNumber(currentConsumption)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#F36D8F]">Objectif</p>
            <p className="text-lg font-bold text-gray-800">{formatNumber(maxConsumption)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyConsumptionIndicator;