import { useState, useEffect , useContext} from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../commun/context/ThemeContext";
import { FaArrowLeft, FaArrowRight, FaCheck, FaBuilding, FaMapMarkerAlt } from "react-icons/fa";
import { AuthContext } from "../../commun/context/AuthContext"; // Importez AuthContext

const AddEntreprise = () => {
  const [secteurs, setSecteurs] = useState([]);
  const [categoriesSite, setCategoriesSite] = useState([]); // Nouvel état pour les catégories
const { idUser } = useContext(AuthContext);
  useEffect(() => {
      const fetchData = async () => {
          try {
              // Récupérer les secteurs
              const secteursResponse = await fetch('http://localhost:8000/secteurs');
              if (secteursResponse.ok) {
                  setSecteurs(await secteursResponse.json());
              }

              // Récupérer les catégories de site
              const categoriesResponse = await fetch('http://localhost:8000/categories/sites');
              if (categoriesResponse.ok) {
                  setCategoriesSite(await categoriesResponse.json());
              }
          } catch (error) {
              console.error("Erreur lors de la récupération des données:", error);
          }
      };
      
      fetchData();
  }, []);
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  // État pour gérer l'étape actuelle
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;
  
  // État pour les données du formulaire entreprise
  const [entrepriseData, setEntrepriseData] = useState({
    nom: "",
    taille: "",
    secteur_id: "",
    certificat_propriete: null,
    certificat_propriete_nom: ""
  });
  
  // État pour les données du formulaire site
  const [siteData, setSiteData] = useState({
    nom: "",
    adresse: "",
    latitude: "",
    longitude: "",
    idCategorieSite: "",
    certificat_propriete: null,
    certificat_propriete_nom: ""
  });
  
  // Gestion des changements pour le formulaire entreprise
  const handleEntrepriseChange = (e) => {
    const { name, value } = e.target;
    setEntrepriseData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gestion des changements pour le formulaire site
  const handleSiteChange = (e) => {
    const { name, value } = e.target;
    setSiteData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gestion des fichiers uploadés
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (type === 'entreprise') {
        setEntrepriseData(prev => ({
          ...prev,
          certificat_propriete: file,
          certificat_propriete_nom: file.name
        }));
      } else {
        setSiteData(prev => ({
          ...prev,
          certificat_propriete: file,
          certificat_propriete_nom: file.name
        }));
      }
    }
  };
  
  // Soumission du formulaire final
  const handleSubmit = async () => {
    try {
        // 1. Création de l'entreprise
        const entrepriseFormData = new FormData();
        entrepriseFormData.append('nom', entrepriseData.nom);
        entrepriseFormData.append('taille', entrepriseData.taille);
        entrepriseFormData.append('secteur_id', entrepriseData.secteur_id);
        if (entrepriseData.certificat_propriete) {
            entrepriseFormData.append('certificat_propriete', entrepriseData.certificat_propriete);
        }
        
        const entrepriseResponse = await fetch('http://localhost:8000/entreprises/', {
            method: 'POST',
            body: entrepriseFormData
        });
        
        if (!entrepriseResponse.ok) {
            throw new Error('Erreur lors de la création de l\'entreprise');
        }
        
        const entreprise = await entrepriseResponse.json();

        // 2. Création du site pour l'entreprise
        const siteFormData = new FormData();
        siteFormData.append('nom', siteData.nom);
        siteFormData.append('adresse', siteData.adresse);
        siteFormData.append('latitude', siteData.latitude);
        siteFormData.append('longitude', siteData.longitude);
        siteFormData.append('idCategorieSite', siteData.idCategorieSite);
        if (siteData.certificat_propriete) {
            siteFormData.append('certificat_propriete', siteData.certificat_propriete);
        }
        
        // Utilisation de la nouvelle route pour ajouter un site à l'entreprise
        const siteResponse = await fetch(
            `http://localhost:8000/sites/entreprise/${entreprise.idEntreprise}/${idUser}/${siteData.idCategorieSite}`, 
            {
                method: 'POST',
                body: siteFormData
            }
        );
        
        if (!siteResponse.ok) {
            throw new Error('Erreur lors de la création du site');
        }

        const siteResult = await siteResponse.json();
        console.log("Site créé avec ID:", siteResult.site_id);
        
        // Redirection après succès
        navigate('/dashboard-entreprise');
        
    } catch (error) {
        console.error('Erreur:', error);
        // Afficher un message d'erreur à l'utilisateur
    }
};
useEffect(() => {
    const savedData = localStorage.getItem("siteData");
    const coordinates = localStorage.getItem("coordinates");

    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const parsedDataCoordinates = JSON.parse(coordinates);
      setSiteData({
        nom: parsedData.nom || '',
        adresse: parsedData.adresse || '',
        latitude: parsedDataCoordinates.lat || 0,
        longitude: parsedDataCoordinates.lng || 0,
      });

      
    }
  }, []);
const handleGoToMap = () => {
  localStorage.setItem("siteData", JSON.stringify({
    nom: siteData.nom || '',
    adresse: siteData.adresse || '',
  }));

  
  navigate('/maps', {
    state: {
      coordinates: { lat: siteData.latitude, lng: siteData.longitude },
      isEditing: true,
      entreprise:true,
      isFirst:true
    },
  });
};
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#08112F] text-white' : 'bg-gray-50 text-gray-900'} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[...Array(totalSteps)].map((_, i) => (
              <div 
                key={i} 
                className={`flex items-center justify-center w-10 h-10 rounded-full 
                  ${currentStep > i + 1 ? 'bg-green-500 text-white' : 
                   currentStep === i + 1 ? 'bg-blue-500 text-white' : 
                   theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}
              >
                {currentStep > i + 1 ? <FaCheck /> : i + 1}
              </div>
            ))}
          </div>
          <div className="relative">
            <div className="absolute top-1/2 h-1 w-full bg-gray-300 dark:bg-gray-700 -z-10"></div>
            <div 
              className="absolute top-1/2 h-1 bg-blue-500 transition-all duration-300 -z-10" 
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
        
        {/* Contenu du formulaire */}
        <div className={`p-6 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <FaBuilding className="text-2xl text-blue-500" />
                <h2 className="text-2xl font-bold">Informations sur l'entreprise</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-medium">Nom de l'entreprise</label>
                  <input
                    type="text"
                    name="nom"
                    value={entrepriseData.nom}
                    onChange={handleEntrepriseChange}
                    className={`w-full p-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Taille de l'entreprise</label>
                  <select
                    name="taille"
                    value={entrepriseData.taille}
                    onChange={handleEntrepriseChange}
                    className={`w-full p-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    required
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="petite">Petite (1-50 employés)</option>
                    <option value="moyenne">Moyenne (51-250 employés)</option>
                    <option value="grande">Grande (250+ employés)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Secteur d'activité</label>
                  <select
  name="secteur_id"
  value={entrepriseData.secteur_id}
  onChange={handleEntrepriseChange}
  className={`w-full p-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
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
                
                <div>
                  <label className="block mb-2 font-medium">Certificat de propriété</label>
                  <div className={`border-2 border-dashed rounded-lg p-4 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="file"
                      id="entreprise-certificat"
                      onChange={(e) => handleFileUpload(e, 'entreprise')}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                    />
                    <label htmlFor="entreprise-certificat" className="cursor-pointer">
                      {entrepriseData.certificat_propriete_nom ? (
                        <p className="text-green-500">{entrepriseData.certificat_propriete_nom}</p>
                      ) : (
                        <p className="text-center">
                          <span className="text-blue-500 underline">Cliquez pour uploader</span> ou glissez-déposez le fichier
                        </p>
                      )}
                    </label>
                  </div>
                  <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Formats acceptés: PDF, DOC, DOCX</p>
                </div>
              </div>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <FaMapMarkerAlt className="text-2xl text-blue-500" />
                <h2 className="text-2xl font-bold">Informations sur le site</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-medium">Nom du site</label>
                  <input
                    type="text"
                    name="nom"
                    value={siteData.nom}
                    onChange={handleSiteChange}
                    className={`w-full p-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Adresse</label>
                  <input
                    type="text"
                    name="adresse"
                    value={siteData.adresse}
                    onChange={handleSiteChange}
                    className={`w-full p-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    required
                  />
                </div>
                
                <div className="flex justify-between items-center">
              <label className="text-sm">Préciser la résidence sur la carte</label>
              <button
                onClick={handleGoToMap}
                className="bg-[#003366] text-white py-2 px-4 rounded-md"
              >
                Aller à la carte
              </button>
            </div>
                
                <div>
                  <label className="block mb-2 font-medium">Catégorie du site</label>
                  <select
        name="idCategorieSite"
        value={siteData.idCategorieSite}
        onChange={handleSiteChange}
        className={`w-full p-3 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
        required
    >
        <option value="">Sélectionnez...</option>
        {categoriesSite.map(categorie => (
            <option key={categorie.idCategorieSite} value={categorie.idCategorieSite}>
                {categorie.nom}
            </option>
        ))}
    </select>
                </div>
                
                <div>
                  <label className="block mb-2 font-medium">Certificat de propriété</label>
                  <div className={`border-2 border-dashed rounded-lg p-4 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                    <input
                      type="file"
                      id="site-certificat"
                      onChange={(e) => handleFileUpload(e, 'site')}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                    />
                    <label htmlFor="site-certificat" className="cursor-pointer">
                      {siteData.certificat_propriete_nom ? (
                        <p className="text-green-500">{siteData.certificat_propriete_nom}</p>
                      ) : (
                        <p className="text-center">
                          <span className="text-blue-500 underline">Cliquez pour uploader</span> ou glissez-déposez le fichier
                        </p>
                      )}
                    </label>
                  </div>
                  <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Formats acceptés: PDF, DOC, DOCX</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Boutons de navigation */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className={`flex items-center px-6 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                <FaArrowLeft className="mr-2" /> Précédent
              </button>
            ) : (
              <div></div> 
            )}
            
            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className={`flex items-center px-6 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600`}
              >
                Suivant <FaArrowRight className="ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className={`flex items-center px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600`}
              >
                Terminer <FaCheck className="ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEntreprise;