import PropTypes from "prop-types";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

export default function LiveOpsFilters({
  categories,
  selectedCategories,
  onCategoryToggle,
  region,
  regionOptions,
  onRegionChange,
  onlineOnly,
  onOnlineOnlyChange,
  showTraffic,
  onShowTrafficChange,
  legend,
}) {
  return (
    <Box
      sx={{
        width: 260,
        flexShrink: 0,
        bgcolor: "#111827",
        borderRight: "1px solid rgba(148,163,184,.15)",
        p: 2,
        overflow: "auto",
      }}
    >
      <Typography sx={{ color: "#f8fafc", fontWeight: 700, mb: 2 }}>
        Live Operations
      </Typography>

      <Typography sx={{ color: "#94a3b8", fontSize: 12, mb: 1 }}>Region</Typography>
      <Select
        fullWidth
        size="small"
        value={region}
        onChange={(e) => onRegionChange?.(e.target.value)}
        sx={{
          mb: 2,
          color: "#e2e8f0",
          bgcolor: "rgba(15,23,42,.8)",
          ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(148,163,184,.25)" },
        }}
      >
        {(regionOptions ?? []).map((opt) => (
          <MenuItem key={opt.key} value={opt.key}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>

      <Typography sx={{ color: "#94a3b8", fontSize: 12, mb: 1 }}>Categories</Typography>
      <FormGroup sx={{ mb: 2 }}>
        {(categories ?? []).map((cat) => (
          <FormControlLabel
            key={cat.key}
            control={
              <Checkbox
                size="small"
                checked={selectedCategories.includes(cat.key)}
                onChange={() => onCategoryToggle?.(cat.key)}
                sx={{ color: "#64748b", "&.Mui-checked": { color: "#a78bfa" } }}
              />
            }
            label={
              <Typography sx={{ color: "#cbd5e1", fontSize: 13 }}>{cat.label}</Typography>
            }
          />
        ))}
      </FormGroup>

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={onlineOnly}
              onChange={(e) => onOnlineOnlyChange?.(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography sx={{ color: "#cbd5e1", fontSize: 13 }}>
              Available drivers only
            </Typography>
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={showTraffic}
              onChange={(e) => onShowTrafficChange?.(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography sx={{ color: "#cbd5e1", fontSize: 13 }}>
              Enhanced map tiles
            </Typography>
          }
        />
      </Stack>

      <Typography sx={{ color: "#94a3b8", fontSize: 12, mb: 1 }}>Legend</Typography>
      <Stack spacing={0.75}>
        {[
          ["customer_signup", "Customers", "#22c55e"],
          ["driver_signup", "Drivers", "#eab308"],
          ["ride_request", "Ride requests", "#3b82f6"],
          ["online_driver", "Online drivers", "#f97316"],
          ["emergency", "Urgent issues", "#ef4444"],
        ].map(([key, label, color]) => (
          <Stack key={key} direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
            <Typography sx={{ color: "#cbd5e1", fontSize: 12, flex: 1 }}>{label}</Typography>
            <Typography sx={{ color: "#64748b", fontSize: 12 }}>
              {legend?.[key] ?? 0}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

LiveOpsFilters.propTypes = {
  categories: PropTypes.array,
  selectedCategories: PropTypes.array,
  onCategoryToggle: PropTypes.func,
  region: PropTypes.string,
  regionOptions: PropTypes.array,
  onRegionChange: PropTypes.func,
  onlineOnly: PropTypes.bool,
  onOnlineOnlyChange: PropTypes.func,
  showTraffic: PropTypes.bool,
  onShowTrafficChange: PropTypes.func,
  legend: PropTypes.object,
};
