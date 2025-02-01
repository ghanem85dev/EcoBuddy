import React from "react";
import RealTimeConsumption from "./components/RealTimeConsumption";
import DevicesDetected from "./components/DevicesDetected";
import Gamification from "./components/Gamification";
import "./App.css";

const App = () => {
  return (
    <div className="dashboard">
      <h1>Tableau de bord énergétique</h1>
      <RealTimeConsumption />
      <DevicesDetected />
      <Gamification />
    </div>
  );
};

export default App;