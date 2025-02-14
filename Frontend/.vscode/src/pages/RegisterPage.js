import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { FaGoogle } from "react-icons/fa";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    let newErrors = {};
    
    if (!email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = "Veuillez entrer un email valide.";
    }
    
    if (password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Le mot de passe doit contenir au moins une lettre majuscule.";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Le mot de passe doit contenir au moins une lettre minuscule.";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Le mot de passe doit contenir au moins un chiffre.";
    } else if (!/[\W_]/.test(password)) {
      newErrors.password = "Le mot de passe doit contenir au moins un caractère spécial.";
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    if (!role) {
      newErrors.role = "Veuillez sélectionner un rôle.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
if (!validateForm()) return ;
    try {
      await axios.post("http://localhost:8000/auth/register", {
        email,
        password,
        role
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      alert("Inscription réussie !");
      navigate("/login");
    } catch (error) {
      alert("Erreur lors de l'inscription.");
      console.error("Error:", error);
    }
  };

  const handleGoogleClick = () =>
  {
    setShowRoleModal(true);
  }
  const handleSuccess = (response) => {
    const id_token = response.credential;
    if (!role) {
      alert("Veuillez sélectionner un rôle avant de continuer.");
      return;
    }
    fetch(`http://localhost:8000/auth/google-signup?role=${encodeURIComponent(role)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token }),
      credentials: "include"
    })
    .then(response => response.json())
    .then(data => {
      if (data.access_token) {
        alert("Connexion réussie !");
        navigate("/login");
      } else {
        alert("Ce compte existe déjà !");
      }
    })
    .catch(error => console.error("Erreur:", error));
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-semibold text-center text-orange-600 mb-6">Inscription</h2>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Champ Email */}
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          {/* Champ Mot de passe */}
          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          {/* Champ Confirmation du mot de passe */}
          <div>
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Sélecteur de rôle */}
          <div>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Sélectionnez un rôle</option>
              <option value="particulier">Particulier</option>
              <option value="professionnel">Professionnel</option>
              <option value="collectivite">Collectivité</option>
            </select>
            {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
          </div>

          {/* Bouton d'inscription */}
          <button
            className="w-full bg-orange-600 text-white p-3 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300 ease-in-out"
            type="submit"
          >
            S'inscrire
          </button>
        </form>

        {/* Connexion avec Google */}
        <div className="mt-6">
        <button
  className="w-full bg-white text-gray-600 p-3 rounded-lg border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-300 flex items-center justify-center gap-2" onClick={handleGoogleClick}
>
<FaGoogle />Se connecter avec Google
</button>

        </div>
        
        {showRoleModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4">Choisissez votre rôle</h3>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Sélectionnez un rôle</option>
                <option value="particulier">Particulier</option>
                <option value="professionnel">Professionnel</option>
                <option value="collectivite">Collectivité</option>
              </select>
              {role && (
                <GoogleLogin
                  clientId="104107465263-v7mlmu7q301eula8lbr8l176ngs3gslt.apps.googleusercontent.com"
                  buttonText="Continuer avec Google"
                  onSuccess={handleSuccess}
                  onError={() => console.log("Erreur de connexion Google")}
                />
              )}
              <button
                className="mt-4 w-full text-red-500 hover:text-red-600 focus:outline-none"
                onClick={() => setShowRoleModal(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Lien vers la connexion */}
        <p className="text-sm text-center text-gray-600 mt-4">
          Vous avez déjà un compte ? <a href="/login" className="font-bold text-orange-600 hover:underline">Se connecter</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
