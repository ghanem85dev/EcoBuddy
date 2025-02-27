import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { FaHome } from "react-icons/fa";
import { motion } from "framer-motion";

const SitesSettings = () => {
  const { id } = useParams();
  const [residences, setResidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newResidenceName, setNewResidenceName] = useState('');
  const [newResidenceAddress, setNewResidenceAddress] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResidence, setEditingResidence] = useState(null);

  useEffect(() => {
    const fetchResidences = async () => {
      if (!id) {
        setError('id est manquant');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://localhost:8000/sites/${id}`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        const data = await response.json();
        setResidences(data);
      } catch (error) {
        setError(error.message);
        console.error('Erreur lors de la récupération des résidences', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResidences();
  }, [id]);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette résidence ?')) {
      try {
        const response = await fetch(`http://localhost:8000/sites/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error('Erreur lors de la suppression de la résidence');
        }
        setResidences((prevResidences) =>
          prevResidences.filter((residence) => residence.idSite !== id)
        );
      } catch (error) {
        setError(error.message);
        console.error('Erreur lors de la suppression de la résidence', error);
      }
    }
  };

  const handleModify = (id) => {
    const residenceToEdit = residences.find(residence => residence.idSite === id);
    setEditingResidence(residenceToEdit);
  };

  const handleAddResidence = async () => {
    if (!newResidenceName || !newResidenceAddress) {
      setError('Le nom et l\'adresse de la résidence sont requis');
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/sites/${id}/1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newResidenceName, adresse: newResidenceAddress }),
      });
      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout de la résidence');
      }
      window.location.reload();
    } catch (error) {
      setError(error.message);
      console.error('Erreur lors de l\'ajout de la résidence', error);
    }
  };

  const handleSaveEdit = async (id) => {
    if (!editingResidence.nom || !editingResidence.adresse) {
      setError('Le nom et l\'adresse de la résidence sont requis');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/sites/${id}/1`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: editingResidence.nom,
          adresse: editingResidence.adresse,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour de la résidence');
      }

      setResidences((prevResidences) =>
        prevResidences.map((residence) =>
          residence.idSite === id ? { ...residence, ...editingResidence } : residence
        )
      );

      setEditingResidence(null); // Fermer le formulaire d'édition
    } catch (error) {
      setError(error.message);
      console.error('Erreur lors de la mise à jour de la résidence', error);
    }
  };

  return (
    <section>
      <div className="container py-14 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-8 space-y-6 md:space-y-0">
        <div className="flex flex-col justify-center">
          <div className="text-center md:text-left space-y-12">
            <motion.h1
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold !leading-snug"
            >
              Retrouvez vos sites sur MyEnergyHub
            </motion.h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              Ajouter une résidence
            </button>
            <div className="flex flex-col gap-6">
              {residences.map((site) => (
                <motion.div
                  key={site.id}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true }}
                  className="flex flex-col items-start gap-2 p-6 bg-[#f4f4f4] rounded-2xl hover:bg-white duration-300 hover:shadow-2xl"
                >
                  <div className="flex justify-between w-full items-center">
                    <div className="flex items-center gap-4">
                      <FaHome className="text-3xl" style={{ position: 'relative', top: '8px' }} />
                      <p className="text-xl font-semibold">{site.nom}</p>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleModify(site.idSite)}
                        className="text-black"
                      >
                        <AiOutlineEdit className="text-xl" />
                      </button>
                      <button
                        onClick={() => handleDelete(site.idSite)}
                        className="text-black"
                      >
                        <AiOutlineDelete className="text-xl" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-blue-800 mt-1 ml-10">{site.adresse}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pop-up pour ajouter ou modifier une résidence */}
      {(showAddForm || editingResidence) && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h3 className="text-2xl mb-4">{editingResidence ? 'Modifier la résidence' : 'Ajouter une résidence'}</h3>
            <input
              type="text"
              placeholder="Nom de la résidence"
              value={editingResidence ? editingResidence.nom : newResidenceName}
              onChange={(e) => editingResidence ? setEditingResidence({ ...editingResidence, nom: e.target.value }) : setNewResidenceName(e.target.value)}
              className="mb-4 p-2 w-full border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Adresse de la résidence"
              value={editingResidence ? editingResidence.adresse : newResidenceAddress}
              onChange={(e) => editingResidence ? setEditingResidence({ ...editingResidence, adresse: e.target.value }) : setNewResidenceAddress(e.target.value)}
              className="mb-4 p-2 w-full border border-gray-300 rounded-md"
            />
            <div className="flex gap-4">
              <button
                onClick={editingResidence ? () => handleSaveEdit(editingResidence.idSite) : handleAddResidence}
                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600"
              >
                {editingResidence ? 'Sauvegarder' : 'Ajouter'}
              </button>
              <button
                onClick={() => { setEditingResidence(null); setShowAddForm(false); }}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
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

export default SitesSettings;
