import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { styled } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";

import { SideNav } from "./side-nav";
import { TopNav } from "./top-nav";
import { LiveOpsUiProvider, useLiveOpsUi } from "../../contexts/live-ops-ui-context";

const SIDE_NAV_WIDTH = 280;

const LayoutRoot = styled("div", {
  shouldForwardProp: (prop) => prop !== "hideSideNav",
})(({ theme, hideSideNav }) => ({
  display: "flex",
  flex: "1 1 auto",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "hidden",
  [theme.breakpoints.up("lg")]: {
    paddingLeft: hideSideNav ? 0 : SIDE_NAV_WIDTH,
  },
}));

const TOP_NAV_HEIGHT = 64;

const LayoutContainer = styled("div", {
  shouldForwardProp: (prop) => prop !== "isLiveOps" && prop !== "isLargeScreen",
})(({ theme, isLiveOps, isLargeScreen }) => ({
  display: "flex",
  flex: "1 1 auto",
  flexDirection: "column",
  minHeight:
    isLiveOps && isLargeScreen
      ? "100vh"
      : `calc(100vh - ${TOP_NAV_HEIGHT}px)`,
  minWidth: 0,
  maxWidth: "100%",
  overflowX: "hidden",
  width: "100%",
  ...(isLiveOps && isLargeScreen
    ? {
        bgcolor: theme.palette.background.default,
        overflow: "hidden",
      }
    : {}),
}));

function DashboardLayoutInner({ children }) {
  const pathname = usePathname();
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const { isMapFullscreen, setMapFullscreen } = useLiveOpsUi();
  const isLiveOps = pathname === "/live-operations";
  const hideSideNav = isLiveOps && isMapFullscreen;
  const hideTopNav = (isLiveOps && lgUp) || hideSideNav;
  const [openNav, setOpenNav] = useState(false);

  const handlePathnameChange = useCallback(() => {
    if (openNav) {
      setOpenNav(false);
    }
  }, [openNav]);

  useEffect(() => {
    handlePathnameChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    setMapFullscreen(false);
  }, [pathname, setMapFullscreen]);

  return (
    <>
      {!hideTopNav ? <TopNav onNavOpen={() => setOpenNav(true)} /> : null}
      {!hideSideNav ? (
        <SideNav onClose={() => setOpenNav(false)} open={openNav} />
      ) : null}
      <LayoutRoot hideSideNav={hideSideNav}>
        <LayoutContainer isLiveOps={isLiveOps} isLargeScreen={lgUp}>
          {children}
        </LayoutContainer>
      </LayoutRoot>
    </>
  );
}

export const Layout = (props) => {
  const { children } = props;

  return (
    <LiveOpsUiProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </LiveOpsUiProvider>
  );
};
