import React, { useEffect, useState } from "react";
import axios from "axios";

const DevicesDetected = ({ userId }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResidence, setSelectedResidence] = useState(localStorage.getItem('selectedResidence') || '0');

  const fetchDevices = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching devices for user:", userId, "Residence:", selectedResidence);
      const url = selectedResidence === '0'
        ? `http://localhost:8000/appareils/user/${userId}`
        : `http://localhost:8000/appareils/${selectedResidence}`;
      const response = await axios.get(url);
      console.log("API Response:", response.data);
      setDevices(response.data);
    } catch (error) {
      console.error("Erreur API :", error.response ? error.response.data : error.message);
      setError("Erreur lors de la récupération des appareils.");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    const newResidence = localStorage.getItem('selectedResidence') || '0';
    if (newResidence !== selectedResidence) {
      setSelectedResidence(newResidence);
    }
  }, [selectedResidence]);

  useEffect(() => {
    if (!userId) {
      console.log("userId est undefined ou null !");
      return;
    }

    fetchDevices();
  }, [userId, selectedResidence]);

  if (loading) {
    return <div className="text-blue-700 font-semibold">Chargement...</div>;
  }

  if (error) {
    return <div className="text-red-500 font-semibold">{error}</div>;
  }

  return (
    <div className="bg-gradient-to-r from-blue-800 to-blue-400 p-6 shadow-xl rounded-3xl text-white border border-gray-300">
      <h2 className="text-lg font-semibold mb-4">Appareils Détectés</h2>
      <ul>
        {devices.length > 0 ? (
          devices.map((device, index) => (
            <li key={index} className="border-b border-blue-300 py-2 flex justify-between">
              <span className="font-medium">{device.nom}</span> 
              <span className="text-blue-200">{device.puissance} W</span>
            </li>
          ))
        ) : (
          <li className="text-blue-200">Aucun appareil détecté.</li>
        )}
      </ul>
    </div>
  );
};

export default DevicesDetected;
