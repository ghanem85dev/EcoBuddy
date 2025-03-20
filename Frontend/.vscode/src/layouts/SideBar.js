import React, { forwardRef, useState } from "react";
import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import {
    IoBarChartSharp,
    IoTimerSharp,
    IoNotifications,
    IoGameControllerOutline,
    IoSettings,
} from "react-icons/io5";
import { TbDeviceAnalytics } from "react-icons/tb";
import { MdDeviceThermostat } from "react-icons/md";
import { LuThermometerSun } from "react-icons/lu";
import { FaMoneyCheckAlt, FaUserPlus } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { cn } from "../utils/cn";
import { TbHomeBolt } from "react-icons/tb";

export const navbarLinks = [
    {
        links: [
            { label: "Tableau de bord", icon: IoBarChartSharp, path: "/dashboard" },
            { label: "Consommation en temps réel", icon: IoTimerSharp, path: "/realtime" },
            { label: "Appareils connectés", icon: TbDeviceAnalytics, path: "/devices" },
        ],
    },
    {
        links: [
            { label: "Suivi énergétique", icon: MdDeviceThermostat, path: "/energy" },
            { label: "Simulateur solaire", icon: LuThermometerSun, path: "/solar" },
        ],
    },
    {
        links: [
            { label: "Notifications", icon: IoNotifications, path: "/notifications" },
            { label: "Alertes & Historique", icon: FiAlertTriangle, path: "/alerts" },
            { label: "Paiements", icon: FaMoneyCheckAlt, path: "/payments" },
            { label: "Invitations", icon: FaUserPlus, path: "/invite" },
            { label: "Gamification", icon: IoGameControllerOutline, path: "/gamification" },
            { label: "Paramètres généraux", icon: IoSettings, path: "/settings" },
        ],
    },
];

const Sidebar = forwardRef(({ collapsed }, ref) => {
    const { theme } = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(collapsed);

    React.useEffect(() => {
        setIsCollapsed(collapsed);
    }, [collapsed]);

    return (
        <aside
            ref={ref}
            className={cn(
                "fixed z-50 flex h-full flex-col transition-all duration-300",
                "bg-[#3D4A84] text-white rounded-r-3xl shadow-lg",
                isCollapsed ? "w-[80px]" : "w-[260px]"
            )}
        >
            {/* HEADER SIDEBAR */}
            <div className="flex flex-col items-center py-6">
                <div className="flex items-center gap-x-3">
                    <TbHomeBolt className="text-white" size={28} />
                    {!isCollapsed && <p className="text-lg font-semibold">MyEnergyHub</p>}
                </div>
            </div>

            {/* NAVIGATION */}
            <div className="flex w-full flex-col gap-y-2 overflow-y-auto p-3">
                {navbarLinks.map((navbarLink, index) => (
                    <nav key={index} className="sidebar-group">
                        {navbarLink.links.map((link) => (
                            <NavLink
                                key={link.label}
                                to={link.path}
                                className={cn(
                                    "flex items-center gap-x-3 px-4 py-3 text-sm font-medium transition-all relative",
                                    "hover:bg-white hover:text-[#3D4A84] rounded-l-full"
                                )}
                            >
                                {/* ICONES */}
                                {React.createElement(link.icon, {
                                    size: 22,
                                    className: "text-white",
                                })}
                                {!isCollapsed && <p className="ml-2">{link.label}</p>}

                                {/* COURBES EXTERNES */}
                                <span className="absolute right-0 top-[-50px] w-[50px] h-[50px] bg-transparent rounded-full shadow-[35px_35px_0_10px_var(--white)] pointer-events-none" />
                                <span className="absolute right-0 bottom-[-50px] w-[50px] h-[50px] bg-transparent rounded-full shadow-[35px_-35px_0_10px_var(--white)] pointer-events-none" />
                            </NavLink>
                        ))}
                    </nav>
                ))}
            </div>

            {/* BOUTON LOGOUT */}
            <div className="mt-auto p-3">
                <NavLink
                    to="/logout"
                    className="flex items-center gap-x-3 px-4 py-3 text-sm font-medium transition-all hover:bg-white hover:text-[#3D4A84] rounded-l-full"
                >
                    <IoSettings size={22} className="text-white" />
                    {!isCollapsed && <p className="ml-2">Log Out</p>}
                </NavLink>
            </div>
        </aside>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
};

export { Sidebar };
