import { useState, useEffect, useContext } from "react";
import { Sidebar } from "../../commun/layouts/SideBar";
import { Header } from "../../commun/layouts/header";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../commun/context/ThemeContext";
import { AuthContext } from "../../commun/context/AuthContext";
import { FaPlus } from "react-icons/fa";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import { FaEye, FaTimes } from "react-icons/fa";
import Gamification from "../../commun/components/Gamification";
import ConsommationCategorieEntreprise from "../../entreprise/components/ConsommationCategorieEntreprise";
import HistoricalConsumption from "../components/HistoricalConsumption";

const SortableItem = ({ chart, toggleChartVisibility, theme }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chart.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`border shadow-lg rounded-xl h-auto min-h-[300px] p-6 w-full mt-4 ${
        theme === 'dark' ? 'bg-[#1E293B] border-gray-700' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex justify-between items-center">
        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{chart.name}</p>
        <button 
          onClick={() => toggleChartVisibility(chart)} 
          className={theme === 'dark' ? 'text-red-500 hover:text-red-700' : 'text-red-600 hover:text-red-800'}
        >
          <FaTimes />
        </button>
      </div>
      <div className="mt-4">{chart.component}</div>
    </div>
  );
};

const DashboardEntreprise = () => {
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("Tableau de bord");
  const { idUser, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSite, setSelectedSite] = useState(null);
  const [visibleCharts, setVisibleCharts] = useState([]);
  const [hiddenCharts, setHiddenCharts] = useState([]);

  const isResponsableView = location.pathname.includes("responsable");

  const initialCharts = [
    { 
      id: "realTime", 
      name: "Consommation en Temps Réel", 
      component: <HistoricalConsumption responsable={isResponsableView} /> 
    },
    { 
      id: "gamification", 
      name: "Gamification", 
      component: <Gamification /> 
    },
    { 
      id: "ConsommationCategorie", 
      name: "Consommation par catégorie", 
      component: <ConsommationCategorieEntreprise siteId={selectedSite} responsable={isResponsableView} /> 
    },
  ];

  useEffect(() => {
    if (role === null) return;
    if (role !== 'entreprise' && role !== 'responsable') navigate('/acceuil');
    
    localStorage.removeItem("selectedSite");
    localStorage.removeItem("selectedEntreprise");
    
    // Mettre à jour activePage en fonction de la vue
    setActivePage(isResponsableView ? "Sites gérés" : "Tableau de bord");
  }, [role, navigate, isResponsableView]);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/preferences/${idUser}`);
        const { visible = [], hidden = [] } = response.data;
        setVisibleCharts(visible.length ? visible : initialCharts);
        setHiddenCharts(hidden);
      } catch (error) {
        console.error("Erreur lors de la récupération des préférences :", error);
        setVisibleCharts(initialCharts);
      }
    };

    if (idUser) fetchPreferences();
  }, [idUser]);

  const toggleChartVisibility = (chart) => {
    if (visibleCharts.find((c) => c.id === chart.id)) {
      const newVisible = visibleCharts.filter((c) => c.id !== chart.id);
      const newHidden = [...hiddenCharts, chart];
      setVisibleCharts(newVisible);
      setHiddenCharts(newHidden);
      savePreferences(newVisible, newHidden);
    } else {
      const newHidden = hiddenCharts.filter((c) => c.id !== chart.id);
      const newVisible = [...visibleCharts, chart];
      setVisibleCharts(newVisible);
      setHiddenCharts(newHidden);
      savePreferences(newVisible, newHidden);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = visibleCharts.findIndex((chart) => chart.id === active.id);
      const newIndex = visibleCharts.findIndex((chart) => chart.id === over.id);
      const newOrder = arrayMove(visibleCharts, oldIndex, newIndex);
      setVisibleCharts(newOrder);
      savePreferences(newOrder, hiddenCharts);
    }
  };

  const savePreferences = async (visible, hidden) => {
    try {
      await axios.put(`http://localhost:8000/preferences/${idUser}`, { visible, hidden });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des préférences :", error);
    }
  };

  const handleSiteSelect = (siteId) => {
    setSelectedSite(siteId === "0" ? null : siteId);
  };

  if (role !== 'entreprise' && role !== 'responsable') return null;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#08112F] text-white' : 'bg-white text-black'} transition-colors flex`}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-[50px]' : 'ml-[250px]'}`}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} idUser={idUser} />

        <div className="flex-1 p-10 overflow-auto">
          <div className="h-full">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={visibleCharts} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-6 w-full transition-all duration-300">
                  {visibleCharts.map((chart) => (
                    <SortableItem 
                      key={chart.id} 
                      chart={chart} 
                      toggleChartVisibility={toggleChartVisibility}
                      theme={theme}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {hiddenCharts.length > 0 && (
              <div className="mt-6">
                <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  Graphiques masqués
                </h3>
                <div className="flex flex-wrap gap-3">
                  {hiddenCharts.map((chart) => (
                    <div 
                      key={chart.id} 
                      className={`px-4 py-2 rounded-lg shadow-lg cursor-pointer text-md flex items-center ${
                        theme === 'dark' ? 'bg-[#003366] text-white' : 'bg-blue-100 text-[#003366]'
                      }`}
                      onClick={() => toggleChartVisibility(chart)}
                    >
                      <FaEye className="mr-2" />
                      {chart.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {!isResponsableView && (
          <button 
            onClick={() => navigate("/entreprise/addEntreprise")}
            className={`fixed bottom-8 right-8 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
            aria-label="Ajouter une entreprise"
          >
            <FaPlus className="text-xl" />
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardEntreprise;