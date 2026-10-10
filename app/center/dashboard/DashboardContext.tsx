"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { DashboardState, User, Center } from "../type";
import { useNetworkStatus } from "@/app/hooks/useNetworkStatus";
import { processOfflineQueue } from "@/app/lib/api";
import DebugPanel from "./panels/DebugPanel";

interface DashboardContextType extends Omit<DashboardState, "user" | "center"> {
  toggleSidebar: () => void;
  setCurrentPage: (page: string) => void;
  activePanel: string;
  setActivePanel: (panel: string) => void;
  setUser: (user: User) => void;
  setCenter: (center: Center) => void;
  logout: () => void;
  hasPermission: (roles: string[]) => boolean;
  user: User;
  center: Center;
  isLoading: boolean;
  isSessionValid: boolean;
  checkSession: () => boolean;
  loading: { all: boolean };
  refreshData: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isMobileMenuOpen: boolean;
  isOnline: boolean;
  setMobileMenuOpen: (isOpen: boolean) => void;
  navigateToPanel: (panelId: string, pageName: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

const SESSION_TIMEOUT = 30 * 60 * 1000;
const SESSION_EXPIRY = 24 * 60 * 60 * 1000;

const normalizeCenterData = (centerData: any): Center => {
  if (!centerData) {
    return getDefaultCenter();
  }

  const centerName =
    centerData.centerName || centerData.name || "Medical Center";
  const centerType =
    centerData.centerType || centerData.type || "medical_center";
  const centerId = centerData.centerId || centerData.id || "1";

  const normalized: any = {
    id: centerId,
    centerName,
    centerType,
    logo: centerData.logo || null,
    location: centerData.location || {
      address: "Loading...",
      lat: 0,
      lng: 0,
    },
    contact: centerData.contact || {
      phone: "Loading...",
      email: "Loading...",
      website: "",
    },
    operatingHours: centerData.operatingHours || {
      opening: "09:00",
      closing: "17:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      timezone: "WAT",
    },
    registrationNumbers: centerData.registrationNumbers || {
      cac: "",
      state: "",
      federal: "",
    },
    ownerInfo: centerData.ownerInfo || {
      isOwner: false,
      fullName: "Loading...",
      email: "Loading...",
      phone: "Loading...",
      position: "Loading...",
    },
    specificDetails: centerData.specificDetails || {},
    legal: centerData.legal || {
      agreed: false,
      signature: "",
      date: "",
    },
    facilities: centerData.facilities || [],
    services: centerData.services || [],
    status: centerData.status || "active",
    verified: centerData.verified || false,
  };

  Object.keys(centerData).forEach((key) => {
    if (!(key in normalized) && key !== "name" && key !== "type") {
      normalized[key] = centerData[key];
    }
  });

  return normalized as Center;
};

const getDefaultCenter = (): Center => {
  return {
    id: "1",
    centerName: "Loading...",
    centerType: "pharmacy",
    logo: null,
    location: {
      address: "Loading...",
      lat: 0,
      lng: 0,
    },
    contact: {
      phone: "Loading...",
      email: "Loading...",
      website: "",
    },
    operatingHours: {
      opening: "09:00",
      closing: "17:00",
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      timezone: "",
    },
    registrationNumbers: {
      cac: "",
      state: "",
      federal: "",
    },
    ownerInfo: {
      isOwner: false,
      fullName: "Loading...",
      email: "Loading...",
      phone: "Loading...",
      position: "Loading...",
    },
    specificDetails: {},
    legal: {
      agreed: false,
      signature: "",
      date: "",
    },
    facilities: [],
    services: [],
    status: "active",
    verified: false,
  };
};

const defaultUser: User = {
  id: "1",
  email: "loading@example.com",
  fullName: "Loading User",
  role: "center_owner",
  position: "Loading",
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPage, setCurrentPage] = useState("Dashboard");
  const [activePanel, setActivePanel] = useState("dashboard");
  const [user, setUser] = useState<User>(defaultUser);
  const [center, setCenter] = useState<Center>(getDefaultCenter());
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Network status
  const isOnline = useNetworkStatus();

  // ✅ Process offline queue when coming back online
  useEffect(() => {
    if (isOnline) {
      processOfflineQueue();
    }
  }, [isOnline]);

  const logout = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();

    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    setUser(defaultUser);
    setCenter(getDefaultCenter());
    setIsSessionValid(false);
    setMobileMenuOpen(false);

    router.push("/?logout=true");
  }, [router]);

  const validateSession = useCallback(() => {
    try {
      const storedData = localStorage.getItem("userSession");
      const lastActivity = localStorage.getItem("lastActivity");
      const authToken = localStorage.getItem("authToken");

      if (!storedData || !authToken) {
        return false;
      }

      const parsedData = JSON.parse(storedData);
      const expiresAt = parsedData.expiresAt || parsedData.user?.expiresAt;
      const lastActivityTime = lastActivity
        ? parseInt(lastActivity)
        : Date.now();

      if (expiresAt && Date.now() > expiresAt) {
        return false;
      }

      if (Date.now() - lastActivityTime > SESSION_TIMEOUT) {
        return false;
      }

      localStorage.setItem("lastActivity", Date.now().toString());
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const navigateToPanel = useCallback(
    (panelId: string, pageName: string) => {
      setActivePanel(panelId);
      setCurrentPage(pageName);
      setMobileMenuOpen(false);

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const newUrl = `${currentPath}#${panelId}`;
        window.history.pushState({ panel: panelId }, pageName, newUrl);
      }

      localStorage.setItem("lastActivity", Date.now().toString());
    },
    [setActivePanel, setCurrentPage, setMobileMenuOpen],
  );

  useEffect(() => {
    const initializeSession = async () => {
      const storedData = localStorage.getItem("userSession");

      if (storedData) {
        try {
          if (!validateSession()) {
            logout();
            return;
          }

          const parsedData = JSON.parse(storedData);
          const userData = parsedData.user || parsedData;
          const centerData = parsedData.center;

          const newUser: User = {
            id: userData.id || "1",
            email: userData.email || "user@example.com",
            fullName:
              userData.fullName || centerData?.ownerInfo?.fullName || "User",
            role:
              userData.role ||
              (centerData?.ownerInfo?.isOwner ? "center_owner" : "admin"),
            position:
              userData.position || centerData?.ownerInfo?.position || "Staff",
            avatar: userData.avatar,
          };

          setUser(newUser);

          const normalizedCenter = normalizeCenterData(centerData);
          setCenter(normalizedCenter);

          setIsSessionValid(true);

          if (typeof window !== "undefined") {
            const path = window.location.pathname;
            const pathParts = path.split("/").filter((part) => part);

            if (pathParts.length >= 4 && pathParts[2] === "dashboard") {
              const panelFromUrl = pathParts[3];
              if (panelFromUrl && panelFromUrl !== activePanel) {
                const panelName = panelFromUrl
                  .split("-")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
                navigateToPanel(panelFromUrl, panelName);
              }
            }
          }
        } catch (error) {
          console.error("Error loading user data:", error);
          logout();
        }
      } else {
        const currentPath = window.location.pathname;
        if (
          currentPath.startsWith("/center") ||
          currentPath.startsWith("/staff")
        ) {
          router.push("/");
        }
      }

      setIsLoading(false);
    };

    initializeSession();
  }, [router, validateSession, logout, navigateToPanel, activePanel]);

  useEffect(() => {
    const updateActivity = () => {
      localStorage.setItem("lastActivity", Date.now().toString());
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((event) => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    const interval = setInterval(() => {
      if (!validateSession()) {
        logout();
      }
    }, 60000);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
    };
  }, [validateSession, logout]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const hasPermission = (roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  const checkSession = () => {
    const isValid = validateSession();
    setIsSessionValid(isValid);
    return isValid;
  };

  const refreshSession = async () => {
    try {
      const response = await fetch("/api/auth/refresh-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const storedData = localStorage.getItem("userSession");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const updatedSession = {
            ...parsedData,
            expiresAt: Date.now() + SESSION_EXPIRY,
          };
          localStorage.setItem("userSession", JSON.stringify(updatedSession));
          localStorage.setItem("lastActivity", Date.now().toString());
        }
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  };

  const value: DashboardContextType = {
    sidebarCollapsed,
    currentPage,
    activePanel,
    user,
    center,
    isLoading,
    isSessionValid,
    isMobileMenuOpen,
    isOnline,
    toggleSidebar,
    setCurrentPage,
    setActivePanel,
    setUser: (newUser: User) => setUser(newUser),
    setCenter: (newCenter: Center) => {
      setCenter(newCenter);

      const storedData = localStorage.getItem("userSession");
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          const updatedSession = {
            ...parsedData,
            center: newCenter,
          };
          localStorage.setItem("userSession", JSON.stringify(updatedSession));
        } catch (error) {
          console.error("Error updating localStorage:", error);
        }
      }
    },
    logout,
    hasPermission,
    checkSession,
    loading: { all: isLoading },
    refreshData: refreshSession,
    refreshSession,
    setMobileMenuOpen,
    navigateToPanel,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}

      {/* <DebugPanel /> */}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
