import React, { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import EntrepriseCard from "../../entreprise/components/EntrepriseCard";
import { FiFilter, FiRefreshCw, FiAlertCircle, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { AuthContext } from "../../commun/context/AuthContext";
import AddEntreprise from "./AddEntreprise";
import { useLocation } from "react-router-dom";
import EditEntreprise from "../components/EditEntreprise"; // Nouveau composant à créer
import { useNavigate } from "react-router-dom";


const ListEntreprises = () => {
  const { idUser } = useContext(AuthContext);
  const location = useLocation();
  const [state, setState] = useState({
    entreprises: [],
    loading: true,
    error: null,
    filter: "all",
    refresh: false,
    searchQuery: ""
  });

  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [formData, setFormData] = useState({
    entreprise: {
      nom: "",
      taille: "",
      secteur_id: "",
      certificat_propriete: null,
      certificat_propriete_nom: ""
    },
    site: {
      nom: "",
      adresse: "",
      latitude: "",
      longitude: "",
      idCategorieSite: "",
      certificat_propriete: null,
      certificat_propriete_nom: ""
    }
  });

  // Restaurer les données au montage si on revient de la carte
  useEffect(() => {
    const savedData = localStorage.getItem("entrepriseFormData");
    const coordinates = localStorage.getItem("coordinates");
    
    if (savedData && location.state?.fromMap) {
      const parsedData = JSON.parse(savedData);
      const parsedCoords = JSON.parse(coordinates || '{}');
      
      setFormData(prev => ({
        entreprise: {
          ...prev.entreprise,
          ...parsedData.entreprise
        },
        site: {
          ...prev.site,
          ...parsedData.site,
          latitude: parsedCoords.lat || 0,
          longitude: parsedCoords.lng || 0
        }
      }));
      
      // Ouvrir automatiquement le modal si on revient de la carte
      setShowAddModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    if (idUser) {
      fetchData();
    }
  }, [idUser, state.refresh]);

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await axios.get(`http://localhost:8000/entreprises/user/${idUser}`);
      setState(prev => ({ ...prev, entreprises: response.data, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.detail || error.message,
        loading: false
      }));
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: state.entreprises.length,
      approuvée: 0,
      rejetée: 0,
      en_attente: 0
    };

    state.entreprises.forEach(ent => {
      const status = ent.statut_approbation?.toLowerCase();
      if (status === 'approve') counts.approuvée++;
      else if (status === 'non_approve') counts.rejetée++;
      else if (status === 'en_attente') counts.en_attente++;
    });

    return [
      { value: "all", label: "Toutes", count: counts.all },
      { value: "approve", label: "Approuvées", count: counts.approuvée },
      { value: "non_approve", label: "Rejetées", count: counts.rejetée },
      { value: "en_attente", label: "En attente", count: counts.en_attente }
    ];
  };

  const handleEdit = (entreprise) => {
    setSelectedEntreprise(entreprise);
    setShowEditModal(true);
  };

  const handleDelete = async (entrepriseId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) {
      try {
  
          const response = await fetch(`http://localhost:8000/entreprises/${entrepriseId}`, { 
            method: 'DELETE' 
          })
          if (!response.ok) throw new Error('Erreur lors de la suppression');
        setState(prev => ({ ...prev, refresh: !prev.refresh }));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        alert("Erreur lors de la suppression de l'entreprise");
      }
    }
  };

  const handleDownloadCertificat = async (entrepriseId) => {
    try {
      const response = await fetch(`http://localhost:8000/entreprises/certificat/${entrepriseId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificat_propriete_${entrepriseId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert("Certificat non disponible");
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      alert("Erreur lors du téléchargement");
    }
  };

  const statusFilters = getStatusCounts();

  const filteredEntreprises = state.entreprises.filter(ent => {
    const matchesFilter = state.filter === "all" || ent.statut_approbation?.toLowerCase() === state.filter;
    const matchesSearch = ent.nom?.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                         ent.secteur?.nom?.toLowerCase().includes(state.searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (state.loading || !idUser) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-gray-500 mb-4"
        >
          <FiRefreshCw size={32} />
        </motion.div>
        <p className="text-gray-400">Chargement des entreprises...</p>
      </div>
    );
  }

  if (state.error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-xl p-6 max-w-md mx-auto mt-10 text-center shadow-sm"
      >
        <div className="text-red-500 mb-4">
          <FiAlertCircle size={48} className="mx-auto" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600 mb-6">{state.error}</p>
        <button
          onClick={() => setState(prev => ({ ...prev, refresh: !prev.refresh }))}
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
        >
          <FiRefreshCw />
          Réessayer
        </button>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
              onClick={() => setShowAddModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
            >
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-50"
                >
                  <FiX size={24} />
                </button>
                
                <AddEntreprise 
  initialFormData={formData}
  onSuccess={() => {
    setShowAddModal(false);
    setState(prev => ({ ...prev, refresh: !prev.refresh }));
    // Réinitialiser le formData après succès
    setFormData({
      entreprise: {
        nom: "",
        taille: "",
        secteur_id: "",
        certificat_propriete: null,
        certificat_propriete_nom: ""
      },
      site: {
        nom: "",
        adresse: "",
        latitude: "",
        longitude: "",
        idCategorieSite: "",
        certificat_propriete: null,
        certificat_propriete_nom: ""
      }
    });
  }} 
  onClose={() => {setShowAddModal(false);
  navigate('/entreprise/entreprises')}}
/>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal d'édition */}
      <AnimatePresence>
        {showEditModal && selectedEntreprise && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
              onClick={() => setShowEditModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
            >
              <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-50"
                >
                  <FiX size={24} />
                </button>
                
                <EditEntreprise 
                  entreprise={selectedEntreprise}
                  onSuccess={() => {
                    setShowEditModal(false);
                    setState(prev => ({ ...prev, refresh: !prev.refresh }));
                  }} 
                  onClose={() => setShowEditModal(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              {statusFilters.map(({ value, label, count }) => (
                <button
                  key={value}
                  onClick={() => setState(prev => ({ ...prev, filter: value }))}
                  className={`flex items-center gap-2 text-sm ${
                    state.filter === value ? 'text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{label}</span>
                  {count > 0 && (
                    <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={state.searchQuery}
                onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 w-full"
              />
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-black hover:bg-black text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiPlus size={18} />
              <span>Ajouter</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {filteredEntreprises.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300"
            >
              <p className="text-gray-500">
                {state.searchQuery 
                  ? "Aucun résultat trouvé pour votre recherche"
                  : "Aucune entreprise trouvée"}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500">
                {filteredEntreprises.length} entreprise(s) trouvée(s)
                {state.filter !== "all" && ` (filtrée(s) par statut "${state.filter}")`}
              </div>
              
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <AnimatePresence>
                  {filteredEntreprises.map(entreprise => (
                    <EntrepriseCard 
                      key={entreprise.idEntreprise} 
                      entreprise={entreprise}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDownloadCertificat={handleDownloadCertificat}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListEntreprises;