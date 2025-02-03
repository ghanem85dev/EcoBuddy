import React from "react";
import RealTimeConsumption from "../components/RealTimeConsumption";
import DevicesDetected from "../components/DevicesDetected";
import Gamification from "../components/Gamification";

const Home = () => {
  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6">Tableau de Bord</h2>
      <RealTimeConsumption />
      <DevicesDetected />
      <Gamification />
    </div>
  );
};

export default Home;