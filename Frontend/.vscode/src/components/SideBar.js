import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-60 bg-gray-900 text-white h-screen p-5">
      <ul>
        <li className="mb-4"><Link to="/">🏠 Accueil</Link></li>
        <li className="mb-4"><Link to="/marketplace">🛒 Marketplace</Link></li>
        <li className="mb-4"><Link to="/settings">⚙️ Paramètres</Link></li>
      </ul>
    </div>
  );
};

export default Sidebar;