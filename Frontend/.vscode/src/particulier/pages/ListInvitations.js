import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import InvitationCard from "../../commun/components/InvitationCard";
import { FiFilter, FiRefreshCw, FiAlertCircle, FiPlus, FiSearch, FiInbox, FiSend, FiX } from "react-icons/fi";
import { AuthContext } from "../../commun/context/AuthContext";
import { useContext } from "react";

const ListInvitations = () => {
  const { idUser, role } = useContext(AuthContext);
  const [state, setState] = useState({
    invitations: [],
    loading: true,
    error: null,
    filter: "all",
    refresh: false,
    searchQuery: "",
    tab: "received"
  });

  // État pour la modal d'invitation
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState("");
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");
  const [inviteError, setInviteError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  useEffect(() => {
    if (idUser) {
      fetchData();
    }
  }, [idUser, state.refresh, state.tab]);

  const fetchData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const endpoint = state.tab === "sent" 
        ? `http://localhost:8000/api/invitations/sent/${idUser}`
        : `http://localhost:8000/api/invitations/received/${idUser}`;
      const response = await axios.get(endpoint);
      setState(prev => ({ ...prev, invitations: response.data, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.response?.data?.message || error.message,
        loading: false
      }));
    }
  };

  // Charger les sites disponibles pour l'utilisateur
  const fetchSites = async () => {
    if (!idUser) return;
    
    try {
      const response = await axios.get(`http://localhost:8000/own-approved-sites/${idUser}`);
      setSites(response.data);
      if (response.data.length > 0) {
        setSelectedSite(response.data[0].idSite);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des sites", error);
    }
  };

  useEffect(() => {
    fetchData();
    if (showInviteModal) {
      fetchSites();
    }
  }, [state.refresh, state.tab, showInviteModal]);

  const getStatusCounts = () => {
    const counts = {
      all: state.invitations.length,
      pending: 0,
      accepted: 0,
      rejected: 0
    };

    state.invitations.forEach(inv => {
      const status = inv.status?.toLowerCase();
      if (status === 'pending') counts.pending++;
      else if (status === 'accepted') counts.accepted++;
      else if (status === 'rejected') counts.rejected++;
    });

    return [
      { value: "all", label: "Toutes", count: counts.all },
      { value: "pending", label: "En attente", count: counts.pending },
      { value: "accepted", label: "Acceptées", count: counts.accepted },
      { value: "rejected", label: "Refusées", count: counts.rejected }
    ];
  };

  const statusFilters = getStatusCounts();

  const filteredInvitations = state.invitations.filter(inv => {
    const matchesFilter = state.filter === "all" || inv.status?.toLowerCase() === state.filter;
    const matchesSearch = inv.site_name?.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                         (state.tab === "received" 
                           ? inv.sender_email?.toLowerCase().includes(state.searchQuery.toLowerCase())
                           : inv.recipient_email?.toLowerCase().includes(state.searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleTabChange = (tab) => {
    setState(prev => ({ ...prev, tab, filter: "all", searchQuery: "" }));
  };

  const handleInvite = async () => {
    if (!email || !selectedSite) {
      setInviteError("Veuillez entrer un email et sélectionner un site.");
      return;
    }

    setIsSending(true);
    setInviteError(null);

    try {
      await axios.post("http://localhost:8000/api/invite", {
        email,
        site_id: Number(selectedSite),
        owner_id: idUser,
      });

      // Fermer la modal et rafraîchir la liste
      setShowInviteModal(false);
      setEmail("");
      setState(prev => ({ ...prev, refresh: !prev.refresh }));
    } catch (error) {
      console.error(error);
      setInviteError(error.response?.data?.detail || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setIsSending(false);
    }
  };

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
        <p className="text-gray-400">Chargement des invitations...</p>
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
          onClick={() => setState(prev => ({ ...prev, refresh: !prev.refresh }))}
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
        >
          <FiRefreshCw />
          Réessayer
        </button>
      </motion.div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Barre supérieure avec filtres et actions */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Boutons de navigation Reçues/Envoyées */}
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => handleTabChange("received")}
                className={`px-3 py-1 rounded-md flex items-center gap-2 text-sm ${
                  state.tab === "received" ? "bg-white text-gray-800 shadow-sm" : "text-gray-600 hover:text-gray-800"
                } transition-colors`}
              >
                <FiInbox size={16} />
                <span>Reçues</span>
              </button>
              <button
                onClick={() => handleTabChange("sent")}
                className={`px-3 py-1 rounded-md flex items-center gap-2 text-sm ${
                  state.tab === "sent" ? "bg-white text-gray-800 shadow-sm" : "text-gray-600 hover:text-gray-800"
                } transition-colors`}
              >
                <FiSend size={16} />
                <span>Envoyées</span>
              </button>
            </div>

            {/* Filtres par statut */}
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
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-black hover:bg-black text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FiPlus size={18} />
              <span>Inviter</span>
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="p-6">
          {filteredInvitations.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300"
            >
              <p className="text-gray-500">
                {state.searchQuery 
                  ? "Aucun résultat trouvé pour votre recherche"
                  : `Aucune invitation ${state.tab === "sent" ? "envoyée" : "reçue"} trouvée`}
              </p>
            </motion.div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500">
                {filteredInvitations.length} invitation(s) {state.tab === "sent" ? "envoyée(s)" : "reçue(s)"}
                {state.filter !== "all" && ` (filtrée(s) par statut "${state.filter}")`}
              </div>
              
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <AnimatePresence>
                  {filteredInvitations.map(invitation => (
                    <InvitationCard 
                      key={invitation.id} 
                      invitation={invitation} 
                      variant={state.tab}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Modal d'invitation */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            {/* Fond flouté */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
              onClick={() => setShowInviteModal(false)}
            />

            {/* Formulaire d'invitation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
                {/* En-tête */}
                <div className="bg-gray-400 p-4 text-white flex justify-between items-center">
                  <h3 className="text-xl font-semibold">
                    Inviter un {role === "particulier" ? "membre" : "responsable"}
                  </h3>
                  <button 
                    onClick={() => setShowInviteModal(false)}
                    className="text-white hover:text-gray-200"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                {/* Corps du formulaire */}
                <div className="p-6">
                  {/* Champ Email */}
                  <div className="mb-4">
                    <label className="block text-black font-medium mb-2">Email du membre</label>
                    <input
                      type="email"
                      placeholder="Entrez l'email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0055A4]"
                    />
                  </div>

                  {/* Sélection du site */}
                  <div className="mb-6">
                    <label className="block text-black font-medium mb-2">Sélectionner un site</label>
                    <select
                      value={selectedSite}
                      onChange={(e) => setSelectedSite(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0055A4]"
                    >
                      {sites.map((site) => (
                        <option key={site.idSite} value={site.idSite}>
                          {site.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message d'erreur */}
                  {inviteError && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg"
                    >
                      {inviteError}
                    </motion.div>
                  )}

                  {/* Bouton Envoyer */}
                  <motion.button
                    onClick={handleInvite}
                    disabled={isSending}
                    className="w-full bg-black text-white py-3 rounded-lg hover:bg-[#0055A4] transition-all flex items-center justify-center gap-2"
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1 }}
                      >
                        <FiRefreshCw />
                      </motion.div>
                    ) : (
                      <>
                        <span>Envoyer l'invitation</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ListInvitations;