import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const RealTimeConsumption = ({ idUser }) => {
  const [data, setData] = useState({
    labels: [],
    values: [],
  });

  // Récupérer selectedResidence du localStorage
  const selectedResidence = localStorage.getItem('selectedResidence');
  console.log({ idUser, selectedResidence });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Déterminer l'URL selon la valeur de selectedResidence
        const url = selectedResidence === '0'
          ? `http://localhost:8000/api/consumption/${idUser}`
          : `http://localhost:8000/Consommation/site/${selectedResidence}`;
        
        const response = await axios.get(url);  // Appeler l'API avec l'URL dynamique
        setData({
          labels: response.data.appareils,
          values: response.data.values,
        });
        console.log(response.data.appareils);
      } catch (error) {
        console.error("Erreur API :", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [idUser, selectedResidence]);  // Ajout de selectedResidence aux dépendances

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <Line
        data={{
          labels: data.labels,
          datasets: [
            {
              label: "Consommation (kWh)",
              data: data.values,
              borderColor: "blue",
              fill: false,
            },
          ],
        }}
      />
    </div>
  );
};

export default RealTimeConsumption;
