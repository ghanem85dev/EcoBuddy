import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "react-facebook-login";

import { FaGoogle, FaFacebookF } from "react-icons/fa";
import loginImage from "../assets/login.png"; // Illustration

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState({});
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
      await axios.post("http://localhost:8000/auth/register", { email, password, role });
      alert("Inscription réussie !");
      navigate("/login");
    } catch (error) {
      alert("Erreur lors de l'inscription !");
    }
  };

  return (
    <div className="grid grid-cols-2 h-screen w-full">
      {/* Section Formulaire - Correction pour éviter les espaces */}
      <div className="flex flex-col justify-center items-center px-16">
        <h2 className="text-4xl font-bold text-[#6eb1e6] mb-4">Inscription</h2>
        
        {/* Correction du paragraphe pour un affichage complet */}
        <p className="text-gray-500 mb-6 text-center leading-relaxed w-full">
          Créez un compte et commencez à surveiller votre consommation énergétique.
        </p>

   {/* Conteneur pour aligner Google et Facebook sur la même ligne */}
<div className="flex w-full gap-4">
  {/* Connexion avec Google */}
  <div className="flex-1 border border-gray-300 py-3 rounded-lg shadow-sm cursor-pointer flex justify-center items-center">
    <GoogleLogin
      onSuccess={(response) => {
        console.log("Connexion Google réussie :", response);
      }}
      onError={() => {
        console.log("Erreur de connexion Google");
      }}
    />
  </div>

  {/* Connexion avec Facebook */}
  <div className="flex-1 border border-gray-300 py-3 rounded-lg shadow-sm cursor-pointer flex justify-center items-center">
    <FacebookLogin
      appId="604000669075467"
      autoLoad={false}
      fields="name,email,picture"
      callback={() => console.log("Connexion Facebook")}
      cssClass="flex justify-center items-center text-gray-700 w-full"
      textButton="S'inscrire avec Facebook"
      icon={<FaFacebookF className="text-blue-600 text-xl mr-2" />}
    />
  </div>
</div>


        {/* Ligne séparatrice */}
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

          {/* Correction du bouton d'inscription */}
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
      </div>

      {/* Section Illustration - Suppression des espaces et alignement */}
      <div className="flex justify-center items-center">
        <img src={loginImage} alt="Illustration Inscription" className="max-w-md object-contain" />
      </div>
    </div>
  );
};

export default Register;
