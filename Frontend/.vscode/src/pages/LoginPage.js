import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google"; // Importation du composant GoogleLogin

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/auth/login", { email, password });
      login(response.data.access_token);
      alert("Connexion réussie !");
      // Redirection selon le rôle
      if (response.data.role === "particulier") {
        navigate("/particulier");
      } else if (response.data.role === "professionnel") {
        navigate("/professionnel");
      } else if (response.data.role === "collectivite") {
        navigate("/collectivite");
      }
    } catch (error) {
      alert("Erreur de connexion !");
    }
  };

  // Fonction pour gérer la connexion Google

  const handleSuccess = (response) => {
    const id_token = response.credential;

    // Envoyer le token à l'API backend
    fetch('http://localhost:8000/auth/google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id_token }),
      credentials: 'include' // Permet d'envoyer et recevoir des cookies
    })
    .then(response => response.json())
    .then(data => {
      if (data.access_token) {
        login(data.access_token);
        alert("Connexion réussie !");
        navigate(`/${data.role}`);
      } else {
        alert("Veuillez créer un compte !");
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  const handleFailure = (error) => {
    console.error("Google Sign In failed:", error);
  };


  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6">Connexion</h2>
      <form onSubmit={handleLogin}>
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
        <button className="bg-blue-500 text-white p-2 rounded w-full" type="submit">
          Se connecter
        </button>

        

      

      {/* Ajout du bouton de connexion Google */}
      <div className="mt-4">
        <GoogleLogin
        clientId= "104107465263-v7mlmu7q301eula8lbr8l176ngs3gslt.apps.googleusercontent.com"
        buttonText="Login with Google"
        onSuccess={handleSuccess}
          onError={(error) => console.log("Erreur de connexion Google :", error)}
        />
      </div>
      <p className="mt-4">

          Pas encore de compte ? <a href="/register" className="text-blue-500">Inscrivez-vous ici</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
