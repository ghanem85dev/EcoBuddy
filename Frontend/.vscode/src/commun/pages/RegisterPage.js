import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login";
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import loginImage from "../../assets/login.png";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    nom: "",
    prenom: "",
    telephone: "",
    adresse: ""
  });
  const [errors, setErrors] = useState({});
  const [showRoleModal, setShowRoleModal] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = "Veuillez entrer un email valide.";
    }
    if (formData.password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }
    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }
    if (!formData.role) {
      newErrors.role = "Veuillez sélectionner un rôle.";
    }
    if (!formData.nom && formData.role !== "particulier") {
      newErrors.nom = "Veuillez entrer votre nom.";
    }
    if (!formData.prenom && formData.role === "particulier") {
      newErrors.prenom = "Veuillez entrer votre prénom.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const { confirmPassword, ...userData } = formData;
      const response = await axios.post("http://localhost:8000/auth/register", userData);
      
      alert("Inscription réussie !");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.detail || "Erreur lors de l'inscription !");
    }
  };

  const handleGoogleClick = () => {
    setShowRoleModal(true);
  };

  const handleGoogleSuccess = (response) => {
    const id_token = response.credential;
    if (!formData.role) {
      alert("Veuillez sélectionner un rôle avant de continuer.");
      return;
    }
    
    axios.post(`http://localhost:8000/auth/google-signup?role=${encodeURIComponent(formData.role)}`, { id_token })
      .then(({ data }) => {
        if (data.access_token) {
          alert("Inscription réussie ! Veuillez vous connecter.");
          navigate("/login");
        } else {
          alert("Ce compte existe déjà !");
        }
      })
      .catch(error => console.error("Erreur:", error));
  };

  const handleFacebookRegister = (response) => {
    if (!response.accessToken) {
      alert("Connexion Facebook annulée ou échouée.");
      return;
    }
    if (!formData.role) {
      alert("Veuillez sélectionner un rôle avant de continuer.");
      return;
    }

    axios.post(`http://localhost:8000/auth/facebook-signup?role=${encodeURIComponent(formData.role)}`, {
      access_token: response.accessToken
    })
      .then(({ data }) => {
        if (data.access_token) {
          alert("Inscription réussie ! Veuillez vous connecter.");
          navigate("/login");
        } else {
          alert("Ce compte existe déjà !");
        }
      })
      .catch(error => console.error("Erreur lors de l'inscription Facebook:", error));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen w-full">
      <div className="flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#6eb1e6] mb-4 text-center">Inscription</h2>
          <p className="text-gray-500 mb-6 text-center leading-relaxed">
            Créez un compte et commencez à surveiller votre consommation énergétique.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={handleGoogleClick}
              className="flex items-center justify-center gap-2 bg-white border border-gray-300 py-3 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition w-full"
            >
              <FaGoogle className="text-red-500" />
              <span>Google</span>
            </button>
            
            <FacebookLogin
              appId="604000669075467"
              autoLoad={false}
              fields="name,email,picture,first_name,last_name"
              callback={handleFacebookRegister}
              cssClass="flex items-center justify-center gap-2 bg-white border border-gray-300 py-3 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition w-full"
              textButton="Facebook"
              icon={<FaFacebookF className="text-blue-600" />}
            />
          </div>

          <div className="flex items-center my-6">
            <hr className="flex-grow border-gray-300" />
            <span className="px-3 text-[#6eb1e6] font-semibold text-sm">Ou avec votre email</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Nom*</label>
                <input
                  type="text"
                  name="nom"
                  placeholder="Votre nom"
                  className="border border-gray-300 p-3 rounded-lg w-full"
                  value={formData.nom}
                  onChange={handleChange}
                />
                {errors.nom && <p className="text-red-500 text-sm mt-1">{errors.nom}</p>}
              </div>
              
              {formData.role === "particulier" && (
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Prénom*</label>
                  <input
                    type="text"
                    name="prenom"
                    placeholder="Votre prénom"
                    className="border border-gray-300 p-3 rounded-lg w-full"
                    value={formData.prenom}
                    onChange={handleChange}
                  />
                  {errors.prenom && <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Email*</label>
              <input
                type="email"
                name="email"
                placeholder="Votre email"
                className="border border-gray-300 p-3 rounded-lg w-full"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Téléphone</label>
                <input
                  type="tel"
                  name="telephone"
                  placeholder="Votre téléphone"
                  className="border border-gray-300 p-3 rounded-lg w-full"
                  value={formData.telephone}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  name="adresse"
                  placeholder="Votre adresse"
                  className="border border-gray-300 p-3 rounded-lg w-full"
                  value={formData.adresse}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Rôle*</label>
              <select
                name="role"
                className="border border-gray-300 p-3 rounded-lg w-full"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="">Choisissez un rôle</option>
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
                <option value="collectivite">Collectivité</option>
              </select>
              {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Mot de passe*</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Votre mot de passe"
                  className="border border-gray-300 p-3 rounded-lg w-full"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-1">Confirmation*</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirmez votre mot de passe"
                  className="border border-gray-300 p-3 rounded-lg w-full"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg text-white font-bold text-lg bg-[#6eb1e6] hover:bg-[#5a9ace] transition"
            >
              S'inscrire
            </button>

            <p className="text-gray-500 text-sm text-center">
              Déjà un compte ?{" "}
              <a href="/login" className="text-[#6eb1e6] font-semibold hover:underline">
                Connectez-vous ici
              </a>
            </p>
          </form>
        </div>
      </div>

      <div className="hidden lg:flex justify-center items-center bg-blue-50 p-8">
        <img 
          src={loginImage} 
          alt="Inscription" 
          className="max-w-full h-auto max-h-[80vh] object-contain" 
        />
      </div>

      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-2xl font-semibold mb-4 text-center text-[#6eb1e6]">Choisissez votre rôle</h3>
            <select
              className="border border-gray-300 p-3 rounded-lg w-full mb-4"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="">Sélectionnez un rôle</option>
              <option value="particulier">Particulier</option>
              <option value="entreprise">Entreprise</option>
              <option value="collectivite">Collectivité</option>
            </select>
            
            {formData.role && (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => console.log("Échec de la connexion Google")}
                  useOneTap
                />
              </div>
            )}
            
            <button
              className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800 transition"
              onClick={() => setShowRoleModal(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;