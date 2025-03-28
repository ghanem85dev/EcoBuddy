import { useState } from "react";
import {Sidebar} from "../../commun/layouts/SideBar";

const QuestionForm = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [role, setRole] = useState("particulier");
  const [categorie, setCategorie] = useState("Facturation et Paiement");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || !answer || !role || !categorie) {
      setMessage("Veuillez remplir tous les champs.");
      return;
    }

    const formData = { question, answer, role, categorie };

    try {
      const response = await fetch("http://localhost:8000/add_question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage("Question ajoutée avec succès !");
        setQuestion("");
        setAnswer("");
        setRole("particulier");
        setCategorie("Facturation et Paiement");
      } else {
        const errorData = await response.json();
        setMessage(`Erreur : ${errorData.detail || "Problème lors de l'envoi"}`);
      }
    } catch (error) {
      setMessage("Problème de connexion au serveur.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar avec width fixe */}
      <div className="w-64">
        <Sidebar />
      </div>

      {/* Contenu Principal centré */}
      <div className="flex flex-col flex-1">
        

        {/* Centrage parfait du formulaire */}
        <div className="flex justify-center items-center h-full">
          <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md mx-auto">
            <h2 className="text-2xl font-bold text-center text-[#0e457f] mb-6">
              Ajouter une Question
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700">Question :</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Réponse :</label>
                <textarea
                  className="w-full p-2 border rounded"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Rôle :</label>
                <select
                  className="w-full p-2 border rounded"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="particulier">Particulier</option>
                  <option value="collectivité">Collectivité</option>
                  <option value="entreprise">Entreprise</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Catégorie :</label>
                <select
                  className="w-full p-2 border rounded"
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value)}
                  required
                >
                  <option value="Facturation et Paiement">Facturation et Paiement</option>
                  <option value="Consommation et Suivi">Consommation et Suivi</option>
                  <option value="Compteur Linky">Compteur Linky</option>
                  <option value="Aides et Bonus">Aides et Bonus</option>
                  <option value="Contrats et Offres">Contrats et Offres</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
              >
                Ajouter
              </button>
            </form>
            {message && <p className="mt-4 text-center text-red-500">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionForm;
