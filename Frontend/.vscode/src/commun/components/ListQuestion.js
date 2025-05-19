import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const QuestionList = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredQuestions(questions);
    } else {
      setFilteredQuestions(
        questions.filter((q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, questions]);

  const fetchCategories = async (role) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/get_categories?role=${role}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des catégories");

      const data = await response.json();
      setCategories(data);
    } catch (error) {
      setMessage("Problème de connexion au serveur.");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async (category) => {
    setIsLoading(true);
    setSelectedCategory(category);
    try {
      const response = await fetch(`http://localhost:8000/get_questions_by_category?role=${role}&categorie=${category}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des questions");

      const data = await response.json();
      setQuestions(data);
      setFilteredQuestions(data);
    } catch (error) {
      setMessage("Problème de connexion au serveur.");
      setQuestions([]);
      setFilteredQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md border border-gray-100">
        {/* Header avec bouton de retour conditionnel */}
        <div className="flex items-center mb-6">
          {selectedCategory && (
            <button 
              className="mr-4 p-2 text-[#17B3DE] hover:bg-[#e6f7fc] rounded-full transition"
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery("");
              }}
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
          )}
          <h2 className="text-2xl font-bold text-[#17B3DE]">
            {selectedCategory ? `Questions pour "${selectedCategory}"` : "Sélectionnez une catégorie"}
          </h2>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-[#fce8ed] text-[#F36D8F] rounded-lg border border-[#F36D8F]/20">
            {message}
          </div>
        )}

        {/* Barre de recherche */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={selectedCategory ? "Rechercher dans cette catégorie..." : "Rechercher parmi toutes les catégories..."}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2DBDAC] focus:border-[#2DBDAC] outline-none transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={!selectedCategory && searchQuery === ""}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2DBDAC]"></div>
          </div>
        ) : (
          <>
            {/* Affichage des catégories */}
            {!selectedCategory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <button
                      key={index}
                      className="p-4 bg-white border border-[#2DBDAC]/30 rounded-xl shadow-sm hover:bg-[#e6f9f7] hover:border-[#2DBDAC] hover:shadow-md transition-all text-left group"
                      onClick={() => fetchQuestions(category)}
                    >
                      <h3 className="font-medium text-[#17B3DE] group-hover:text-[#2DBDAC]">{category}</h3>
                      <p className="text-sm text-gray-500 mt-1">Cliquez pour voir les questions</p>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-8 text-center text-gray-500">
                    Aucune catégorie disponible
                  </div>
                )}
              </div>
            ) : (
              /* Affichage des questions */
              <div className="space-y-3">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((q, index) => (
                    <button
                      key={index}
                      className="w-full p-4 bg-white border border-[#17B3DE]/20 rounded-lg hover:bg-[#e6f7fc] hover:border-[#17B3DE]/50 transition text-left group"
                      onClick={() => navigate(`/reponse/${q.id}`)}
                    >
                      <h3 className="font-medium text-gray-800 group-hover:text-[#17B3DE]">{q.question}</h3>
                      {q.description && (
                        <p className="text-sm text-gray-500 mt-1 truncate">
                          {q.description}
                        </p>
                      )}
                      <div className="mt-2 h-1 w-0 group-hover:w-full bg-[#F36D8F] transition-all duration-300"></div>
                    </button>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    {searchQuery ? 
                      "Aucune question ne correspond à votre recherche" : 
                      "Aucune question disponible dans cette catégorie"}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuestionList;