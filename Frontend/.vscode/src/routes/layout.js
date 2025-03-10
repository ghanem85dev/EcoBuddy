// import { Outlet } from "react-router-dom";
// import { useEffect, useRef, useState } from "react";
// import { useMediaQuery } from "@uidotdev/usehooks";
// import { useClickOutside } from "../hooks/UseClickOutside";
// import { Sidebar } from "../layouts/SideBar";
// import { Header } from "../layouts/header";
// import { cn } from "../utils/cn";

// const Layout = () => {
//     const isDesktopDevice = useMediaQuery("(min-width: 768px)");
//     const [collapsed, setCollapsed] = useState(!isDesktopDevice);
//     const sidebarRef = useRef(null);

//     useEffect(() => {
//         setCollapsed(!isDesktopDevice);
//     }, [isDesktopDevice]);

//     useClickOutside([sidebarRef], () => {
//         if (!isDesktopDevice && !collapsed) {
//             setCollapsed(true);
//         }
//     });

//     return (
//         <div className="min-h-screen bg-slate-100 transition-colors dark:bg-slate-950">
//             <div
//                 className={cn(
//                     "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
//                     !collapsed && "max-md:pointer-events-auto max-md:z-50 max-md:opacity-30"
//                 )}
//             />
//             <Sidebar ref={sidebarRef} collapsed={collapsed} />
//             <div className={cn("transition-[margin] duration-300", collapsed ? "md:ml-[70px]" : "md:ml-[240px]")}>
//                 <Header collapsed={collapsed} setCollapsed={setCollapsed} />
//                 <div className="h-[calc(100vh-60px)] overflow-y-auto overflow-x-hidden p-6">
//                     <Outlet />  {/* This is where the routed components will render */}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Layout;