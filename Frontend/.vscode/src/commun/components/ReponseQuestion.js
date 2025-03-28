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
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg mt-8">
      {message && <p className="text-red-500 text-center text-lg">{message}</p>}

      {question ? (
        <>
          <h2 className="text-2xl font-semibold text-[#0e457f] mb-6 text-center">{question.question}</h2>
          
          {/* Affichage du texte avec le HTML interprété */}
          <div className="text-gray-700 text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: question.answer }} />
        </>
      ) : (
        <p className="text-gray-500 text-center text-lg">Chargement...</p>
      )}
    </div>
  );
};

export default Reponse;
