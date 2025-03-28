import React, { useState, useEffect, useContext } from 'react';
import { AiOutlineEdit, AiOutlineDelete, AiOutlineFilePdf, AiOutlineCheck, AiOutlineClockCircle, AiOutlineCloseCircle } from "react-icons/ai";
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

  // Styles dynamiques en fonction du thème
  const bgColor = theme === "dark" ? "bg-[#08112F] text-white" : "bg-white text-[#003366]";
  const cardBgColor = theme === "dark" ? "bg-[#5A77DF] text-white" : "bg-[#f0faff] text-[#003366]";
  const buttonBg = theme === "dark" ? "bg-[#5A77DF]" : "bg-[#003366]";

  // Récupérer la liste de toutes les entreprises
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
  
      // Recharger la liste des entreprises après la mise à jour
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
    <section className={`${bgColor} min-h-screen p-10`}>
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Illustration */}
        <div className="flex items-center justify-center mt-10">
          <motion.img
            src={entrepriseImage}
            alt="Illustration entreprise"
            className="w-2/3 md:w-1/2"
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
            className="text-3xl font-bold text-[#003366] mb-6 text-center md:text-left"
          >
            Gestion des Entreprises (Admin)
          </motion.h1>

          {/* Entreprises en attente */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Entreprises en Attente</h2>
            <div className="space-y-4">
              {pendingEntreprises.map((entreprise) => (
                <EntrepriseCard
                  key={entreprise.idEntreprise}
                  entreprise={entreprise}
                  handleDownloadCertificat={handleDownloadCertificat}
                  cardBgColor={cardBgColor}
                  isAdmin={true}
                  onApprove={() => handleApproveOrReject(entreprise.idEntreprise, "approve")}
                  onReject={() => handleApproveOrReject(entreprise.idEntreprise, "non_approve")}
                />
              ))}
            </div>
          </div>

          {/* Entreprises approuvées */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Entreprises Approuvées</h2>
            <div className="space-y-4">
              {approvedEntreprises.map((entreprise) => (
                <EntrepriseCard
                  key={entreprise.idEntreprise}
                  entreprise={entreprise}
                  handleDownloadCertificat={handleDownloadCertificat}
                  cardBgColor={cardBgColor}
                />
              ))}
            </div>
          </div>

          {/* Entreprises non approuvées */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Entreprises Non Approuvées</h2>
            <div className="space-y-4">
              {rejectedEntreprises.map((entreprise) => (
                <EntrepriseCard
                  key={entreprise.idEntreprise}
                  entreprise={entreprise}
                  handleDownloadCertificat={handleDownloadCertificat}
                  cardBgColor={cardBgColor}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Composant pour afficher une carte d'entreprise
const EntrepriseCard = ({ entreprise, handleDownloadCertificat, cardBgColor, isAdmin, onApprove, onReject }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${cardBgColor} p-5 rounded-xl shadow-lg border border-gray-300 hover:shadow-2xl transition-all flex justify-between items-center`}
    >
      <div className="flex items-center gap-4">
        <FaBuilding className="text-3xl text-[#003366]" />
        <div>
          <p className="text-lg font-semibold">{entreprise.nom}</p>
          <p className="text-sm text-[#0055A4]">Taille: {entreprise.taille}</p>
          {/* Badge pour indiquer le statut */}
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
        {entreprise.certificat_propriete_nom && (
          <button
            onClick={() => handleDownloadCertificat(entreprise.idEntreprise)}
            className="text-[#003366] p-2 rounded-full hover:bg-[#003366] hover:text-white transition-all"
          >
            <AiOutlineFilePdf className="text-2xl" />
          </button>
        )}

        {/* Boutons pour approuver ou rejeter (uniquement pour l'admin) */}
        {isAdmin && entreprise.statut_approbation === "en_attente" && (
          <>
            <button
              onClick={onApprove}
              className="text-green-600 p-2 rounded-full hover:bg-green-600 hover:text-white transition-all"
            >
              <AiOutlineCheck className="text-xl" />
            </button>
            <button
              onClick={onReject}
              className="text-red-600 p-2 rounded-full hover:bg-red-600 hover:text-white transition-all"
            >
              <AiOutlineCloseCircle className="text-xl" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdminEntreprisesSettings;