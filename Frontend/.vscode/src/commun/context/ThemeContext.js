import React, { createContext, useState, useContext, useEffect } from 'react';

// Créer le contexte du thème
const ThemeContext = createContext();

// Hook personnalisé pour accéder au contexte du thème
export const useTheme = () => {
  return useContext(ThemeContext);
};

// Fournisseur de contexte pour envelopper l'application
export const ThemeProvider = ({ children }) => {
  // Initialisation du thème, on le récupère du localStorage ou on le définit par défaut en "light"
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    // Sauvegarder le thème sélectionné dans le localStorage
    localStorage.setItem('theme', theme);
    // Appliquer le thème à la classe body pour gérer le mode clair/sombre
    document.body.className = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
