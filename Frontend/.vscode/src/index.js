import React from 'react';
import ReactDOM from 'react-dom/client'; // Utilisez react-dom/client pour React 18+
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext'; // Import du ThemeProvider
import { FiMenu, FiAlertTriangle } from "react-icons/fi";
import { TbHomeBolt, TbDeviceAnalytics } from "react-icons/tb";
import { IoBarChartSharp, IoTimerSharp, IoNotifications, IoGameControllerOutline, IoSettings } from "react-icons/io5";
import { MdDeviceThermostat } from "react-icons/md";
import { LuThermometerSun } from "react-icons/lu";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { CoordinateProvider } from './context/CoordinateContext';

/* global FB */

// Vérifier si on est dans un environnement navigateur avant d'utiliser window
if (typeof window !== "undefined") {
  window.fbAsyncInit = function() {
    window.FB.init({
      appId: '604000669075467', // Remplacez par votre Facebook App ID
      cookie: true,
      xfbml: true,
      version: 'v18.0'
    });
    window.FB.AppEvents.logPageView();
  };

  // Charger dynamiquement le SDK Facebook
  (function(d, s, id) {
    if (d.getElementById(id)) return;
    let js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
  }(document, 'script', 'facebook-jssdk'));
}

const root = ReactDOM.createRoot(document.getElementById('root')); // Pour React 18+

root.render(
  <GoogleOAuthProvider clientId="104107465263-v7mlmu7q301eula8lbr8l176ngs3gslt.apps.googleusercontent.com">
    <AuthProvider>
      <ThemeProvider>
      <CoordinateProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        </CoordinateProvider>
      </ThemeProvider>
    </AuthProvider>
  </GoogleOAuthProvider>
);

// Définition des liens de navigation
export const navbarLinks = [
  {
    title: "Accueil & Surveillance",
    links: [
      { label: "Tableau de bord", icon: <IoBarChartSharp size={22} />, path: "/dashboard" },
      { label: "Consommation en temps réel", icon:  <IoTimerSharp size={22} />, path: "/realtime" },
      { label: "Appareils connectés", icon: <TbDeviceAnalytics size={22} />, path: "/devices" },
    ],
  },

  {
    title: "Analyse & Optimisation",
    links: [
      { label: "Suivi énergétique", icon: <MdDeviceThermostat size={22} />, path: "/energy" },
      { label: "Simulateur solaire", icon:  <LuThermometerSun size={22} />, path: "/solar" },
    ],
  },
  {
    title: "Gestion & Paramètres",
    links: [
      { label: "Notifications", icon: <IoNotifications size={22} />, path: "/notifications" },
      { label: "Alertes & Historique", icon:  <FiAlertTriangle size={22} />, path: "/alerts" },
      { label: "Paiements & Abonnements", icon:  <FaMoneyCheckAlt size={22} />, path: "/payments" },
      { label: "Gamification & Récompenses", icon:  <IoGameControllerOutline size={22} />, path: "/gamification" },
      { label: "Paramètres généraux", icon:  <IoSettings size={22} />, path: "/settings" },
    ],
  },
];

// Mesurer les performances de l'application
reportWebVitals();
