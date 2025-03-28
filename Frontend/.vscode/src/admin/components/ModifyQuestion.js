import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ModifyQuestion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const response = await fetch(`http://localhost:8000/get_question/${id}`);
        if (!response.ok) throw new Error("Erreur lors de la récupération de la question");

        const data = await response.json();
        setQuestion(data.question);
        setAnswer(data.answer);
      } catch (error) {
        console.error("Erreur:", error);
      }
    };

    fetchQuestion();
  }, [id]);

  const handleUpdate = async () => {
    try {
      const response = await fetch(`http://localhost:8000/update_question/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question, answer }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");

      alert("Question mise à jour avec succès !");
      
      // Rediriger vers la page des questions après la mise à jour
      navigate("/adminquestion");
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-semibold text-[#0e457f] mb-4">Modifier la Question</h2>

      <div className="mb-4">
        <label className="block text-gray-700">Question</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Réponse</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <button onClick={handleUpdate} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700">
        Mettre à jour
      </button>
    </div>
  );
};

export default ModifyQuestion;