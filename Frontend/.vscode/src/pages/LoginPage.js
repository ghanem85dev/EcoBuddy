import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login";
import { FaFacebookF } from "react-icons/fa";
import { Link } from "react-router-dom";
import mdp from "../assets/mdp.png"; // Ajout de l'image

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // États pour la réinitialisation de mot de passe
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetStep, setResetStep] = useState("request");
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:8000/auth/login", { email, password });
      login(response.data.access_token);

      localStorage.setItem("token", response.data.access_token);

      alert("Connexion réussie !");
      navigate(`/home/${response.data.id}`);
    } catch (error) {
      alert("Erreur de connexion !");
    }
  };

  // Envoi de l'email de réinitialisation
  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/auth/request-password-reset", { email: resetEmail });
      alert("Email de réinitialisation envoyé !");
      setResetStep("reset");
    } catch (error) {
      alert("Erreur lors de l'envoi de l'email !");
    }
  };

  // Réinitialisation du mot de passe
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/auth/reset-password", {
        email: resetEmail,
        token: resetToken,
        new_password: newPassword,
      });
      alert("Réinitialisation réussie !");
      setIsResettingPassword(false);
      setResetStep("request");
    } catch (error) {
      alert("Erreur lors de la réinitialisation !");
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
          navigate(`/home/${data.id}`);
        } else {
          alert("Veuillez créer un compte !");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
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
                navigate(`/home/${data.id}`);
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

  return (
    <div className="flex h-screen">
      {/* Section Formulaire */}
      <div className="w-1/2 flex flex-col justify-center px-16">
        <h2 className="text-5xl font-bold text-[#6eb1e6] mb-4 text-center">Connexion</h2>
        <p className="text-gray-500 mb-6 text-center">
          Accédez à votre tableau de bord et surveillez votre consommation énergétique.
        </p>

        {!isResettingPassword ? (
          <>
            {/* Connexion avec Google et Facebook en ligne */}
            <div className="flex w-full gap-4">
              {/* Connexion Google */}
              <div className="flex-1 border border-gray-300 py-3 rounded-lg shadow-sm cursor-pointer flex justify-center items-center">
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={() => console.log("Erreur de connexion Google")}
                />
              </div>

              {/* Connexion Facebook */}
              <div className="flex-1 border border-gray-300 py-3 rounded-lg shadow-sm cursor-pointer flex justify-center items-center">
                <FacebookLogin
                  appId="604000669075467"
                  autoLoad={false}
                  fields="name,email,picture"
                  callback={handleFacebookLogin}
                  cssClass="flex justify-center items-center text-gray-700 w-full"
                  textButton="Se connecter avec Facebook"
                  icon={<FaFacebookF className="text-blue-600 text-xl mr-2" />}
                />
              </div>
            </div>

            {/* Ligne séparatrice */}
            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="px-3 text-[#6eb1e6] font-semibold text-sm">Ou connectez-vous avec votre e-mail</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            {/* Formulaire de connexion */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-gray-700 font-semibold">Adresse e-mail</label>
                <input
                  type="email"
                  placeholder="Votre adresse e-mail"
                  className="border border-gray-300 p-3 rounded-lg w-full mt-1"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-gray-700 font-semibold">Mot de passe</label>
                <input
                  type="password"
                  placeholder="Votre mot de passe"
                  className="border border-gray-300 p-3 rounded-lg w-full mt-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Bouton Connexion */}
              <button
                type="submit"
                className="w-full py-3 rounded-lg text-white font-bold text-lg bg-[#6eb1e6] hover:bg-[#5a9ace] transition"
              >
                Se connecter
              </button>

              <p className="text-center">
                <button
                  onClick={() => setIsResettingPassword(true)}
                  className="text-[#6eb1e6] font-semibold hover:text-[#5a9ace] transition"
                >
                  Mot de passe oublié ?
                </button>
              </p>
              <p className="text-center mt-4 text-gray-500">
                Vous n'avez pas encore de compte ?{" "}
                <Link to="/register" className="text-[#6eb1e6] font-semibold hover:text-[#5a9ace] transition">
                  Inscrivez-vous ici
                </Link>
              </p>
            </form>
          </>
        ) : (
          <>
            {resetStep === "request" ? (
              <form onSubmit={handlePasswordResetRequest} className="space-y-4 bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-center text-gray-900 mb-4">
                  Réinitialisation du mot de passe
                </h2>
                <input
                  type="email"
                  placeholder="Votre email"
                  className="border border-gray-300 p-3 rounded-lg w-full"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <button
                  className="bg-[#6eb1e6] text-white p-3 rounded-lg w-full font-bold hover:bg-[#5a9ace] transition"
                  type="submit"
                >
                  Envoyer le lien
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4 bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-center text-gray-900 mb-4">
                  Saisissez votre nouveau mot de passe
                </h2>
                <input
                  type="text"
                  placeholder="Code de vérification"
                  className="border border-gray-300 p-3 rounded-lg w-full"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Nouveau mot de passe"
                  className="border border-gray-300 p-3 rounded-lg w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button className="bg-green-500 text-white p-3 rounded-lg w-full font-bold hover:bg-green-600 transition" type="submit">
                  Réinitialiser le mot de passe
                </button>
              </form>
            )}
          </>
        )}
      </div>

      {/* Section Illustration */}
      <div className="w-1/2 flex items-center justify-center bg-[#9fe4f4]">
        <img src={mdp} alt="Illustration Connexion" className="max-w-md object-contain" />
      </div>
    </div>
  );
};

export default Login;