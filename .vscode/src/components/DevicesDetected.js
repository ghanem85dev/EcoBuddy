import React, { useEffect, useState } from "react";

const DevicesDetected = () => {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    // Simulate fetching data from an API
    setDevices([
      { name: "Frigo", consumption: "1.2", lastActivity: "Il y a 2 heures" },
      { name: "Lave-linge", consumption: "0.8", lastActivity: "Il y a 1 heure" },
    ]);
  }, []);

  return (
    <section className="devices-detected">
      <h2>Appareils détectés</h2>
      <table>
        <thead>
          <tr>
            <th>Appareil</th>
            <th>Consommation (kWh)</th>
            <th>Dernière activité</th>
          </tr>
        </thead>
        <tbody>
          {devices.length > 0 ? (
            devices.map((device, index) => (
              <tr key={index}>
                <td>{device.name}</td>
                <td>{device.consumption}</td>
                <td>{device.lastActivity}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">Aucun appareil détecté</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
};

export default DevicesDetected;