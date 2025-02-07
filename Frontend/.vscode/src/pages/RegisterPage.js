import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("particulier");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/auth/register", { email, password, role });
      alert("Inscription réussie !");
      navigate("/login");
    } catch (error) {
      alert("Erreur lors de l'inscription");
    }
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
          <option value="particulier">Particulier</option>
          <option value="professionnel">Professionnel</option>
          <option value="collectivite">Collectivité</option>
        </select>
        <button className="bg-blue-500 text-white p-2 rounded w-full" type="submit">
          S'inscrire
        </button>
      </form>
    </div>
  );
};

export default Register;