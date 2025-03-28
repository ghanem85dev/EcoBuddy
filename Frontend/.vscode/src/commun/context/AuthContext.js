import { createContext, useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [idUser, setIdUser] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        console.log('Token trouvé dans localStorage:', token); // Log pour vérifier le token
        const decoded = jwtDecode(token);
        console.log('Token décodé:', decoded); // Log pour vérifier le contenu du token
        setUser(decoded.user);
        setRole(decoded.role);
        setIdUser(decoded.id)
      } catch (error) {
        console.error('Erreur lors du décodage du token :', error);
      }
    } else {
      console.log('Aucun token trouvé dans localStorage'); // Log si le token est manquant
    }
  }, []);
  const login = (token) => {
    localStorage.setItem("token", token);
    const decoded = jwtDecode(token);
    console.log(decoded.role)
    setUser(decoded.sub);
    setRole(decoded.role);
    setIdUser(decoded.id)
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setRole(null);
    setIdUser(null)
  };

  return (
    <AuthContext.Provider value={{ user, role,idUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };