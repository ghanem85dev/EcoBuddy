import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { 
  FiHome, 
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiFile,
  FiMapPin,
  FiCheck,
  FiX,
  FiClock,
  FiArchive,
  FiBriefcase,
  FiLayers,
  FiUser
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../commun/context/AuthContext';

const SiteCard = ({ site, onUpdate, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    nom: site.nom || '',
    adresse: site.adresse || '',
    latitude: site.latitude || '',
    longitude: site.longitude || '',
    certificat_propriete: null,
    entreprise_id: site.entreprise?.idEntreprise || '',
    categorie_id: site.categorie?.idCategorie || ''
  });
  const [entreprises, setEntreprises] = useState([]);
  const [categories, setCategories] = useState([]);
  const { role, user ,idUser} = useContext(AuthContext); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (role === 'entreprise' && idUser) {
      const fetchUserEntreprises = async () => {
        try {
          const response = await fetch(`http://localhost:8000/entreprises/user/${idUser}`);
          if (!response.ok) throw new Error('Erreur lors du chargement des entreprises');
          const data = await response.json();
          console.log(data)
          setEntreprises(data);
          
          if (data.length === 1 && !site.idSite) {
            setFormData(prev => ({ ...prev, entreprise_id: data[0].idEntreprise }));
          }
        } catch (error) {
          setError(error.message);
        }
      };
      fetchUserEntreprises();
    }
  }, [role, user, site.idSite]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/categories/sites');
        if (!response.ok) throw new Error('Erreur lors du chargement des catégories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        setError(error.message);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const returningFromMap = localStorage.getItem("returningFromMap");
    if (returningFromMap === "true") {
      setShowEditModal(true);
      localStorage.removeItem("returningFromMap");
    }
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem("residenceData");
    const savedCoordinates = localStorage.getItem("coordinates");
    const editingResidenceId = localStorage.getItem("editingResidenceId");
    
    if (savedData && savedCoordinates && editingResidenceId && editingResidenceId === site.idSite?.toString()) {
      const parsedData = JSON.parse(savedData);
      const parsedCoordinates = JSON.parse(savedCoordinates);
      
      setFormData(prev => ({
        ...prev,
        nom: parsedData.nom || prev.nom,
        adresse: parsedData.adresse || prev.adresse,
        latitude: parsedCoordinates.lat || prev.latitude,
        longitude: parsedCoordinates.lng || prev.longitude
      }));
      
      localStorage.removeItem("residenceData");
      localStorage.removeItem("coordinates");
      localStorage.removeItem("editingResidenceId");
    }
  }, [site.idSite]);

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

  const status = site.statut_approbation?.toLowerCase() || "default";
  const { color, textColor, icon, text } = statusConfig[status] || statusConfig.default;

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleEditModal = () => {
    setShowEditModal(!showEditModal);
    if (!showEditModal) {
      setFormData({
        nom: site.nom || '',
        adresse: site.adresse || '',
        latitude: site.latitude || '',
        longitude: site.longitude || '',
        certificat_propriete: null,
        entreprise_id: site.entreprise?.idEntreprise || '',
        categorie_id: site.categorie?.idCategorie || ''
      });
    }
  };

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

  const handleGoToMapWithSitePosition = async (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    try {
      const response = await fetch(`http://localhost:8000/site/position/${site.idSite}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des coordonnées du site');
      const { latitude, longitude } = await response.json();
      navigate('/maps', {
        state: {
          coordinates: { lat: latitude, lng: longitude },
          isEditing: false,
          residenceId: site.idSite,
        },
      });
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDownloadCertificat = async (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    try {
      const response = await fetch(`http://localhost:8000/site/certificat/${site.idSite}`);
      if (!response.ok) throw new Error('Erreur lors du téléchargement du certificat');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "certificat_propriete.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    if (window.confirm('Voulez-vous supprimer cette résidence ?')) {
      try {
        const response = await fetch(`http://localhost:8000/sites/${site.idSite}`, { method: 'DELETE' });
        onDelete();
        if (!response.ok) throw new Error('Erreur lors de la suppression');
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    toggleEditModal();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, certificat_propriete: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nom', formData.nom);
      formDataToSend.append('adresse', formData.adresse);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      
      if (formData.certificat_propriete) {
        formDataToSend.append('certificat_propriete', formData.certificat_propriete);
      }

      const endpoint = `http://localhost:8000/sites/entreprise/${site.idSite}/${formData.entreprise_id}/${idUser}/${formData.categorie_id}`;
      const response = await fetch(endpoint, {
        method: 'PUT',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      onUpdate();
      setShowEditModal(false);
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMap = () => {
    localStorage.setItem("residenceData", JSON.stringify({
      nom: formData.nom,
      adresse: formData.adresse,
      certificat_propriete: formData.certificat_propriete,
      entreprise_id: formData.entreprise_id,
      categorie_id: formData.categorie_id
    }));
  
    localStorage.setItem("coordinates", JSON.stringify({
      lat: formData.latitude,
      lng: formData.longitude
    }));
  
    localStorage.setItem("editingResidenceId", site.idSite || 'new');
  
    navigate('/maps', {
      state: {
        coordinates: { lat: formData.latitude, lng: formData.longitude },
        isEditing: true,
        residenceId: site.idSite || null,
      },
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-white rounded-xl shadow-md border-l-[3px] ${
          site.est_archive ? "border-gray-400" : "border-[#17B3DE]"
        } hover:shadow-lg transition-all duration-300 relative`}
      >
        <div className="p-5">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {site.nom}
                  {site.est_archive && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                      <FiArchive size={12} /> Archivée
                    </span>
                  )}
                </h3>
                
                <div className={`${color} ${textColor} text-xs px-3 py-1 rounded-full flex items-center gap-1 font-medium`}>
                  {icon}
                  <span>{text}</span>
                </div>
              </div>
              
              <div className="mt-3 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <FiMapPin className="mr-2 text-gray-400" />
                  <span>{site.adresse}</span>
                </div>
                
                {site.entreprise && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FiBriefcase className="mr-2 text-gray-400" />
                    <span>Entreprise: {site.entreprise.nom}</span>
                  </div>
                )}
                
                {site.categorie && (
                  <div className="flex items-center text-sm text-gray-600">
                    <FiLayers className="mr-2 text-gray-400" />
                    <span>Catégorie: {site.categorie.nom}</span>
                  </div>
                )}
              </div>
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <button
                      onClick={handleGoToMapWithSitePosition}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiMapPin className="mr-2" /> Localisation
                    </button>
                    <button
                      onClick={handleDownloadCertificat}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiFile className="mr-2" /> Certificat
                    </button>
                    <button
                      onClick={handleEdit}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <FiEdit className="mr-2" /> Modifier
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <FiTrash2 className="mr-2" /> Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {site.idSite ? 'Modifier' : 'Créer'} {site.statut_approbation === 'approve' ? 'le nom du site' : 'le site'}
              </h3>
              <button onClick={toggleEditModal} className="text-gray-500 hover:text-gray-700">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du site</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
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

              {(site.statut_approbation !== 'approve' || !site.idSite) && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
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
                    <label className="text-m">Préciser la résidence sur la carte</label>
                    <button
                      type="button"
                      onClick={handleGoToMap}
                      className="bg-gray-500 text-white py-2 px-4 rounded-md"
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
                </>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={toggleEditModal}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#17B3DE] text-white rounded-md hover:bg-[#1498c4] disabled:opacity-50"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SiteCard;