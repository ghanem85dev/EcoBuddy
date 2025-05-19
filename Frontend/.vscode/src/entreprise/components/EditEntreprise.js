// EditEntreprise.js
import React, { useState, useEffect } from "react";
import { FiUpload } from "react-icons/fi";
import axios from "axios";

const EditEntreprise = ({ entreprise, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    nom: entreprise.nom,
    taille: entreprise.taille,
    secteur_id: entreprise.secteur?.idSecteur || "",
    certificat_propriete: null,
    certificat_propriete_nom: entreprise.certificat_propriete_nom || ""
  });

  const [secteurs, setSecteurs] = useState([]);

  useEffect(() => {
    const fetchSecteurs = async () => {
      try {
        const response = await axios.get('http://localhost:8000/secteurs');
        setSecteurs(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des secteurs:", error);
      }
    };
    
    fetchSecteurs();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        certificat_propriete: file,
        certificat_propriete_nom: file.name
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("nom", formData.nom);
      formDataToSend.append("taille", formData.taille);
      formDataToSend.append("secteur_id", formData.secteur_id);
      if (formData.certificat_propriete) {
        formDataToSend.append("certificat_propriete", formData.certificat_propriete);
      }

      await axios.put(`http://localhost:8000/entreprises/${entreprise.idEntreprise}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      onSuccess();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      alert("Erreur lors de la modification de l'entreprise");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Modifier l'entreprise</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taille</label>
            <select
              name="taille"
              value={formData.taille}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Sélectionnez...</option>
              <option value="petite">Petite (1-50 employés)</option>
              <option value="moyenne">Moyenne (51-250 employés)</option>
              <option value="grande">Grande (250+ employés)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Secteur d'activité</label>
            <select
              name="secteur_id"
              value={formData.secteur_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Sélectionnez un secteur...</option>
              {secteurs.map(secteur => (
                <option 
                  key={secteur.idSecteur} 
                  value={secteur.idSecteur}
                  selected={secteur.idSecteur === entreprise.secteur?.idSecteur}
                >
                  {secteur.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificat de propriété
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-blue-400">
              <input
                type="file"
                id="certificat-propriete"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="certificat-propriete" className="flex flex-col items-center justify-center cursor-pointer">
                <FiUpload className="text-gray-400 mb-2" size={24} />
                {formData.certificat_propriete_nom ? (
                  <p className="text-sm text-green-600 font-medium">{formData.certificat_propriete_nom}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600">Glissez-déposez votre fichier ici</p>
                    <p className="text-xs text-gray-500 mt-1">ou cliquez pour sélectionner</p>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Formats acceptés: PDF, DOC, DOCX (max 5MB)</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEntreprise;