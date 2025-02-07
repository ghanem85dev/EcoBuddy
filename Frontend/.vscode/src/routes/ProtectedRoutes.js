import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoutes = ({ allowedRoles }) => {
  const { role } = useContext(AuthContext);
 
  return allowedRoles.includes(role) ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoutes;