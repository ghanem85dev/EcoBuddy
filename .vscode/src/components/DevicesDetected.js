import React, { useEffect, useState } from "react";
import axios from "axios";

const DevicesDetected = () => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get("/api/devices");
        setDevices(response.data);
      } catch (error) {
        console.error("Erreur API :", error);
      }
    };

    fetchDevices();
  }, []);

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold">Appareils Détectés</h3>
      <ul>
        {devices.map((device, index) => (
          <li key={index} className="border-b py-2">
            {device.name} - {device.consumption} kWh
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DevicesDetected;