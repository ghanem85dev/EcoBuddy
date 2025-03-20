import { useEffect, useState } from "react";
import { Sidebar } from "../layouts/SideBar";
import { Header } from "../layouts/header";
import { useParams } from "react-router-dom";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import { FaEye, FaTimes } from "react-icons/fa";
import RealTimeConsumption from "../components/RealTimeConsumption";
import ConsumptionComparison from "../components/ConsumptionComparison";
import DevicesDetected from "../components/DevicesDetected";
import Gamification from "../components/Gamification";
import ComparisonRange from "../components/ComparisonRange";
import Residence from "../components/Residence";
import ConsumptionComparisonByCategory from "../components/ConsumptionComparisonByCategory";
import { FaUserPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import du context pour gérer le thème

// 📌 Définition des cartes de charts
const SortableItem = ({ chart, toggleChartVisibility }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chart.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-[#1E293B] border border-gray-700 shadow-lg rounded-xl h-auto min-h-[300px] p-6 w-full mt-4"
    >
      <div className="flex justify-between items-center">
        <p className="text-white font-semibold">{chart.name}</p>
        <button onClick={() => toggleChartVisibility(chart)} className="text-red-500 hover:text-red-700">
          <FaTimes />
        </button>
      </div>
      <div className="mt-4">{chart.component}</div>
    </div>
  );
};

const DashboardPage = () => {
  const { theme, toggleTheme } = useTheme(); // Utilisation du contexte pour gérer le thème
  const { idUser } = useParams();
  const [visibleCharts, setVisibleCharts] = useState([]);
  const [hiddenCharts, setHiddenCharts] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const initialCharts = [
    { id: "realTime", name: "Consommation en Temps Réel", component: <RealTimeConsumption idUser={idUser}/> },
   // { id: "devices", name: "Appareils Détectés", component: <DevicesDetected userId={idUser}/> },
    { id: "gamification", name: "Gamification", component: <Gamification /> },
    { id: "comparison", name: "Comparaison de Consommation", component: <ConsumptionComparison idUser={idUser} /> },
    { id: "comparisonByCategory", name: "Comparaison de Consommation selon la categorie", component: <ConsumptionComparisonByCategory idUser={idUser} /> },
    { id: "ComparisonRange", name: "Comparaison de Consommation ", component: <ComparisonRange userId={idUser} /> },
  ];

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

    fetchPreferences();
  }, [idUser]);

  const savePreferences = async (visible, hidden) => {
    try {
      await axios.put(`http://localhost:8000/preferences/${idUser}`, { visible, hidden });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des préférences :", error);
    }
  };

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
  const [activePage, setActivePage] = useState("Tableau de bord");

  return ( 
    <div className={`min-h-screen bg-${theme === 'light' ? 'lightbg' : 'darkbg'} transition-colors flex`}>
      <Sidebar activePage={activePage}
        setActivePage={setActivePage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'ml-[50px] w-[calc(100%-50px)]' : 'ml-[250px] w-[calc(100%-250px)]'} p-4`}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} idUser={idUser} />
        <div className="h-[calc(100vh-60px)] overflow-y-auto p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Residence idUser={idUser} />
            <button onClick={() => navigate('/invite')} className="text-[#003366] text-2xl hover:text-[#0055aa]">
              <FaUserPlus />
            </button>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={visibleCharts} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-6 w-full transition-all duration-300">
                {visibleCharts.map((chart) => (
                  <SortableItem key={chart.id} chart={chart} toggleChartVisibility={toggleChartVisibility} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {hiddenCharts.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white mb-3">Graphiques masqués</h3>
              <div className="flex flex-wrap gap-3">
                {hiddenCharts.map((chart) => (
                  <div key={chart.id} className="px-4 py-2 bg-[#003366] text-white rounded-lg shadow-lg cursor-pointer text-md"
                    onClick={() => toggleChartVisibility(chart)}>
                    <FaEye className="mr-2" />
                    {chart.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
