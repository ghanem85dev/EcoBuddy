import React, { useEffect, useState } from "react";
import axios from "axios";

const DevicesDetected = ({ userId }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResidence, setSelectedResidence] = useState(localStorage.getItem('selectedResidence') || '0');

  // Fonction pour récupérer les appareils en fonction de selectedResidence
  const fetchDevices = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = selectedResidence === '0'
        ? `http://localhost:8000/appareils/user/${userId}`
        : `http://localhost:8000/appareils/${selectedResidence}`;
      const response = await axios.get(url);
      setDevices(response.data);
    } catch (error) {
      console.error("Erreur API :", error);
      setError("Erreur lors de la récupération des appareils.");
    } finally {
      setLoading(false);
    }
  };

  // Écouter les changements dans localStorage (depuis un autre onglet)
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'selectedResidence') {
        const newResidence = event.newValue || '0';
        if (newResidence !== selectedResidence) {
          setSelectedResidence(newResidence);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedResidence]);

  // Surveiller les changements de selectedResidence dans le même onglet
  useEffect(() => {
    const interval = setInterval(() => {
      const newResidence = localStorage.getItem('selectedResidence') || '0';
      if (newResidence !== selectedResidence) {
        setSelectedResidence(newResidence);
      }
    }, 1000); // Vérifie toutes les secondes

    return () => clearInterval(interval); // Nettoyer l'intervalle
  }, [selectedResidence]);

  // Effectuer le fetch lorsque userId ou selectedResidence changent
  useEffect(() => {
    if (!userId) {
      console.log("userId est undefined ou null !");
      return;
    }

    fetchDevices();
  }, [userId, selectedResidence]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <ul>
        {devices.length > 0 ? (
          devices.map((device, index) => (
            <li key={index} className="border-b py-2">
              <span className="font-medium">{device.nom}</span> - 
              <span className="text-gray-600"> {device.puissance} W</span>
            </li>
          ))
        ) : (
          <li>Aucun appareil détecté.</li>
        )}
      </ul>
    </div>
  );
};

export default DevicesDetected;