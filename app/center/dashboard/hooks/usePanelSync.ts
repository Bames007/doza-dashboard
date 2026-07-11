// app/center/dashboard/hooks/usePanelSync.ts
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  getPanelIdFromPath,
  getPageNameFromPanelId,
} from "../utils/panel-mapping";

export const usePanelSync = (
  setActivePanel: (panel: string) => void,
  setCurrentPage: (page: string) => void
) => {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      const panelId = getPanelIdFromPath(pathname);
      const pageName = getPageNameFromPanelId(panelId);

      // Update panel and page if they've changed
      setActivePanel(panelId);
      setCurrentPage(pageName);

      console.log("🔄 Panel sync:", { pathname, panelId, pageName });
    }
  }, [pathname, setActivePanel, setCurrentPage]);

  // Also sync on initial load
  useEffect(() => {
    const initialPanelId = getPanelIdFromPath(window.location.pathname);
    const initialPageName = getPageNameFromPanelId(initialPanelId);

    setActivePanel(initialPanelId);
    setCurrentPage(initialPageName);

    console.log("🚀 Initial panel sync:", {
      path: window.location.pathname,
      panelId: initialPanelId,
      pageName: initialPageName,
    });
  }, [setActivePanel, setCurrentPage]);
};
