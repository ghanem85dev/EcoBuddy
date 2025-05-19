import React, { useState, useEffect, useContext } from 'react';
import { AiOutlineFilePdf, AiOutlineCheck, AiOutlineClockCircle, AiOutlineCloseCircle, AiOutlineMore, AiOutlineUser } from "react-icons/ai";
import { FaBuilding } from "react-icons/fa";
import { motion } from "framer-motion";
import entrepriseImage from "../../assets/residence.png";
import { useTheme } from "../../commun/context/ThemeContext";
import { AuthContext } from "../../commun/context/AuthContext";
import { useNavigate } from 'react-router-dom';

const AdminEntreprisesSettings = () => {
  const navigate = useNavigate();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const { role } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // États de pagination pour chaque colonne
  const [pagination, setPagination] = useState({
    pending: { currentPage: 1, itemsPerPage: 5 },
    approved: { currentPage: 1, itemsPerPage: 5 },
    rejected: { currentPage: 1, itemsPerPage: 5 }
  });

  // Styles dynamiques
  const bgColor = theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800";
  const columnBg = theme === "dark" ? "bg-gray-800" : "bg-white";
  
  // Couleurs des colonnes
  const columnColors = {
    pending: "#17B3DE",
    approved: "#2DBDAC",
    rejected: "rgba(243, 109, 143, 0.7)"
  };

  // Récupérer la liste de toutes les entreprises avec secteur et user
  const fetchAllEntreprises = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/entreprises`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des entreprises');

      const data = await response.json();
      setEntreprises(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les entreprises par statut
  const approvedEntreprises = entreprises.filter((entreprise) => entreprise.statut_approbation === "approve");
  const pendingEntreprises = entreprises.filter((entreprise) => entreprise.statut_approbation === "en_attente");
  const rejectedEntreprises = entreprises.filter((entreprise) => entreprise.statut_approbation === "non_approve");

  // Fonction pour changer de page
  const handlePageChange = (column, newPage) => {
    setPagination(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        currentPage: newPage
      }
    }));
  };

  // Fonction pour obtenir les entreprises paginées
  const getPaginatedEntreprises = (entreprises, column) => {
    const { currentPage, itemsPerPage } = pagination[column];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return entreprises.slice(startIndex, startIndex + itemsPerPage);
  };

  // Approuver ou rejeter une entreprise
  const handleApproveOrReject = async (entrepriseId, statut) => {
    try {
      const response = await fetch(
        `http://localhost:8000/entreprises/approve/${entrepriseId}?statut=${statut}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
  
      fetchAllEntreprises();
    } catch (error) {
      setError(error.message);
    }
  };

  // Télécharger le certificat de propriété
  const handleDownloadCertificat = async (entrepriseId) => {
    try {
      const response = await fetch(`http://localhost:8000/entreprises/certificat/${entrepriseId}`);
      if (!response.ok) throw new Error('Erreur lors du téléchargement du certificat');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificat_propriete_entreprise.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error.message);
    }
  };

  // Afficher les données de l'utilisateur
  const handleShowUser = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  useEffect(() => {
    if (role === null) return;
    
    if (role !== 'admin') {
      navigate('/acceuil');
    } else {
      fetchAllEntreprises();
    }
  }, [role, navigate]);

  if (role !== 'admin') {
    return null;
  }

  return (
    <div className={`${bgColor} min-h-screen p-6`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestion des Entreprises</h1>
            <p className="text-gray-500">Tableau interactif pour gérer les demandes</p>
          </div>
          <div className="mt-4 md:mt-0">
            <motion.img
              src={entrepriseImage}
              alt="Illustration entreprise"
              className="h-16"
              whileHover={{ scale: 1.05 }}
            />
          </div>
        </div>

        {/* Board */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2DBDAC]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Colonne En Attente */}
            <div className={`${columnBg} rounded-lg shadow-md overflow-hidden`}>
              <div 
                className="p-4 text-white font-bold flex items-center justify-between"
                style={{ backgroundColor: columnColors.pending }}
              >
                <div className="flex items-center">
                  <AiOutlineClockCircle className="mr-2" />
                  <span>En Attente</span>
                </div>
                <span className="bg-white text-[#17B3DE] px-2 py-1 rounded-full text-xs">
                  {pendingEntreprises.length}
                </span>
              </div>
              <div className="p-4 space-y-4 min-h-[200px]">
                {getPaginatedEntreprises(pendingEntreprises, 'pending').map((entreprise) => (
                  <EntrepriseCard
                    key={entreprise.idEntreprise}
                    entreprise={entreprise}
                    handleDownloadCertificat={handleDownloadCertificat}
                    color={columnColors.pending}
                    onApprove={() => handleApproveOrReject(entreprise.idEntreprise, "approve")}
                    onReject={() => handleApproveOrReject(entreprise.idEntreprise, "non_approve")}
                    onShowUser={() => handleShowUser(entreprise.user)}
                  />
                ))}
              </div>
              <PaginationControls 
                totalItems={pendingEntreprises.length} 
                currentPage={pagination.pending.currentPage} 
                itemsPerPage={pagination.pending.itemsPerPage}
                onPageChange={(page) => handlePageChange('pending', page)}
                color={columnColors.pending}
              />
            </div>

            {/* Colonne Approuvées */}
            <div className={`${columnBg} rounded-lg shadow-md overflow-hidden`}>
              <div 
                className="p-4 text-white font-bold flex items-center justify-between"
                style={{ backgroundColor: columnColors.approved }}
              >
                <div className="flex items-center">
                  <AiOutlineCheck className="mr-2" />
                  <span>Approuvées</span>
                </div>
                <span className="bg-white text-[#2DBDAC] px-2 py-1 rounded-full text-xs">
                  {approvedEntreprises.length}
                </span>
              </div>
              <div className="p-4 space-y-4 min-h-[200px]">
                {getPaginatedEntreprises(approvedEntreprises, 'approved').map((entreprise) => (
                  <EntrepriseCard
                    key={entreprise.idEntreprise}
                    entreprise={entreprise}
                    handleDownloadCertificat={handleDownloadCertificat}
                    color={columnColors.approved}
                    onShowUser={() => handleShowUser(entreprise.user)}
                  />
                ))}
              </div>
              <PaginationControls 
                totalItems={approvedEntreprises.length} 
                currentPage={pagination.approved.currentPage} 
                itemsPerPage={pagination.approved.itemsPerPage}
                onPageChange={(page) => handlePageChange('approved', page)}
                color={columnColors.approved}
              />
            </div>

            {/* Colonne Rejetées */}
            <div className={`${columnBg} rounded-lg shadow-md overflow-hidden`}>
              <div 
                className="p-4 text-white font-bold flex items-center justify-between"
                style={{ backgroundColor: columnColors.rejected }}
              >
                <div className="flex items-center">
                  <AiOutlineCloseCircle className="mr-2" />
                  <span>Rejetées</span>
                </div>
                <span className="bg-white text-[#F36D8F] px-2 py-1 rounded-full text-xs">
                  {rejectedEntreprises.length}
                </span>
              </div>
              <div className="p-4 space-y-4 min-h-[200px]">
                {getPaginatedEntreprises(rejectedEntreprises, 'rejected').map((entreprise) => (
                  <EntrepriseCard
                    key={entreprise.idEntreprise}
                    entreprise={entreprise}
                    handleDownloadCertificat={handleDownloadCertificat}
                    color={columnColors.rejected}
                    onShowUser={() => handleShowUser(entreprise.user)}
                  />
                ))}
              </div>
              <PaginationControls 
                totalItems={rejectedEntreprises.length} 
                currentPage={pagination.rejected.currentPage} 
                itemsPerPage={pagination.rejected.itemsPerPage}
                onPageChange={(page) => handlePageChange('rejected', page)}
                color={columnColors.rejected}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal pour afficher les données de l'utilisateur */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6">
            {selectedUser && (
              <div className="space-y-4">
                <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <AiOutlineUser className="text-[#2DBDAC]" />
                  <span>Propriétaire de l'entreprise</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-500">Nom complet</p>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xl font-medium text-gray-800">
                      {selectedUser.prenom || 'Prénom non renseigné'} {selectedUser.nom || 'Nom non renseigné'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-500">Email</p>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xl font-medium text-gray-800">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>
                
                {selectedUser.telephone && (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-500">Téléphone</p>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xl font-medium text-gray-800">
                        {selectedUser.telephone}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedUser.adresse && (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-500">Adresse</p>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xl font-medium text-gray-800">
                        {selectedUser.adresse}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-500">Rôle</p>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <p className="text-xl font-medium text-gray-800">
                      {selectedUser.role}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="px-4 py-2 bg-[#2DBDAC] text-white rounded-lg hover:bg-[#239f8f] transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Composant pour afficher une carte d'entreprise
const EntrepriseCard = ({ entreprise, handleDownloadCertificat, color, onApprove, onReject, onShowUser }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-lg shadow-sm border-l-4 p-4 cursor-pointer`}
      style={{ borderLeftColor: color }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <FaBuilding className="text-lg" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold">{entreprise.nom}</h3>
            <p className="text-sm text-gray-500">Taille: {entreprise.taille}</p>
            <p className="text-sm text-gray-500">Secteur: {entreprise.secteur.nom}</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowActions(!showActions)}
          className="text-gray-400 hover:text-gray-600"
        >
          <AiOutlineMore />
        </button>
      </div>

      {(isHovered || showActions) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-gray-100"
        >
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDownloadCertificat(entreprise.idEntreprise)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  title="Télécharger le certificat"
                >
                  <AiOutlineFilePdf className="text-lg" />
                </motion.button>
            
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onShowUser}
                className="p-2 rounded-full hover:bg-blue-100 text-blue-500"
                title="Voir le propriétaire"
              >
                <AiOutlineUser className="text-lg" />
              </motion.button>
            </div>

            {onApprove && onReject && (
              <div className="flex space-x-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onApprove}
                  className="p-2 rounded-full hover:bg-green-100 text-green-500"
                  title="Approuver"
                >
                  <AiOutlineCheck className="text-lg" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onReject}
                  className="p-2 rounded-full hover:bg-red-100 text-red-500"
                  title="Rejeter"
                >
                  <AiOutlineCloseCircle className="text-lg" />
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Composant de pagination
const PaginationControls = ({ totalItems, currentPage, itemsPerPage, onPageChange, color }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        Précédent
      </button>
      
      <div className="flex space-x-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-md flex items-center justify-center ${
              page === currentPage 
                ? 'text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: page === currentPage ? color : 'transparent' }}
          >
            {page}
          </button>
        ))}
      </div>
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded-md ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
      >
        Suivant
      </button>
    </div>
  );
};

export default AdminEntreprisesSettings;