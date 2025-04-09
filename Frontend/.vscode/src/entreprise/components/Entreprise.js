import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { TbBuildingPlus } from "react-icons/tb";
import EntrepriseSites from './EntrepriseSites';

const Entreprise = ({ idUser, onSiteSelect, onEntrepriseSelect }) => {
  const [entreprises, setEntreprises] = useState([]);
  const [selectedEntreprise, setSelectedEntreprise] = useState("0");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Gestion du clic en dehors du dropdown
  useEffect(() => {
    localStorage.removeItem("selectedSite")
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchEntreprises = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:8000/entreprises/user/${idUser}`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des entreprises');
        const data = await response.json();
        const approvedEntreprises = data.filter(entreprise => entreprise.statut_approbation === "approve");
        setEntreprises(approvedEntreprises);

        const savedEntreprise = localStorage.getItem('selectedEntreprise') || "0";
        setSelectedEntreprise(savedEntreprise);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (idUser) fetchEntreprises();
  }, [idUser]);

  const handleEntrepriseSelect = (entrepriseId) => {
    
    const newValue = entrepriseId.toString();
    setSelectedEntreprise(newValue);
    localStorage.setItem('selectedEntreprise', newValue);
    setIsDropdownOpen(false);
    if (onEntrepriseSelect) onEntrepriseSelect(entrepriseId);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  return (
    <div className="flex items-start gap-4" ref={dropdownRef}>
      <div className="flex items-center gap-4">
        {loading && <p className="text-blue-500 font-semibold">Chargement...</p>}
        {error && <p className="text-red-500 font-semibold">{error}</p>}

        <div className="relative">
          <motion.button
            className="bg-[#003366] text-white px-4 py-2 rounded-lg shadow-lg text-lg flex items-center gap-2 hover:bg-[#4A90E2] transition-all"
            onClick={toggleDropdown}
            whileTap={{ scale: 0.95 }}
          >
            {selectedEntreprise === "0" 
              ? 'Toutes les entreprises' 
              : entreprises.find(ent => ent.idEntreprise.toString() === selectedEntreprise)?.nom || 'Sélection...'}
          </motion.button>

          {isDropdownOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-lg overflow-hidden border border-[#003366] z-50"
            >
              <li
                className="px-4 py-3 cursor-pointer hover:bg-blue-100 text-[#003366]"
                onClick={() => handleEntrepriseSelect(0)}
              >
                Toutes les entreprises
              </li>
              {entreprises.map((entreprise) => (
                <li
                  key={entreprise.idEntreprise}
                  className="px-4 py-3 cursor-pointer hover:bg-blue-100 text-[#003366]"
                  onClick={() => handleEntrepriseSelect(entreprise.idEntreprise)}
                >
                  {entreprise.nom}
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      </div>

      {selectedEntreprise !== "0" && (
        <div className="ml-4">
          <EntrepriseSites 
            idEntreprise={selectedEntreprise} 
            onSiteSelect={onSiteSelect}
          />
        </div>
      )}
    </div>
  );
};

export default Entreprise;