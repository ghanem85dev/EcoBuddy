import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiCheck, 
  FiX, 
  FiClock, 
  FiHome, 
  FiLayers, 
  FiArchive, 
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiFile
} from "react-icons/fi";

const EntrepriseCard = ({ entreprise, onEdit, onDelete, onDownloadCertificat }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  
  const statusConfig = {
    approve: {
      color: "bg-green-100",
      textColor: "text-green-800",
      icon: <FiCheck className="text-green-500" />,
      text: "Approuvée"
    },
    non_approve: {
      color: "bg-red-100",
      textColor: "text-red-800",
      icon: <FiX className="text-red-500" />,
      text: "Rejetée"
    },
    en_attente: {
      color: "bg-yellow-100",
      textColor: "text-yellow-800",
      icon: <FiClock className="text-yellow-500" />,
      text: "En attente"
    },
    default: {
      color: "bg-gray-100",
      textColor: "text-gray-800",
      icon: <FiClock className="text-gray-500" />,
      text: "Inconnu"
    }
  };

  const status = entreprise.statut_approbation?.toLowerCase() || "default";
  const { color, textColor, icon, text } = statusConfig[status] || statusConfig.default;

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuAction = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    action?.();
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onEdit?.(entreprise);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDelete?.(entreprise.idEntreprise);
  };

  const handleDownloadCertificat = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    onDownloadCertificat?.(entreprise.idEntreprise);
  };

  // Ferme le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-xl shadow-md border-l-[3px] ${
        entreprise.est_archive ? "border-gray-400" : "border-[#17B3DE]"
      } hover:shadow-lg transition-all duration-300 relative`}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {entreprise.nom}
              {entreprise.est_archive && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                  <FiArchive size={12} /> Archivée
                </span>
              )}
            </h3>
            
            <div className="flex items-center gap-4 mt-2">
              <p className="text-sm text-gray-500 flex items-center">
                <FiLayers className="mr-1" />
                {entreprise.secteur?.nom || "Secteur inconnu"}
              </p>
              
              <p className="text-sm text-gray-500 flex items-center">
                <FiHome className="mr-1" />
                {entreprise.taille}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`${color} ${textColor} text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium`}>
              {icon}
              <span>{text}</span>
            </div>
            
            <div className="relative">
              <button 
                ref={buttonRef}
                onClick={toggleMenu}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiMoreVertical />
              </button>
              
              {isMenuOpen && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200"
                  onClick={(e) => e.stopPropagation()} // Empêche la fermeture lors du clic dans le menu
                >
                  <div className="py-1">
                    <button
                      onClick={handleEdit}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiEdit className="mr-2" /> Modifier
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiTrash2 className="mr-2" /> Supprimer
                    </button>
                    {entreprise && (
                      <button
                        onClick={handleDownloadCertificat}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        <FiFile className="mr-2" /> Certificat
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nombre de sites */}
        {entreprise.sites && (
          <div className="mt-4">
            <div className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
              {entreprise.sites.length} {entreprise.sites.length > 1 ? "sites" : "site"}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default EntrepriseCard;