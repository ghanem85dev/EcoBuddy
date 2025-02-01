import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const RealTimeConsumption = () => {
  const [consumptionData, setConsumptionData] = useState({
    labels: ["12:00", "12:15", "12:30", "12:45", "13:00"],
    data: [5, 6, 4, 8, 7],
  });

  const [keyIndicators, setKeyIndicators] = useState({
    consumedKwh: "--",
    estimatedCost: "--",
  });

  useEffect(() => {
    // Simule la récupération des données d'une API
    setKeyIndicators({
      consumedKwh: 25.6,
      estimatedCost: 3.45,
    });
  }, []);

  const chartData = {
    labels: consumptionData.labels,
    datasets: [
      {
        label: "Consommation (kWh)",
        data: consumptionData.data,
        borderColor: "blue",
        backgroundColor: "rgba(0, 0, 255, 0.2)", // Pour un effet plus visible
        fill: true, // Remplissage sous la ligne
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Consommation d'énergie en temps réel",
      },
      legend: {
        display: true,
      },
    },
    scales: {
      x: { title: { display: true, text: "Temps" } },
      y: { title: { display: true, text: "kWh" } },
    },
  };

  return (
    <section className="real-time-consumption">
      <h2>Consommation en temps réel</h2>
      <Line data={chartData} options={chartOptions} />
      <div className="key-indicators">
        <p><strong>kWh consommés :</strong> {keyIndicators.consumedKwh}</p>
        <p><strong>Coût estimé :</strong> {keyIndicators.estimatedCost} €</p>
      </div>
    </section>
  );
};

export default RealTimeConsumption;
