import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FaHome } from "react-icons/fa";
import { motion } from "framer-motion";
import residenceImage from "../assets/residence.png"; // Assurez-vous que l'image est correcte

const SitesSettings = () => {
  const { id } = useParams();
  const [residences, setResidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newResidence, setNewResidence] = useState({ nom: '', adresse: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingResidence, setEditingResidence] = useState(null);

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

  const handleDelete = async (idSite) => {
    if (window.confirm('Voulez-vous supprimer cette résidence ?')) {
      try {
        const response = await fetch(`http://localhost:8000/sites/${idSite}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erreur lors de la suppression');

        // Mettre à jour l'état après suppression
        setResidences((prev) => prev.filter((residence) => residence.idSite !== idSite));
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleModify = (residence) => {
    setEditingResidence(residence);
    setNewResidence({ nom: residence.nom, adresse: residence.adresse });
    setShowForm(true);
  };

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

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResidence),
      });

      if (!response.ok) throw new Error(`Erreur lors de ${editingResidence ? 'la modification' : "l'ajout"}`);

      // Recharger les résidences après l'ajout ou la modification
      fetchResidences();

      setNewResidence({ nom: '', adresse: '' });
      setEditingResidence(null);
      setShowForm(false);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <section className="bg-white min-h-screen p-10">
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
              className="bg-[#003366] text-white py-2 px-6 rounded-lg hover:bg-[#0055A4] transition-all"
              whileTap={{ scale: 0.95 }}
            >
              Ajouter une résidence
            </motion.button>
          </div>

          {/* Liste des résidences */}
          <div className="overflow-y-auto max-h-[60vh] space-y-4">
            {residences.map((site) => (
              <motion.div
                key={site.idSite}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#f0faff] p-5 rounded-xl shadow-lg border border-gray-300 hover:shadow-2xl transition-all flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <FaHome className="text-3xl text-[#003366]" />
                  <div>
                    <p className="text-lg font-semibold">{site.nom}</p>
                    <p className="text-sm text-[#0055A4]">{site.adresse}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => handleModify(site)} className="text-[#003366]">
                    <AiOutlineEdit className="text-xl" />
                  </button>
                  <button onClick={() => handleDelete(site.idSite)} className="text-red-600">
                    <AiOutlineDelete className="text-xl" />
                  </button>
                </div>
              </motion.div>
            ))}
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
            <div className="flex gap-4">
              <button onClick={handleAddOrUpdateResidence} className="bg-[#003366] text-white py-2 px-4 rounded-md">
                {editingResidence ? 'Modifier' : 'Ajouter'}
              </button>
              <button onClick={() => setShowForm(false)} className="bg-gray-500 text-white py-2 px-4 rounded-md">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SitesSettings;
