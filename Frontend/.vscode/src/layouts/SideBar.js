import React, { forwardRef } from "react";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";

import { IoBarChartSharp, IoTimerSharp, IoNotifications, IoGameControllerOutline, IoSettings } from "react-icons/io5";
import { TbDeviceAnalytics } from "react-icons/tb";
import { MdDeviceThermostat } from "react-icons/md";
import { LuThermometerSun } from "react-icons/lu";
import { FaMoneyCheckAlt } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { TbHomeBolt } from "react-icons/tb";
import { FaUserPlus } from "react-icons/fa";

import logoLight from "../assets/logoLight.svg";
import logoDark from "../assets/logoDark.svg";
import { cn } from "../utils/cn";

// 🟢 Définition des liens du menu
export const navbarLinks = [
    {
        title: "Accueil & Surveillance",
        links: [
            { label: "Tableau de bord", icon: IoBarChartSharp, path: "/dashboard" },
            { label: "Consommation en temps réel", icon: IoTimerSharp, path: "/realtime" },
            { label: "Appareils connectés", icon: TbDeviceAnalytics, path: "/devices" },
        ],
    },
    {
        title: "Analyse & Optimisation",
        links: [
            { label: "Suivi énergétique", icon: MdDeviceThermostat, path: "/energy" },
            { label: "Simulateur solaire", icon: LuThermometerSun, path: "/solar" },
        ],
    },
    {
        title: "Gestion & Paramètres",
        links: [
            { label: "Notifications", icon: IoNotifications, path: "/notifications" },
            { label: "Alertes & Historique", icon: FiAlertTriangle, path: "/alerts" },

            { label: "Paiements", icon: FaMoneyCheckAlt, path: "/payments" },
            { label: "Invitations ", icon: FaUserPlus, path: "/invite"
                                        
                                        },
            { label: "Gamification", icon: IoGameControllerOutline, path: "/gamification" },
            { label: "Paramètres généraux", icon: IoSettings, path: "/settings" },
        ],
    },
];

// 🟢 Déclaration correcte de `Sidebar`
const Sidebar = forwardRef(({ collapsed }, ref) => {
    return (
        <aside
            ref={ref}
            className={cn(
                "fixed z-[100] flex h-full w-[240px] flex-col overflow-x-hidden border-r border-slate-300 bg-white transition-all dark:border-slate-700 dark:bg-slate-900",
                collapsed ? "md:w-[70px] md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:-left-full" : "max-md:left-0"
            )}
        >
            {/* Logo Section */}
            <div className="flex gap-x-3 p-3">
            <TbHomeBolt className="block dark:hidden" color="blue" size={32} />

{/* Icône en mode sombre */}
<TbHomeBolt className="hidden dark:block" color="white" size={32} />
                {!collapsed && <p className="text-lg font-medium text-slate-900 dark:text-slate-50">My EnergyHub</p>}
            </div>

            {/* Navigation Links */}
            <div className="flex w-full flex-col gap-y-4 overflow-y-auto p-3 scrollbar-thin">
                {navbarLinks.map((navbarLink) => (
                    <nav key={navbarLink.title} className={cn("sidebar-group", collapsed && "md:items-center")}>
                        {/* 🟢 Masquer le titre si le sidebar est fermé */}
                        {!collapsed && (
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 px-4">
                                {navbarLink.title}
                            </p>
                        )}
                        {navbarLink.links.map((link) => (
                            <NavLink
                                key={link.label}
                                to={link.path}
                                className={cn("sidebar-item flex items-center gap-x-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-all", collapsed && "md:w-[45px]")}
                            >
                                {React.createElement(link.icon, { size: 22, className: "flex-shrink-0" })}
                                {!collapsed && <p className="whitespace-nowrap">{link.label}</p>}
                            </NavLink>
                        ))}
                    </nav>
                ))}
            </div>
        </aside>
    );
});

// 🟢 Déplacement de l'export après la déclaration complète
Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
};

export { Sidebar }; // Export correct
