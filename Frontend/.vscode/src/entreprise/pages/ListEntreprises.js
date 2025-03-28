import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AiOutlineEdit, AiOutlineDelete, AiOutlineFilePdf, AiOutlineCheck, AiOutlineClockCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { FaBuilding } from "react-icons/fa";
import { motion } from "framer-motion";
import entrepriseImage from "../../assets/entreprise.png";
import { PiBuilding } from "react-icons/pi";
import { useTheme } from "../../commun/context/ThemeContext";
import { AuthContext } from "../../commun/context/AuthContext";

const EntreprisesList = () => {
  const { idUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [secteurs, setSecteurs] = useState([]);
  const [loadingSecteurs, setLoadingSecteurs] = useState(false);
  const [newEntreprise, setNewEntreprise] = useState({ 
    nom: '', 
    taille: '', 
    secteur_id: '', 
    certificat_propriete: null 
  });
  const [showForm, setShowForm] = useState(false);
  const [editingEntreprise, setEditingEntreprise] = useState(null);
  const { theme } = useTheme();

  // Styles dynamiques en fonction du thème
  const bgColor = theme === "dark" ? "bg-[#08112F] text-white" : "bg-white text-[#0078B8]";
  const cardBgColor = theme === "dark" ? "bg-[#5A77DF] text-white" : "bg-[#f0faff] text-[#0078B8]";
  const buttonBg = theme === "dark" ? "bg-[#5A77DF]" : "bg-[#0078B8]";

  useEffect(() => {
    const fetchSecteurs = async () => {
      setLoadingSecteurs(true);
      try {
        const response = await fetch('http://localhost:8000/secteurs');
        if (response.ok) {
          const data = await response.json();
          setSecteurs(data);
        }
      } catch (error) {
        console.error('Error fetching secteurs:', error);
      } finally {
        setLoadingSecteurs(false);
      }
    };
    fetchSecteurs();
  }, []);

  // Récupérer la liste des entreprises
  const fetchEntreprises = async () => {
    const userId = idUser;
    if (!userId) {
      setError('ID utilisateur manquant');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching entreprises for user ${userId}`);
      const response = await fetch(`http://localhost:8000/entreprises/user/${idUser}`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des entreprises');
      }

      const data = await response.json();
      console.log('Data received:', data);
      setEntreprises(data);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntreprises();
  }, [idUser]);

  // Grouper les entreprises par statut
  const approvedEntreprises = entreprises.filter((e) => e.statut_approbation === "approve");
  const pendingEntreprises = entreprises.filter((e) => e.statut_approbation === "en_attente");
  const rejectedEntreprises = entreprises.filter((e) => e.statut_approbation === "non_approve");

  // Supprimer une entreprise
  const handleDelete = async (idEntreprise) => {
    if (window.confirm('Voulez-vous supprimer cette entreprise ?')) {
      try {
        const response = await fetch(`http://localhost:8000/entreprises/${idEntreprise}`, { 
          method: 'DELETE' 
        });
        if (!response.ok) throw new Error('Erreur lors de la suppression');

        setEntreprises((prev) => prev.filter((e) => e.idEntreprise !== idEntreprise));
      } catch (error) {
        setError(error.message);
      }
    }
  };

  // Modifier une entreprise
  const handleModify = (entreprise) => {
    setEditingEntreprise(entreprise);
    setNewEntreprise({
      nom: entreprise.nom,
      taille: entreprise.taille,
      secteur_id: entreprise.secteur_id,
      certificat_propriete: entreprise.certificat_propriete,
    });
    setShowForm(true);
  };

  // Ajouter ou mettre à jour une entreprise
  const handleAddOrUpdateEntreprise = async () => {
    if (!newEntreprise.nom || !newEntreprise.taille || !newEntreprise.secteur_id) {
      setError("Tous les champs sont requis.");
      return;
    }

    try {
      const userId = idUser;
      let url = `http://localhost:8000/entreprises`;
      let method = "POST";

      if (editingEntreprise) {
        url = `http://localhost:8000/entreprises/${editingEntreprise.idEntreprise}`;
        method = "PUT";
      }

      const formData = new FormData();
      formData.append("nom", newEntreprise.nom);
      formData.append("taille", newEntreprise.taille);
      formData.append("secteur_id", newEntreprise.secteur_id);
      formData.append("user_id", userId);
      if (newEntreprise.certificat_propriete) {
        formData.append("certificat_propriete", newEntreprise.certificat_propriete);
      }

      const response = await fetch(url, {
        method,
        body: formData,
      });

      if (!response.ok) throw new Error(`Erreur lors de ${editingEntreprise ? 'la modification' : "l'ajout"}`);

      fetchEntreprises();
      setNewEntreprise({ nom: '', taille: '', secteur_id: '', certificat_propriete: null });
      setEditingEntreprise(null);
      setShowForm(false);
    } catch (error) {
      setError(error.message);
    }
  };

  // Gérer le téléchargement du fichier PDF
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setNewEntreprise({ ...newEntreprise, certificat_propriete: file });
    } else {
      setError("Veuillez sélectionner un fichier PDF valide.");
    }
  };

  // Télécharger le certificat de propriété
  const handleDownloadCertificat = async (idEntreprise) => {
    try {
      const response = await fetch(`http://localhost:8000/entreprises/certificat/${idEntreprise}`);
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

  // Naviguer vers la liste des sites pour une entreprise
  const handleViewSites = (idEntreprise) => {
    navigate(`/listSites/${idEntreprise}`);
  };

  return (
    <section className={`${bgColor} min-h-screen p-10`}>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Illustration - version agrandie */}
        <div className="flex items-center justify-center mt-10">
          <motion.img
            src={entrepriseImage}
            alt="Illustration entreprise"
            className="w-full md:w-3/4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Liste des entreprises */}
        <div>
        <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-black mb-6 text-center md:text-left"  // Changé de text-[#0078B8] à text-black
          >
            Vos Entreprises
          </motion.h1>

          <div className="flex justify-center md:justify-start mb-6">
            <motion.button
              onClick={() => navigate("/entreprise/addEntreprise")}
              className={`${buttonBg} text-white py-2 px-6 rounded-lg hover:bg-[#0055A4] transition-all`}
              whileTap={{ scale: 0.95 }}
            >
              Ajouter une entreprise
            </motion.button>
          </div>

          {/* Entreprises approuvées */}
          <div className="mb-8">
            <div className="space-y-4">
              {entreprises.map((entreprise) => (
                <EntrepriseCard
                  key={entreprise.idEntreprise}
                  entreprise={entreprise}
                  handleModify={handleModify}
                  handleDelete={handleDelete}
                  handleDownloadCertificat={handleDownloadCertificat}
                  handleViewSites={handleViewSites}
                  cardBgColor={cardBgColor}
                />
              ))}
            </div>
          </div>

        
        </div>
      </div>

      {/* Pop-up d'ajout/modification */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-2xl font-semibold text-[#0078B8] mb-4">
              {editingEntreprise ? 'Modifier l\'entreprise' : 'Ajouter une entreprise'}
            </h3>
            
            <input
              type="text"
              placeholder="Nom de l'entreprise"
              value={newEntreprise.nom}
              onChange={(e) => setNewEntreprise({ ...newEntreprise, nom: e.target.value })}
              className="mb-4 p-2 w-full border border-gray-300 rounded-md"
            />
            
            <select
              value={newEntreprise.taille}
              onChange={(e) => setNewEntreprise({ ...newEntreprise, taille: e.target.value })}
              className="mb-4 p-2 w-full border border-gray-300 rounded-md"
            >
              <option value="">Sélectionnez la taille</option>
              <option value="petite">Petite (1-50 employés)</option>
              <option value="moyenne">Moyenne (51-250 employés)</option>
              <option value="grande">Grande (250+ employés)</option>
            </select>
            
            <select
              value={newEntreprise.secteur_id}
              onChange={(e) => setNewEntreprise({ ...newEntreprise, secteur_id: e.target.value })}
              className="mb-4 p-2 w-full border border-gray-300 rounded-md"
              disabled={loadingSecteurs}
            >
              <option value="">Sélectionnez un secteur...</option>
              {secteurs.map(secteur => (
                <option key={secteur.idSecteur} value={secteur.idSecteur}>
                  {secteur.nom}
                </option>
              ))}
            </select>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Certificat de propriété (PDF)
                {editingEntreprise?.certificat_propriete_nom && (
                  <span className="ml-2 text-green-600">
                    Fichier actuel: {editingEntreprise.certificat_propriete_nom}
                  </span>
                )}
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md"
              />
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            <div className="flex gap-4 mt-4">
              <button 
                onClick={handleAddOrUpdateEntreprise} 
                className="bg-[#0078B8] text-white py-2 px-4 rounded-md"
              >
                {editingEntreprise ? 'Modifier' : 'Ajouter'}
              </button>
              <button
                onClick={() => {
                  setNewEntreprise({ nom: '', taille: '', secteur_id: '', certificat_propriete: null });
                  setEditingEntreprise(null);
                  setShowForm(false);
                }}
                className="bg-gray-500 text-white py-2 px-4 rounded-md"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Composant pour afficher une carte d'entreprise
const EntrepriseCard = ({ entreprise, handleModify, handleDelete, handleDownloadCertificat, handleViewSites, cardBgColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${cardBgColor} p-5 rounded-xl shadow-lg border border-gray-300 hover:shadow-2xl transition-all flex justify-between items-center`}
    >
      <div className="flex items-center gap-4">
        <FaBuilding className="text-3xl text-[#0078B8]" />
        <div>
          <p className="text-lg font-semibold">{entreprise.nom}</p>
          <p className="text-sm text-[#0055A4]">Taille: {entreprise.taille}</p>
          <p className="text-sm text-[#0055A4]">Secteur ID: {entreprise.secteur_id}</p>
          {entreprise.statut_approbation === "approve" ? (
            <div className="flex items-center gap-1 text-green-600">
              <AiOutlineCheck /> Approuvé
            </div>
          ) : entreprise.statut_approbation === "non_approve" ? (
            <div className="flex items-center gap-1 text-red-600">
              <AiOutlineCloseCircle /> Non approuvé
            </div>
          ) : (
            <div className="flex items-center gap-1 text-yellow-600">
              <AiOutlineClockCircle /> En attente
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => handleViewSites(entreprise.idEntreprise)}
          className="text-[#0078B8] p-2 rounded-full hover:bg-[#0078B8] hover:text-white transition-all"
        >
          <PiBuilding className="text-2xl" />
        </button>

        <button
          onClick={() => handleDownloadCertificat(entreprise.idEntreprise)}
          className={`text-[#0078B8] p-2 rounded-full hover:bg-[#0078B8] hover:text-white transition-all ${
            !entreprise.certificat_propriete_nom ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!entreprise.certificat_propriete_nom}
        >
          <AiOutlineFilePdf className="text-2xl" />
        </button>

        <button
          onClick={() => handleModify(entreprise)}
          className={`text-[#0078B8] p-2 rounded-full hover:bg-[#0078B8] hover:text-white transition-all ${
            entreprise.statut_approbation === "non_approve" ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={entreprise.statut_approbation === "non_approve"}
        >
          <AiOutlineEdit className="text-xl" />
        </button>

        <button
          onClick={() => handleDelete(entreprise.idEntreprise)}
          className="text-red-600 p-2 rounded-full hover:bg-red-600 hover:text-white transition-all"
        >
          <AiOutlineDelete className="text-xl" />
        </button>
      </div>
    </motion.div>
  );
};

export default EntreprisesList;