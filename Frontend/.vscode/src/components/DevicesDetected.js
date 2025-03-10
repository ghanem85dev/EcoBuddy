import React, { useEffect, useState } from "react";
import axios from "axios";

const DevicesDetected = ({ userId }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResidence, setSelectedResidence] = useState(localStorage.getItem("selectedResidence") || "0");

  const fetchDevices = async (residenceId) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const url = residenceId === "0"
        ? `http://localhost:8000/appareils/user/${userId}`
        : `http://localhost:8000/appareils/${residenceId}`;
      
      const response = await axios.get(url);
      setDevices(response.data);
    } catch (error) {
      console.error("Erreur API :", error);
      setError("Erreur lors de la récupération des appareils.");
    } finally {
      setLoading(false);
    }
  };

  // Gestion centralisée des mises à jour
  useEffect(() => {
    const checkResidenceChange = () => {
      const newResidence = localStorage.getItem("selectedResidence") || "0";
      if (newResidence !== selectedResidence) {
        setSelectedResidence(newResidence);
        fetchDevices(newResidence); // Rafraîchir immédiatement
      }
    };

    // Vérifie les changements toutes les 500ms et à l'événement storage
    const interval = setInterval(checkResidenceChange, 500);
    window.addEventListener("storage", checkResidenceChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", checkResidenceChange);
    };
  }, [selectedResidence, userId]);

  // Rafraîchissement périodique des données
  useEffect(() => {
    const interval = setInterval(() => fetchDevices(selectedResidence), 5000);
    return () => clearInterval(interval);
  }, [selectedResidence, userId]);

  if (loading) return <div className="text-blue-700 font-semibold">Chargement...</div>;
  if (error) return <div className="text-red-500 font-semibold">{error}</div>;

  return (
    <div className="card">
      <div className="card-header">
        <p className="card-title">Appareils Détectés</p>
      </div>
      <div className="card-body p-0">
        <div className="relative h-[500px] w-full flex-shrink-0 overflow-auto rounded-none [scrollbar-width:_thin]">
          <table className="table">
            <thead className="table-header">
              <tr className="table-row">
                <th className="table-head">#</th>
                <th className="table-head">Nom</th>
                <th className="table-head">Puissance (W)</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {devices.length > 0 ? (
                devices.map((device, index) => (
                  <tr key={device.id || index} className="table-row">
                    <td className="table-cell">{index + 1}</td>
                    <td className="table-cell">{device.nom}</td>
                    <td className="table-cell">{device.puissance} W</td>
                    <td className="table-cell">
                      <div className="flex items-center gap-x-4">
                        {/* Actions */}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="table-row">
                  <td colSpan="4" className="table-cell text-center text-gray-500">
                    Aucun appareil détecté.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DevicesDetected;