import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus } from "lucide-react"; // Ajout de l'icône Plus
import {Sidebar} from "../../commun/layouts/SideBar";
import {AdminNavbar} from "../components/AdminNavbar";

const AdminQuestions = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("http://localhost:8000/get_roles");
        if (!response.ok) throw new Error("Erreur lors de la récupération des rôles");
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error("Erreur:", error);
      }
    };

    fetchRoles();
  }, []);

  const handleRoleChange = async (role) => {
    setSelectedRole(role);
    setSelectedCategory("");

    try {
      const response = await fetch(`http://localhost:8000/get_categories_by_role/${role}`);
      if (!response.ok) throw new Error("Erreur lors de la récupération des catégories");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleCategoryChange = async (category) => {
    setSelectedCategory(category);

    try {
      const response = await fetch(
        `http://localhost:8000/get_questions_by_role_and_category?role=${selectedRole}&category=${category}`
      );
      if (!response.ok) throw new Error("Erreur lors de la récupération des questions");
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error("Erreur:", error);
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
      }
    }
  };

  const handleAddNewQuestion = () => {
    
    navigate(`/addquestion`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 fixed h-full">
        <Sidebar />
      </div>

      {/* Contenu Principal */}
      <div className="flex flex-col flex-1 ml-64">
        <AdminNavbar />

        {/* Conteneur centré */}
        <div className="flex flex-col items-center justify-center h-full p-6">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#0e457f]">Questions Admin</h2>
              <button 
                onClick={handleAddNewQuestion}
                className="bg-[#0e457f] text-white p-2 rounded-full hover:bg-blue-700 transition"
                title="Ajouter une nouvelle question"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* Sélection du rôle */}
            <div className="mb-4">
              <label htmlFor="role" className="block text-gray-700">Choisir un rôle</label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Sélectionnez un rôle</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Sélection de la catégorie */}
            {selectedRole && (
              <div className="mb-4">
                <label htmlFor="category" className="block text-gray-700">Choisir une catégorie</label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Sélectionnez une catégorie</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Liste des questions */}
            {questions.length > 0 ? (
              <ul className="space-y-4">
                {questions.map((question) => (
                  <li key={question.id} className="p-4 bg-[#f7f7f7] text-[#0e457f] rounded-lg shadow-md hover:bg-blue-50 transition flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-xl">{question.question}</h3>
                      <p className="text-gray-600 mt-2">{question.answer}</p>
                    </div>
                    <div className="flex space-x-4">
                      <button onClick={() => handleEdit(question.id)} className="text-blue-500 hover:text-blue-700">
                        <Edit size={20} />
                      </button>
                      <button onClick={() => handleDelete(question.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center text-lg">Aucune question disponible.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuestions;