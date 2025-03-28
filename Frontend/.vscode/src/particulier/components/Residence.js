import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { TbHomePlus } from "react-icons/tb";

const Residence = ({ idUser }) => {
  const [residences, setResidences] = useState([]);
  const [selectedResidence, setSelectedResidence] = useState("0"); // Initialisé à "0" par défaut
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResidences = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:8000/user-sites/${idUser}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des données');
        const data = await response.json();
        const approvedResidences = data.filter((site) => site.statut_approbation === "approve");
        setResidences(approvedResidences);

        // Récupération de la résidence sauvegardée ou "0" par défaut
        const savedResidence = localStorage.getItem('selectedResidence') || "0";
        setSelectedResidence(savedResidence);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (idUser) fetchResidences();
  }, [idUser]);

  const handleResidenceSelect = (residenceId) => {
    const newValue = residenceId.toString();
    setSelectedResidence(newValue);
    localStorage.setItem('selectedResidence', newValue);
    setIsDropdownOpen(false);
  };

  const goToSettings = () => {
    navigate(`/Sites-settings/${idUser}`);
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
          {selectedResidence === "0" 
            ? 'Toutes les résidences' 
            : residences.find(res => res.idSite.toString() === selectedResidence)?.nom || 'Sélection...'}
        </motion.button>

        {isDropdownOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-lg overflow-hidden border border-[#003366] z-50"
          >
            <li
              className="px-4 py-3 cursor-pointer hover:bg-blue-100 text-[#003366]"
              onClick={() => handleResidenceSelect(0)}
            >
              Toutes les résidences
            </li>
            {residences.map((residence) => (
              <li
                key={residence.idSite}
                className="px-4 py-3 cursor-pointer hover:bg-blue-100 text-[#003366]"
                onClick={() => handleResidenceSelect(residence.idSite)}
              >
                {residence.nom}
              </li>
            ))}
          </motion.ul>
        )}
      </div>

      <button

        className="text-[#003366] text-2xl hover:text-[#0055aa]"
        onClick={goToSettings}
      >
        <TbHomePlus size={24} />
      </button>
    </div>
  );
};

export default Residence;