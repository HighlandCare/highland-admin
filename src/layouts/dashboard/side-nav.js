import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import ArrowLeftOnRectangleIcon from "@heroicons/react/24/solid/ArrowLeftOnRectangleIcon";
import ChevronLeftIcon from "@heroicons/react/24/solid/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/react/24/solid/ChevronRightIcon";

import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Stack,
  SvgIcon,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { Scrollbar } from "../../components/scrollbar";
import { items } from "./config";
import { SideNavItem } from "./side-nav-item";
import { clearAuthSession } from "../../utils/authSession";
import { gradients } from "../../theme/colors";
import {
  SIDE_NAV_WIDTH_COLLAPSED,
  SIDE_NAV_WIDTH_EXPANDED,
} from "../../contexts/dashboard-layout-context";

const getPathnameOnly = (path = "") => String(path).split("?")[0];

const getQueryParam = (path = "", key) => {
  const queryIndex = String(path).indexOf("?");
  if (queryIndex === -1) {
    return null;
  }

  try {
    return new URLSearchParams(String(path).slice(queryIndex + 1)).get(key);
  } catch (error) {
    return null;
  }
};

const isPathActive = (pathname, itemPath) => {
  if (!itemPath) {
    return false;
  }

  const basePath = getPathnameOnly(itemPath);
  return (
    pathname === basePath ||
    pathname === `${basePath}/` ||
    (basePath !== "/" && pathname?.startsWith(`${basePath}/`))
  );
};

export const SideNav = (props) => {
  const { open, onClose, collapsed = false, onToggleCollapse } = props;
  const pathname = usePathname();
  const router = useRouter();
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));
  const drawerWidth = collapsed ? SIDE_NAV_WIDTH_COLLAPSED : SIDE_NAV_WIDTH_EXPANDED;

  const activeCategory = useMemo(() => {
    if (typeof router.query?.category === "string") {
      return router.query.category;
    }
    return getQueryParam(router.asPath, "category");
  }, [router.asPath, router.query?.category]);

  const handleSignOut = useCallback(() => {
    clearAuthSession();
    onClose?.();
    router.push("/auth/login");
  }, [onClose, router]);

  const content = (
    <Scrollbar
      sx={{
        height: "100%",
        "& .simplebar-content": {
          height: "100%",
        },
        "& .simplebar-scrollbar:before": {
          background: "neutral.400",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Box sx={{ p: collapsed ? 1.5 : 3, pb: collapsed ? 1 : 3 }}>
          <Stack alignItems="center" spacing={collapsed ? 1 : 1.5}>
            <Box
              component="img"
              alt="Highland"
              src="/assets/logo.png"
              sx={{
                display: "block",
                maxWidth: "100%",
                width: collapsed ? 40 : 100,
                transition: "width 0.2s ease",
              }}
            />
            {!collapsed ? (
              <Typography
                data-brand="true"
                sx={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #B8E8EB 100%)",
                  backgroundClip: "text",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  lineHeight: 1.2,
                  textAlign: "center",
                  textTransform: "uppercase",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Highland
              </Typography>
            ) : null}
          </Stack>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
        <Box
          component="nav"
          sx={{
            flexGrow: 1,
            px: collapsed ? 0.75 : 2,
            py: 2,
          }}
        >
          <Stack
            component="ul"
            spacing={0.5}
            sx={{
              listStyle: "none",
              p: 0,
              m: 0,
            }}
          >
            {items.map((item) => {
              const childrenItems = (item.children || []).map((child) => {
                const childCategory = getQueryParam(child.path, "category");
                const childActive =
                  isPathActive(pathname, child.path) &&
                  (!childCategory || childCategory === activeCategory);

                return {
                  ...child,
                  active: childActive,
                };
              });

              const childActive = childrenItems.some((child) => child.active);
              const active = childActive || isPathActive(pathname, item.path);

              return (
                <SideNavItem
                  active={active}
                  childrenItems={childrenItems}
                  collapsed={collapsed}
                  disabled={item.disabled}
                  external={item.external}
                  icon={item.icon}
                  key={item.title}
                  open={childActive || active}
                  path={item.children?.length ? undefined : item.path}
                  title={item.title}
                />
              );
            })}
          </Stack>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
        <Box
          sx={{
            px: collapsed ? 1 : 2,
            py: 2,
            width: "100%",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <Stack
            direction={collapsed ? "column" : "row"}
            spacing={0.75}
            alignItems={collapsed ? "center" : "stretch"}
            sx={{ width: "100%" }}
          >
            {lgUp ? (
              <Tooltip
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                placement="right"
                arrow
              >
                <IconButton
                  onClick={onToggleCollapse}
                  aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                  sx={{
                    flexShrink: 0,
                    width: collapsed ? 40 : 44,
                    height: collapsed ? 40 : 44,
                    p: 0,
                    color: "rgba(255,255,255,0.85)",
                    border: "1px solid rgba(255,255,255,0.14)",
                    borderRadius: 1.5,
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
                      color: "common.white",
                    },
                  }}
                >
                  <SvgIcon fontSize="small">
                    {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                  </SvgIcon>
                </IconButton>
              </Tooltip>
            ) : null}

            {collapsed ? (
              <Tooltip title="Log out" placement="right" arrow>
                <IconButton
                  onClick={handleSignOut}
                  sx={{
                    flexShrink: 0,
                    width: 40,
                    height: 40,
                    p: 0,
                    borderRadius: 1.5,
                    color: "common.white",
                    bgcolor: "primary.main",
                    "&:hover": { bgcolor: "primary.dark" },
                  }}
                >
                  <SvgIcon fontSize="small" component={ArrowLeftOnRectangleIcon} />
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleSignOut}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  "&:hover": {
                    background: gradients.buttonHover,
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SvgIcon
                    component={ArrowLeftOnRectangleIcon}
                    fontSize="small"
                    sx={{ marginRight: "10px" }}
                  />
                  Log out
                </Stack>
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
    </Scrollbar>
  );

  const drawerPaperSx = {
    background: gradients.sidebar,
    color: "common.white",
    width: drawerWidth,
    transition: "width 0.2s ease",
    overflowX: "hidden",
  };

  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open
        PaperProps={{ sx: drawerPaperSx }}
        variant="permanent"
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Drawer
      anchor="left"
      onClose={onClose}
      open={open}
      PaperProps={{ sx: { ...drawerPaperSx, width: SIDE_NAV_WIDTH_EXPANDED } }}
      sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
      variant="temporary"
    >
      {content}
    </Drawer>
  );
};

SideNav.propTypes = {
  collapsed: PropTypes.bool,
  onClose: PropTypes.func,
  onToggleCollapse: PropTypes.func,
  open: PropTypes.bool,
};
