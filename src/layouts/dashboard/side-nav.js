import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import ArrowLeftOnRectangleIcon from "@heroicons/react/24/solid/ArrowLeftOnRectangleIcon";

import {
  Box,
  Button,
  Divider,
  Drawer,
  Stack,
  SvgIcon,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { Scrollbar } from "../../components/scrollbar";
import { items } from "./config";
import { SideNavItem } from "./side-nav-item";
import { clearAuthSession } from "../../utils/authSession";
import { gradients } from "../../theme/colors";

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
  const { open, onClose } = props;
  const pathname = usePathname();
  const router = useRouter();
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

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
        <Box sx={{ p: 3 }}>
          <Stack alignItems="center" spacing={1.5}>
            <Box
              component="img"
              alt="Highland"
              src="/assets/logo.png"
              sx={{
                display: "block",
                maxWidth: "100%",
                width: 100,
              }}
            />
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
          </Stack>
        </Box>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
        <Box
          component="nav"
          sx={{
            flexGrow: 1,
            px: 2,
            py: 3,
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
            px: 2,
            py: 3,
          }}
        >
          <Stack direction="row" alignItems="flex-end" width="100%" spacing={2}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleSignOut}
              sx={{
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
          </Stack>
        </Box>
      </Box>
    </Scrollbar>
  );

  if (lgUp) {
    return (
      <Drawer
        anchor="left"
        open
        PaperProps={{
          sx: {
            background: gradients.sidebar,
            color: "common.white",
            width: 280,
          },
        }}
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
      PaperProps={{
        sx: {
          background: gradients.sidebar,
          color: "common.white",
          width: 280,
        },
      }}
      sx={{ zIndex: (theme) => theme.zIndex.appBar + 100 }}
      variant="temporary"
    >
      {content}
    </Drawer>
  );
};

SideNav.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
