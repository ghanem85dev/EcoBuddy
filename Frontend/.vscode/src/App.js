import React from "react";
import { Routes, Route } from "react-router-dom"; // Pas besoin de BrowserRouter ici
import { useTheme } from "./commun/context/ThemeContext"; // Import du contexte

// Import des composants
import Hero from "./commun/components/Hero";
import Services from "./components/Services";
import Banner from "./components/Banner";
import Login from "./commun/pages/LoginPage";
import Register from "./commun/pages/RegisterPage";
import SitesSettings from "./particulier/pages/SitesSettings";
import Home from "./pages/HomePage";
import InviteUser from "./commun/pages/InviteUser";
import AcceptInvite from "./commun/pages/AcceptInvite";
import DashboardPage from "./particulier/pages/DashboardPage";
import UserSettings from "./commun/pages/UserSettings";
import Maps from "./commun/components/Maps";
import DashboardAdmin from "./admin/pages/dashboardAdmin"
import QuestionForm from "./admin/components/AddQuestion"
import QuestionList from "./commun/components/ListQuestion"
import Reponse from "./commun/components/ReponseQuestion"

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
        <Route path="/addquestion" element={<QuestionForm />} />
        <Route path="/question/collectivité" element={<QuestionList />} />
        <Route path="/question/particulier" element={<QuestionList />} />
        <Route path="/reponse/:id" element={<Reponse />} />
        
        <Route path="/Sites-settings/:id" element={<SitesSettings />} />
        <Route path="/dashboard/:idUser" element={<DashboardPage />} />
        <Route path="/UserSettings/:idUser" element={<UserSettings />} />
        <Route path="/invite" element={<InviteUser />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/dashboard/admin" element={<DashboardAdmin />} />
      </Routes>
    </div>
  );
};

export default App;
