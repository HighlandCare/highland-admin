import { usePathname } from "next/navigation";
import PropTypes from "prop-types";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { gradients } from "../../theme/colors";

export const SideNav = (props) => {
  const { open, onClose } = props;
  const pathname = usePathname();
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

  const router = useRouter();
  const handleSignOut = useCallback(() => {
    localStorage.clear();
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
              const active = item.path
                ? pathname === item.path ||
                  pathname === `${item.path}/` ||
                  (item.path !== "/" && pathname?.startsWith(`${item.path}/`))
                : false;
              return (
                <SideNavItem
                  active={active}
                  disabled={item.disabled}
                  external={item.external}
                  icon={item.icon}
                  key={item.title}
                  path={item.path}
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
