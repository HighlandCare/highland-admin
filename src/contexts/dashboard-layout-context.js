import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

export const SIDE_NAV_WIDTH_EXPANDED = 280;
export const SIDE_NAV_WIDTH_COLLAPSED = 72;
const STORAGE_KEY = "highland-admin-sidebar-collapsed";

const DashboardLayoutContext = createContext({
  sideNavCollapsed: false,
  sideNavWidth: SIDE_NAV_WIDTH_EXPANDED,
  toggleSideNav: () => {},
  setSideNavCollapsed: () => {},
});

export function DashboardLayoutProvider({ children }) {
  const [sideNavCollapsed, setSideNavCollapsedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setSideNavCollapsedState(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  const setSideNavCollapsed = useCallback((value) => {
    setSideNavCollapsedState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(Boolean(value)));
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleSideNav = useCallback(() => {
    setSideNavCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const sideNavWidth = sideNavCollapsed ? SIDE_NAV_WIDTH_COLLAPSED : SIDE_NAV_WIDTH_EXPANDED;

  const value = useMemo(
    () => ({
      sideNavCollapsed,
      sideNavWidth: hydrated ? sideNavWidth : SIDE_NAV_WIDTH_EXPANDED,
      toggleSideNav,
      setSideNavCollapsed,
    }),
    [hydrated, setSideNavCollapsed, sideNavCollapsed, sideNavWidth, toggleSideNav]
  );

  return (
    <DashboardLayoutContext.Provider value={value}>{children}</DashboardLayoutContext.Provider>
  );
}

DashboardLayoutProvider.propTypes = {
  children: PropTypes.node,
};

export function useDashboardLayout() {
  return useContext(DashboardLayoutContext);
}
