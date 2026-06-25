import PropTypes from "prop-types";
import EnvelopeIcon from "@heroicons/react/24/outline/EnvelopeIcon";
import PhoneIcon from "@heroicons/react/24/outline/PhoneIcon";
import MapPinIcon from "@heroicons/react/24/outline/MapPinIcon";
import {
  Avatar,
  Box,
  IconButton,
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

export const TablePersonCell = ({ imageUrl, name, subtitle }) => (
  <Stack alignItems="center" direction="row" spacing={1.5}>
    <Avatar
      src={imageUrl}
      sx={{
        bgcolor: "neutral.100",
        color: "neutral.700",
        fontSize: 14,
        fontWeight: 600,
        height: 40,
        width: 40,
      }}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </Avatar>
    <Box>
      <Typography fontWeight={600} variant="body2">
        {name || "—"}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" variant="caption">
          {subtitle}
        </Typography>
      )}
    </Box>
  </Stack>
);

TablePersonCell.propTypes = {
  imageUrl: PropTypes.string,
  name: PropTypes.string,
  subtitle: PropTypes.string,
};

export const TableEmailCell = ({ email }) => (
  <Stack alignItems="center" direction="row" spacing={1}>
    <SvgIcon fontSize="small" sx={{ color: "neutral.400" }}>
      <EnvelopeIcon />
    </SvgIcon>
    <Typography color="text.secondary" variant="body2">
      {email || "—"}
    </Typography>
  </Stack>
);

TableEmailCell.propTypes = {
  email: PropTypes.string,
};

export const TablePhoneCell = ({ phone }) => (
  <Stack alignItems="center" direction="row" spacing={1}>
    <SvgIcon fontSize="small" sx={{ color: "neutral.400" }}>
      <PhoneIcon />
    </SvgIcon>
    <Typography color="text.secondary" variant="body2">
      {phone || "—"}
    </Typography>
  </Stack>
);

TablePhoneCell.propTypes = {
  phone: PropTypes.string,
};

export const TableDetailCell = ({ icon: Icon, primary, secondary }) => (
  <Stack alignItems="center" direction="row" spacing={1.25}>
    {Icon && (
      <SvgIcon fontSize="small" sx={{ color: "neutral.400" }}>
        <Icon />
      </SvgIcon>
    )}
    <Box>
      <Typography fontWeight={600} variant="body2">
        {primary || "—"}
      </Typography>
      {secondary && (
        <Typography color="text.secondary" variant="caption">
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
    {actions.map(({ icon: Icon, label, onClick, color = "neutral.500" }) => (
      <Tooltip key={label} title={label}>
        <IconButton
          onClick={onClick}
          size="small"
          sx={{
            color,
            "&:hover": {
              bgcolor: "neutral.50",
              color: "neutral.800",
            },
          }}
        >
          <SvgIcon fontSize="small">
            <Icon />
          </SvgIcon>
        </IconButton>
      </Tooltip>
    ))}
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
