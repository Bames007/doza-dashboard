"use client";

import { DashboardProvider, useDashboard } from "./DashboardContext";
import DashboardSidebar from "./DashboardSideBar";
import DashboardHeader from "./DashboardHeader";
import MessagesPanel from "../messenger/MessagePanel";
import DraggableChatPopup from "../messenger/DraggableChatPopup";
import PanelRenderer from "./PanelRenderer";
import { useState, useEffect, useRef } from "react";
import { Activity, X, RefreshCw, Loader2, LogOut } from "lucide-react";

// --- Loading Component ---
const LoadingScreen = ({ message }: { message: string }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="text-center max-w-sm w-full bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
      <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto mb-4" />
      <h2 className="text-lg font-bold text-gray-800">{message}</h2>
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
        <div className="bg-green-600 h-full rounded-full animate-pulse w-full"></div>
      </div>
    </div>
  </div>
);

// --- Session Status Indicator Component ---
function SessionStatusIndicator() {
  const [isMinimized, setIsMinimized] = useState(true);
  const [session, setSession] = useState({ minutes: 0, isActive: true });
  const { logout } = useDashboard();

  useEffect(() => {
    const checkSession = () => {
      const lastActivity = localStorage.getItem("lastActivity");
      if (!lastActivity) return;

      const diff = Date.now() - parseInt(lastActivity);
      const minutes = Math.floor(diff / 60000);

      // Assume session expires at 30 minutes
      setSession({
        minutes: minutes,
        isActive: minutes < 30,
      });
    };

    const interval = setInterval(checkSession, 30000); // Check every 30 seconds
    checkSession();
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    localStorage.setItem("lastActivity", Date.now().toString());
    setSession({ minutes: 0, isActive: true });
    setIsMinimized(true);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 ${
            session.isActive ? "bg-slate-900" : "bg-red-500 animate-pulse"
          }`}
        >
          <Activity className="w-5 h-5 text-white" />
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 w-[calc(100vw-32px)] md:w-72 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Session Status</h3>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {session.isActive
                ? `System active. Last activity: ${session.minutes}m ago.`
                : "Session timeout imminent."}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Main Layout Content ---
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoading, isSessionValid } = useDashboard();
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);

  if (isLoading) return <LoadingScreen message="Securing your workspace..." />;
  if (!isSessionValid)
    return <LoadingScreen message="Session expired. Redirecting..." />;

  return (
    <div className="flex flex-col h-screen bg-slate-50 md:flex-row overflow-hidden">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* <DashboardHeader
          onMessagesToggle={() => setIsMessagesOpen(!isMessagesOpen)}
        /> */}

        <main className="flex-1 overflow-y-auto p-2 md:p-6 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            <PanelRenderer />
            <div className="md:px-2">{children}</div>
          </div>
        </main>
      </div>

      {/* Sidebar - Mobile Navigation */}
      <div className="md:hidden border-t bg-white p-2 z-40">
        <DashboardSidebar />
      </div>

      {/* Overlays/Panels */}
      <MessagesPanel
        isOpen={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
        onChatSelect={(chat) => setSelectedChat(chat)}
      />
      <DraggableChatPopup
        chat={selectedChat}
        onClose={() => setSelectedChat(null)}
      />

      {/* Session Indicator */}
      <SessionStatusIndicator />
    </div>
  );
}

// --- Exported Layout Component ---
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <LoadingScreen message="Initializing Doza..." />;

  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}
