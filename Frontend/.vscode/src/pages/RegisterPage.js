import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false); // Gérer l'affichage de la carte
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
        await axios.post("http://localhost:8000/auth/register", {
            email,
            password,
            role
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        alert("Inscription réussie !");
        navigate("/login");
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            alert("Erreur lors de l'inscription: " + error.response.data.detail);
        } else if (error.request) {
            // The request was made but no response was received
            alert("Erreur lors de l'inscription: Aucun réponse du serveur.");
        } else {
            // Something happened in setting up the request that triggered an Error
            alert("Erreur lors de l'inscription: " + error.message);
        }
        console.error("Error:", error);
    }
};

  // Afficher la carte pour choisir le rôle
  const handleGoogleClick = () => {
    setShowRoleModal(true);
  };

  // Fonction pour gérer la connexion Google après sélection du rôle
  const handleSuccess = (response) => {
    const id_token = response.credential;

    if (!role) {
      alert("Veuillez sélectionner un rôle avant de continuer.");
      return;
    }

    fetch(`http://localhost:8000/auth/google-signup?role=${encodeURIComponent(role)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id_token}),
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
      .catch(error => {
        console.error("Error:", error);
      });
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6">Inscription</h2>
      <form onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          className="border p-2 mb-4 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="border p-2 mb-4 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
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
        <button className="bg-blue-500 text-white p-2 rounded w-full" type="submit">
          S'inscrire
        </button>
      </form>

      {/* Bouton Google qui ouvre la carte */}
      <div className="mt-4">
        <button className="bg-red-500 text-white p-2 rounded w-full" onClick={handleGoogleClick}>
          Se connecter avec Google
        </button>
      </div>

      {/* Carte pour choisir le rôle avant Google Login */}
      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
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
            {/* Afficher le bouton Google seulement si un rôle est choisi */}
            {role && (
              <GoogleLogin
                clientId="104107465263-v7mlmu7q301eula8lbr8l176ngs3gslt.apps.googleusercontent.com"
                buttonText="Continuer avec Google"
                onSuccess={handleSuccess}
                onError={(error) => console.log("Erreur de connexion Google :", error)}
              />
            )}
            {/* Bouton pour fermer la carte */}
            <button
              className="mt-4 text-red-500 w-full"
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
