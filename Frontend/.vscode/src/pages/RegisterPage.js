import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Validation du formulaire d'inscription classique
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

  // Inscription classique par email / mot de passe
  const handleRegister = async (e) => {
    
    e.preventDefault();
    
    if (!validateForm()){
      alert("non valide")
      return;}
      
    try {
      alert(" valide")
      await axios.post("http://localhost:8000/auth/register", { email, password, role });
      alert("Inscription réussie !");
      navigate("/login");
    } catch (error) {
      alert("Erreur lors de l'inscription");
    }
  };

  // ----- Inscription via Google -----
  const handleGoogleClick = () => {
    setShowRoleModal(true);
  };

  const handleGoogleSuccess = (response) => {
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
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          alert("Inscription réussie ! Veuillez vous connecter.");
          navigate("/login");
        } else {
          alert("Ce compte existe déjà !");
        }
      })
      .catch((error) => console.error("Erreur:", error));
  };

  // ----- Inscription via Facebook -----
  const handleFacebookRegister = () => {
    // Vérifiez d'abord que le SDK Facebook est chargé
    if (!window.FB) {
      alert("Le SDK Facebook n'est pas chargé. Veuillez réessayer plus tard.");
      return;
    }
    // Vérifier que le rôle est sélectionné
    if (!role) {
      alert("Veuillez sélectionner un rôle avant de continuer.");
      return;
    }
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          fetch(`http://localhost:8000/auth/facebook-signup?role=${encodeURIComponent(role)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: accessToken }),
            credentials: "include"
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.access_token) {
                alert("Inscription réussie ! Veuillez vous connecter.");
                navigate("/login");
              } else {
                alert("Ce compte existe déjà !");
              }
            })
            .catch((error) => console.error("Erreur lors de l'inscription Facebook:", error));
        } else {
          alert("Connexion Facebook annulée ou échouée.");
        }
      },
      { scope: "public_profile,email" }
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6">Inscription</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          className="border p-2 mb-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        <input
          type="password"
          placeholder="Mot de passe"
          className="border p-2 mb-2 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}

        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          className="border p-2 mb-2 w-full"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}

        <select
          className="border p-2 mb-2 w-full"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Sélectionnez un rôle</option>
          <option value="particulier">Particulier</option>
          <option value="professionnel">Professionnel</option>
          <option value="collectivite">Collectivité</option>
        </select>
        {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}

        <button className="bg-blue-500 text-white p-3 rounded w-full mt-2 text-lg" type="submit">
          S'inscrire
        </button>
      </form>

      <div className="mt-4 flex flex-col gap-4">
        {/* Bouton pour inscription avec Google */}
        <button
          className="bg-red-500 text-white p-3 rounded w-full text-lg"
          onClick={handleGoogleClick}
        >
          S'inscrire avec Google
        </button>

        {/* Bouton pour inscription avec Facebook */}
        <button
          className="bg-blue-700 text-white p-3 rounded w-full text-lg"
          onClick={handleFacebookRegister}
        >
          S'inscrire avec Facebook
        </button>

    
       
      </div>

      {/* Modale pour Google (sélection du rôle) */}
      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[500px]">
            <h3 className="text-xl font-semibold mb-4">Choisissez votre rôle</h3>
            <select
              className="border p-2 mb-4 w-full"
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
                onSuccess={handleGoogleSuccess}
                onError={() => console.log("Erreur de connexion Google")}
              />
            )}
            <button
              className="mt-4 text-red-500 w-full text-lg"
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
