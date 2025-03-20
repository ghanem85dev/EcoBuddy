import React from "react";
import { Routes, Route } from "react-router-dom"; // Pas besoin de BrowserRouter ici
import { useTheme } from "./context/ThemeContext"; // Import du contexte

// Import des composants
import Hero from "./components/Hero";
import Services from "./components/Services";
import Banner from "./components/Banner";
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";
import SitesSettings from "./pages/SitesSettings";
import Home from "./pages/HomePage";
import InviteUser from "./pages/InviteUser";
import AcceptInvite from "./pages/AcceptInvite";
import DashboardPage from "./pages/DashboardPage";
import UserSettings from "./pages/UserSettings";
import Maps from "./components/Maps";

const App = () => {
  const { theme } = useTheme(); // Récupère le thème actuel (light ou dark)

  return (
    <div className={`App ${theme}`}>
      {/* Les routes sont ici, sans BrowserRouter */}
      <Routes>
        <Route path="/" element={<><Hero /><Services /><Banner /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/service" element={<Services />} />
        <Route path="/home/:idUser" element={<Home />} />
        <Route path="/maps" element={<Maps />} />
        
        <Route path="/Sites-settings/:id" element={<SitesSettings />} />
        <Route path="/dashboard/:idUser" element={<DashboardPage />} />
        <Route path="/UserSettings/:idUser" element={<UserSettings />} />
        <Route path="/invite" element={<InviteUser />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
      </Routes>
    </div>
  );
};

export default App;
