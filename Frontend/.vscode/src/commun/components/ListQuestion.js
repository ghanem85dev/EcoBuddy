import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Extraire le rôle depuis l'URL
    const pathParts = window.location.pathname.split("/");
    const detectedRole = pathParts[pathParts.length - 1];
    setRole(detectedRole);

    if (!detectedRole) {
      setMessage("Rôle non défini !");
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await fetch(`http://localhost:8000/get_questions?role=${detectedRole}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération des questions");

        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        setMessage("Problème de connexion au serveur.");
        setQuestions([]); // Réinitialisation en cas d'erreur
      }
    };

    fetchQuestions();
  }, []);

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Liste des Questions pour {role}</h2>
      {message && <p className="text-red-500">{message}</p>}
      <ul className="mt-4">
        {questions.length > 0 ? (
          questions.map((q, index) => (
            <li 
              key={index} 
              className="p-2 border-b cursor-pointer text-blue-500 hover:underline"
              onClick={() => navigate(`/reponse/${q.id}`)} // Redirection vers la page réponse
            >
              {q.question}
            </li>
          ))
        ) : (
          <p className="text-gray-500">Aucune question trouvée pour ce rôle.</p>
        )}
      </ul>
    </div>
  );
};

export default QuestionList;