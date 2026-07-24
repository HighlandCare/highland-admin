import { createContext, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

const LiveOpsUiContext = createContext({
  isMapFullscreen: false,
  setMapFullscreen: () => {},
});

export function LiveOpsUiProvider({ children }) {
  const [isMapFullscreen, setMapFullscreen] = useState(false);
  const value = useMemo(
    () => ({ isMapFullscreen, setMapFullscreen }),
    [isMapFullscreen]
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
