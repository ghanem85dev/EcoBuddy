import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend } from "chart.js";

// Register the necessary components for chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,  // Register PointElement for displaying points on the line chart
  Title,
  Tooltip,
  Legend
);
const RealTimeConsumption = () => {
  const [data, setData] = useState({
    labels: [],
    values: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/consumption");
        setData({
          labels: response.data.timestamps,
          values: response.data.values,
        });
      } catch (error) {
        console.error("Erreur API :", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold">Consommation en Temps Réel</h3>
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
