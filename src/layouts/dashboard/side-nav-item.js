import NextLink from "next/link";
import PropTypes from "prop-types";
import { Box, ButtonBase } from "@mui/material";
import { primary } from "../../theme/colors";

export const SideNavItem = (props) => {
  const { active = false, disabled, external, icon, path, title } = props;

  const linkProps = path
    ? external
      ? {
          component: "a",
          href: path,
          target: "_blank",
        }
      : {
          component: NextLink,
          href: path,
        }
    : {};

  return (
    <li>
      <ButtonBase
        sx={{
          alignItems: "center",
          borderRadius: 1.5,
          display: "flex",
          justifyContent: "flex-start",
          pl: "16px",
          pr: "16px",
          py: "8px",
          textAlign: "left",
          width: "100%",
          ...(active && {
            background: `linear-gradient(90deg, ${primary.alpha12} 0%, rgba(255,255,255,0.04) 100%)`,
            borderLeft: `3px solid ${primary.main}`,
          }),
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.06)",
          },
        }}
        {...linkProps}
      >
        {icon && (
          <Box
            component="span"
            sx={{
              alignItems: "center",
              color: "rgba(255,255,255,0.55)",
              display: "inline-flex",
              justifyContent: "center",
              mr: 2,
              ...(active && {
                color: "primary.main",
              }),
            }}
          >
            {icon}
          </Box>
        )}
        <Box
          component="span"
          sx={{
            color: "rgba(255,255,255,0.65)",
            flexGrow: 1,
            fontFamily: (theme) => theme.typography.fontFamily,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: "24px",
            whiteSpace: "nowrap",
            ...(active && {
              color: "common.white",
            }),
            ...(disabled && {
              color: "neutral.500",
            }),
          }}
        >
          {title}
        </Box>
      </ButtonBase>
    </li>
  );
};

SideNavItem.propTypes = {
  active: PropTypes.bool,
  disabled: PropTypes.bool,
  external: PropTypes.bool,
  icon: PropTypes.node,
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};
