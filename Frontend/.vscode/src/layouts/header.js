import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoSun } from "react-icons/go";
import { FaRegMoon, FaRegBell } from "react-icons/fa";
import { FiChevronsLeft } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import profileImg from "../assets/profile-image.jpg"; 
import PropTypes from "prop-types";

export const Header = ({ collapsed, setCollapsed, idUser }) => {
    const navigate = useNavigate();

    const handleToggleSidebar = () => {
        if (setCollapsed) {
            console.log("Sidebar toggle clicked"); // Vérification
            setCollapsed(!collapsed);
        }
    };

    return (
        <header className="relative z-10 flex h-[60px] items-center justify-between bg-white px-4 shadow-md transition-colors dark:bg-slate-900">
            <div className="flex items-center gap-x-3">
                <button className="btn-ghost size-10" onClick={handleToggleSidebar}>
                    <FiChevronsLeft className={collapsed ? "rotate-180" : ""} />
                </button>
                <div className="input flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 dark:border-gray-700">
                    <FaSearch className="text-slate-500 dark:text-slate-300" />
                    <input type="text" placeholder="Search..." className="w-full bg-transparent" />
                </div>
            </div>
            <div className="flex items-center gap-x-3">
                <button className="btn-ghost size-10">
                    <FaRegBell size={20} />
                </button>
                <button className="size-10 overflow-hidden rounded-full" onClick={() => navigate(`/UserSettings/${idUser}`)}>
                    <img src={profileImg} alt="profile" className="size-full object-cover" />
                </button>
            </div>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
    idUser: PropTypes.string,
};
