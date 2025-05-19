import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const Reponse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReponse = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/get_question/${id}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération de la réponse");

        const data = await response.json();
        setQuestion(data);
      } catch (error) {
        console.error("Erreur:", error);
        setMessage("Désolé, nous n'avons pas pu charger cette réponse. Veuillez réessayer.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReponse();
  }, [id]);

  const handleGoBack = () => {
    navigate(-1); // Retour à la page précédente
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg">
        {/* En-tête avec bouton de retour */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleGoBack}
            className="mr-4 p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
            aria-label="Retour"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-blue-800">Réponse détaillée</h1>
        </div>

        {/* Messages d'erreur */}
        {message && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p>{message}</p>
          </div>
        )}

        {/* Contenu principal */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : question ? (
          <div className="space-y-6">
            {/* Question */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h2 className="text-xl font-semibold text-blue-800">{question.question}</h2>
              {question.description && (
                <p className="mt-2 text-gray-600">{question.description}</p>
              )}
            </div>

            {/* Réponse */}
            <div className="prose max-w-none">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Réponse :</h3>
              <div 
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: question.answer }} 
              />
            </div>

            {/* Métadonnées */}
            <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
              {question.category && (
                <p>Catégorie : <span className="text-blue-600">{question.category}</span></p>
              )}
              {question.date_created && (
                <p>Date de création : {new Date(question.date_created).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ) : (
          !message && (
            <div className="text-center py-12 text-gray-500">
              <p>Aucune information disponible pour cette question.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Reponse;