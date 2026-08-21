import NextLink from "next/link";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import ChevronDownIcon from "@heroicons/react/24/solid/ChevronDownIcon";
import {
  Box,
  ButtonBase,
  Collapse,
  Menu,
  MenuItem,
  Stack,
  SvgIcon,
  Tooltip,
} from "@mui/material";
import { primary } from "../../theme/colors";

const itemButtonSx = (active, { nested = false, collapsed = false } = {}) => ({
  alignItems: "center",
  borderRadius: 1.5,
  display: "flex",
  justifyContent: collapsed ? "center" : "flex-start",
  pl: collapsed ? "8px" : nested ? "44px" : "16px",
  pr: collapsed ? "8px" : "16px",
  py: nested ? "6px" : "8px",
  textAlign: "left",
  width: "100%",
  minHeight: collapsed ? 44 : undefined,
  ...(active && {
    background: `linear-gradient(90deg, ${primary.alpha12} 0%, rgba(255,255,255,0.04) 100%)`,
    borderLeft: collapsed ? "none" : `3px solid ${primary.main}`,
    ...(collapsed && {
      boxShadow: `inset 0 0 0 2px ${primary.main}`,
    }),
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

const iconBoxSx = (active) => ({
  alignItems: "center",
  color: "rgba(255,255,255,0.55)",
  display: "inline-flex",
  justifyContent: "center",
  ...(active && {
    color: "primary.main",
  }),
});

export const SideNavItem = (props) => {
  const {
    active = false,
    childrenItems = [],
    collapsed = false,
    disabled,
    external,
    icon,
    open: openProp,
    path,
    title,
  } = props;

  const hasChildren = Array.isArray(childrenItems) && childrenItems.length > 0;
  const [open, setOpen] = useState(Boolean(openProp) || active);
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    if (openProp || active) {
      setOpen(true);
    }
  }, [openProp, active]);

  useEffect(() => {
    if (!collapsed) {
      setMenuAnchor(null);
    }
  }, [collapsed]);

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

  if (hasChildren && collapsed) {
    return (
      <li>
        <Tooltip title={title} placement="right" arrow>
          <ButtonBase
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            sx={itemButtonSx(active || Boolean(menuAnchor), { collapsed: true })}
          >
            {icon ? (
              <Box component="span" sx={{ ...iconBoxSx(active), mr: 0 }}>
                {icon}
              </Box>
            ) : null}
          </ButtonBase>
        </Tooltip>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              sx: {
                bgcolor: "background.paper",
                minWidth: 200,
                mt: 0.5,
              },
            },
          }}
        >
          {childrenItems.map((child) => (
            <MenuItem
              key={child.title}
              component={child.path ? NextLink : "div"}
              href={child.path || undefined}
              selected={Boolean(child.active)}
              onClick={() => setMenuAnchor(null)}
              sx={{ fontSize: 14, fontWeight: child.active ? 700 : 500 }}
            >
              {child.title}
            </MenuItem>
          ))}
        </Menu>
      </li>
    );
  }

  if (hasChildren) {
    return (
      <li>
        <ButtonBase onClick={() => setOpen((prev) => !prev)} sx={itemButtonSx(active)}>
          {icon ? (
            <Box component="span" sx={{ ...iconBoxSx(active), mr: 2 }}>
              {icon}
            </Box>
          ) : null}
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

  const itemButton = (
    <ButtonBase sx={itemButtonSx(active, { collapsed })} {...linkProps}>
      {icon ? (
        <Box component="span" sx={{ ...iconBoxSx(active), mr: collapsed ? 0 : 2 }}>
          {icon}
        </Box>
      ) : null}
      {!collapsed ? (
        <Box component="span" sx={titleSx(active, disabled)}>
          {title}
        </Box>
      ) : null}
    </ButtonBase>
  );

  return (
    <li>
      {collapsed ? (
        <Tooltip title={title} placement="right" arrow>
          {itemButton}
        </Tooltip>
      ) : (
        itemButton
      )}
    </li>
  );
};

SideNavItem.propTypes = {
  active: PropTypes.bool,
  childrenItems: PropTypes.array,
  collapsed: PropTypes.bool,
  disabled: PropTypes.bool,
  external: PropTypes.bool,
  icon: PropTypes.node,
  open: PropTypes.bool,
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};
