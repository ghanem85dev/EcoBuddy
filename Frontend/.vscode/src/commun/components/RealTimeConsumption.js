import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from "chart.js";
import { useTheme } from "../context/ThemeContext";  // Import de useTheme

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const RealTimeConsumption = ({ idUser }) => {
  const [data, setData] = useState({ labels: [], values: [] });
  const { theme } = useTheme(); // Utilisation du thème actuel

  // Récupérer selectedResidence du localStorage
  const selectedResidence = localStorage.getItem("selectedResidence");
  console.log({ idUser, selectedResidence });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Déterminer l'URL selon la valeur de selectedResidence
        const url =
          selectedResidence === "0"
            ? `http://localhost:8000/api/consumption/${idUser}`
            : `http://localhost:8000/Consommation/site/${selectedResidence}`;

        const response = await axios.get(url);
        setData({
          labels: response.data.appareils,
          values: response.data.values,
        });
      } catch (error) {
        console.error("Erreur API :", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [idUser, selectedResidence]);

  // Définir les couleurs selon le thème
  const chartColors = theme === "light" 
    ? { borderColor: "#2563eb", backgroundColor: "rgba(37, 99, 235, 0.2)" }
    : { borderColor: "#9333ea", backgroundColor: "rgba(147, 51, 234, 0.2)" };

  return (
    <div className="card col-span-1 md:col-span-2 lg:col-span-4">
      <div className="card-header">
        <p className="card-title">Real-Time Consumption</p>
      </div>
      <div className="card-body p-0">
        <Line
          data={{
            labels: data.labels,
            datasets: [
              {
                label: "Consommation (kWh)",
                data: data.values,
                borderColor: chartColors.borderColor, // Appliquer la couleur du bord selon le thème
                backgroundColor: chartColors.backgroundColor, // Appliquer la couleur du fond selon le thème
                fill: true,
                tension: 0.4,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.raw} kWh`,
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  color: theme === "light" ? "#475569" : "#e5e7eb", // Définir les couleurs des ticks en fonction du thème
                },
                grid: {
                  display: false,
                },
              },
              y: {
                ticks: {
                  color: theme === "light" ? "#475569" : "#e5e7eb", // Définir les couleurs des ticks en fonction du thème
                  callback: (value) => `${value} kWh`,
                },
                grid: {
                  color: theme === "light" ? "rgba(148, 163, 184, 0.2)" : "rgba(55, 65, 81, 0.2)", // Ajuster la couleur du grid selon le thème
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default RealTimeConsumption;
