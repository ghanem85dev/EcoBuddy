import React, { useState } from "react";

const Gamification = () => {
  const [points, setPoints] = useState(1500);

  return (
    <div className="bg-white p-4 shadow-md rounded-lg">
      <h3 className="text-xl font-semibold">Gamification</h3>
      <p>Points accumulés : <strong>{points}</strong></p>
      <div className="progress-bar bg-gray-300 h-4 rounded-full mt-2">
        <div className="progress bg-green-500 h-4 rounded-full" style={{ width: `${(points / 2000) * 100}%` }}></div>
      </div>
      <p className="mt-2">{(points / 2000) * 100}% vers le prochain badge</p>
    </div>
  );
};

export default Gamification;