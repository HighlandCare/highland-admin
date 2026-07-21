import { useState } from "react";
import PropTypes from "prop-types";
import EnvelopeIcon from "@heroicons/react/24/outline/EnvelopeIcon";
import PhoneIcon from "@heroicons/react/24/outline/PhoneIcon";
import MapPinIcon from "@heroicons/react/24/outline/MapPinIcon";
import EllipsisVerticalIcon from "@heroicons/react/24/solid/EllipsisVerticalIcon";
import {
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  SvgIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { brand } from "../theme/colors";

const badgeColors = {
  success: {
    bgcolor: alpha("#10B981", 0.12),
    color: "#047857",
  },
  warning: {
    bgcolor: alpha("#F59E0B", 0.14),
    color: "#B45309",
  },
  error: {
    bgcolor: alpha("#EF4444", 0.12),
    color: "#B91C1C",
  },
  info: {
    bgcolor: alpha(brand.primary, 0.12),
    color: brand.primary,
  },
  neutral: {
    bgcolor: alpha("#6B7280", 0.12),
    color: "#374151",
  },
};

export const StatusBadge = ({ color = "neutral", label }) => (
  <Box
    sx={{
      alignItems: "center",
      borderRadius: "999px",
      display: "inline-flex",
      fontSize: 13,
      fontWeight: 500,
      lineHeight: 1.4,
      px: 1.5,
      py: 0.5,
      textTransform: "capitalize",
      whiteSpace: "nowrap",
      ...badgeColors[color],
    }}
  >
    {label}
  </Box>
);

StatusBadge.propTypes = {
  color: PropTypes.oneOf(["success", "warning", "error", "info", "neutral"]),
  label: PropTypes.string.isRequired,
};

const tableTextSx = {
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export const TablePersonCell = ({ imageUrl, name, subtitle }) => {
  const nameLooksLikeEmail = typeof name === "string" && name.includes("@");
  const subtitleLooksLikeEmail = typeof subtitle === "string" && subtitle.includes("@");
  const displayName = nameLooksLikeEmail ? name.toLowerCase() : name;

  return (
  <Stack alignItems="center" direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ minWidth: 0 }}>
    <Avatar
      src={imageUrl}
      sx={{
        bgcolor: "neutral.100",
        color: "neutral.700",
        flexShrink: 0,
        fontSize: 14,
        fontWeight: 600,
        height: { xs: 36, sm: 40 },
        width: { xs: 36, sm: 40 },
      }}
    >
      {displayName?.charAt(0)?.toUpperCase() || "?"}
    </Avatar>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        data-email={nameLooksLikeEmail ? "true" : undefined}
        fontWeight={600}
        sx={{
          ...tableTextSx,
          ...(nameLooksLikeEmail ? { textTransform: "lowercase" } : {}),
        }}
        variant="body2"
      >
        {displayName || "—"}
      </Typography>
      {subtitle && (
        <Typography
          color="text.secondary"
          data-email={subtitleLooksLikeEmail ? "true" : undefined}
          sx={{
            ...tableTextSx,
            ...(subtitleLooksLikeEmail ? { textTransform: "lowercase" } : {}),
          }}
          variant="caption"
        >
          {subtitleLooksLikeEmail ? subtitle.toLowerCase() : subtitle}
        </Typography>
      )}
    </Box>
  </Stack>
  );
};

TablePersonCell.propTypes = {
  imageUrl: PropTypes.string,
  name: PropTypes.string,
  subtitle: PropTypes.string,
};

export const TableEmailCell = ({ email }) => (
  <Stack alignItems="center" direction="row" spacing={1} sx={{ maxWidth: { xs: 140, sm: 220, md: "none" }, minWidth: 0 }}>
    <SvgIcon fontSize="small" sx={{ color: "neutral.400", flexShrink: 0 }}>
      <EnvelopeIcon />
    </SvgIcon>
    <Typography
      color="text.secondary"
      data-email="true"
      sx={{ ...tableTextSx, textTransform: "lowercase" }}
      variant="body2"
    >
      {email ? email.toLowerCase() : "—"}
    </Typography>
  </Stack>
);

TableEmailCell.propTypes = {
  email: PropTypes.string,
};

export const TablePhoneCell = ({ phone }) => (
  <Stack alignItems="center" direction="row" spacing={1} sx={{ minWidth: 0 }}>
    <SvgIcon fontSize="small" sx={{ color: "neutral.400", flexShrink: 0 }}>
      <PhoneIcon />
    </SvgIcon>
    <Typography color="text.secondary" sx={tableTextSx} variant="body2">
      {phone || "—"}
    </Typography>
  </Stack>
);

TablePhoneCell.propTypes = {
  phone: PropTypes.string,
};

export const TableDetailCell = ({ icon: Icon, primary, secondary }) => (
  <Stack alignItems="center" direction="row" spacing={1.25} sx={{ minWidth: 0 }}>
    {Icon && (
      <SvgIcon fontSize="small" sx={{ color: "neutral.400", flexShrink: 0 }}>
        <Icon />
      </SvgIcon>
    )}
    <Box sx={{ minWidth: 0 }}>
      <Typography fontWeight={600} sx={tableTextSx} variant="body2">
        {primary || "—"}
      </Typography>
      {secondary && (
        <Typography color="text.secondary" sx={tableTextSx} variant="caption">
          {secondary}
        </Typography>
      )}
    </Box>
  </Stack>
);

TableDetailCell.propTypes = {
  icon: PropTypes.elementType,
  primary: PropTypes.string,
  secondary: PropTypes.string,
};

export const TableLocationCell = ({ city, state }) => (
  <TableDetailCell icon={MapPinIcon} primary={city} secondary={state} />
);

TableLocationCell.propTypes = {
  city: PropTypes.string,
  state: PropTypes.string,
};

export const TableQuickActions = ({ actions }) => (
  <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
    {actions.map(({ icon: Icon, label, onClick, color = "neutral.500" }) => {
      const hasActionColor = color !== "neutral.500";

      return (
        <Tooltip key={label} title={label}>
          <IconButton
            aria-label={label}
            onClick={onClick}
            size="small"
            sx={{
              color,
              "&:hover": {
                bgcolor: hasActionColor ? alpha(brand.primary, 0.06) : "neutral.50",
                color: hasActionColor ? color : "neutral.800",
              },
            }}
          >
            <SvgIcon fontSize="small">
              <Icon />
            </SvgIcon>
          </IconButton>
        </Tooltip>
      );
    })}
  </Stack>
);

TableQuickActions.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType.isRequired,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      color: PropTypes.string,
    })
  ).isRequired,
};

export const TableActionsMenu = ({ actions, disabled = false }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const menuId = open ? "table-actions-menu" : undefined;

  const handleOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleActionClick = (onClick) => {
    handleClose();
    if (typeof onClick === "function") {
      onClick();
    }
  };

  return (
    <>
      <Tooltip title="Actions">
        <span>
          <IconButton
            aria-controls={menuId}
            aria-expanded={open ? "true" : undefined}
            aria-haspopup="true"
            aria-label="Open actions menu"
            disabled={disabled || !actions?.length}
            onClick={handleOpen}
            size="small"
            sx={{
              color: "neutral.500",
              "&:hover": {
                bgcolor: "neutral.50",
                color: "neutral.800",
              },
            }}
          >
            <SvgIcon fontSize="small">
              <EllipsisVerticalIcon />
            </SvgIcon>
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        id={menuId}
        onClose={handleClose}
        open={open}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        slotProps={{
          paper: {
            sx: {
              border: "1px solid",
              borderColor: "neutral.200",
              boxShadow: "0px 8px 24px rgba(15, 23, 42, 0.08)",
              minWidth: 200,
              mt: 0.5,
            },
          },
        }}
      >
        {actions.map(({ icon: Icon, label, onClick, color = "neutral.700", disabled: actionDisabled }) => (
          <MenuItem
            disabled={actionDisabled}
            key={label}
            onClick={() => handleActionClick(onClick)}
            sx={{
              color,
              gap: 1.25,
              py: 1.1,
            }}
          >
            {Icon && (
              <SvgIcon fontSize="small" sx={{ color: "inherit" }}>
                <Icon />
              </SvgIcon>
            )}
            <Typography variant="body2">{label}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

TableActionsMenu.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType,
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func,
      color: PropTypes.string,
      disabled: PropTypes.bool,
    })
  ).isRequired,
  disabled: PropTypes.bool,
};
