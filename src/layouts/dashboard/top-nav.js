import PropTypes from "prop-types";

import Bars3Icon from "@heroicons/react/24/solid/Bars3Icon";

import {
  Avatar,
  Badge,
  Box,
  IconButton,
  Stack,
  SvgIcon,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

export const TopNav = (props) => {
  const { onNavOpen, sideNavWidth = 280 } = props;
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up("lg"));

  return (
    <>
      <Box
        component="header"
        sx={{
          backdropFilter: "blur(6px)",
          backgroundColor: (theme) => alpha(theme.palette.background.default, 0.8),
          left: {
            lg: `${sideNavWidth}px`,
          },
          position: "sticky",
          top: 0,
          transition: (theme) =>
            theme.transitions.create(["left", "width"], {
              duration: theme.transitions.duration.shorter,
            }),
          width: {
            xs: "100%",
            lg: `calc(100% - ${sideNavWidth}px)`,
          },
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={2}
          sx={{
            minHeight: 64,
            px: 2,
          }}
        >
          <Stack alignItems="center" direction="row" spacing={2}>
            {!lgUp && (
              <IconButton onClick={onNavOpen}>
                <SvgIcon fontSize="small">
                  <Bars3Icon />
                </SvgIcon>
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Box>
    </>
  );
};

TopNav.propTypes = {
  onNavOpen: PropTypes.func,
  sideNavWidth: PropTypes.number,
};
