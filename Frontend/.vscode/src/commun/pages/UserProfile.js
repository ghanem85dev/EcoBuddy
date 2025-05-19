import { Edit2, MapPin, Phone, Mail } from 'lucide-react';
import { AuthContext } from "../../commun/context/AuthContext";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import profileImage from '../../assets/profile.png';

const UserProfile = () => {
  const { idUser } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    budget_max: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/users/${idUser}`);
        setUserData(response.data);
        setFormData({
          nom: response.data.nom || '',
          prenom: response.data.prenom || '',
          telephone: response.data.telephone || '',
          adresse: response.data.adresse || '',
          budget_max: response.data.budget_max || ''
        });
      } catch (err) {
        setError(err.response?.data?.message || "Erreur lors du chargement des données utilisateur");
      } finally {
        setLoading(false);
      }
    };

    if (idUser) {
      fetchUserData();
    }
  }, [idUser]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
  try {
    // Préparer les données avec les conversions de type
    const payload = {
      nom: formData.nom || null,
      prenom: formData.prenom || null,
      telephone: formData.telephone ? parseInt(formData.telephone) : null,
      adresse: formData.adresse || null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null
    };

    // Envoyer la requête
    const response = await axios.put(
      `http://localhost:8000/api/users/${idUser}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Mettre à jour l'état
    setUserData(response.data);
    setIsEditing(false);
  } catch (err) {
    console.error("Erreur détaillée:", err.response);
    setError(
      err.response?.data?.detail || 
      err.response?.data?.message || 
      "Erreur lors de la mise à jour des données"
    );
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2DBDAC]/10 to-[#17B3DE]/10 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2DBDAC] mx-auto"></div>
          <p className="text-[#17B3DE] font-medium">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2DBDAC]/10 to-[#17B3DE]/10 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center border border-[#F36D8F]/20">
          <div className="text-[#F36D8F] mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#2DBDAC] hover:bg-[#239f8f] text-white rounded-full transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2DBDAC]/10 to-[#17B3DE]/10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#17B3DE] font-medium">Aucune donnée utilisateur disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2DBDAC]/10 to-[#17B3DE]/10 p-4 md:p-8 w-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card (Left Side) */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow-xl rounded-2xl p-8 flex flex-col items-center gap-6 border border-gray-200 h-full hover:shadow-2xl transition-shadow duration-300">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#2DBDAC]/30 hover:border-[#2DBDAC]/50 transition-all duration-300">
                  <img 
                    src={profileImage} 
                    alt="Photo de profil" 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <button 
                  onClick={handleEditToggle}
                  className="absolute bottom-0 right-0 bg-[#F36D8F] text-white p-2 rounded-full hover:bg-[#e05a7b] transition-colors duration-300 shadow-md"
                >
                  <Edit2 size={18} />
                </button>
              </div>
              
              <div className="text-center space-y-4 w-full">
                <h2 className="text-3xl font-bold text-gray-800 hover:text-[#2DBDAC] transition-colors duration-300">
                  {userData.prenom || 'Prénom'} {userData.nom || 'Nom'}
                </h2>
                
                <div className="inline-block px-4 py-1 bg-[#2DBDAC]/10 text-[#2DBDAC] rounded-full text-sm font-medium hover:bg-[#2DBDAC]/20 transition-colors duration-300">
                  {userData.role || 'Utilisateur'}
                </div>
                
                {userData.adresse && (
                  <div className="flex items-center justify-center gap-3 text-gray-600 text-lg hover:text-[#17B3DE] transition-colors duration-300 cursor-pointer">
                    <MapPin className="w-6 h-6" />
                    <p>{userData.adresse}</p>
                  </div>
                )}
                
                <div className="pt-6 space-y-4 w-full">
                  {userData.telephone && (
                    <div className="flex items-center gap-3 text-gray-600 text-lg p-4 bg-gray-50 rounded-xl hover:bg-[#17B3DE]/5 hover:text-[#17B3DE] transition-colors duration-300 cursor-pointer">
                      <Phone className="w-6 h-6" />
                      <span>{userData.telephone}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-gray-600 text-lg p-4 bg-gray-50 rounded-xl hover:bg-[#17B3DE]/5 hover:text-[#17B3DE] transition-colors duration-300 cursor-pointer">
                    <Mail className="w-6 h-6" />
                    <span>{userData.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information (Right Side) */}
          <div className="lg:col-span-2">
            <div className={`bg-white shadow-xl rounded-2xl p-8 border ${isEditing ? 'border-[#2DBDAC]' : 'border-gray-200'} h-full transition-all duration-300`}>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-800">Informations personnelles</h3>
                <button 
                  onClick={handleEditToggle}
                  className={`flex items-center gap-2 ${isEditing ? 'text-[#F36D8F]' : 'text-[#2DBDAC]'} hover:text-[#239f8f] transition-colors duration-300 text-lg`}
                >
                  <Edit2 size={20} />
                  <span>{isEditing ? 'Annuler' : 'Modifier'}</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-500">Prénom</p>
                  <div className={`p-4 ${isEditing ? 'bg-[#2DBDAC]/5 border-[#2DBDAC]' : 'bg-gray-50 border-gray-200'} rounded-xl border hover:border-[#2DBDAC] transition-colors duration-300`}>
                    {isEditing ? (
    <input 
      type="text" 
      name="prenom"
      value={formData.prenom}
      onChange={handleInputChange}
      className="w-full bg-transparent text-xl font-medium text-gray-800 outline-none"
    />
  ) : (
    <p className="text-xl font-medium text-gray-800">
      {userData.prenom || 'Non renseigné'}
    </p>
  )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-500">Nom</p>
                  <div className={`p-4 ${isEditing ? 'bg-[#2DBDAC]/5 border-[#2DBDAC]' : 'bg-gray-50 border-gray-200'} rounded-xl border hover:border-[#2DBDAC] transition-colors duration-300`}>
                    {isEditing ? (
    <input 
      type="text" 
      name="nom"
      value={formData.nom}
      onChange={handleInputChange}
      className="w-full bg-transparent text-xl font-medium text-gray-800 outline-none"
    />
  ) : (
    <p className="text-xl font-medium text-gray-800">
      {userData.nom || 'Non renseigné'}
    </p>
  )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-500">Email</p>
                  <div className={`p-4 ${isEditing ? 'bg-[#F36D8F]/5 border-[#F36D8F]' : 'bg-gray-50 border-gray-200'} rounded-xl border hover:border-[#17B3DE] transition-colors duration-300`}>
                   
                      <p className="text-xl font-medium text-gray-800">
                        {userData.email}
                      </p>
                    
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-500">Téléphone</p>
                  <div className={`p-4 ${isEditing ? 'bg-[#17B3DE]/5 border-[#17B3DE]' : 'bg-gray-50 border-gray-200'} rounded-xl border hover:border-[#17B3DE] transition-colors duration-300`}>
                    {isEditing ? (
    <input 
      type="tel" 
      name="telephone"
      value={formData.telephone}
      onChange={handleInputChange}
      className="w-full bg-transparent text-xl font-medium text-gray-800 outline-none"
    />
  ) : (
    <p className="text-xl font-medium text-gray-800">
      {userData.telephone || 'Non renseigné'}
    </p>
  )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-500">Rôle</p>
                  <div className={`p-4 ${isEditing ? 'bg-[#F36D8F]/5 border-[#F36D8F]' : 'bg-gray-50 border-gray-200'} rounded-xl border hover:border-[#F36D8F] transition-colors duration-300`}>
                    <p className="text-xl font-medium text-gray-800">
                      {userData.role || 'Non renseigné'}
                    </p>
                  </div>
                </div>
                
                {userData.budget_max && (
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-gray-500">Budget maximum</p>
                    <div className={`p-4  ${isEditing ? 'bg-[#2DBDAC]/5 border-[#2DBDAC]' : 'bg-gray-50 border-gray-200'} rounded-xl border hover:border-[#F36D8F] transition-colors duration-300`}>
                      {isEditing ? (
    <input 
      type="number" 
      name="budget_max"
      value={formData.budget_max}
      onChange={handleInputChange}
      className="w-full bg-transparent text-xl font-medium text-gray-800 outline-none"
    />
  ) : (
    <p className="text-xl font-medium text-gray-800">
      {userData.budget_max ? `${userData.budget_max} €` : 'Non renseigné'}
    </p>
  )}
                    </div>
                  </div>
                )}
                
                <div className="md:col-span-2 space-y-2">
                  <p className="text-lg font-medium text-gray-500">Adresse</p>
                  <div className={`p-4 ${isEditing ? 'bg-[#2DBDAC]/5 border-[#2DBDAC]' : 'bg-gray-50 border-gray-200'} rounded-xl border hover:border-[#2DBDAC] transition-colors duration-300`}>
                    {isEditing ? (
    <textarea 
      name="adresse"
      value={formData.adresse}
      onChange={handleInputChange}
      className="w-full bg-transparent text-xl font-medium text-gray-800 outline-none resize-none"
      rows={2}
    />
  ) : (
    <p className="text-xl font-medium text-gray-800">
      {userData.adresse || 'Non renseigné'}
    </p>
  )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="mt-8 flex justify-end space-x-4">
                  <button 
                    onClick={handleEditToggle}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors duration-300"
                  >
                    Annuler
                  </button>
                  <button 
    onClick={handleSubmit}
    className="px-6 py-2 bg-[#2DBDAC] text-white rounded-full hover:bg-[#239f8f] transition-colors duration-300"
  >
    Enregistrer
  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;