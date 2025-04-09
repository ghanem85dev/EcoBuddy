import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AiOutlineEdit, AiOutlineDelete, AiOutlineFilePdf, AiOutlineCheck, AiOutlineClockCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { FaHome } from "react-icons/fa";
import { motion } from "framer-motion";
import residenceImage from "../../assets/residence.png";
import { PiMapPinArea } from "react-icons/pi";
import { useTheme } from "../../commun/context/ThemeContext";

const SitesSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [residences, setResidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newResidence, setNewResidence] = useState({ nom: '', adresse: '', latitude: 0, longitude: 0, certificat_propriete: null });
  const [showForm, setShowForm] = useState(false);
  const [editingResidence, setEditingResidence] = useState(null);
  const [coordinates, setCoordinates] = useState(null);
  const { theme } = useTheme();

  // Styles dynamiques en fonction du thème
  const bgColor = theme === "dark" ? "bg-[#08112F] text-white" : "bg-white text-[#003366]";
  const cardBgColor = theme === "dark" ? "bg-[#5A77DF] text-white" : "bg-[#f0faff] text-[#003366]";
  const buttonBg = theme === "dark" ? "bg-[#5A77DF]" : "bg-[#003366]";

  // Récupérer les coordonnées et les données du formulaire après retour de la carte
  useEffect(() => {
    const savedData = localStorage.getItem("residenceData");
    const coordinates = localStorage.getItem("coordinates");
    const editingResidenceId = localStorage.getItem("editingResidenceId");

    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const parsedDataCoordinates = JSON.parse(coordinates);
      setNewResidence({
        nom: parsedData.nom || '',
        adresse: parsedData.adresse || '',
        latitude: parsedDataCoordinates.lat || 0,
        longitude: parsedDataCoordinates.lng || 0,
        certificat_propriete: parsedData.certificat_propriete || null,
      });

      if (editingResidenceId) {
        const residenceToEdit = residences.find(residence => residence.idSite === parseInt(editingResidenceId));
        if (residenceToEdit) {
          setEditingResidence(residenceToEdit);
        }
      }

      setShowForm(true);
    }
  }, [residences]);

  // Récupérer la liste des résidences
  const fetchResidences = async () => {
    if (!id) {
      setError('ID utilisateur manquant');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/sites/${id}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des résidences');

      const data = await response.json();
      setResidences(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidences();
  }, [id]);

  // Grouper les résidences par statut
  const approvedResidences = residences.filter((site) => site.statut_approbation === "approve");
  const pendingResidences = residences.filter((site) => site.statut_approbation === "en_attente");
  const rejectedResidences = residences.filter((site) => site.statut_approbation === "non_approve");

  // Supprimer une résidence
  const handleDelete = async (idSite) => {
    if (window.confirm('Voulez-vous supprimer cette résidence ?')) {
      try {
        const response = await fetch(`http://localhost:8000/sites/${idSite}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erreur lors de la suppression');

        setResidences((prev) => prev.filter((residence) => residence.idSite !== idSite));
      } catch (error) {
        setError(error.message);
      }
    }
  };

  // Modifier une résidence
  const handleModify = (residence) => {
    setEditingResidence(residence);
    setNewResidence({
      nom: residence.nom,
      adresse: residence.adresse,
      latitude: residence.latitude,
      longitude: residence.longitude,
      certificat_propriete: residence.certificat_propriete,
    });
    setShowForm(true);
  };

  // Ajouter ou mettre à jour une résidence
  const handleAddOrUpdateResidence = async () => {
    if (!newResidence.nom || !newResidence.adresse) {
      setError("Le nom et l'adresse sont requis.");
      return;
    }

    try {
      let url = `http://localhost:8000/sites/${id}/1`;
      let method = "POST";

      if (editingResidence) {
        url = `http://localhost:8000/sites/${editingResidence.idSite}/1`;
        method = "PUT";
      }

      const formData = new FormData();
      formData.append("nom", newResidence.nom);
      formData.append("adresse", newResidence.adresse);
      formData.append("latitude", newResidence.latitude);
      formData.append("longitude", newResidence.longitude);
      if (newResidence.certificat_propriete) {
        formData.append("certificat_propriete", newResidence.certificat_propriete);
      }

      const response = await fetch(url, {
        method,
        body: formData,
      });

      localStorage.removeItem("residenceData");
      localStorage.removeItem("editingResidenceId");

      if (!response.ok) throw new Error(`Erreur lors de ${editingResidence ? 'la modification' : "l'ajout"}`);

      fetchResidences(); // Recharger les résidences
      setNewResidence({ nom: '', adresse: '', latitude: 0, longitude: 0, certificat_propriete: null });
      setEditingResidence(null);
      setShowForm(false);
    } catch (error) {
      setError(error.message);
    }
  };

  // Gérer le téléchargement du fichier PDF
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setNewResidence({ ...newResidence, certificat_propriete: file });
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
      a.download = "certificat_propriete.pdf"; // Nom du fichier à télécharger
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error.message);
    }
  };

  // Redirection vers la carte pour ajouter/modifier une résidence
  const handleGoToMap = () => {
    localStorage.setItem("residenceData", JSON.stringify({
      nom: newResidence.nom || '',
      adresse: newResidence.adresse || '',
      certificat_propriete: newResidence.certificat_propriete || null,
    }));

    if (editingResidence) {
      localStorage.setItem("editingResidenceId", editingResidence.idSite);
    }

    navigate('/maps', {
      state: {
        coordinates: { lat: newResidence.latitude, lng: newResidence.longitude },
        isEditing: true,
        residenceId: editingResidence?.idSite,
      },
    });
  };

  // Redirection vers la carte pour visualiser ou modifier la position d'une résidence existante
  const handleGoToMapWithSitePosition = async (siteId) => {
    try {
      const response = await fetch(`http://localhost:8000/site/position/${siteId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des coordonnées du site');

      const { latitude, longitude } = await response.json();
      navigate('/maps', {
        state: {
          coordinates: { lat: latitude, lng: longitude },
          isEditing: false, // Désactiver le mode édition
          residenceId: siteId,
        },
      });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <section className={`${bgColor} min-h-screen p-10`}>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Illustration */}
        <div className="flex items-center justify-center mt-10">
          <motion.img
            src={residenceImage}
            alt="Illustration résidence"
            className="w-2/3 md:w-1/2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Liste des résidences */}
        <div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold text-[#003366] mb-6 text-center md:text-left"
          >
            Vos Résidences
          </motion.h1>

          <div className="flex justify-center md:justify-start mb-6">
            <motion.button
              onClick={() => setShowForm(true)}
              className={`${buttonBg} text-white py-2 px-6 rounded-lg hover:bg-[#0055A4] transition-all`}
              whileTap={{ scale: 0.95 }}
            >
              Ajouter une résidence
            </motion.button>
          </div>

          {/* Résidences approuvées */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Résidences Approuvées</h2>
            <div className="space-y-4">
              {approvedResidences.map((site) => (
                <ResidenceCard
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

          {/* Résidences en attente */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Résidences en Attente</h2>
            <div className="space-y-4">
              {pendingResidences.map((site) => (
                <ResidenceCard
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

          {/* Résidences non approuvées */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Résidences Non Approuvées</h2>
            <div className="space-y-4">
              {rejectedResidences.map((site) => (
                <ResidenceCard
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
      </div>

      {/* Pop-up d'ajout/modification */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-2xl font-semibold text-[#003366] mb-4">
              {editingResidence ? 'Modifier la résidence' : 'Ajouter une résidence'}
            </h3>
            <input
              type="text"
              placeholder="Nom de la résidence"
              value={newResidence.nom}
              onChange={(e) => setNewResidence({ ...newResidence, nom: e.target.value })}
              className="mb-4 p-2 w-full border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Adresse de la résidence"
              value={newResidence.adresse}
              onChange={(e) => setNewResidence({ ...newResidence, adresse: e.target.value })}
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
              <label className="text-sm">Préciser la résidence sur la carte</label>
              <button
                onClick={handleGoToMap}
                className="bg-[#003366] text-white py-2 px-4 rounded-md"
              >
                Aller à la carte
              </button>
            </div>

            <div className="flex gap-4 mt-4">
              <button onClick={handleAddOrUpdateResidence} className="bg-[#003366] text-white py-2 px-4 rounded-md">
                {editingResidence ? 'Modifier' : 'Ajouter'}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("residenceData");
                  localStorage.removeItem("editingResidenceId");
                  setNewResidence({ nom: '', adresse: '', latitude: 0, longitude: 0, certificat_propriete: null });
                  setEditingResidence(null);
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

// Composant pour afficher une carte de résidence
const ResidenceCard = ({ site, handleModify, handleDelete, handleDownloadCertificat, handleGoToMapWithSitePosition, cardBgColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${cardBgColor} p-5 rounded-xl shadow-lg border border-gray-300 hover:shadow-2xl transition-all flex justify-between items-center`}
    >
      <div className="flex items-center gap-4">
        <FaHome className="text-3xl text-[#003366]" />
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
        {/* Bouton pour télécharger le PDF (toujours visible) */}
        <button
          onClick={() => handleDownloadCertificat(site.idSite)}
          className={`text-[#003366] p-2 rounded-full hover:bg-[#003366] hover:text-white transition-all ${
            !site.certificat_propriete_nom ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!site.certificat_propriete_nom}
        >
          <AiOutlineFilePdf className="text-2xl" />
        </button>

        {/* Bouton pour voir la position sur la carte */}
        <button
          onClick={() => handleGoToMapWithSitePosition(site.idSite)}
          className="text-[#003366] p-2 rounded-full hover:bg-[#003366] hover:text-white transition-all"
        >
          <PiMapPinArea className="text-2xl" />
        </button>

        {/* Bouton pour modifier (désactivé si le site n'est pas approuvé) */}
        <button
          onClick={() => handleModify(site)}
          className={`text-[#003366] p-2 rounded-full hover:bg-[#003366] hover:text-white transition-all ${
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

export default SitesSettings;