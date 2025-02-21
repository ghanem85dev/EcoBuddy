import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

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
      navigate(`/${response.data.role}`);
    } catch (error) {
      console.error("Erreur de connexion !", error);
      alert("Erreur de connexion ! Veuillez vérifier vos identifiants.");
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
      .catch((error) => {
        console.error("Erreur lors de la connexion Google:", error);
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-lg rounded-lg">
      <h3 className="text-3xl font-semibold text-center text-orange-600 drop-shadow-md font-serif">
  Se connecter
</h3>


        <p className="text-sm text-center text-gray-600">Veuillez saisir vos identifiants pour accéder à votre compte</p>
        <GoogleLogin onSuccess={handleSuccess} onError={() => console.error("Erreur de connexion Google")} />
        <div className="flex items-center my-3">
          <hr className="w-full border-gray-300" />
          <p className="px-3 text-gray-500">or</p>
          <hr className="w-full border-gray-300" />
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email*</label>
            <input
              id="email"
              type="email"
              placeholder="mail@gmail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              id="password"
              type="password"
              placeholder="Entrer votre mot de passe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring focus:ring-indigo-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
  <label className="flex items-center">
    <input type="checkbox" className="w-4 h-4 text-orange-600 border-gray-300 rounded" />
    <span className="ml-2 text-sm text-gray-600">Rester connecté</span>
  </label>
  <a href="#" className="text-sm text-orange-600 hover:underline">Mot de passe oublié ?</a>
</div>

          <button
  className="w-full py-3 text-white bg-orange-600 rounded-lg hover:bg-orange-700"
  type="submit"
>
  Connexion
</button>

        </form>
        <p className="text-sm text-center text-gray-600">
  Pas encore inscrit ? <a href="/register" className="font-bold text-orange-600 hover:underline">Créer un compte</a>
</p>

      </div>
    </div>
  );
};

export default Login;
