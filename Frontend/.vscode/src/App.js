import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Banner from "./components/Banner";
import Login from  "./pages/LoginPage";
import Register from "./pages/RegisterPage";

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
      </Routes>
    </main>
  );
};

export default App;