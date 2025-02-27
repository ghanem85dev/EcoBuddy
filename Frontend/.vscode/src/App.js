import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Banner from "./components/Banner";
import Login from  "./pages/LoginPage";
import Register from "./pages/RegisterPage";
import SitesSettings from "./pages/SitesSettings"
import Home from "./pages/HomePage"

const App = () => {
  return (
    <main className="overflow-x-hidden bg-white text-dark">
      <Routes>
        {/* Page d'accueil */}
        <Route path="/" element={
          <>
            <Hero />
            <Services />
            <Banner />
          </>
        } />

        {/* Page de connexion */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/service" element={<Services />} />
        <Route path="/home/:id" element={<Home />} />
          <Route path="/Sites-settings/:id" element={<SitesSettings />} />
      </Routes>
    </main>
  );
};

export default App;