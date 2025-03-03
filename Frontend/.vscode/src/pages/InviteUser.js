import { useContext, useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";

const InviteUser = () => {
  const { idUser } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState("");

  useEffect(() => {
    if (!idUser) {
      console.warn("idUser est null, la requête ne sera pas envoyée.");
      return;
    }

    const fetchSites = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/sites/${idUser}`);
        setSites(response.data);
        if (response.data.length > 0) {
          setSelectedSite(response.data[0].idSite);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des sites", error);
      }
    };

    fetchSites();
  }, [idUser]);

  const handleInvite = async () => {
    if (!email || !selectedSite) {
      alert("Veuillez entrer un email et sélectionner un site.");
      return;
    }
    try {
      await axios.post("http://localhost:8000/api/invite", {
        email,
        site_id: Number(selectedSite),
        owner_id: idUser
      });
      alert("Invitation envoyée !");
      setEmail("");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'envoi");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md border border-gray-200"
      >
        <h3 className="text-2xl font-semibold text-[#003366] mb-6 text-center">
          Inviter un membre
        </h3>

        {/* Champ Email */}
        <div className="mb-4">
          <label className="block text-[#003366] font-medium mb-2">Email du membre</label>
          <input
            type="email"
            placeholder="Entrez l'email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#0055A4]"
          />
        </div>

        {/* Sélection du site */}
        <div className="mb-4">
          <label className="block text-[#003366] font-medium mb-2">Sélectionner un site</label>
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

        {/* Bouton Envoyer */}
        <motion.button
          onClick={handleInvite}
          className="w-full bg-[#003366] text-white py-3 rounded-lg hover:bg-[#0055A4] transition-all"
          whileTap={{ scale: 0.95 }}
        >
          Envoyer l'invitation
        </motion.button>
      </motion.div>
    </div>
  );
};

export default InviteUser;
