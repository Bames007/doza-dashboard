// config/navigation.ts
import {
  getCenterRoleNavigation,
  normalizeRoleForCenter,
  getFallbackNavigation,
} from "./center-role-navigation";
import type { NavigationItem, CenterType } from "../type";
import logger from "@/app/utils/logger";

export const getFilteredNavigation = (
  userRole: string,
  centerType?: CenterType,
): NavigationItem[] => {
  // Validate centerType
  const validCenterTypes: CenterType[] = [
    "pharmacy",
    "hospital",
    "clinic",
    "medical_center",
    "diagnostic_lab",
    "dental_clinic",
    "optical_center",
    "emergency",
    "cardiac_center",
  ];

  if (!centerType) {
    logger.warn(
      { userRole },
      "No center type provided for navigation filtering",
    );
    const fallback = getFallbackNavigation("medical_center", "nurse");
    logger.debug(
      { fallbackCount: fallback.length },
      "Using fallback navigation (no center type)",
    );
    return fallback;
  }

  if (!validCenterTypes.includes(centerType)) {
    logger.warn({ userRole, centerType }, "Invalid center type provided");
    const fallback = getFallbackNavigation("medical_center", "nurse");
    logger.debug(
      { fallbackCount: fallback.length },
      "Using fallback navigation (invalid center type)",
    );
    return fallback;
  }

  try {
    const normalizedRole = normalizeRoleForCenter(userRole, centerType);
    logger.debug(
      { userRole, centerType, normalizedRole },
      "Normalized role for navigation",
    );

    const navigationItems = getCenterRoleNavigation(centerType, normalizedRole);

    if (navigationItems.length === 0) {
      logger.warn(
        { userRole, centerType, normalizedRole },
        "No navigation items found, returning fallback",
      );
      const fallback = getFallbackNavigation(centerType, normalizedRole);
      logger.debug(
        { fallbackCount: fallback.length },
        "Using fallback navigation (no items)",
      );
      return fallback;
    }

    logger.debug(
      { userRole, centerType, normalizedRole, count: navigationItems.length },
      "Navigation items retrieved successfully",
    );
    return navigationItems;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error(
      { userRole, centerType, error: msg },
      "Error getting filtered navigation",
    );
    const fallback = getFallbackNavigation("medical_center", "nurse");
    logger.debug(
      { fallbackCount: fallback.length },
      "Using fallback navigation (error)",
    );
    return fallback;
  }
};

export { roleDashboards, centerTypeConfigs } from "./center-based-navigation";
