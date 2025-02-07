import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD:Frontend/.vscode/src/pages/LoginPage.js
import { GoogleLogin } from "@react-oauth/google"; // Importation du composant GoogleLogin
=======
>>>>>>> 93ad9a3 (home page):.vscode/src/pages/LoginPage.js

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

<<<<<<< HEAD:Frontend/.vscode/src/pages/LoginPage.js
  // Fonction pour gérer la connexion Google
  const handleGoogleLogin = async (response) => {
    try {
      console.log(response);
      if (response?.credential) {
        const googleResponse = await axios.post("http://localhost:8000/auth/callback", {
          code: response.credential, // Send the authorization code instead of the token
        });
  
        login(googleResponse.data.access_token); // Store the JWT token
  
        // Redirect based on the role
        if (googleResponse.data.role === "particulier") {
          navigate("/particulier");
        } else if (googleResponse.data.role === "professionnel") {
          navigate("/professionnel");
        } else if (googleResponse.data.role === "collectivite") {
          navigate("/collectivite");
        }
      } else {
        throw new Error("No authorization code returned from Google");
      }
    } catch (error) {
      alert("Erreur de connexion avec Google !");
      console.error(error);
    }
  };
  

  
=======
>>>>>>> 93ad9a3 (home page):.vscode/src/pages/LoginPage.js
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
        <p className="mt-4">
<<<<<<< HEAD:Frontend/.vscode/src/pages/LoginPage.js
          Pas encore de compte ? <a href="/register" className="text-blue-500">Inscrivez-vous ici</a>
        </p>
      </form>

      {/* Ajout du bouton de connexion Google */}
      <div className="mt-4">
        <GoogleLogin
        clientId= "104107465263-v7mlmu7q301eula8lbr8l176ngs3gslt.apps.googleusercontent.com"
        buttonText="Login with Google"
        onSuccess={handleGoogleLogin}
          onError={(error) => console.log("Erreur de connexion Google :", error)}
        />
      </div>
=======
  Pas encore de compte ? <a href="/register" className="text-blue-500">Inscrivez-vous ici</a>
</p>
      </form>
>>>>>>> 93ad9a3 (home page):.vscode/src/pages/LoginPage.js
    </div>
  );
};

<<<<<<< HEAD:Frontend/.vscode/src/pages/LoginPage.js
export default Login;
=======
export default Login;
>>>>>>> 93ad9a3 (home page):.vscode/src/pages/LoginPage.js
