import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { FaGoogle, FaFacebook } from "react-icons/fa"; // Importing Google and Facebook icons from react-icons

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
    if (!validateForm()) {
      alert("non valide");
      return;
    }

    try {
      alert(" valide");
      await axios.post("http://localhost:8000/auth/register", { email, password, role });
      alert("Inscription réussie !");
      navigate("/login");
    } catch (error) {
      alert("Erreur lors de l'inscription");
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
    <div className="p-6 max-w-sm mx-auto bg-white rounded-lg shadow-lg mt-12">
      <h2 className="text-3xl font-semibold text-center mb-6 text-orange-500">Inscription</h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-orange-500 text-sm">{errors.email}</p>}

        <input
          type="password"
          placeholder="Mot de passe"
          className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="text-orange-500 text-sm">{errors.password}</p>}

        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {errors.confirmPassword && <p className="text-orange-500 text-sm">{errors.confirmPassword}</p>}

        <select
          className="border p-2 w-full rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 transition duration-300"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Sélectionnez un rôle</option>
          <option value="particulier">Particulier</option>
          <option value="professionnel">Professionnel</option>
          <option value="collectivite">Collectivité</option>
        </select>
        {errors.role && <p className="text-orange-500 text-sm">{errors.role}</p>}

        <button className="bg-orange-500 text-white p-2 rounded-md w-full mt-4 text-base hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition duration-300" type="submit">
          S'inscrire
        </button>

        <div className="mt-6 flex flex-col gap-4">
          <button
            className="bg-orange-500 text-white p-2 rounded-md w-full text-base hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition duration-300 flex items-center justify-center"
            onClick={handleGoogleClick}
          >
            <FaGoogle className="mr-2 text-lg" />
            S'inscrire avec Google
          </button>

          <button
            className="bg-orange-500 text-white p-2 rounded-md w-full text-base hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-300 transition duration-300 flex items-center justify-center"
            onClick={handleFacebookRegister}
          >
            <FaFacebook className="mr-2 text-lg" />
            S'inscrire avec Facebook
          </button>
        </div>
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
  );
};

export default Register;
