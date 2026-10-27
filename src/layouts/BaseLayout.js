import PropTypes from "prop-types";
import { Box } from "@mui/material";

const BaseLayout = ({ children }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flex: "1 1 auto",
        flexDirection: "column",
        minHeight: "100%",
        width: "100%",
      }}
    >
      {children}
    </Box>
  );
};

BaseLayout.propTypes = {
  children: PropTypes.node,
};

export default BaseLayout;
