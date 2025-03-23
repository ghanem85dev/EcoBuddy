import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login";

import { FaGoogle, FaFacebookF } from "react-icons/fa";
import loginImage from "../../assets/login.png"; // Illustration

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState({});
  const [showRoleModal, setShowRoleModal] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    let newErrors = {};

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = "Veuillez entrer un email valide.";
    }
    if (password.length < 8) {
      newErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
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
    if (!validateForm()) {
      alert("Formulaire invalide !");
      return;
    }
    try {
      console.log("avant request:");
      const response = await axios.post("http://localhost:8000/auth/register", { email, password, role });
      console.log("Réponse du serveur:", response.data);
      alert("Inscription réussie !");
      navigate("/login");
    } catch (error) {
      alert("Erreur lors de l'inscription !");
    }
  };

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
      credentials: "include",
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

  const handleFacebookRegister = () => {
    if (!window.FB) {
      alert("Le SDK Facebook n'est pas chargé. Veuillez réessayer plus tard.");
      return;
    }
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
            credentials: "include",
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
    <div className="grid grid-cols-2 h-screen w-full">
      <div className="flex flex-col justify-center items-center px-16">
        <h2 className="text-4xl font-bold text-[#6eb1e6] mb-4">Inscription</h2>
        <p className="text-gray-500 mb-6 text-center leading-relaxed w-full">
          Créez un compte et commencez à surveiller votre consommation énergétique.
        </p>
        <div className="flex w-full gap-4">
          <div className="flex-1 border border-gray-300 py-3 rounded-lg shadow-sm cursor-pointer flex justify-center items-center">
          <button
            className="bg-orange-500 text-white p-2 rounded-md w-full text-base hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition duration-300 flex items-center justify-center"
            onClick={handleGoogleClick}
          ></button>
          </div>
          <div className="flex-1 border border-gray-300 py-3 rounded-lg shadow-sm cursor-pointer flex justify-center items-center">
            <FacebookLogin
              appId="604000669075467"
              autoLoad={false}
              fields="name,email,picture"
              callback={handleFacebookRegister}
              cssClass="flex justify-center items-center text-gray-700 w-full"
              textButton="S'inscrire avec Facebook"
              icon={<FaFacebookF className="text-blue-600 text-xl mr-2" />}
            />
          </div>
        </div>

        <div className="flex items-center my-4 w-full">
          <hr className="flex-grow border-gray-300" />
          <span className="px-3 text-[#6eb1e6] font-semibold text-sm">Ou inscrivez-vous avec votre e-mail</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <form onSubmit={handleRegister} className="space-y-4 w-full">
          <div>
            <label className="text-gray-700 font-semibold">Adresse e-mail</label>
            <input
              type="email"
              placeholder="Votre adresse e-mail"
              className="border border-gray-300 p-3 rounded-lg w-full mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
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
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>

          <div>
            <label className="text-gray-700 font-semibold">Confirmer le mot de passe</label>
            <input
              type="password"
              placeholder="Confirmez votre mot de passe"
              className="border border-gray-300 p-3 rounded-lg w-full mt-1"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="text-gray-700 font-semibold">Sélectionnez un rôle</label>
            <select
              className="border border-gray-300 p-3 rounded-lg w-full mt-1"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">Choisissez un rôle</option>
              <option value="particulier">Particulier</option>
              <option value="professionnel">Professionnel</option>
              <option value="collectivite">Collectivité</option>
            </select>
            {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-lg text-white font-bold text-lg bg-[#6eb1e6] hover:bg-[#5a9ace] transition"
          >
            S'inscrire
          </button>

          <p className="text-gray-500 text-sm text-center">
            Déjà un compte ?{" "}
            <a href="/login" className="text-[#6eb1e6] font-semibold hover:text-[#5a9ace] transition">
              Connectez-vous ici
            </a>
          </p>
        </form>

        {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
            <h3 className="text-2xl font-semibold mb-4 text-center text-orange-500">Choisissez votre rôle</h3>
            <select
              className="border p-2 mb-4 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
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
              className="mt-4 text-red-500 w-full text-lg text-center hover:underline transition duration-300"
              onClick={() => setShowRoleModal(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}
      </div>
      <div className="hidden lg:block flex justify-center items-center bg-blue-50">
        <img src={loginImage} alt="login" className="w-3/4 h-3/4 object-cover" />
      </div>
    </div>
  );
};

export default Register;