import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { styled } from "@mui/material/styles";
import { useMediaQuery } from "@mui/material";

import { SideNav } from "./side-nav";
import { TopNav } from "./top-nav";
import { LiveOpsUiProvider, useLiveOpsUi } from "../../contexts/live-ops-ui-context";
import {
  DashboardLayoutProvider,
  SIDE_NAV_WIDTH_EXPANDED,
  useDashboardLayout,
} from "../../contexts/dashboard-layout-context";

const TOP_NAV_HEIGHT = 64;

const LayoutRoot = styled("div", {
  shouldForwardProp: (prop) => prop !== "hideSideNav" && prop !== "sideNavWidth",
})(({ theme, hideSideNav, sideNavWidth }) => ({
  display: "flex",
  flex: "1 1 auto",
  flexDirection: "column",
  maxWidth: "100%",
  minHeight: 0,
  minWidth: 0,
  overflowX: "hidden",
  width: "100%",
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
      : `calc(100dvh - ${TOP_NAV_HEIGHT}px)`,
  ...(isLiveOps && isLargeScreen
    ? {
        height: "100vh",
        maxHeight: "100vh",
        overflow: "hidden",
        bgcolor: theme.palette.background.default,
      }
    : {
        // Allow page content to grow and scroll on mobile / tablet.
        height: "auto",
        overflow: "visible",
        paddingBottom: "10px",
      }),
  minWidth: 0,
  maxWidth: "100%",
  width: "100%",
}));

function DashboardLayoutInner({ children }) {
  const router = useRouter();
  const pathname = router.pathname || "";
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"), {
    defaultMatches: false,
    noSsr: true,
  });
  const { isMapFullscreen, setMapFullscreen } = useLiveOpsUi();
  const { sideNavCollapsed, sideNavWidth, toggleSideNav } = useDashboardLayout();
  const isLiveOps = pathname === "/live-operations";
  const hideSideNav = isLiveOps && isMapFullscreen;
  const hideTopNav = (isLiveOps && lgUp) || hideSideNav;
  const [openNav, setOpenNav] = useState(false);

  useEffect(() => {
    setOpenNav(false);
  }, [pathname]);

  useEffect(() => {
    setMapFullscreen(false);
  }, [pathname, setMapFullscreen]);

  // Mobile / tablet always get an expanded temporary drawer; collapse is desktop-only.
  const mobileNavOpen = !lgUp && openNav;
  const sideNavCollapsedForViewport = lgUp ? sideNavCollapsed : false;
  const sideNavWidthForViewport = lgUp ? sideNavWidth : SIDE_NAV_WIDTH_EXPANDED;

  return (
    <>
      {!hideTopNav ? (
        <TopNav onNavOpen={() => setOpenNav(true)} sideNavWidth={sideNavWidthForViewport} />
      ) : null}
      {!hideSideNav ? (
        <SideNav
          collapsed={sideNavCollapsedForViewport}
          onClose={() => setOpenNav(false)}
          onToggleCollapse={toggleSideNav}
          open={mobileNavOpen}
        />
      ) : null}
      <LayoutRoot hideSideNav={hideSideNav} sideNavWidth={sideNavWidthForViewport}>
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
