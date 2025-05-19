// src/commun/layouts/MainLayout.jsx
import { Header } from "./header";
import { Sidebar } from "./SideBar";
import { Outlet } from 'react-router-dom';

export const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <Header/>
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">
      <Outlet /> 
        </main>
      </div>
    </div>
  );
};