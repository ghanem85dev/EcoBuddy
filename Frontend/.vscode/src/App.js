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
import AdminSitesSettings from "./admin/pages/adminSitesSettings"
import DashboardEntreprise from "./entreprise/pages/DashboardEntreprise"
import AddEntreprise from "./entreprise/pages/AddEntreprise"
import EntreprisesList from "./entreprise/pages/ListEntreprises"
import SitesEntreprise from "./entreprise/pages/listSites"
import AdminEntreprisesSettings from "./admin/pages/AdminEntrepriseSettings"
import ModifyQuestion from "./admin/components/ModifyQuestion"
import AdminQuestions from "./admin/pages/AdminQuestions"

const App = () => {
  const { theme } = useTheme(); // Récupère le thème actuel (light ou dark)

  return (
    <div className={`App ${theme}`}>
      {/* Les routes sont ici, sans BrowserRouter */}
      <Routes>
        <Route path="/" element={<><Hero /><Services /><Banner /></>} />
        <Route path="/acceuil" element={<><Hero /><Services /><Banner /></>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/service" element={<Services />} />
        <Route path="/home/:idUser" element={<Home />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/addquestion" element={<QuestionForm />} />
        <Route path="/question/entreprise" element={<QuestionList />} />
        <Route path="/question/particulier" element={<QuestionList />} />
        <Route path="/admin/question" element={<AdminQuestions />} />
        <Route path="/modifyquestion/:id" element={<ModifyQuestion />} />
        <Route path="/reponse/:id" element={<Reponse />} />
        <Route path="/admin/Sites-settings" element={<AdminSitesSettings />} />
        <Route path="/Sites-settings/:id" element={<SitesSettings />} />
        <Route path="particulier/dashboard/:idUser" element={<DashboardPage />} />
        <Route path="/UserSettings/:user_id" element={<UserSettings />} />
        <Route path="/invite" element={<InviteUser />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
      
<Route path="/dashboard/entreprise" element={<DashboardEntreprise key="entreprise" />} />
<Route path="/dashboard/responsable" element={<DashboardEntreprise key="responsable" />} />
        <Route path="/listEntreprises" element={<EntreprisesList />} />
        <Route path="/entreprise/addEntreprise" element={<AddEntreprise />} />
        <Route path="/listSites/:entreprise_id" element={<SitesEntreprise />} />
        <Route path="/admin/entrepriseSettings" element={<AdminEntreprisesSettings />} />

      </Routes>
    </div>
  );
};

export default App;
