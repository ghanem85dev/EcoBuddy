import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline"; // Icône de retour

const QuestionList = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");  // Variable pour la recherche
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Détection du rôle et récupération des catégories au chargement du composant
  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const detectedRole = pathParts[pathParts.length - 1]; 
    setRole(detectedRole);

    if (!detectedRole) {
      setMessage("Rôle non défini !");
      return;
    }

    fetchCategories(detectedRole);
  }, []);

  // Filtrage des questions selon la recherche de l'utilisateur
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQuestions(questions);  // Afficher toutes les questions si la recherche est vide
    } else {
      setFilteredQuestions(
        questions.filter((q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase())  // Filtrage basé sur la recherche
        )
      );
    }
  }, [searchQuery, questions]);

  // Récupérer les catégories depuis le backend
  const fetchCategories = async (role) => {
    try {
      const response = await fetch(`http://localhost:8000/get_categories?role=${role}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des catégories");

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      setMessage("Problème de connexion au serveur.");
      setCategories([]);
    }
  };

  // Récupérer les questions d'une catégorie spécifique
  const fetchQuestions = async (category) => {
    setSelectedCategory(category);
    try {
      const response = await fetch(`http://localhost:8000/get_questions_by_category?role=${role}&categorie=${category}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des questions");

      const data = await response.json();
      setQuestions(data);
      setFilteredQuestions(data);  // Mettre à jour la liste filtrée avec toutes les questions de cette catégorie
    } catch (error) {
      setMessage("Problème de connexion au serveur.");
      setQuestions([]);
      setFilteredQuestions([]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#0e457f] p-6 rounded-lg shadow-lg text-white mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Sélectionnez une catégorie</h2>

      {message && <p className="text-red-300 text-center">{message}</p>}

      {/* Barre de recherche, uniquement si une catégorie est sélectionnée */}
      {selectedCategory && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher une question..."
            className="w-full p-3 rounded-lg border-2 border-gray-300 text-black focus:border-blue-500 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}  // Met à jour la recherche en fonction de l'utilisateur
          />
        </div>
      )}

      {/* Affichage des catégories */}
      {!selectedCategory ? (
        <ul className="mt-4 space-y-3">
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <li 
                key={index} 
                className="p-3 bg-white text-[#0e457f] rounded-lg cursor-pointer shadow-md hover:bg-blue-100 transition"
                onClick={() => fetchQuestions(category)}  // Charger les questions de la catégorie
              >
                {category}
              </li>
            ))
          ) : (
            <p className="text-gray-200 text-center">Aucune catégorie trouvée.</p>
          )}
        </ul>
      ) : (
        <div>
          {/* Bouton de retour avec l'icône */}
          <button 
            className="mb-4 p-2 text-white bg-[#0e457f] rounded-full hover:bg-blue-700 transition flex items-center justify-center"
            onClick={() => setSelectedCategory(null)}  // Revenir aux catégories
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>

          <h3 className="text-xl font-semibold mb-2 text-center">Questions pour {selectedCategory}</h3>
          <ul className="mt-4 space-y-3">
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((q, index) => (
                <li 
                  key={index} 
                  className="p-3 bg-white text-[#0e457f] rounded-lg cursor-pointer shadow-md hover:bg-blue-100 transition"
                  onClick={() => navigate(`/reponse/${q.id}`)}  // Rediriger vers la page de réponse de la question
                >
                  {q.question}
                </li>
              ))
            ) : (
              <p className="text-gray-200 text-center">Aucune question trouvée.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default QuestionList;