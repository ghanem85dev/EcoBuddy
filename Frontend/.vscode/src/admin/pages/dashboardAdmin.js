import { useState } from "react";
import { Sidebar } from "../../commun/layouts/SideBar";
import { Header } from "../../commun/layouts/header";
import { useParams } from "react-router-dom";
import { useTheme } from "../../commun/context/ThemeContext";

const WelcomeDashboard = () => {
  const { theme } = useTheme();
  const { idUser } = useParams();
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("Tableau de bord");

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#08112F] text-white' : 'bg-white text-black'} transition-colors flex`}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-[50px] w-[calc(100%-50px)]' : 'ml-[250px] w-[calc(100%-250px)]'} p-4`}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} idUser={idUser} />
        <div className="h-[calc(100vh-60px)] flex items-center justify-center">
          <h1 className="text-3xl font-bold">Bienvenue sur EnergyHub</h1>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDashboard;