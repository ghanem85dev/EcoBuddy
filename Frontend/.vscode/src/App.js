
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/NavBar";
import Sidebar from "./components/SideBar";
import Home from "./pages/HomePage";
import Login from "./pages/LoginPage";
import ParticulierDashboard from "./pages/ParticulierDashboardPage";
import ProDashboard from "./pages/DashboardPage";
import CollectiviteDashboard from "./pages/CollectiviteDashboardPage";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import Marketplace from "./pages/MarketplacePage";
import Settings from "./pages/SettingsPage";
import Register from "./pages/RegisterPage";
import "./App.css";



const App = () => {
  const location = useLocation(); // Utilisez useLocation ici, dans le contexte du Router

  // Vérifiez si l'utilisateur est sur /login ou /register
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  return (
    <div className="flex">
      {/* Conditionally render Sidebar and Navbar based on the page */}
      {!isAuthPage && <Sidebar />}
      <div className="flex-1">
        {!isAuthPage && <Navbar />}
        <Routes>
          {/* Routes accessibles sans protection */}
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes protégées avec des rôles */}
          <Route element={<ProtectedRoutes allowedRoles={["particulier"]} />}>
            <Route path="/particulier" element={<ParticulierDashboard />} />
          </Route>
          <Route element={<ProtectedRoutes allowedRoles={["professionnel"]} />}>
            <Route path="/professionnel" element={<ProDashboard />} />
          </Route>
          <Route element={<ProtectedRoutes allowedRoles={["collectivite"]} />}>
            <Route path="/collectivite" element={<CollectiviteDashboard />} />
          </Route>
        </Routes>
      </div>
    </div>
  );
};


export default App;
