import React, { useState } from "react";

const Gamification = () => {
  const [points, setPoints] = useState(1500);
  const progressPercentage = (points / 2000) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-800 to-blue-400 p-6 shadow-xl rounded-3xl text-white border border-gray-300">
      
      <p className="text-white text-sm mb-2">Points accumulés : <strong>{points}</strong></p>
      <div className="w-full bg-blue-300 h-4 rounded-full mt-2 shadow-inner">
        <div 
          className="h-4 rounded-full bg-blue-600 shadow-md transition-all duration-500 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className="mt-3 text-white text-sm">{progressPercentage.toFixed(1)}% vers le prochain badge</p>
    </div>
  );
};

export default Gamification;