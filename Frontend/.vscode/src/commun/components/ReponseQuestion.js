import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const Reponse = () => {
  const { id } = useParams();
  const [question, setQuestion] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchReponse = async () => {
      try {
        const response = await fetch(`http://localhost:8000/get_question/${id}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération de la réponse");

        const data = await response.json();
        console.log("Réponse reçue:", data); // Debugging
        setQuestion(data);
      } catch (error) {
        setMessage("Problème de connexion au serveur.");
      }
    };

    fetchReponse();
  }, [id]);

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      {message && <p className="text-red-500">{message}</p>}
      {question ? (
        <>
          <h2 className="text-xl font-bold mb-4">{question.question}</h2>
          {/* Affichage du texte avec le HTML interprété */}
          <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: question.answer }} />
        </>
      ) : (
        <p className="text-gray-500">Chargement...</p>
      )}
    </div>
  );
};

export default Reponse;
