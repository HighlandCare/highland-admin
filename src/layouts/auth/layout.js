import PropTypes from "prop-types";
import NextLink from "next/link";
import { Box, Unstable_Grid2 as Grid } from "@mui/material";
import { gradients } from "../../theme/colors";

export const Layout = (props) => {
  const { children } = props;

  return (
    <Box
      component="main"
      sx={{
        display: "flex",
        flex: "1 1 auto",
      }}
    >
      <Grid container sx={{ flex: "1 1 auto" }}>
        <Grid
          xs={12}
          lg={6}
          sx={{
            backgroundColor: "background.paper",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            width: "100%",
          }}
        >
          {children}
        </Grid>
        <Grid
          xs={12}
          lg={6}
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            background: gradients.brandRadial,
            color: "white",
            "& img": {
              maxWidth: "100%",
            },
          }}
        >
          <Box
            component={NextLink}
            href="/"
            sx={{
              display: "inline-flex",
            }}
          >
            <img
              alt="Highland Care Dashboard"
              src="/assets/logo.png"
              style={{
                display: "inline-block",
                maxHeight: 150,
              }}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

Layout.prototypes = {
  children: PropTypes.node,
};
