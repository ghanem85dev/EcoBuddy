import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AiOutlineEdit, AiOutlineDelete, AiOutlineFilePdf, AiOutlineCheck, AiOutlineClockCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { FaHome } from "react-icons/fa";
import { motion } from "framer-motion";
import residenceImage from "../../assets/SitesEntreprise.png";
import { PiMapPinArea } from "react-icons/pi";
import { useTheme } from "../../commun/context/ThemeContext";
import { AuthContext } from "../../commun/context/AuthContext"; // Importez AuthContext
import { FaUser } from "react-icons/fa";
const EntrepriseSites = () => {
  const { entreprise_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newSite, setNewSite] = useState({ nom: '', adresse: '', latitude: 0, longitude: 0, certificat_propriete: null });
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const { theme } = useTheme();

  const { idUser } = useContext(AuthContext);

  // Styles dynamiques en fonction du thème
  const bgColor = theme === "dark" ? "bg-[#08112F] text-white" : "bg-white text-[#0078B8]";
  const cardBgColor = theme === "dark" ? "bg-[#5A77DF] text-white" : "bg-[#f0faff] text-[#0078B8]";
  const buttonBg = theme === "dark" ? "bg-[#5A77DF]" : "bg-[#0078B8]";

  // Récupérer les coordonnées et les données du formulaire après retour de la carte
  useEffect(() => {
    console.log({entreprise_id})
    const savedData = localStorage.getItem("siteData");
    const coordinates = localStorage.getItem("coordinates");
    const editingSiteId = localStorage.getItem("editingSiteId");

    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const parsedDataCoordinates = JSON.parse(coordinates);
      setNewSite({
        nom: parsedData.nom || '',
        adresse: parsedData.adresse || '',
        latitude: parsedDataCoordinates.lat || 0,
        longitude: parsedDataCoordinates.lng || 0,
        certificat_propriete: parsedData.certificat_propriete || null,
      });

      if (editingSiteId) {
        const siteToEdit = sites.find(site => site.idSite === parseInt(editingSiteId));
        if (siteToEdit) {
          setEditingSite(siteToEdit);
        }
      }

      setShowForm(true);
    }
  }, [sites]);

  // Récupérer la liste des sites de l'entreprise
  const fetchSites = async () => {
    if (!entreprise_id) {
      setError('ID entreprise manquant');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/sites/entreprise/${entreprise_id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des sites');

      const data = await response.json();
      setSites(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, [entreprise_id]);

  // Grouper les sites par statut
  const approvedSites = sites.filter((site) => site.statut_approbation === "approve");
  const pendingSites = sites.filter((site) => site.statut_approbation === "en_attente");
  const rejectedSites = sites.filter((site) => site.statut_approbation === "non_approve");

  // Supprimer un site
  const handleDelete = async (idSite) => {
    if (window.confirm('Voulez-vous supprimer ce site ?')) {
      try {
        const response = await fetch(`http://localhost:8000/sites/${idSite}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erreur lors de la suppression');

        setSites((prev) => prev.filter((site) => site.idSite !== idSite));
      } catch (error) {
        setError(error.message);
      }
    }
  };

  // Modifier un site
  const handleModify = (site) => {
    setEditingSite(site);
    setNewSite({
      nom: site.nom,
      adresse: site.adresse,
      latitude: site.latitude,
      longitude: site.longitude,
      certificat_propriete: site.certificat_propriete,
    });
    setShowForm(true);
  };

  // Ajouter ou mettre à jour un site
  const handleAddOrUpdateSite = async () => {
    if (!newSite.nom || !newSite.adresse) {
      setError("Le nom et l'adresse sont requis.");
      return;
    }

    try {
      let url = `http://localhost:8000/sites/${idUser}/${entreprise_id}/1`;
      let method = "POST";

      if (editingSite) {
        url = `http://localhost:8000/sites/${editingSite.idSite}/1`;
        method = "PUT";
      }

      const formData = new FormData();
      formData.append("nom", newSite.nom);
      formData.append("adresse", newSite.adresse);
      formData.append("latitude", newSite.latitude);
      formData.append("longitude", newSite.longitude);
      if (newSite.certificat_propriete) {
        formData.append("certificat_propriete", newSite.certificat_propriete);
      }

      const response = await fetch(url, {
        method,
        body: formData,
      });

      localStorage.removeItem("siteData");
      localStorage.removeItem("editingSiteId");

      if (!response.ok) throw new Error(`Erreur lors de ${editingSite ? 'la modification' : "l'ajout"}`);

      fetchSites(); // Recharger les sites
      setNewSite({ nom: '', adresse: '', latitude: 0, longitude: 0, certificat_propriete: null });
      setEditingSite(null);
      setShowForm(false);
    } catch (error) {
      setError(error.message);
    }
  };

  // Gérer le téléchargement du fichier PDF
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setNewSite({ ...newSite, certificat_propriete: file });
    } else {
      setError("Veuillez sélectionner un fichier PDF valide.");
    }
  };

  // Télécharger le certificat de propriété
  const handleDownloadCertificat = async (siteId) => {
    try {
      const response = await fetch(`http://localhost:8000/site/certificat/${siteId}`);
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

  // Redirection vers la carte pour ajouter/modifier un site
  const handleGoToMap = () => {
    localStorage.setItem("siteData", JSON.stringify({
      nom: newSite.nom || '',
      adresse: newSite.adresse || '',
      certificat_propriete: newSite.certificat_propriete || null,
    }));

    if (editingSite) {
      localStorage.setItem("editingSiteId", editingSite.idSite);
    }

    navigate('/maps', {
      state: {
        coordinates: { lat: newSite.latitude, lng: newSite.longitude },
        entreprise:true,
        isEditing: true,
        siteId: editingSite?.idSite,
        idEntreprise : entreprise_id
      },
    });
  };

  // Redirection vers la carte pour visualiser ou modifier la position d'un site existant
  const handleGoToMapWithSitePosition = async (siteId) => {
    try {
      const response = await fetch(`http://localhost:8000/site/position/${siteId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des coordonnées du site');

      const { latitude, longitude } = await response.json();
      navigate('/maps', {
        state: {
          coordinates: { lat: latitude, lng: longitude },
          isEditing: false,
          siteId: siteId,
        },
      });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <section className={`${bgColor} min-h-screen p-10`}>
    <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Liste des sites - maintenant à gauche */}
      <div className="order-2 md:order-1">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-black mb-6 text-center md:text-left"
        >
          Sites de l'Entreprise
        </motion.h1>

        <div className="flex justify-center md:justify-start mb-6">
          <motion.button
            onClick={() => setShowForm(true)}
            className={`${buttonBg} text-white py-2 px-6 rounded-lg hover:bg-[#0055A4] transition-all`}
            whileTap={{ scale: 0.95 }}
          >
            Ajouter un site
          </motion.button>
        </div>

        <div className="mb-8">
          <div className="space-y-4">
            {sites.map((site) => (
              <SiteCard
                key={site.idSite}
                site={site}
                handleModify={handleModify}
                handleDelete={handleDelete}
                handleDownloadCertificat={handleDownloadCertificat}
                handleGoToMapWithSitePosition={handleGoToMapWithSitePosition}
                cardBgColor={cardBgColor}
              />
            ))}
          </div>
        </div>
        </div>
      {/* Illustration - maintenant à droite et agrandie */}
      <div className="order-1 md:order-2 flex items-center justify-center mt-10">
        <motion.img
          src={residenceImage}
          alt="Illustration site"
          className="w-full md:w-4/5 max-w-2xl"  // Image agrandie
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
      {/* Pop-up d'ajout/modification */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-2xl font-semibold text-[#0078B8] mb-4">
              {editingSite ? 'Modifier le site' : 'Ajouter un site'}
            </h3>
            <input
              type="text"
              placeholder="Nom du site"
              value={newSite.nom}
              onChange={(e) => setNewSite({ ...newSite, nom: e.target.value })}
              className="mb-4 p-2 w-full border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Adresse du site"
              value={newSite.adresse}
              onChange={(e) => setNewSite({ ...newSite, adresse: e.target.value })}
              className="mb-4 p-2 w-full border border-gray-300 rounded-md"
            />

            {/* Champ pour télécharger le fichier PDF */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Certificat de propriété (PDF)</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="mt-1 p-2 w-full border border-gray-300 rounded-md"
              />
            </div>

            {/* Afficher les coordonnées */}
            {coordinates && (
              <div className="mb-4">
                <p className="text-sm">Coordonnées: {coordinates.lat}, {coordinates.lng}</p>
              </div>
            )}

            <div className="flex justify-between items-center">
              <label className="text-sm">Préciser le site sur la carte</label>
              <button
                onClick={handleGoToMap}
                className="bg-[#0078B8] text-white py-2 px-4 rounded-md"
              >
                Aller à la carte
              </button>
            </div>

            <div className="flex gap-4 mt-4">
              <button onClick={handleAddOrUpdateSite} className="bg-[#0078B8] text-white py-2 px-4 rounded-md">
                {editingSite ? 'Modifier' : 'Ajouter'}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("siteData");
                  localStorage.removeItem("editingSiteId");
                  setNewSite({ nom: '', adresse: '', latitude: 0, longitude: 0, certificat_propriete: null });
                  setEditingSite(null);
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

// Composant pour afficher une carte de site
const SiteCard = ({ site, handleModify, handleDelete, handleDownloadCertificat, handleGoToMapWithSitePosition, cardBgColor }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${cardBgColor} p-5 rounded-xl shadow-lg border border-gray-300 hover:shadow-2xl transition-all flex justify-between items-center`}
    >
      <div className="flex items-center gap-4">
        <FaHome className="text-3xl text-[#0078B8]"></FaHome>
        <div>
          <p className="text-lg font-semibold">{site.nom}</p>
          <p className="text-sm text-[#0055A4]">{site.adresse}</p>
          {/* Badge pour indiquer le statut */}
          {site.statut_approbation === "approve" ? (
            <div className="flex items-center gap-1 text-green-600">
              <AiOutlineCheck /> Approuvé
            </div>
          ) : site.statut_approbation === "non_approve" ? (
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
        {/* Bouton pour inviter (seulement pour les sites approuvés) */}
        {site.statut_approbation === "approve" && (
          <button
            onClick={() => navigate(`/invite?siteId=${site.idSite}`)}
            className="text-[#0078B8] p-2 rounded-full hover:bg-[#0078B8] hover:text-white transition-all"
            title="Inviter des utilisateurs"
          >
            <FaUser className="text-xl" />
          </button>
        )}

        {/* Bouton pour télécharger le PDF */}
        <button
          onClick={() => handleDownloadCertificat(site.idSite)}
          className={`text-[#0078B8] p-2 rounded-full hover:bg-[#0078B8] hover:text-white transition-all ${
            !site.certificat_propriete_nom ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!site.certificat_propriete_nom}
        >
          <AiOutlineFilePdf className="text-2xl" />
        </button>

        {/* Bouton pour voir la position sur la carte */}
        <button
          onClick={() => handleGoToMapWithSitePosition(site.idSite)}
          className="text-[#0078B8] p-2 rounded-full hover:bg-[#0078B8] hover:text-white transition-all"
        >
          <PiMapPinArea className="text-2xl" />
        </button>

        {/* Bouton pour modifier (désactivé si le site n'est pas approuvé) */}
        <button
          onClick={() => handleModify(site)}
          className={`text-[#0078B8] p-2 rounded-full hover:bg-[#0078B8] hover:text-white transition-all ${
            site.statut_approbation === "non_approve" ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={site.statut_approbation === "non_approve"}
        >
          <AiOutlineEdit className="text-xl" />
        </button>

        {/* Bouton pour supprimer */}
        <button
          onClick={() => handleDelete(site.idSite)}
          className="text-red-600 p-2 rounded-full hover:bg-red-600 hover:text-white transition-all"
        >
          <AiOutlineDelete className="text-xl" />
        </button>
      </div>
    </motion.div>
  );
};

export default EntrepriseSites;