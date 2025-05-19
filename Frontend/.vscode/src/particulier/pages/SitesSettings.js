import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiX, FiFilter, FiRefreshCw, FiAlertCircle, FiSearch, FiBriefcase, FiLayers } from 'react-icons/fi';
import SiteCard from '../components/SiteCard';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../../commun/context/AuthContext";

const ListSites = () => {
  const { idUser, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [state, setState] = useState({
    sites: [],
    loading: true,
    error: null,
    filter: "all",
    refresh: false,
    searchQuery: ""
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    latitude: '',
    longitude: '',
    certificat_propriete: null,
    entreprise_id: '',
    categorie_id: ''
  });

  const [entreprises, setEntreprises] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/categories/sites');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Erreur lors du chargement des catégories:", error);
      }
    };

    const fetchUserEntreprises = async () => {
      try {
        const response = await fetch(`http://localhost:8000/entreprises/user/${idUser}`);
        const data = await response.json();
        setEntreprises(data);
        
        if (data.length === 1) {
          setFormData(prev => ({ ...prev, entreprise_id: data[0].idEntreprise }));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des entreprises:", error);
      }
    };

    if (role === 'entreprise') {
      fetchUserEntreprises();
      fetchCategories();
    }
  }, [idUser, role]);

  useEffect(() => {
    const savedData = localStorage.getItem("siteData");
    const savedCoordinates = localStorage.getItem("coordinates");
    const returningFromMap = localStorage.getItem("returningFromMap");
    
    if (returningFromMap === "true") {
      setShowAddModal(true);
      localStorage.removeItem("returningFromMap");
    }
  
    if (savedData && savedCoordinates) {
      const parsedData = JSON.parse(savedData);
      const parsedCoordinates = JSON.parse(savedCoordinates);
      
      setFormData(prev => ({
        ...prev,
        nom: parsedData.nom || '',
        adresse: parsedData.adresse || '',
        latitude: parsedCoordinates.lat || '',
        longitude: parsedCoordinates.lng || '',
        entreprise_id: parsedData.entreprise_id || prev.entreprise_id,
        categorie_id: parsedData.categorie_id || prev.categorie_id
      }));
      
      setShowAddModal(true);
      
      localStorage.removeItem("siteData");
      localStorage.removeItem("coordinates");
    }
  }, []);

  const fetchSites = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await fetch(`http://localhost:8000/sites/${idUser}`);
      const data = await response.json();
      setState(prev => ({ ...prev, sites: data, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };

  useEffect(() => {
    if (idUser) {
      fetchSites();
    }
  }, [idUser, state.refresh]);

  const handleUpdate = async () => {
    await fetchSites();
  };
  
  const handleDelete = async () => {
    await fetchSites();
  };

  const handleAdd = async () => {
    await fetchSites();
    setShowAddModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, certificat_propriete: e.target.files[0] }));
  };

  const handleGoToMap = () => {
    localStorage.setItem("siteData", JSON.stringify({
      nom: formData.nom,
      adresse: formData.adresse,
      certificat_propriete: formData.certificat_propriete,
      entreprise_id: formData.entreprise_id,
      categorie_id: formData.categorie_id
    }));
  
    localStorage.setItem("coordinates", JSON.stringify({
      lat: formData.latitude || 0,
      lng: formData.longitude || 0
    }));
  
    navigate('/maps', {
      state: {
        coordinates: { 
          lat: formData.latitude || 0, 
          lng: formData.longitude || 0 
        },
        isEditing: true
      },
    });
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('adresse', formData.adresse);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      
      if (formData.certificat_propriete) {
        formDataToSend.append('certificat_propriete', formData.certificat_propriete);
      }

      let endpoint;
      if (role === 'entreprise') {
        endpoint = `http://localhost:8000/sites/entreprise/${formData.entreprise_id}/${idUser}/${formData.categorie_id}`;
      } else {
        endpoint = `http://localhost:8000/sites/${idUser}/1`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout du site');
      }

      await handleAdd();
      setFormData({
        nom: '',
        adresse: '',
        latitude: '',
        longitude: '',
        certificat_propriete: null,
        entreprise_id: entreprises.length === 1 ? entreprises[0].idEntreprise : '',
        categorie_id: ''
      });
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message }));
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: state.sites.length,
      approve: 0,
      non_approve: 0,
      en_attente: 0
    };

    state.sites.forEach(res => {
      const status = res.statut_approbation?.toLowerCase();
      if (status === 'approve') counts.approve++;
      else if (status === 'non_approve') counts.non_approve++;
      else if (status === 'en_attente') counts.en_attente++;
    });

    return [
      { value: "all", label: "Toutes", count: counts.all },
      { value: "approve", label: "Approuvées", count: counts.approve },
      { value: "non_approve", label: "Refusées", count: counts.non_approve },
      { value: "en_attente", label: "En attente", count: counts.en_attente }
    ];
  };

  const statusFilters = getStatusCounts();

  const filteredSites = state.sites.filter(res => {
    const matchesFilter = state.filter === "all" || res.statut_approbation?.toLowerCase() === state.filter;
    const matchesSearch = res.nom?.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                         res.adresse?.toLowerCase().includes(state.searchQuery.toLowerCase());
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
        <p className="text-gray-400">Chargement des résidences...</p>
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
          onClick={() => setState(prev => ({ ...prev, refresh: !prev.refresh, error: null }))}
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
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-50"
                >
                  <FiX size={24} />
                </button>
                
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Ajouter une résidence</h3>
                  </div>

                  <form onSubmit={handleSubmitAdd}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom du site*</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>

                    {role === 'entreprise' && (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise*</label>
                          <select
                            name="entreprise_id"
                            value={formData.entreprise_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                            disabled={entreprises.length === 1}
                          >
                            {entreprises.length > 1 && <option value="">Sélectionner une entreprise</option>}
                            {entreprises.map(entreprise => (
                              <option key={entreprise.idEntreprise} value={entreprise.idEntreprise}>
                                {entreprise.nom}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie*</label>
                          <select
                            name="categorie_id"
                            value={formData.categorie_id}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border rounded-md"
                            required
                          >
                            <option value="">Sélectionner une catégorie</option>
                            {categories.map(categorie => (
                              <option key={categorie.idCategorieSite} value={categorie.idCategorieSite}>
                                {categorie.nom}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Adresse*</label>
                      <input
                        type="text"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md"
                        required
                      />
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm">Préciser la résidence sur la carte</label>
                      <button
                        type="button"
                        onClick={handleGoToMap}
                        className="bg-gray-600 text-white py-2 px-4 rounded-md"
                      >
                        Aller à la carte
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Certificat de propriété (PDF)
                      </label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700"
                      >
                        Ajouter
                      </button>
                    </div>
                  </form>

                  {state.error && (
                    <div className="mt-4 text-sm text-red-600">
                      {state.error}
                    </div>
                  )}
                </div>
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
          {filteredSites.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300"
            >
              <p className="text-gray-500">
                {state.searchQuery 
                  ? "Aucun résultat trouvé pour votre recherche"
                  : "Aucune résidence trouvée"}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500">
                {filteredSites.length} résidence(s) trouvée(s)
                {state.filter !== "all" && ` (filtrée(s) par statut "${state.filter}")`}
              </div>
              
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <AnimatePresence>
                  {filteredSites.map(site => (
                    <SiteCard 
                      key={site.idSite} 
                      site={site}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
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

export default ListSites;