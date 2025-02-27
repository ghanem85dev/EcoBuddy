
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/NavBar";
import Sidebar from "./components/SideBar";
import Home from "./pages/HomePage";
import Login from "./pages/LoginPage";
import Register from "./pages/RegisterPage";
import SitesSettings from "./pages/SitesSettings";
import "./App.css";
import { useLocation } from "react-router-dom";



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
          <Route path="/home/:id" element={<Home />} />
          {/* <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/settings" element={<Settings />} /> */}
          <Route path="/Sites-settings/:id" element={<SitesSettings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes protégées avec des rôles */}
          {/* <Route element={<ProtectedRoutes allowedRoles={["particulier"]} />}>
            <Route path="/particulier" element={<ParticulierDashboard />} />
          </Route>
          <Route element={<ProtectedRoutes allowedRoles={["professionnel"]} />}>
            <Route path="/professionnel" element={<ProDashboard />} />
          </Route>
          <Route element={<ProtectedRoutes allowedRoles={["collectivite"]} />}>
            <Route path="/collectivite" element={<CollectiviteDashboard />} />
          </Route> */}
        </Routes>
      </div>
    </div>
  );
};


export default App;
