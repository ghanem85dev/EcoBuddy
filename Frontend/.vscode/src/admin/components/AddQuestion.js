import { useState } from "react";

const QuestionForm = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [role, setRole] = useState("particulier"); // Valeur par défaut
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question || !answer || !role) {
      setMessage("Veuillez remplir tous les champs.");
      return;
    }

    const formData = { question, answer, role };

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
        setRole("particulier"); // Réinitialisation du champ rôle
      } else {
        const errorData = await response.json();
        setMessage(`Erreur : ${errorData.detail || "Problème lors de l'envoi"}`);
      }
    } catch (error) {
      setMessage("Problème de connexion au serveur.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Ajouter une Question</h2>
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
            <option value="collectivité">Collectivite</option>
            <option value="entreprise">Entreprise</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Ajouter
        </button>
      </form>
      {message && <p className="mt-4 text-center text-red-500">{message}</p>}
    </div>
  );
};

export default QuestionForm;