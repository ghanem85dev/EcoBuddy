import React, { useContext, useState, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import RealTimeConsumption from "../components/RealTimeConsumption";
import DevicesDetected from "../components/DevicesDetected";
import Gamification from "../components/Gamification";
import ConsumptionComparison from "../components/ConsumptionComparison";
import { MdDashboard } from "react-icons/md";
import { FaTimes, FaEye, FaUserPlus } from "react-icons/fa";
import Sidebar from "../components/SideBar";
import Residence from "../components/Residence";
import { AuthContext } from "../context/AuthContext";

const SortableItem = ({ chart, toggleChartVisibility }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chart.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-full">
      <div className="p-6 shadow-lg rounded-xl bg-white border border-gray-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-300">
          <h3 className="font-semibold text-lg text-gray-800">{chart.name}</h3>
          <button onClick={() => toggleChartVisibility(chart)} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        <div className="p-4">{chart.component}</div>
      </div>
    </div>
  );
};

const Home = () => {
  const { idUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const initialCharts = [
    { id: "realTime", name: "Consommation en Temps Réel", component: <RealTimeConsumption idUser={idUser} /> },
    { id: "devices", name: "Appareils Détectés", component: <DevicesDetected userId={idUser} /> },
    { id: "gamification", name: "Gamification", component: <Gamification /> },
    { id: "comparison", name: "Comparaison de Consommation", component: <ConsumptionComparison idUser={idUser} /> },
  ];

  const [visibleCharts, setVisibleCharts] = useState(initialCharts);
  const [hiddenCharts, setHiddenCharts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:8000/preferences/1").then((response) => {
      const savedOrder = response.data.chart_positions;
      if (savedOrder.length) {
        const orderedCharts = savedOrder.map((id) => initialCharts.find((chart) => chart.id === id)).filter(Boolean);
        setVisibleCharts(orderedCharts);
        setHiddenCharts(initialCharts.filter((chart) => !orderedCharts.includes(chart)));
      }
    }).catch(() => {});
  }, []);

  const savePreferences = (newOrder) => {
    axios.put("http://localhost:8000/preferences", {
      user_id: 1,
      chart_positions: newOrder.map((chart) => chart.id),
    }).catch(err => console.error("Erreur de sauvegarde des préférences", err));
  };

  const toggleChartVisibility = (chart) => {
    if (visibleCharts.find((c) => c.id === chart.id)) {
      setVisibleCharts((prev) => prev.filter((c) => c.id !== chart.id));
      setHiddenCharts((prev) => [...prev, chart]);
    } else {
      setHiddenCharts((prev) => prev.filter((c) => c.id !== chart.id));
      setVisibleCharts((prev) => {
        const newCharts = [...prev, chart];
        savePreferences(newCharts);
        return newCharts;
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = visibleCharts.findIndex((chart) => chart.id === active.id);
      const newIndex = visibleCharts.findIndex((chart) => chart.id === over.id);
      const newOrder = arrayMove(visibleCharts, oldIndex, newIndex);
      setVisibleCharts(newOrder);
      savePreferences(newOrder);
    }
  };

  return (
    <div className="flex bg-white text-gray-800 min-h-screen">
      <Sidebar />
      <div className="flex-1 p-10">
        {/* En-tête du tableau de bord */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center text-3xl font-bold text-[#003366]">
            <MdDashboard className="text-[#003366] text-4xl mr-3" />
            <span>Tableau de Bord</span>
          </div>
          <div className="flex items-center gap-4">
            <Residence idUser={idUser} />
            <button onClick={() => navigate('/invite')} className="text-[#003366] text-2xl hover:text-[#0055aa]">
              <FaUserPlus />
            </button>
          </div>
        </div>

        {/* Section des graphiques */}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleCharts} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleCharts.map((chart) => (
                <SortableItem key={chart.id} chart={chart} toggleChartVisibility={toggleChartVisibility} />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Section des graphiques cachés */}
        {hiddenCharts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Graphiques masqués</h3>
            <div className="flex flex-wrap gap-3">
              {hiddenCharts.map((chart) => (
                <div
                  key={chart.id}
                  className="px-4 py-2 bg-[#003366] text-white rounded-lg shadow-lg cursor-pointer text-md"
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
  );
};

export default Home;
