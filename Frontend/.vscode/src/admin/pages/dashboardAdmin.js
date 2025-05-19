import { useState, useEffect, useContext } from "react"; // Ajoutez useContext ici

import { useParams, useNavigate } from "react-router-dom"; // Ajoutez useNavigate ici
import { useTheme } from "../../commun/context/ThemeContext";
import { AuthContext } from "../../commun/context/AuthContext"; // Importez AuthContext
import {Sidebar}  from "../../commun/layouts/SideBar";
import {AdminNavbar} from "../components/AdminNavbar";
import UsersByRoleChart from "../components/UsersByRole";
import EntrepriseSectorChart from "../components/EntrepriseSectorChart"
import EntrepriseSizeChart from "../components/EntrepriseSizeChart"
import SitesByCategoryChart from "../components/SitesByCategoryChart"
import StatsCard from "../../commun/components/StatsCard"
import ApprobationStatsCard from "../components/ApprobationStatsCard"
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

         <div className="space-y-6">
          <div className="flex" style={{ gap: '32px' }}>
                    <StatsCard idUser={idUser} type="demande residence" />
                    <StatsCard idUser={idUser} type="demande entreprise" />
                    <StatsCard idUser={idUser} type="demande local" />
                  </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UsersByRoleChart></UsersByRoleChart>
            </div>
             <div className="lg:col-span-2">
            <EntrepriseSectorChart></EntrepriseSectorChart>
            </div>
             <div className="lg:col-span-2">
            <SitesByCategoryChart></SitesByCategoryChart>
            
            </div>
           
            <div className="lg:col-span-1 relative top-[-1062px]">
            <div className="lg:col-span-2 mb-6">
            <EntrepriseSizeChart></EntrepriseSizeChart>
            </div>
             <div className="lg:col-span-2 mb-6">
                       <ApprobationStatsCard type="residence"  />
                       </div>
                       <div className="lg:col-span-2 mb-6">
                       <ApprobationStatsCard type="entreprise"  />
                       </div>
                       <div className="lg:col-span-2">
                       <ApprobationStatsCard type="local"/>
                       </div>
            </div>
            </div>
             </div>
          
    );
  };
  
  export default WelcomeDashboard;