import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext"; // Importer le hook pour obtenir le thème

const ComparisonRange = ({ userId }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState(null);
  const [consumptionData, setConsumptionData] = useState(null);

  const selectedResidence = localStorage.getItem("selectedResidence") || "0"; // Récupération de la résidence

  const { theme } = useTheme(); // Utilisation du thème actuel

  // Définir les couleurs en fonction du thème
  const backgroundColor = theme === "light" ? "bg-white" : "bg-[#1a2e45]"; // Fond général
  const textColor = theme === "light" ? "text-gray-800" : "text-white"; // Couleur du texte
  const inputBgColor = theme === "light" ? "bg-gray-100" : "bg-[#0F172A]"; // Couleur de fond des inputs
  const inputTextColor = theme === "light" ? "text-gray-800" : "text-white"; // Couleur du texte des inputs
  const borderColor = theme === "light" ? "border-blue-500" : "border-blue-600"; // Couleur des bordures
  const focusRingColor = theme === "light" ? "focus:ring-blue-300" : "focus:ring-blue-500"; // Couleur de la bague de focus

  const getFirstDayOfPreviousMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    date.setDate(1);
    return date.toISOString().split("T")[0];
  };

  const getTodayDate = () => {
    const date = new Date();
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    setStartDate(getFirstDayOfPreviousMonth());
    setEndDate(getTodayDate());
  }, []);

  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);

  const fetchComparisonData = async () => {
    if (!startDate || !endDate) {
      setError("Veuillez sélectionner une date de début et de fin.");
      return;
    }

    try {
      let url = "";
      if (selectedResidence === "0") {
        // Si aucune résidence spécifique sélectionnée → consommation totale
        url = `http://localhost:8000/Comparison/total/${userId}`;
      } else {
        // Si une résidence est sélectionnée → consommation pour ce site
        url = `http://localhost:8000/Comparison/range/${userId}/${selectedResidence}`;
      }

      const response = await axios.get(url, {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      if (response.data && Object.keys(response.data).length > 0) {
        setConsumptionData(response.data);
        setError(null);
      } else {
        setConsumptionData(null);
        setError("Aucune donnée disponible pour cette période.");
      }
    } catch (err) {
      setError("Erreur lors de la récupération des données. Veuillez réessayer.");
      console.error("API Error:", err);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [startDate, endDate, selectedResidence]);

  return (
    <div className={`${backgroundColor} ${textColor} p-6 rounded-2xl shadow-lg`}>
      <h2 className="text-xl font-semibold text-blue-300 mb-4">
        Comparaison de Consommation sur une Période
      </h2>
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex flex-col">
          <label className="text-blue-200">Date de début :</label>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className={`${inputBgColor} ${inputTextColor} p-2 rounded-md border ${borderColor} focus:outline-none ${focusRingColor}`}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-blue-200">Date de fin :</label>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className={`${inputBgColor} ${inputTextColor} p-2 rounded-md border ${borderColor} focus:outline-none ${focusRingColor}`}
          />
        </div>
      </div>
      {error && <div className="text-red-500 font-semibold">{error}</div>}

      {consumptionData && (
        <div className={`${inputBgColor} p-4 rounded-md mt-4 border ${borderColor}`}>
          <h3 className="text-lg font-semibold text-blue-300">Résultats :</h3>
          {selectedResidence === "0" ? (
            <p className="mt-2">
              <strong className="text-blue-200">Utilisateur :</strong> {consumptionData.user}
            </p>
          ) : (
            <p className="mt-2">
              <strong className="text-blue-200">Site :</strong> {consumptionData.site}
            </p>
          )}
          <p className="mt-2">
            <strong className="text-blue-200">Consommation totale :</strong>{" "}
            {consumptionData.consommation_pour_periode} kWh
          </p>
        </div>
      )}
    </div>
  );
};

export default ComparisonRange;
