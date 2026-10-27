import PropTypes from "prop-types";
import { ClipLoader } from "react-spinners";
import Box from "@mui/material/Box";
import { brand } from "../theme/colors";

const LOADER_COLOR = brand.primary;
const TOP_NAV_HEIGHT = 64;
const PAGE_VERTICAL_PADDING = 32;
const SPEED_MULTIPLIER = 2.4;

export const PAGE_LOADER_MIN_HEIGHT = `calc(100vh - ${TOP_NAV_HEIGHT + PAGE_VERTICAL_PADDING}px)`;

const SIZE_MAP = {
  xs: 14,
  sm: 20,
  md: 28,
  lg: 36,
  xl: 44,
};

const INLINE_MIN_HEIGHT_MAP = {
  xs: 22,
  sm: 26,
  md: 30,
};

const MIN_HEIGHT_MAP = {
  xs: undefined,
  sm: 28,
  md: 120,
  lg: 200,
  xl: "40vh",
  page: PAGE_LOADER_MIN_HEIGHT,
};

const resolveSize = (size, page) => {
  if (page || size === "page") {
    return SIZE_MAP.lg;
  }

  return typeof size === "number" ? size : SIZE_MAP[size] || SIZE_MAP.md;
};

export default function Loader({
  color = LOADER_COLOR,
  inline = false,
  minHeight,
  page = false,
  size = "md",
  sx,
}) {
  const isPageLoader = page || size === "page";
  const loader = (
    <ClipLoader
      color={color}
      loading
      size={resolveSize(size, page)}
      speedMultiplier={SPEED_MULTIPLIER}
    />
  );

  if (inline) {
    const inlineMinHeight =
      typeof size === "number" ? size * 2 : INLINE_MIN_HEIGHT_MAP[size] ?? INLINE_MIN_HEIGHT_MAP.xs;

    return (
      <Box
        component="span"
        sx={{
          alignItems: "center",
          display: "inline-flex",
          justifyContent: "center",
          lineHeight: 1,
          minHeight: inlineMinHeight,
          verticalAlign: "middle",
          ...sx,
        }}
      >
        {loader}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        alignItems: "center",
        display: "flex",
        flex: isPageLoader ? 1 : undefined,
        justifyContent: "center",
        minHeight:
          minHeight ??
          (isPageLoader ? PAGE_LOADER_MIN_HEIGHT : MIN_HEIGHT_MAP[size] ?? MIN_HEIGHT_MAP.md),
        width: "100%",
        ...sx,
      }}
    >
      {loader}
    </Box>
  );
}

Loader.propTypes = {
  color: PropTypes.string,
  inline: PropTypes.bool,
  minHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  page: PropTypes.bool,
  size: PropTypes.oneOfType([
    PropTypes.oneOf(["xs", "sm", "md", "lg", "xl", "page"]),
    PropTypes.number,
  ]),
  sx: PropTypes.object,
};
