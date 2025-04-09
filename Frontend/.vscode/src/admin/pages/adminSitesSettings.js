import React, { useState, useEffect, useContext } from 'react';
import { AiOutlineEdit, AiOutlineDelete, AiOutlineFilePdf, AiOutlineCheck, AiOutlineClockCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { FaHome, FaBuilding } from "react-icons/fa";
import { motion } from "framer-motion";
import residenceImage from "../../assets/residence.png";
import { PiMapPinArea } from "react-icons/pi";
import { useTheme } from "../../commun/context/ThemeContext";
import { AuthContext } from "../../commun/context/AuthContext";
import { useNavigate } from 'react-router-dom';

const AdminSitesSettings = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const { role } = useContext(AuthContext);

  const bgColor = theme === "dark" ? "bg-[#08112F] text-white" : "bg-white text-[#003366]";
  const cardBgColor = theme === "dark" ? "bg-[#5A77DF] text-white" : "bg-[#f0faff] text-[#003366]";
  
  // Récupérer la liste de tous les sites
  const fetchAllSites = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/sites`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des sites');

      const data = await response.json();
      setSites(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Approuver ou rejeter un site
  const handleApproveOrReject = async (siteId, statut) => {
    try {
      const response = await fetch(
        `http://localhost:8000/sites/approve/${siteId}?statut=${statut}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      fetchAllSites();
    } catch (error) {
      setError(error.message);
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

  useEffect(() => {
    if (role === null) return;
    if (role !== 'admin') {
      navigate('/acceuil');
    } else {
      fetchAllSites();
    }
  }, [role, navigate]);

  const handleGoToMapWithSitePosition = async (siteId) => {
    try {
      const response = await fetch(`http://localhost:8000/site/position/${siteId}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des coordonnées du site');

      const { latitude, longitude } = await response.json();
      navigate('/maps', {
        state: {
          coordinates: { lat: latitude, lng: longitude },
          isEditing: false,
          residenceId: siteId,
          adminSitesSettings: true
        },
      });
    } catch (error) {
      setError(error.message);
    }
  };

  // Filtrer les sites
  const residences = sites.filter(site => site.entreprise === null);
  const businessLocations = sites.filter(site => site.entreprise !== null);
  // Grouper par statut
  const approvedResidences = residences.filter(site => site.statut_approbation === "approve");
  const pendingResidences = residences.filter(site => site.statut_approbation === "en_attente");
  const rejectedResidences = residences.filter(site => site.statut_approbation === "non_approve");

  const approvedBusinessLocations = businessLocations.filter(site => site.statut_approbation === "approve");
  const pendingBusinessLocations = businessLocations.filter(site => site.statut_approbation === "en_attente");
  const rejectedBusinessLocations = businessLocations.filter(site => site.statut_approbation === "non_approve");

  if (role !== 'admin') {
    return null;
  }

  return (
    <section className={`${bgColor} min-h-screen p-4 md:p-10`}>
      <div className="container mx-auto">
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold text-[#003366] mb-6 text-center"
        >
          Gestion des Sites (Admin)
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne de gauche - Résidences */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <FaHome className="text-[#003366]" /> Résidences
            </h2>

            {/* Résidences en attente */}
            {pendingResidences.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">En Attente</h3>
                <div className="space-y-4">
                  {pendingResidences.map((site) => (
                    <SiteCard
                      key={site.idSite}
                      site={site}
                      handleGoToMapWithSitePosition={handleGoToMapWithSitePosition}
                      handleDownloadCertificat={handleDownloadCertificat}
                      cardBgColor={cardBgColor}
                      isAdmin={true}
                      onApprove={() => handleApproveOrReject(site.idSite, "approve")}
                      onReject={() => handleApproveOrReject(site.idSite, "non_approve")}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Résidences approuvées */}
            {approvedResidences.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Approuvées</h3>
                <div className="space-y-4">
                  {approvedResidences.map((site) => (
                    <SiteCard
                      key={site.idSite}
                      site={site}
                      handleGoToMapWithSitePosition={handleGoToMapWithSitePosition}
                      handleDownloadCertificat={handleDownloadCertificat}
                      cardBgColor={cardBgColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Résidences non approuvées */}
            {rejectedResidences.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Non Approuvées</h3>
                <div className="space-y-4">
                  {rejectedResidences.map((site) => (
                    <SiteCard
                      key={site.idSite}
                      site={site}
                      handleGoToMapWithSitePosition={handleGoToMapWithSitePosition}
                      handleDownloadCertificat={handleDownloadCertificat}
                      cardBgColor={cardBgColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Colonne de droite - Locaux d'entreprise */}
          <div>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <FaBuilding className="text-[#003366]" /> Locaux des Entreprises
            </h2>

            {/* Locaux en attente (uniquement si l'entreprise est approuvée) */}
            {pendingBusinessLocations.filter(site => site.entreprise?.statut_approbation === "approve").length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">En Attente</h3>
                <div className="space-y-4">
                  {pendingBusinessLocations
                    .filter(site => site.entreprise?.statut_approbation === "approve")
                    .map((site) => (
                      <SiteCard
                        key={site.idSite}
                        site={site}
                        handleGoToMapWithSitePosition={handleGoToMapWithSitePosition}
                        handleDownloadCertificat={handleDownloadCertificat}
                        cardBgColor={cardBgColor}
                        isAdmin={true}
                        onApprove={() => handleApproveOrReject(site.idSite, "approve")}
                        onReject={() => handleApproveOrReject(site.idSite, "non_approve")}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Locaux approuvés */}
            {approvedBusinessLocations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Approuvés</h3>
                <div className="space-y-4">
                  {approvedBusinessLocations.map((site) => (
                    <SiteCard
                      key={site.idSite}
                      site={site}
                      handleGoToMapWithSitePosition={handleGoToMapWithSitePosition}
                      handleDownloadCertificat={handleDownloadCertificat}
                      cardBgColor={cardBgColor}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Locaux non approuvés */}
            {rejectedBusinessLocations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Non Approuvés</h3>
                <div className="space-y-4">
                  {rejectedBusinessLocations.map((site) => (
                    <SiteCard
                      key={site.idSite}
                      site={site}
                      handleGoToMapWithSitePosition={handleGoToMapWithSitePosition}
                      handleDownloadCertificat={handleDownloadCertificat}
                      cardBgColor={cardBgColor}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const SiteCard = ({ site, handleDownloadCertificat, cardBgColor, isAdmin, onApprove, onReject, handleGoToMapWithSitePosition }) => {
  const isBusinessLocation = site.entreprise !== null;
  const isEnterpriseApproved = site.entreprise?.statut_approbation === "approve";
console.log(site)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${cardBgColor} p-5 rounded-xl shadow-lg border border-gray-300 hover:shadow-2xl transition-all flex justify-between items-center`}
    >
      <div className="flex items-center gap-4">
        {isBusinessLocation ? (
          <FaBuilding className="text-3xl text-[#003366]" />
        ) : (
          <FaHome className="text-3xl text-[#003366]" />
        )}
        <div>
          <p className="text-lg font-semibold">{site.nom}</p>
          <p className="text-sm text-[#0055A4]">{site.adresse}</p>
          
          {/* Afficher le nom de l'entreprise si c'est un local d'entreprise */}
          {isBusinessLocation && (
            <p className="text-sm">
              Entreprise: {site.entreprise?.nom || 'Inconnue'}
              {site.entreprise?.statut_approbation !== "approve" && (
                <span className="text-yellow-600 ml-2">(Entreprise en attente)</span>
              )}
            </p>
          )}
          
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
        {/* Bouton pour voir la position sur la carte */}
        <button
          onClick={() => handleGoToMapWithSitePosition(site.idSite)}
          className="text-[#003366] p-2 rounded-full hover:bg-[#003366] hover:text-white transition-all"
          title="Voir sur la carte"
        >
          <PiMapPinArea className="text-2xl" />
        </button>

        {/* Bouton pour télécharger le PDF */}
        {site.certificat_propriete_nom && (
          <button
            onClick={() => handleDownloadCertificat(site.idSite)}
            className="text-[#003366] p-2 rounded-full hover:bg-[#003366] hover:text-white transition-all"
            title="Télécharger le certificat"
          >
            <AiOutlineFilePdf className="text-2xl" />
          </button>
        )}

        {/* Boutons pour approuver ou rejeter (uniquement pour l'admin et si ce n'est pas un local d'entreprise OU si l'entreprise est approuvée) */}
        {isAdmin && site.statut_approbation === "en_attente" && (!isBusinessLocation || isEnterpriseApproved) && (
          <>
            <button
              onClick={onApprove}
              className="text-green-600 p-2 rounded-full hover:bg-green-600 hover:text-white transition-all"
              title="Approuver"
            >
              <AiOutlineCheck className="text-xl" />
            </button>
            <button
              onClick={onReject}
              className="text-red-600 p-2 rounded-full hover:bg-red-600 hover:text-white transition-all"
              title="Rejeter"
            >
              <AiOutlineCloseCircle className="text-xl" />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default AdminSitesSettings;