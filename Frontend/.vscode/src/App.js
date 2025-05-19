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
import UserDeviceList from "./particulier/pages/UserDeviceList";
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
import ChatbotPage from "./commun/pages/chatbotPage";
import UserProfile from "./commun/pages/UserProfile"
import { MainLayout } from "./commun/layouts/MainLayout";
import ListInvitations from "./particulier/pages/ListInvitations";
import ListRecompenses from "./commun/pages/ListRecompenses";
import ListDefi from "./commun/pages/ListDefi"
import UsersAdminPage from "./admin/pages/UsersAdminPage"

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

        
        <Route path="/question/particulier" element={<QuestionList />} />
        <Route path="/home/:idUser" element={<Home />} />
        <Route element={<MainLayout />}>
        <Route path="/question/entreprise" element={<QuestionList />} />
        <Route path="/maps" element={<Maps />} />
        <Route path="/addquestion" element={<QuestionForm />} />
        <Route path="/admin/question" element={<AdminQuestions />} />
        <Route path="/modifyquestion/:id" element={<ModifyQuestion />} />
        <Route path="/reponse/:id" element={<Reponse />} />
        <Route path="/admin/sites" element={<AdminSitesSettings />} />
        <Route path="/admin/residences" element={<AdminSitesSettings />} />
        <Route path="/particulier/sites" element={<SitesSettings />} />
        <Route path="/entreprise/sites" element={<SitesSettings />} />
        <Route path="/particulier/dashboard" element={<DashboardPage />} />
        <Route path="/UserSettings/:user_id" element={<UserSettings />} />
        <Route path="/particulier/invitation" element={<ListInvitations />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/admin/dashboard" element={<DashboardAdmin />} />
        <Route path="/profile" element={<UserProfile />} />
      
<Route path="/entreprise/dashboard" element={<DashboardEntreprise key="entreprise" />} />
<Route path="/dashboard/responsable" element={<DashboardEntreprise key="responsable" />} />
        <Route path="/entreprise/entreprises" element={<EntreprisesList />} />
        <Route path="/entreprise/addEntreprise" element={<AddEntreprise />} />
        <Route path="/listSites/:entreprise_id" element={<SitesEntreprise />} />
        <Route path="/admin/entreprises" element={<AdminEntreprisesSettings />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/particulier/appareils" element={<UserDeviceList />} />
        <Route path="/entreprise/gamification" element={<ListRecompenses />} />
        <Route path="/particulier/gamification" element={<ListRecompenses />} />
        <Route path="/entreprise/defis" element={<ListDefi />} />
        <Route path="/admin/defis" element={<ListDefi />} />
        <Route path="/particulier/defis" element={<ListDefi />} />
        <Route path="/admin/utilisateurs" element={<UsersAdminPage/>} /> 
        </Route>
      </Routes>
    </div>
  );
};

export default App;
