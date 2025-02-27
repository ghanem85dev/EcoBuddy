import React, { useContext, useState, useEffect } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import RealTimeConsumption from "../components/RealTimeConsumption";
import DevicesDetected from "../components/DevicesDetected";
import Gamification from "../components/Gamification";
import { MdDashboard } from "react-icons/md";
import { FaTimes, FaEye } from "react-icons/fa";
import Card from "../components/Card";
import Residence from "../components/Residence";
import ConsumptionComparison from "../components/ConsumptionComparison";
import { AuthContext } from "../context/AuthContext";



const SortableItem = ({ chart, toggleChartVisibility }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: chart.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: "2rem",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="w-full max-w-4xl mx-auto">
      <Card className="p-8 shadow-2xl rounded-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-400">
          <span className="font-semibold text-xl">{chart.name}</span>
          <button onClick={() => toggleChartVisibility(chart)} className="text-gray-500 hover:text-gray-700">
            <FaTimes />
          </button>
        </div>
        <div className="p-6">{chart.component}</div>
      </Card>
    </div>
  );
};

const Home = () => {
  const { idUser } = useContext(AuthContext);
  const initialCharts = [
    { id: "realTime", name: "Consommation en Temps Réel", component: <RealTimeConsumption idUser={idUser}/> },
    { id: "devices", name: "Appareils Détectés", component: <DevicesDetected userId={idUser} /> },  
    { id: "gamification", name: "Gamification", component: <Gamification /> },
  ];

  const [visibleCharts, setVisibleCharts] = useState(initialCharts);

  useEffect(() => {
    if (idUser) {
      setVisibleCharts([
        { id: "realTime", name: "Consommation en Temps Réel", component: <RealTimeConsumption idUser={idUser} /> },
        { id: "devices", name: "Appareils Détectés", component: <DevicesDetected userId={idUser} /> },  
        { id: "gamification", name: "Gamification", component: <Gamification /> },
      ]);
    }
  }, [idUser]);

  const [hiddenCharts, setHiddenCharts] = useState([]);
  const [chartPositions, setChartPositions] = useState({});

  useEffect(() => {
    axios.get(`http://localhost:8000/preferences/1`).then((response) => {
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
    }).catch(err => console.error("Error saving preferences", err));
  };

  const toggleChartVisibility = (chart) => {
    if (visibleCharts.find((c) => c.id === chart.id)) {
      setChartPositions((prev) => ({ ...prev, [chart.id]: visibleCharts.findIndex(c => c.id === chart.id) }));
      setVisibleCharts((prev) => prev.filter((c) => c.id !== chart.id));
      setHiddenCharts((prev) => [...prev, chart]);
    } else {
      setHiddenCharts((prev) => prev.filter((c) => c.id !== chart.id));
      setVisibleCharts((prev) => {
        const newCharts = [...prev];
        const indexToRestore = chartPositions[chart.id] !== undefined ? chartPositions[chart.id] : prev.length;
        newCharts.splice(indexToRestore, 0, chart);
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
    <div className="p-10 bg-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center text-gray-800 text-4xl font-semibold">
          <MdDashboard className="text-orange-500 text-5xl mr-4" />
          <span>Tableau de Bord</span>
        </div>
        <div className="flex items-center ml-auto space-x-4">
          <Residence idUser={idUser} />
          <div className="flex space-x-4">
            {hiddenCharts.map((chart) => (
              <div
                key={chart.id}
                className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-lg cursor-pointer text-xl"
                onClick={() => toggleChartVisibility(chart)}
              >
                <FaEye className="text-orange-500" />
                <span>{chart.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={visibleCharts} strategy={verticalListSortingStrategy}>
    {visibleCharts.map((chart) => (
      <SortableItem key={chart.id} chart={chart} toggleChartVisibility={toggleChartVisibility} />
    ))}
  </SortableContext>
  {/* This should be within the SortableContext if you want it to be draggable */}
  <SortableItem chart={{ id: "comparison", name: "Comparaison de Consommation", component: <ConsumptionComparison idUser={idUser} /> }} toggleChartVisibility={toggleChartVisibility} />
</DndContext>

    </div>
  );
};

export default Home;
