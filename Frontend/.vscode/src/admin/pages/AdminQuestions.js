import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus } from "lucide-react";
import { Sidebar } from "../../commun/layouts/SideBar";
import { AdminNavbar } from "../components/AdminNavbar";

const AdminQuestions = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8000/get_roles");
        if (!response.ok) throw new Error("Erreur lors de la récupération des rôles");
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error("Erreur:", error);
        setError("Impossible de charger les rôles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const handleRoleChange = async (role) => {
    setSelectedRole(role);
    setSelectedCategory("");
    setQuestions([]);
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/get_categories_by_role/${role}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des catégories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de charger les catégories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = async (category) => {
    setSelectedCategory(category);
    setIsLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/get_questions_by_role_and_category?role=${selectedRole}&category=${category}`
      );
      if (!response.ok) throw new Error("Erreur lors de la récupération des questions");
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de charger les questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/modifyquestion/${id}`);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Voulez-vous vraiment supprimer cette question ?");
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:8000/delete_question/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Erreur lors de la suppression");

        setQuestions(questions.filter((question) => question.id !== id));
      } catch (error) {
        console.error("Erreur:", error);
        setError("Échec de la suppression de la question");
      }
    }
  };

  const handleAddNewQuestion = () => {
    navigate(`/addquestion`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenu Principal */}
      <div className="flex flex-col flex-1 lg:ml-64">
        <AdminNavbar />

        {/* Conteneur principal */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* En-tête */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Gestion des Questions</h1>
                <p className="text-gray-600">Gérez les questions et réponses de votre FAQ</p>
              </div>
              {/* <button
                onClick={handleAddNewQuestion}
                className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="mr-2" size={18} />
                Ajouter une question
              </button> */}
            </div>

            {/* Messages d'erreur */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
                {error}
              </div>
            )}

            {/* Filtres */}
            <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sélection du rôle */}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                  </label>
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isLoading}
                  >
                    <option value="">Sélectionnez un rôle</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sélection de la catégorie */}
                {selectedRole && (
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isLoading || !selectedRole}
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Liste des questions */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : questions.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {questions.map((question) => (
                    <li key={question.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div className="flex-1 mb-4 md:mb-0">
                          <h3 className="text-lg font-medium text-gray-800">{question.question}</h3>
                          <p className="mt-1 text-gray-600 line-clamp-2">{question.answer}</p>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleEdit(question.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit size={20} />
                          </button>
                          <button
                            onClick={() => handleDelete(question.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-12 text-center">
                  {selectedCategory ? (
                    <p className="text-gray-500">Aucune question disponible dans cette catégorie</p>
                  ) : selectedRole ? (
                    <p className="text-gray-500">Sélectionnez une catégorie pour voir les questions</p>
                  ) : (
                    <p className="text-gray-500">Sélectionnez un rôle et une catégorie pour voir les questions</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
  <button
    onClick={handleAddNewQuestion}
    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
  >
    <Plus className="mr-2" size={18} />
    Ajouter une question
  </button>
</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminQuestions;