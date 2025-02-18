import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // États pour la réinitialisation de mot de passe
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  // resetStep détermine l'étape : "request" pour envoyer l'email ou "reset" pour saisir le token et le nouveau mot de passe
  const [resetStep, setResetStep] = useState("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/auth/login", { email, password });
      login(response.data.access_token);
      alert("Connexion réussie !");
      navigate(`/${response.data.role}`);
    } catch (error) {
      alert("Erreur de connexion !");
    }
  };

  const handleSuccess = (response) => {
    const id_token = response.credential;
    fetch("http://localhost:8000/auth/google-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id_token }),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.access_token) {
          login(data.access_token);
          alert("Connexion réussie !");
          navigate(`/${data.role}`);
        } else {
          alert("Veuillez créer un compte !");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const handleFailure = (error) => {
    console.error("Google Sign In failed:", error);
  };

  const handleFacebookLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          fetch("http://localhost:8000/auth/facebook-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: accessToken }),
            credentials: "include",
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.access_token) {
                login(data.access_token);
                alert("Connexion réussie !");
                navigate(`/${data.role}`);
              } else {
                alert("Veuillez créer un compte !");
              }
            })
            .catch((error) => console.error("Erreur de connexion Facebook:", error));
        }
      },
      { scope: "public_profile,email" }
    );
  };

  // Envoie de l'email de réinitialisation
  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/auth/request-password-reset", { email: resetEmail });
      alert("Email de réinitialisation envoyé !");
      // Passer à l'étape suivante : saisir token et nouveau mot de passe
      setResetStep("reset");
    } catch (error) {
      alert("Erreur lors de l'envoi de l'email !");
    }
  };

  // Envoi du token et du nouveau mot de passe pour réinitialisation
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
        await axios.post("http://localhost:8000/auth/reset-password", {
            email: resetEmail,
            token: resetToken,
            new_password: newPassword,
        });
        alert("Réinitialisation du mot de passe réussie !");
        setIsResettingPassword(false);
        setResetStep("request"); // Réinitialisation pour une utilisation ultérieure
    } catch (error) {
        alert("Erreur lors de la réinitialisation du mot de passe !");
    }
};

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6">Connexion</h2>
      {!isResettingPassword ? (
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
          <div className="mt-4">
            <GoogleLogin
              clientId="104107465263-v7mlmu7q301eula8lbr8l176ngs3gslt.apps.googleusercontent.com"
              buttonText="Login with Google"
              onSuccess={handleSuccess}
              onError={handleFailure}
            />
          </div>
          <div className="mt-4">
            <FacebookLogin
              appId="604000669075467"
              autoLoad={false}
              fields="name,email,picture"
              callback={handleFacebookLogin}
              textButton="Se connecter avec Facebook"
            />
          </div>
          <p className="mt-4">
            Pas encore de compte ?{" "}
            <a href="/register" className="text-blue-500">
              Inscrivez-vous ici
            </a>
          </p>
          <p className="mt-4">
            <button
              onClick={() => {
                setIsResettingPassword(true);
                setResetStep("request");
              }}
              className="text-blue-500"
            >
              Mot de passe oublié ?
            </button>
          </p>
        </form>
      ) : (
        <>
          {resetStep === "request" ? (
            // Formulaire pour envoyer l'email de réinitialisation
            <form onSubmit={handlePasswordResetRequest}>
              <input
                type="email"
                placeholder="Email"
                className="border p-2 mb-4 w-full"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <button className="bg-blue-500 text-white p-2 rounded w-full" type="submit">
                Envoyer le lien de réinitialisation
              </button>
              <p className="mt-4">
                <button onClick={() => setIsResettingPassword(false)} className="text-blue-500">
                  Retour à la connexion
                </button>
              </p>
            </form>
          ) : (
            // Card affichée après envoi de l'email pour saisir le token et le nouveau mot de passe
            <form onSubmit={handlePasswordReset}>
              <input
                type="text"
                placeholder="Token"
                className="border p-2 mb-4 w-full"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
              />
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                className="border p-2 mb-4 w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button className="bg-green-500 text-white p-2 rounded w-full" type="submit">
                Réinitialiser le mot de passe
              </button>
              <p className="mt-4">
                <button
                  onClick={() => {
                    setIsResettingPassword(false);
                    setResetStep("request");
                  }}
                  className="text-blue-500"
                >
                  Annuler
                </button>
              </p>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default Login;
