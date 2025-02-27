import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom'; // Import de useNavigate 

const Residence = ({ idUser }) => {   
  const [residences, setResidences] = useState([]);   
  const [selectedResidence, setSelectedResidence] = useState(0);  // Stocke l'ID de la résidence sélectionnée
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);   
  const [loading, setLoading] = useState(false);   
  const [error, setError] = useState(null);   
  const navigate = useNavigate(); // Hook pour la navigation    

  // Récupérer les résidences de l'utilisateur   
  useEffect(() => {     
    const fetchResidences = async () => {       
      setLoading(true);       
      setError(null);       
      try {         
        const response = await fetch(`http://localhost:8000/sites/${idUser}`);         
        if (!response.ok) {           
          throw new Error('Erreur lors de la récupération des données');         
        }         
        const data = await response.json();         
        setResidences(data);         
        
        // Sélectionner "Toutes les résidences" par défaut si aucune résidence n'est encore sélectionnée
        const savedResidence = localStorage.getItem('selectedResidence');
        const initialSelectedResidence = savedResidence ? parseInt(savedResidence, 10) : 0;
        
        if (initialSelectedResidence === 0 && data.length > 0) {
          setSelectedResidence(0); // Sélectionner "Toutes les résidences" par défaut
        } else {
          setSelectedResidence(initialSelectedResidence); // Utiliser la résidence précédemment sélectionnée
        }

      } catch (error) {         
        setError(error.message);         
        console.error('Erreur lors de la récupération des résidences', error);       
      } finally {         
        setLoading(false);       
      }     
    };      

    if (idUser) {       
      fetchResidences();     
    }   
  }, [idUser]); // Pas besoin de selectedResidence dans les dépendances

  // Fonction pour gérer la sélection d'une résidence   
  const handleResidenceSelect = (residence) => {     
    if (residence.idSite === null) {
      // Si "Toutes les résidences" est sélectionnée, on stocke 0 dans localStorage
      setSelectedResidence(0);
      localStorage.setItem('selectedResidence', 0);
    } else {
      // Sinon, on stocke l'ID de la résidence dans localStorage
      setSelectedResidence(residence.idSite);
      localStorage.setItem('selectedResidence', residence.idSite);
    }
    setIsDropdownOpen(false);   
  };

  // Fonction pour naviguer vers la page de paramètres et passer idUser dans l'URL   
  const goToSettings = () => {     
    navigate(`/Sites-settings/${idUser}`); // Passe idUser dans l'URL   
  };

  return (     
    <div className="residence-component" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>       
      {/* Affichage de l'état de chargement */}       
      {loading && <p>Chargement des résidences...</p>}        
      {/* Affichage des erreurs */}       
      {error && <p style={{ color: 'red' }}>{error}</p>}        
      <div className="dropdown-container" style={{ position: 'relative' }}>         
        <button           
          className="dropdown-button"           
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}           
          style={{             
            backgroundColor: '#ccc',             
            color: '#fff',             
            border: 'none',             
            padding: '5px 10px',             
            fontSize: '14px',             
            cursor: 'pointer',             
            borderRadius: '5px',           
          }}         
        >           
          {selectedResidence === 0 ? 'Toutes les résidences' : residences.find(res => res.idSite === selectedResidence)?.nom}         
        </button>          
        {isDropdownOpen && (           
          <ul className="dropdown-list" style={{ listStyleType: 'none', padding: 0, position: 'absolute', backgroundColor: 'white', border: '1px solid #ccc', width: '100%', marginTop: '5px' }}>             
            {residences.length === 0 ? (               
              <li>Aucune résidence disponible</li>             
            ) : (               
              <>
                <li                   
                  className="dropdown-item"                   
                  onClick={() => handleResidenceSelect({ idSite: null, nom: 'Toutes les résidences' })}                   
                  style={{                     
                    cursor: 'pointer',                     
                    padding: '10px',                     
                    backgroundColor: '#f0f0f0',                     
                    marginBottom: '5px',                   
                  }}                 
                >                   
                  Toutes les résidences                 
                </li> 
                {residences.map((residence) => (                 
                  <li                   
                    key={residence.idSite}                   
                    className="dropdown-item"                   
                    onClick={() => handleResidenceSelect(residence)}                   
                    style={{                     
                      cursor: 'pointer',                     
                      padding: '10px',                     
                      backgroundColor: '#f0f0f0',                     
                      marginBottom: '5px',                   
                    }}                 
                  >                   
                    {residence.nom}                 
                  </li>               
                ))} 
              </>             
            )}           
          </ul>         
        )}       
      </div>        
      {/* Bouton paramètres */}       
      <button         
        className="settings-button"         
        onClick={goToSettings}         
        style={{           
          backgroundColor: 'transparent',           
          border: 'none',           
          cursor: 'pointer',           
          fontSize: '20px',         
        }}       
      >         
        ⚙️       
      </button>     
    </div>   
  ); 
};

export default Residence; 
