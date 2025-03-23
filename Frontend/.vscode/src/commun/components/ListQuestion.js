import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
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
        setFilteredQuestions(data);
      } catch (error) {
        setMessage("Problème de connexion au serveur.");
        setQuestions([]);
        setFilteredQuestions([]);
      }
    };

    fetchQuestions();
  }, []);

  // Filtrage des questions en fonction de la recherche
  useEffect(() => {
    setFilteredQuestions(
      questions.filter((q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, questions]);

  return (
    <div className="max-w-2xl mx-auto bg-[#0e457f] p-6 rounded-lg shadow-lg text-white mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Questions pour {role}</h2>
      
      {/* Barre de recherche */}
      <input
        type="text"
        placeholder="Rechercher une question..."
        className="w-full p-3 mb-4 rounded-lg border-2 border-gray-300 text-black focus:border-blue-500 focus:outline-none"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {message && <p className="text-red-300 text-center">{message}</p>}

      <ul className="mt-4 space-y-3">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q, index) => (
            <li 
              key={index} 
              className="p-3 bg-white text-[#0e457f] rounded-lg cursor-pointer shadow-md hover:bg-blue-100 transition"
              onClick={() => navigate(`/reponse/${q.id}`)}
            >
              {q.question}
            </li>
          ))
        ) : (
          <p className="text-gray-200 text-center">Aucune question trouvée.</p>
        )}
      </ul>
    </div>
  );
};

export default QuestionList;