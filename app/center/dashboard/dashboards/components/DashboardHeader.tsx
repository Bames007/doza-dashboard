// "use client";

// import { useDashboard } from "../../DashboardContext";
// import { Building2, Bell, Settings, RefreshCw } from "lucide-react";
// import { useMemo } from "react";
// import { bebasNeue, poppins } from "@/app/utils/constants";
// import { cn } from "@/app/utils/utils";

// export default function DashboardHeader() {
//   const {
//     user,
//     center,
//     refreshData,
//     loading = { all: false },
//   } = useDashboard();

//   const currentTime = useMemo(() => {
//     const now = new Date();
//     return {
//       time: now.toLocaleTimeString("en-US", {
//         hour: "2-digit",
//         minute: "2-digit",
//         hour12: true,
//       }),
//       date: now.toLocaleDateString("en-US", {
//         weekday: "long",
//         month: "long",
//         day: "numeric",
//       }),
//       shortDate: now.toLocaleDateString("en-US", {
//         month: "short",
//         day: "numeric",
//       }),
//       greeting: getGreeting(now.getHours()),
//     };
//   }, []);

//   function getGreeting(hour: number) {
//     if (hour < 12) return "Good morning";
//     if (hour < 18) return "Good afternoon";
//     return "Good evening";
//   }

//   return (
//     <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-slate-200/60">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex items-center justify-between py-4">
//           {/* Left: Greeting & Timestamp */}
//           <div className="flex items-center gap-6">
//             <div className="hidden md:flex flex-col items-center justify-center bg-slate-900 text-white rounded-2xl px-4 py-3 min-w-[90px]">
//               <span className={cn("text-xl leading-none", bebasNeue.className)}>
//                 {currentTime.time}
//               </span>
//               <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
//                 {currentTime.shortDate}
//               </span>
//             </div>

//             <div>
//               <h1
//                 className={cn(
//                   "text-3xl text-slate-900 leading-tight",
//                   bebasNeue.className,
//                 )}
//               >
//                 {currentTime.greeting},{" "}
//                 {user?.fullName?.split(" ")[0] || "Admin"}
//               </h1>
//               <p
//                 className={cn(
//                   "text-sm text-slate-500 font-medium",
//                   poppins.className,
//                 )}
//               >
//                 {currentTime.date}
//               </p>
//             </div>
//           </div>

//           {/* Right: Actions */}
//           <div className="flex items-center gap-2 sm:gap-3">
//             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
//               <Building2 className="w-3.5 h-3.5 text-emerald-600" />
//               {center?.centerName || "Healthcare Center"}
//             </div>

//             <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

//             <button
//               onClick={refreshData}
//               disabled={loading?.all}
//               className="p-2.5 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95"
//               aria-label="Refresh data"
//             >
//               <RefreshCw
//                 className={cn("w-5 h-5", loading?.all && "animate-spin")}
//               />
//             </button>

//             <button className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-all active:scale-95 relative">
//               <Bell className="w-5 h-5" />
//               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
//             </button>

//             <button className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-all active:scale-95">
//               <Settings className="w-5 h-5" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }
