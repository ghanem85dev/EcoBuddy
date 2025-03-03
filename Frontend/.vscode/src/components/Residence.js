import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoSettingsSharp } from "react-icons/io5";
import { motion } from "framer-motion";

const Residence = ({ idUser }) => {
  const [residences, setResidences] = useState([]);
  const [selectedResidence, setSelectedResidence] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResidences = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:8000/sites/${idUser}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des données');
        const data = await response.json();
        setResidences(data);

        // Sélection par défaut
        const savedResidence = localStorage.getItem('selectedResidence');
        const initialSelectedResidence = savedResidence ? parseInt(savedResidence, 10) : 0;
        setSelectedResidence(initialSelectedResidence === 0 && data.length > 0 ? 0 : initialSelectedResidence);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (idUser) {
      fetchResidences();
    }
  }, [idUser]);

  const handleResidenceSelect = (residence) => {
    const selectedId = residence.idSite === null ? 0 : residence.idSite;
    setSelectedResidence(selectedId);
    localStorage.setItem('selectedResidence', selectedId);
    setIsDropdownOpen(false);
  };

  const goToSettings = () => {
    navigate(`/Sites-settings/${idUser}`);
  };

  return (
    <div className="relative flex items-center gap-4">
      {loading && <p className="text-blue-500 font-semibold">Chargement...</p>}
      {error && <p className="text-red-500 font-semibold">{error}</p>}

      {/* Bouton principal */}
      <div className="relative">
        <motion.button
          className="bg-[#003366] text-white px-4 py-2 rounded-lg shadow-lg text-lg flex items-center gap-2 hover:bg-[#4A90E2] transition-all"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          whileTap={{ scale: 0.95 }}
        >
          {selectedResidence === 0 ? 'Toutes les résidences' : residences.find(res => res.idSite === selectedResidence)?.nom}
        </motion.button>

        {/* Dropdown des résidences */}
        {isDropdownOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-lg overflow-hidden border border-[#003366]"
          >
            <li
              className="px-4 py-3 cursor-pointer hover:bg-blue-100 text-[#003366]"
              onClick={() => handleResidenceSelect({ idSite: null, nom: 'Toutes les résidences' })}
            >
              Toutes les résidences
            </li>
            {residences.length > 0 ? (
              residences.map((residence) => (
                <li
                  key={residence.idSite}
                  className="px-4 py-3 cursor-pointer hover:bg-blue-100 text-[#003366]"
                  onClick={() => handleResidenceSelect(residence)}
                >
                  {residence.nom}
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-gray-500">Aucune résidence disponible</li>
            )}
          </motion.ul>
        )}
      </div>

      {/* Bouton paramètres */}
      <motion.button
        className="text-white bg-[#003366] p-3 rounded-full shadow-lg hover:bg-[#4A90E2] transition-all"
        onClick={goToSettings}
        whileHover={{ rotate: 90 }}
      >
        <IoSettingsSharp size={24} />
      </motion.button>
    </div>
  );
};

export default Residence;
