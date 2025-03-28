import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { TbHomePlus } from "react-icons/tb";

const ManagedSites = ({ idUser ,onSiteSelect}) => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("0"); // Initialisé à "0" par défaut
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSites = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:8000/managed-sites/${idUser}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des données');
        const data = await response.json();
        const approvedSites = data.filter((site) => site.statut_approbation === "approve");
        setSites(approvedSites);

        // Récupération de la résidence sauvegardée ou "0" par défaut
        const savedSite = localStorage.getItem('selectedSite') || "0";
        setSelectedSite(savedSite);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (idUser) fetchSites();
  }, [idUser]);

  const handleSiteSelect = (siteId) => {
    const newValue = siteId.toString();
    setSelectedSite(newValue);
    onSiteSelect(newValue);
    localStorage.setItem('selectedSite', newValue);
    setIsDropdownOpen(false);
  };

  

  return (
    <div className="relative flex items-center gap-4">
      {loading && <p className="text-blue-500 font-semibold">Chargement...</p>}
      {error && <p className="text-red-500 font-semibold">{error}</p>}

      <div className="relative">
        <motion.button
          className="bg-[#003366] text-white px-4 py-2 rounded-lg shadow-lg text-lg flex items-center gap-2 hover:bg-[#4A90E2] transition-all"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          whileTap={{ scale: 0.95 }}
        >
          {selectedSite === "0" 
            ? 'Toutes les sites' 
            : sites.find(res => res.idSite.toString() === selectedSite)?.nom || 'Sélection...'}
        </motion.button>

        {isDropdownOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-lg overflow-hidden border border-[#003366] z-50"
          >
            <li
              className="px-4 py-3 cursor-pointer hover:bg-blue-100 text-[#003366]"
              onClick={() => handleSiteSelect(0)}
            >
              Toutes les résidences
            </li>
            {sites.map((site) => (
              <li
                key={site.idSite}
                className="px-4 py-3 cursor-pointer hover:bg-blue-100 text-[#003366]"
                onClick={() => handleSiteSelect(site.idSite)}
              >
                {site.nom}
              </li>
            ))}
          </motion.ul>
        )}
      </div>

      
    </div>
  );
};

export default ManagedSites;