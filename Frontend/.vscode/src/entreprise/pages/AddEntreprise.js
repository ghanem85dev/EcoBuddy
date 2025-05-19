import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { 
  FaArrowLeft, 
  FaArrowRight, 
  FaCheck, 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaTimes,
  FaMap
} from "react-icons/fa";
import { FiUpload } from "react-icons/fi";
import { AuthContext } from "../../commun/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

const AddEntreprise = ({ onClose, onSuccess, initialFormData }) => {
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

  const navigate = useNavigate();
  const location = useLocation();
  const [secteurs, setSecteurs] = useState([]);
  const [categoriesSite, setCategoriesSite] = useState([]);
  const { idUser } = useContext(AuthContext);
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Changé de 2 à 3
  const [formKey, setFormKey] = useState(Date.now());

  const { entreprise, site } = formData;

  useEffect(() => {
    const savedFormData = localStorage.getItem("entrepriseFormData");
    const coordinates = localStorage.getItem("coordinates");

    if (savedFormData) {
      const parsedData = JSON.parse(savedFormData);
      const parsedCoords = JSON.parse(coordinates || '{}');
      
      setFormData(prev => ({
        entreprise: {
          ...prev.entreprise,
          ...parsedData.entreprise,
          certificat_propriete: prev.entreprise.certificat_propriete,
          certificat_propriete_nom: prev.entreprise.certificat_propriete_nom || parsedData.entreprise.certificat_propriete_nom || ""
        },
        site: {
          ...prev.site,
          ...parsedData.site,
          latitude: parsedCoords.lat || 0,
          longitude: parsedCoords.lng || 0,
          certificat_propriete: prev.site.certificat_propriete,
          certificat_propriete_nom: prev.site.certificat_propriete_nom || parsedData.site.certificat_propriete_nom || ""
        }
      }));

      setFormKey(Date.now());
    }

    if (location.state?.preserveFormData) {
      const savedData = localStorage.getItem("entrepriseFormData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({
          entreprise: {
            ...prev.entreprise,
            ...parsedData.entreprise,
            certificat_propriete: prev.entreprise.certificat_propriete,
            certificat_propriete_nom: prev.entreprise.certificat_propriete_nom || parsedData.entreprise.certificat_propriete_nom || ""
          },
          site: {
            ...prev.site,
            ...parsedData.site
          }
        }));
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secteursRes, categoriesRes] = await Promise.all([
          fetch('http://localhost:8000/secteurs'),
          fetch('http://localhost:8000/categories/sites')
        ]);
        
        if (secteursRes.ok) setSecteurs(await secteursRes.json());
        if (categoriesRes.ok) setCategoriesSite(await categoriesRes.json());
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };
    
    fetchData();
  }, []);

  const handleGoToMap = () => {
    const dataToSave = {
      entreprise: {
        nom: entreprise.nom,
        taille: entreprise.taille,
        secteur_id: entreprise.secteur_id,
        certificat_propriete_nom: entreprise.certificat_propriete_nom
      },
      site: {
        nom: site.nom,
        adresse: site.adresse,
        idCategorieSite: site.idCategorieSite,
        certificat_propriete_nom: site.certificat_propriete_nom
      }
    };
    
    localStorage.setItem("entrepriseFormData", JSON.stringify(dataToSave));
    
    navigate('/maps', {
      state: {
        coordinates: { 
          lat: site.latitude || 0, 
          lng: site.longitude || 0 
        },
        isEditing: true,
        entreprise: true,
        isFirst: true,
        fromMap: true
      },
    });
  };

  const handleChange = (e, formType) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [name]: value
      }
    }));
  };

  const handleFileUpload = (e, formType, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [formType]: {
          ...prev[formType],
          [fieldName]: file,
          [`${fieldName}_nom`]: file.name
        }
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // 1. Création de l'entreprise
      const entrepriseFormData = new FormData();
      entrepriseFormData.append('nom', entreprise.nom);
      entrepriseFormData.append('taille', entreprise.taille);
      entrepriseFormData.append('secteur_id', entreprise.secteur_id);
      
      if (entreprise.certificat_propriete) {
        entrepriseFormData.append('certificat_propriete', entreprise.certificat_propriete);
      }

      const entrepriseResponse = await fetch('http://localhost:8000/entreprises/', {
        method: 'POST',
        body: entrepriseFormData,
      });
      
      if (!entrepriseResponse.ok) {
        const error = await entrepriseResponse.json();
        throw new Error(error.detail || "Erreur lors de la création de l'entreprise");
      }
      
      const entrepriseCreated = await entrepriseResponse.json();

      // 2. Création du site
      const siteFormData = new FormData();
      siteFormData.append('nom', site.nom);
      siteFormData.append('adresse', site.adresse);
      siteFormData.append('latitude', site.latitude);
      siteFormData.append('longitude', site.longitude);
      siteFormData.append('idCategorieSite', site.idCategorieSite);
      if (site.certificat_propriete) {
        siteFormData.append('certificat_propriete', site.certificat_propriete);
      }
      
      const siteResponse = await fetch(
        `http://localhost:8000/sites/entreprise/${entrepriseCreated.idEntreprise}/${idUser}/${site.idCategorieSite}`, 
        { method: 'POST', body: siteFormData }
      );
      
      if (!siteResponse.ok) throw new Error('Erreur création site');

      localStorage.removeItem("entrepriseFormData");
      localStorage.removeItem("coordinates");

      navigate('/entreprise/entreprises');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  const handleClose = () => {
    localStorage.removeItem("entrepriseFormData");
      localStorage.removeItem("coordinates");
    navigate('/entreprise/entreprises');
  };
  return (
    <motion.div 
      key={formKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentStep === 1 ? "Informations entreprise" : 
             currentStep === 2 ? "Localisation du site" : 
             "Certificats de propriété"}
          </h2>
          <button
  onClick={handleClose}
  className="text-gray-500 hover:text-gray-700 transition-colors"
>
            <FaTimes size={24} />
          </button>
        </div>
        
        <div className="px-6 pt-4">
          <div className="flex justify-between items-center mb-2">
            {[...Array(totalSteps)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${currentStep > i + 1 ? 'bg-green-100 text-green-600' : 
                    currentStep === i + 1 ? 'bg-blue-100 text-blue-600' : 
                    'bg-gray-100 text-gray-500'}`}>
                  {currentStep > i + 1 ? <FaCheck size={16} /> : i + 1}
                </div>
                <span className="text-xs mt-1 text-gray-500">
                  {i === 0 ? "Entreprise" : 
                   i === 1 ? "Site" : 
                   "Certificats"}
                </span>
              </div>
            ))}
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        </div>
        
        <div className="p-6">
          {/* Étape 1 - Informations entreprise */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise*</label>
                  <input
                    type="text"
                    name="nom"
                    value={entreprise.nom}
                    onChange={(e) => handleChange(e, 'entreprise')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taille*</label>
                  <select
                    name="taille"
                    value={entreprise.taille}
                    onChange={(e) => handleChange(e, 'entreprise')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="petite">Petite (1-50 employés)</option>
                    <option value="moyenne">Moyenne (51-250 employés)</option>
                    <option value="grande">Grande (250+ employés)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité*</label>
                  <select
                    name="secteur_id"
                    value={entreprise.secteur_id}
                    onChange={(e) => handleChange(e, 'entreprise')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Sélectionnez un secteur...</option>
                    {secteurs.map(secteur => (
                      <option key={secteur.idSecteur} value={secteur.idSecteur}>
                        {secteur.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {/* Étape 2 - Localisation du site */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du site*</label>
                  <input
                    type="text"
                    name="nom"
                    value={site.nom}
                    onChange={(e) => handleChange(e, 'site')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie*</label>
                  <select
                    name="idCategorieSite"
                    value={site.idCategorieSite}
                    onChange={(e) => handleChange(e, 'site')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Sélectionnez...</option>
                    {categoriesSite.map(cat => (
                      <option key={cat.idCategorieSite} value={cat.idCategorieSite}>
                        {cat.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse*</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="adresse"
                      value={site.adresse}
                      onChange={(e) => handleChange(e, 'site')}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGoToMap}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaMap />
                      <span className="hidden sm:inline">Carte</span>
                    </button>
                  </div>
                </div>
                
                {(site.latitude && site.longitude) && (
                  <div className="md:col-span-2 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="text"
                        value={site.latitude}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="text"
                        value={site.longitude}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Étape 3 - Certificats de propriété */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FaBuilding className="text-blue-500" />
                  Certificat de propriété de l'entreprise
                </h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors hover:border-blue-400">
                  <input
                    type="file"
                    id="entreprise-certificat"
                    onChange={(e) => handleFileUpload(e, 'entreprise', 'certificat_propriete')}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  <label htmlFor="entreprise-certificat" className="flex flex-col items-center justify-center cursor-pointer">
                    <FiUpload className="text-gray-400 mb-2" size={24} />
                    {entreprise.certificat_propriete_nom ? (
                      <p className="text-sm text-green-600 font-medium">{entreprise.certificat_propriete_nom}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">Glissez-déposez votre fichier ici</p>
                        <p className="text-xs text-gray-500 mt-1">ou cliquez pour sélectionner</p>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Formats acceptés: PDF, DOC, DOCX (max 5MB)</p>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-500" />
                  Certificat de propriété du site
                </h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors hover:border-blue-400">
                  <input
                    type="file"
                    id="site-certificat"
                    onChange={(e) => handleFileUpload(e, 'site', 'certificat_propriete')}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                  />
                  <label htmlFor="site-certificat" className="flex flex-col items-center justify-center cursor-pointer">
                    <FiUpload className="text-gray-400 mb-2" size={24} />
                    {site.certificat_propriete_nom ? (
                      <p className="text-sm text-green-600 font-medium">{site.certificat_propriete_nom}</p>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">Glissez-déposez votre fichier ici</p>
                        <p className="text-xs text-gray-500 mt-1">ou cliquez pour sélectionner</p>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Formats acceptés: PDF, DOC, DOCX (max 5MB)</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-between">
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex items-center px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              Précédent
            </button>
          ) : (
            <div></div>
          )}
          
          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex items-center px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-auto"
              disabled={currentStep === 2 && (!site.nom || !site.adresse || !site.idCategorieSite)}
            >
              Suivant
              <FaArrowRight className="ml-2" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors ml-auto"
            >
              Terminer
              <FaCheck className="ml-2" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddEntreprise;