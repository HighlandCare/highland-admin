import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { styled } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";

import { SideNav } from "./side-nav";
import { TopNav } from "./top-nav";
import { LiveOpsUiProvider, useLiveOpsUi } from "../../contexts/live-ops-ui-context";
import {
  DashboardLayoutProvider,
  useDashboardLayout,
} from "../../contexts/dashboard-layout-context";

const TOP_NAV_HEIGHT = 64;

const LayoutRoot = styled("div", {
  shouldForwardProp: (prop) => prop !== "hideSideNav" && prop !== "sideNavWidth",
})(({ theme, hideSideNav, sideNavWidth }) => ({
  display: "flex",
  flex: "1 1 auto",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "hidden",
  transition: theme.transitions.create("padding-left", {
    duration: theme.transitions.duration.shorter,
  }),
  [theme.breakpoints.up("lg")]: {
    paddingLeft: hideSideNav ? 0 : sideNavWidth,
  },
}));

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
  ...(isLiveOps && isLargeScreen
    ? {
        height: "100vh",
        maxHeight: "100vh",
      }
    : {}),
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
  const router = useRouter();
  const pathname = router.pathname || "";
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const { isMapFullscreen, setMapFullscreen } = useLiveOpsUi();
  const { sideNavCollapsed, sideNavWidth, toggleSideNav } = useDashboardLayout();
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
  }, [pathname, handlePathnameChange]);

  useEffect(() => {
    setMapFullscreen(false);
  }, [pathname, setMapFullscreen]);

  return (
    <>
      {!hideTopNav ? <TopNav onNavOpen={() => setOpenNav(true)} sideNavWidth={sideNavWidth} /> : null}
      {!hideSideNav ? (
        <SideNav
          collapsed={sideNavCollapsed}
          onClose={() => setOpenNav(false)}
          onToggleCollapse={toggleSideNav}
          open={openNav}
        />
      ) : null}
      <LayoutRoot hideSideNav={hideSideNav} sideNavWidth={sideNavWidth}>
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
    <DashboardLayoutProvider>
      <LiveOpsUiProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </LiveOpsUiProvider>
    </DashboardLayoutProvider>
  );
};
