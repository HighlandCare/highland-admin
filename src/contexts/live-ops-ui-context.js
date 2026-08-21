import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import { createLiveOpsPageTheme } from "../theme/live-ops-page-theme";

const STORAGE_KEY = "highland-live-ops-map-theme";

const LiveOpsUiContext = createContext({
  isMapFullscreen: false,
  setMapFullscreen: () => {},
  mapTheme: "dark",
  toggleMapTheme: () => {},
});

function readStoredTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch (error) {
    // Ignore storage access errors.
  }
  return "dark";
}

export function LiveOpsUiProvider({ children }) {
  const [isMapFullscreen, setMapFullscreen] = useState(false);
  const [mapTheme, setMapTheme] = useState("dark");

  useEffect(() => {
    setMapTheme(readStoredTheme());
  }, []);

  const toggleMapTheme = useCallback(() => {
    setMapTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch (error) {
        // Ignore storage access errors.
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ isMapFullscreen, setMapFullscreen, mapTheme, toggleMapTheme }),
    [isMapFullscreen, mapTheme, toggleMapTheme]
  );

  return (
    <LiveOpsUiContext.Provider value={value}>{children}</LiveOpsUiContext.Provider>
  );
}

LiveOpsUiProvider.propTypes = {
  children: PropTypes.node,
};

export function useLiveOpsUi() {
  return useContext(LiveOpsUiContext);
}

export function LiveOpsThemeProvider({ children }) {
  const parentTheme = useTheme();
  const { mapTheme } = useLiveOpsUi();
  const theme = useMemo(
    () => createLiveOpsPageTheme(parentTheme, mapTheme),
    // Admin app theme is created every render; only rebuild when this page's mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mapTheme]
  );

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

LiveOpsThemeProvider.propTypes = {
  children: PropTypes.node,
};
