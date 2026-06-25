import SimpleBar from "simplebar-react";
import { styled } from "@mui/material/styles";

export const Scrollbar = styled(SimpleBar)({
  maxWidth: "100%",
  width: "100%",
  "& .simplebar-content-wrapper": {
    WebkitOverflowScrolling: "touch",
  },
});
