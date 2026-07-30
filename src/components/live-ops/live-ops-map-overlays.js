import PropTypes from "prop-types";
import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Popover,
  Select,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import FunnelIcon from "@heroicons/react/24/solid/FunnelIcon";
import MapPinIcon from "@heroicons/react/24/solid/MapPinIcon";
import ArrowsPointingOutIcon from "@heroicons/react/24/solid/ArrowsPointingOutIcon";
import ArrowsPointingInIcon from "@heroicons/react/24/solid/ArrowsPointingInIcon";
import LiveOpsLocationSearch from "./live-ops-location-search";
import { buildLegendIconSvg } from "../../utils/liveOpsMarkerIcons";

const LEGEND_ITEMS = [
  { key: "customer_signup", label: "Customers", color: "#22c55e" },
  { key: "driver_signup", label: "Drivers", color: "#eab308" },
  { key: "ride_request", label: "Pending", color: "#3b82f6" },
  { key: "food_order", label: "Food", color: "#a855f7" },
  { key: "online_driver", label: "Online", color: "#f97316" },
  { key: "emergency", label: "Urgent", color: "#ef4444" },
];

const glass = {
  bgcolor: "rgba(255, 255, 255, 0.94)",
  backdropFilter: "blur(12px)",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "14px",
  boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
};

export default function LiveOpsMapOverlays({
  legend,
  locationSearch,
  onLocationSearchChange,
  onPlaceSelect,
  onCurrentLocation,
  locating,
  region,
  regionOptions,
  onRegionChange,
  markerTypes,
  selectedMarkerTypes,
  onMarkerTypeToggle,
  onlineOnly,
  onOnlineOnlyChange,
  selectedMarker,
  onCloseMarker,
  onLocateRegion,
  isMapFullscreen,
  onToggleFullscreen,
  tourStopIndex,
  tourStopTotal,
}) {
  const [filterAnchor, setFilterAnchor] = useState(null);

  const markerBorder =
    selectedMarker?.color === "yellow"
      ? "#eab308"
      : selectedMarker?.color === "blue"
        ? "#3b82f6"
        : selectedMarker?.color === "purple"
          ? "#a855f7"
          : selectedMarker?.color === "red"
            ? "#ef4444"
            : "#00828A";

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000,
          ...glass,
          px: 2,
          py: 1,
          display: { xs: "none", md: "flex" },
          alignItems: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "success.main",
            boxShadow: "0 0 10px rgba(34,197,94,.55)",
            animation: "pulse 2s infinite",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.4 },
            },
          }}
        />
        <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 600 }}>
          Live Activity
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 12 }}>Real-time</Typography>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "absolute",
          top: { xs: 8, sm: 16 },
          left: { xs: 8, sm: "50%" },
          right: { xs: 8, sm: "auto" },
          transform: { xs: "none", sm: "translateX(-50%)" },
          zIndex: 1000,
          width: { xs: "auto", sm: "calc(100% - 32px)", md: 420 },
        }}
      >
        <LiveOpsLocationSearch
          value={locationSearch}
          onChange={onLocationSearchChange}
          onPlaceSelect={onPlaceSelect}
          onCurrentLocation={onCurrentLocation}
          locating={locating}
        />
        <IconButton
          onClick={(e) => setFilterAnchor(e.currentTarget)}
          sx={{
            ...glass,
            width: 48,
            height: 48,
            color: "primary.main",
            flexShrink: 0,
            "&:hover": { bgcolor: "primary.alpha8" },
          }}
        >
          <FunnelIcon width={20} />
        </IconButton>
      </Stack>

      {tourStopIndex && tourStopTotal ? (
        <Box
          sx={{
            position: "absolute",
            top: { xs: 56, sm: 72 },
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            ...glass,
            px: 2,
            py: 0.75,
          }}
        >
          <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 700 }}>
            Viewing location {tourStopIndex} of {tourStopTotal}
          </Typography>
        </Box>
      ) : null}

      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            ...glass,
            p: 2,
            width: 300,
            mt: 1,
          },
        }}
      >
        <Typography sx={{ color: "text.primary", fontWeight: 700, mb: 1.5 }}>Filters</Typography>

        <Typography sx={{ color: "text.secondary", fontSize: 11, mb: 0.5 }}>Region</Typography>
        <Select
          fullWidth
          size="small"
          value={region}
          onChange={(e) => onRegionChange?.(e.target.value)}
          sx={{
            mb: 2,
            color: "text.primary",
            bgcolor: "background.default",
            ".MuiOutlinedInput-notchedOutline": { borderColor: "divider" },
          }}
        >
          {(regionOptions ?? []).map((opt) => (
            <MenuItem key={opt.key} value={opt.key}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>

        <Typography sx={{ color: "text.secondary", fontSize: 11, mb: 0.5 }}>Map layers</Typography>
        <FormGroup sx={{ mb: 1.5, maxHeight: 220, overflow: "auto" }}>
          {(markerTypes ?? []).map((type) => (
            <FormControlLabel
              key={type.key}
              disabled={onlineOnly}
              control={
                <Checkbox
                  size="small"
                  checked={
                    onlineOnly
                      ? type.key === "online_driver"
                      : (selectedMarkerTypes ?? []).includes(type.key)
                  }
                  onChange={() => onMarkerTypeToggle?.(type.key)}
                  sx={{ color: "neutral.400", "&.Mui-checked": { color: "primary.main" } }}
                />
              }
              label={
                <Typography sx={{ color: "text.primary", fontSize: 13 }}>{type.label}</Typography>
              }
            />
          ))}
        </FormGroup>

        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={onlineOnly}
              onChange={(e) => onOnlineOnlyChange?.(e.target.checked)}
            />
          }
          label={
            <Typography sx={{ color: "text.primary", fontSize: 13 }}>
              Available drivers only
            </Typography>
          }
        />
      </Popover>

      {selectedMarker ? (
        <Box
          sx={{
            position: "absolute",
            top: { xs: 60, sm: 72 },
            left: { xs: 8, sm: 16 },
            right: { xs: 8, sm: "auto" },
            zIndex: 1000,
            ...glass,
            borderColor: markerBorder,
            borderWidth: 2,
            p: 2,
            minWidth: { xs: 0, sm: 260 },
            maxWidth: { xs: "none", sm: 320 },
          }}
        >
          <Typography sx={{ color: markerBorder, fontSize: 12, fontWeight: 700, mb: 0.5 }}>
            {selectedMarker.type === "driver_signup" || selectedMarker.type === "online_driver"
              ? "Driver"
              : selectedMarker.type === "food_order"
                ? "Food Order"
                : selectedMarker.type === "ride_request"
                  ? "Ride Request"
                  : "Customer"}
          </Typography>
          <Typography sx={{ color: "text.primary", fontWeight: 700, fontSize: 16 }}>
            {selectedMarker.title}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.5 }}>
            {selectedMarker.subtitle}
          </Typography>
          {selectedMarker.phone ? (
            <Typography sx={{ color: "text.primary", fontSize: 13, mt: 1 }}>
              {selectedMarker.phone}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button size="small" sx={{ color: "text.secondary" }} onClick={onCloseMarker}>
              Close
            </Button>
          </Stack>
        </Box>
      ) : null}

      <Box
        sx={{
          position: "absolute",
          bottom: { xs: 12, md: 20 },
          left: { xs: 8, md: "50%" },
          right: { xs: 8, md: "auto" },
          transform: { xs: "none", md: "translateX(-50%)" },
          zIndex: 1000,
          ...glass,
          px: { xs: 1.5, md: 2.5 },
          py: { xs: 1, md: 1.25 },
          display: "flex",
          flexWrap: { xs: "nowrap", md: "wrap" },
          overflowX: { xs: "auto", md: "visible" },
          gap: { xs: 1.5, md: 2 },
          justifyContent: { xs: "flex-start", md: "center" },
        }}
      >
        {LEGEND_ITEMS.map((item) => (
          <Stack
            key={item.key}
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ flexShrink: 0 }}
          >
            <Box
              aria-hidden
              sx={{
                width: 16,
                height: 16,
                lineHeight: 0,
                flexShrink: 0,
                "& svg": { display: "block" },
              }}
              dangerouslySetInnerHTML={{ __html: buildLegendIconSvg(item.key, 16) }}
            />
            <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
              {item.label}: {legend?.[item.key] ?? 0}
            </Typography>
          </Stack>
        ))}
      </Box>

      <Stack
        spacing={1}
        sx={{
          position: "absolute",
          bottom: { xs: 72, md: 88 },
          right: { xs: 8, md: 16 },
          zIndex: 1000,
        }}
      >
        <Tooltip title="Reset map to selected region">
          <IconButton
            onClick={onLocateRegion}
            sx={{
              ...glass,
              width: 44,
              height: 44,
              color: "primary.main",
            }}
          >
            <MapPinIcon width={22} />
          </IconButton>
        </Tooltip>
        <Tooltip title={isMapFullscreen ? "Exit full screen" : "Full screen map"}>
          <IconButton
            onClick={onToggleFullscreen}
            sx={{
              ...glass,
              width: 44,
              height: 44,
              color: "primary.main",
            }}
          >
            {isMapFullscreen ? (
              <ArrowsPointingInIcon width={22} />
            ) : (
              <ArrowsPointingOutIcon width={22} />
            )}
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );
}

LiveOpsMapOverlays.propTypes = {
  legend: PropTypes.object,
  locationSearch: PropTypes.string,
  onLocationSearchChange: PropTypes.func,
  onPlaceSelect: PropTypes.func,
  onCurrentLocation: PropTypes.func,
  locating: PropTypes.bool,
  region: PropTypes.string,
  regionOptions: PropTypes.array,
  onRegionChange: PropTypes.func,
  markerTypes: PropTypes.array,
  selectedMarkerTypes: PropTypes.array,
  onMarkerTypeToggle: PropTypes.func,
  onlineOnly: PropTypes.bool,
  onOnlineOnlyChange: PropTypes.func,
  selectedMarker: PropTypes.object,
  onCloseMarker: PropTypes.func,
  onLocateRegion: PropTypes.func,
  isMapFullscreen: PropTypes.bool,
  onToggleFullscreen: PropTypes.func,
  tourStopIndex: PropTypes.number,
  tourStopTotal: PropTypes.number,
};
