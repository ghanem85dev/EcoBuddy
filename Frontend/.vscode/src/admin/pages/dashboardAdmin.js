import { useState, useEffect, useContext } from "react"; // Ajoutez useContext ici

import { useParams, useNavigate } from "react-router-dom"; // Ajoutez useNavigate ici
import { useTheme } from "../../commun/context/ThemeContext";
import { AuthContext } from "../../commun/context/AuthContext"; // Importez AuthContext
import {Sidebar}  from "../../commun/layouts/SideBar";
import {AdminNavbar} from "../components/AdminNavbar";
import UsersByRoleChart from "../components/UsersByRole";
const WelcomeDashboard = () => {
  const { theme } = useTheme();
  const { idUser } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("Tableau de bord");
  const { user, role } = useContext(AuthContext); // Utilisez useContext pour accéder au contexte
  const navigate = useNavigate();
console.log(role)
  useEffect(() => {
    if (role === null) {
      console.log('Rôle non encore défini, attente...');
      return;
    }
    // Vérifiez si l'utilisateur a le rôle 'admin'
    if (role !== 'admin') {
      // Redirigez l'utilisateur vers une autre page s'il n'a pas le rôle 'admin'
      navigate('/acceuil'); // Redirection vers la page d'accueil
    }
  }, [role, navigate]);

  // Si l'utilisateur n'a pas le rôle 'admin', ne rien afficher
  if (role !== 'admin') {
    return null;
  }


  

  
    return (
      <div className="min-h-screen bg-white text-black flex transition-colors">
        {/* Sidebar */}
        <Sidebar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          collapsed={collapsed} 
          setCollapsed={setCollapsed} 
        />
  
        {/* Contenu principal */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-[50px] w-[calc(100%-50px)]' : 'ml-[250px] w-[calc(100%-250px)]'} p-4`}>
         <AdminNavbar collapsed={collapsed} setCollapsed={setCollapsed} idUser={idUser} />  {/* Contenu de bienvenue */}
         <div className="flex-1 p-10 overflow-auto">
         <div className="h-full">
         <div className="flex flex-col gap-6 w-full transition-all duration-300">
                 <div></div>
            <UsersByRoleChart></UsersByRoleChart>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default WelcomeDashboard;