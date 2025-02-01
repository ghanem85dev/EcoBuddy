import React, { useEffect, useState } from "react";

const Gamification = () => {
  const [points, setPoints] = useState("--");

  useEffect(() => {
    // Simulate fetching data from an API
    setPoints(1500);
  }, []);

  return (
    <section className="gamification">
      <h2>Gamification</h2>
      <div className="points-widget">
        <p><strong>Points accumulés :</strong> {points}</p>
      </div>
      <div className="badges-grid">
        <div className="badge locked">🔒</div>
        <div className="badge unlocked">⭐</div>
        <div className="badge locked">🔒</div>
      </div>
    </section>
  );
};

export default Gamification;