import NextLink from "next/link";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import { Box, ButtonBase, Collapse, Stack, SvgIcon } from "@mui/material";
import { primary } from "../../theme/colors";

const itemButtonSx = (active, { nested = false } = {}) => ({
  alignItems: "center",
  borderRadius: 1.5,
  display: "flex",
  justifyContent: "flex-start",
  pl: nested ? "44px" : "16px",
  pr: "16px",
  py: nested ? "6px" : "8px",
  textAlign: "left",
  width: "100%",
  ...(active && {
    background: `linear-gradient(90deg, ${primary.alpha12} 0%, rgba(255,255,255,0.04) 100%)`,
    borderLeft: `3px solid ${primary.main}`,
  }),
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
});

const titleSx = (active, disabled, { nested = false } = {}) => ({
  color: "rgba(255,255,255,0.65)",
  flexGrow: 1,
  fontFamily: (theme) => theme.typography.fontFamily,
  fontSize: nested ? 13 : 14,
  fontWeight: nested ? (active ? 700 : 500) : 600,
  lineHeight: "24px",
  whiteSpace: "nowrap",
  ...(active && {
    color: "common.white",
  }),
  ...(disabled && {
    color: "neutral.500",
  }),
});

export const SideNavItem = (props) => {
  const {
    active = false,
    childrenItems = [],
    disabled,
    external,
    icon,
    open: openProp,
    path,
    title,
  } = props;

  const hasChildren = Array.isArray(childrenItems) && childrenItems.length > 0;
  const [open, setOpen] = useState(Boolean(openProp) || active);

  useEffect(() => {
    if (openProp || active) {
      setOpen(true);
    }
  }, [openProp, active]);

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

  if (hasChildren) {
    return (
      <li>
        <ButtonBase onClick={() => setOpen((prev) => !prev)} sx={itemButtonSx(active)}>
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
          <Box component="span" sx={titleSx(active, disabled)}>
            {title}
          </Box>
          <SvgIcon
            fontSize="small"
            sx={{
              color: "rgba(255,255,255,0.55)",
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <ChevronDownIcon />
          </SvgIcon>
        </ButtonBase>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <Stack
            component="ul"
            spacing={0.25}
            sx={{ listStyle: "none", m: 0, mt: 0.25, p: 0 }}
          >
            {childrenItems.map((child) => {
              const childLinkProps = child.path
                ? child.external
                  ? {
                      component: "a",
                      href: child.path,
                      target: "_blank",
                    }
                  : {
                      component: NextLink,
                      href: child.path,
                    }
                : {};

              return (
                <li key={child.title}>
                  <ButtonBase
                    sx={itemButtonSx(Boolean(child.active), { nested: true })}
                    {...childLinkProps}
                  >
                    <Box
                      component="span"
                      sx={titleSx(Boolean(child.active), child.disabled, { nested: true })}
                    >
                      {child.title}
                    </Box>
                  </ButtonBase>
                </li>
              );
            })}
          </Stack>
        </Collapse>
      </li>
    );
  }

  return (
    <li>
      <ButtonBase sx={itemButtonSx(active)} {...linkProps}>
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
        <Box component="span" sx={titleSx(active, disabled)}>
          {title}
        </Box>
      </ButtonBase>
    </li>
  );
};

SideNavItem.propTypes = {
  active: PropTypes.bool,
  childrenItems: PropTypes.array,
  disabled: PropTypes.bool,
  external: PropTypes.bool,
  icon: PropTypes.node,
  open: PropTypes.bool,
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};
