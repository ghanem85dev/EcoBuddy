import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Banner from "./components/Banner";
import Login from  "./pages/LoginPage";
import Register from "./pages/RegisterPage";
import SitesSettings from "./pages/SitesSettings";
import Home from "./pages/HomePage";
import InviteUser from "./pages/InviteUser";
import AcceptInvite from "./pages/AcceptInvite";

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
           
<Route path="/invite" element={<InviteUser />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
      </Routes>
    </main>
  );
};

export default App;