import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Popover,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FunnelIcon from "@heroicons/react/24/solid/FunnelIcon";
import MapPinIcon from "@heroicons/react/24/solid/MapPinIcon";
import ArrowsPointingOutIcon from "@heroicons/react/24/solid/ArrowsPointingOutIcon";
import ArrowsPointingInIcon from "@heroicons/react/24/solid/ArrowsPointingInIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";
import { toast } from "react-toastify";
import LiveOpsLocationSearch from "./live-ops-location-search";
import { liveOpsGlass } from "../../theme/live-ops-page-theme";
import { useLiveOpsUi } from "../../contexts/live-ops-ui-context";
import SunIcon from "@heroicons/react/24/solid/SunIcon";
import MoonIcon from "@heroicons/react/24/solid/MoonIcon";
import { enrichLiveOpsItem, resolveLiveOpsDetailPath } from "../../utils/liveOpsNavigation";
import { getDemandHotspotStaticNotifyText } from "../../utils/liveOpsHotspots";

const LiveOpsGeoFilter = dynamic(() => import("./live-ops-geo-filter"), {
  ssr: false,
  loading: () => (
    <Typography sx={{ color: "text.secondary", fontSize: 12, mb: 1.5 }}>
      Loading locations…
    </Typography>
  ),
});

const LEGEND_ITEMS = [
  { key: "customer_signup", label: "Customers", color: "#22c55e" },
  { key: "driver_signup", label: "Drivers", color: "#eab308" },
  { key: "ride_request", label: "Pending", color: "#3b82f6" },
  { key: "online_driver", label: "Online", color: "#f97316" },
  { key: "emergency", label: "Urgent", color: "#ef4444" },
  { key: "demand_hotspot", label: "Demand", color: "#ef4444", isHotspot: true },
];

export default function LiveOpsMapOverlays({
  legend,
  hotspots = [],
  activeHotspotCount = 0,
  activeHotspot = null,
  showHotspots = true,
  onShowHotspotsChange,
  selectedHotspot,
  onCloseHotspot,
  locationSearch,
  onLocationSearchChange,
  onPlaceSelect,
  onCurrentLocation,
  locating,
  mapMarkers,
  markerTypes,
  selectedMarkerTypes,
  onMarkerTypeToggle,
  onlineOnly,
  onOnlineOnlyChange,
  selectedMarker,
  onCloseMarker,
  onViewDetails,
  onLocateRegion,
  isMapFullscreen,
  onToggleFullscreen,
  tourStopIndex,
  tourStopTotal,
  snapshot = null,
  geoFilter,
  onGeoFilterChange,
}) {
  const router = useRouter();
  const theme = useTheme();
  const glass = liveOpsGlass(theme);
  const { mapTheme, toggleMapTheme } = useLiveOpsUi();
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [demandStackDismissed, setDemandStackDismissed] = useState(false);
  const hasGeoFilter = Boolean(geoFilter?.state || geoFilter?.city);

  const enrichedMarker = selectedMarker ? enrichLiveOpsItem(selectedMarker, snapshot) : null;
  const detailPath = enrichedMarker ? resolveLiveOpsDetailPath(enrichedMarker) : null;

  const stackedHotspots = useMemo(() => {
    if (!showHotspots) return [];
    const list = (hotspots || []).filter((item) => item?.active !== false);
    const sorted = [...list].sort(
      (a, b) => (Number(b.pendingCount) || 0) - (Number(a.pendingCount) || 0)
    );
    const primary = selectedHotspot || activeHotspot;
    if (primary?.id) {
      const withoutPrimary = sorted.filter((item) => item.id !== primary.id);
      return [primary, ...withoutPrimary].slice(0, 3);
    }
    return sorted.slice(0, 3);
  }, [activeHotspot, hotspots, selectedHotspot, showHotspots]);

  const frontHotspot = stackedHotspots[0] || null;
  const demandStaticNotify = frontHotspot
    ? getDemandHotspotStaticNotifyText(frontHotspot)
    : null;
  const showDemandStack = Boolean(frontHotspot && !demandStackDismissed);

  useEffect(() => {
    setDemandStackDismissed(false);
  }, [frontHotspot?.id, selectedHotspot?.id]);

  const handleCloseDemandStack = () => {
    setDemandStackDismissed(true);
    onCloseHotspot?.();
  };

  const handleViewDetails = () => {
    if (!detailPath) {
      toast.info("No detail page available for this marker.");
      return;
    }
    router.push(detailPath);
  };

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

  const renderSearchAndFilter = () => (
    <Stack direction="row" spacing={1} sx={{ width: "100%", minWidth: 0 }}>
      <LiveOpsLocationSearch
        value={locationSearch}
        onChange={onLocationSearchChange}
        onPlaceSelect={onPlaceSelect}
        onCurrentLocation={onCurrentLocation}
        locating={locating}
        mapMarkers={mapMarkers}
      />
      <IconButton
        onClick={(e) => setFilterAnchor(e.currentTarget)}
        aria-label="Open map filters"
        sx={{
          ...glass,
          width: 48,
          height: 48,
          color: "primary.main",
          flexShrink: 0,
          bgcolor: hasGeoFilter ? "primary.alpha12" : glass.bgcolor,
          borderColor: hasGeoFilter ? "primary.main" : "divider",
          "&:hover": { bgcolor: "primary.alpha8" },
        }}
      >
        <FunnelIcon width={20} />
      </IconButton>
    </Stack>
  );

  const renderLiveActivityChip = () => (
    <Box
      sx={{
        ...glass,
        px: { xs: 1.25, sm: 2 },
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexWrap: "wrap",
        alignSelf: "flex-start",
        maxWidth: "100%",
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
          flexShrink: 0,
          "@keyframes pulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.4 },
          },
        }}
      />
      <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 600 }}>
        Live Activity
      </Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, display: { xs: "none", sm: "block" } }}>
        Real-time
      </Typography>
      {activeHotspotCount > 0 ? (
        <Typography
          sx={{
            color: "#ef4444",
            fontSize: 11,
            fontWeight: 700,
            px: 1,
            py: 0.25,
            borderRadius: 999,
            bgcolor: "rgba(239,68,68,0.12)",
          }}
        >
          High demand area
        </Typography>
      ) : null}
    </Box>
  );

  return (
    <>
      {/* Mobile / tablet: stack Live Activity → search → cards so nothing overlaps */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 8,
          right: 8,
          zIndex: 1100,
          display: { xs: "flex", lg: "none" },
          flexDirection: "column",
          gap: 1,
          maxHeight: "calc(100% - 96px)",
          overflowY: "auto",
          overflowX: "hidden",
          pointerEvents: "none",
          "& > *": { pointerEvents: "auto" },
        }}
      >
        {renderLiveActivityChip()}
        {renderSearchAndFilter()}
        {tourStopIndex && tourStopTotal ? (
          <Box sx={{ ...glass, px: 2, py: 0.75, alignSelf: "center" }}>
            <Typography sx={{ color: "primary.main", fontSize: 12, fontWeight: 700 }}>
              Viewing location {tourStopIndex} of {tourStopTotal}
            </Typography>
          </Box>
        ) : null}
        {showDemandStack ? (
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 340,
              minHeight: 130,
              alignSelf: "flex-start",
            }}
          >
            {stackedHotspots.length === 1
              ? [2, 1].map((depth) => (
                  <Box
                    key={`demand-stack-peek-mobile-${depth}`}
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: depth * 10,
                      left: depth * 10,
                      right: depth * 10,
                      height: 72,
                      zIndex: 10 + (3 - depth),
                      ...glass,
                      borderColor: "#f97316",
                      borderWidth: 1.5,
                      opacity: 0.45 - depth * 0.08,
                      pointerEvents: "none",
                      boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                    }}
                  />
                ))
              : null}
            {stackedHotspots
              .slice()
              .reverse()
              .map((hotspot, reverseIndex) => {
                const depth = stackedHotspots.length - 1 - reverseIndex;
                const isFront = depth === 0;
                const notify = getDemandHotspotStaticNotifyText(hotspot);
                const offset = depth * 10;

                return (
                  <Box
                    key={`mobile-${hotspot.id || `demand-${depth}`}`}
                    sx={{
                      position: "absolute",
                      top: offset,
                      left: offset,
                      right: depth === 0 ? 0 : offset,
                      zIndex: 20 + (stackedHotspots.length - depth),
                      ...glass,
                      borderColor: isFront ? "#ef4444" : "#f97316",
                      borderWidth: isFront ? 2 : 1.5,
                      p: isFront ? 2 : 1.5,
                      pr: isFront ? 5 : 1.5,
                      opacity: isFront ? 1 : Math.max(0.4, 0.78 - depth * 0.18),
                      transform: isFront ? "none" : `scale(${1 - depth * 0.04})`,
                      transformOrigin: "top left",
                      pointerEvents: isFront ? "auto" : "none",
                      boxShadow: isFront
                        ? "0 12px 28px rgba(0,0,0,0.35)"
                        : "0 6px 16px rgba(0,0,0,0.2)",
                    }}
                  >
                    {isFront ? (
                      <>
                        <IconButton
                          aria-label="Close demand cards"
                          onClick={handleCloseDemandStack}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            zIndex: 2,
                            color: "text.secondary",
                            bgcolor: "rgba(255,255,255,0.08)",
                            border: "1px solid",
                            borderColor: "rgba(255,255,255,0.12)",
                            "&:hover": {
                              color: "text.primary",
                              bgcolor: "rgba(255,255,255,0.14)",
                            },
                          }}
                        >
                          <XMarkIcon width={18} />
                        </IconButton>
                        <Typography
                          sx={{ color: "#ef4444", fontSize: 12, fontWeight: 700, mb: 0.5 }}
                        >
                          High demand zone
                        </Typography>
                        <Typography sx={{ color: "text.primary", fontWeight: 700, fontSize: 16 }}>
                          {notify.pendingLabel || hotspot.label}
                        </Typography>
                        <Typography
                          sx={{ color: "#f97316", fontSize: 13, fontWeight: 700, mt: 1 }}
                        >
                          {notify.notifyLabel}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography sx={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
                          {notify.pendingLabel || hotspot.label}
                        </Typography>
                        <Typography
                          sx={{ color: "#f97316", fontSize: 11, fontWeight: 700, mt: 0.5 }}
                        >
                          {notify.notifyLabel}
                        </Typography>
                      </>
                    )}
                  </Box>
                );
              })}
          </Box>
        ) : null}
        {selectedMarker ? (
          <Box
            sx={{
              ...glass,
              borderColor: markerBorder,
              borderWidth: 2,
              p: 2,
              width: "100%",
              maxWidth: 360,
              alignSelf: "flex-start",
            }}
          >
            <Typography sx={{ color: markerBorder, fontSize: 12, fontWeight: 700, mb: 0.5 }}>
              {selectedMarker.type === "driver_signup" || selectedMarker.type === "online_driver"
                ? "Driver"
                : selectedMarker.type === "ride_request"
                  ? "Ride Request"
                  : selectedMarker.type === "dispute"
                    ? "Dispute"
                    : selectedMarker.type === "emergency"
                      ? "Urgent"
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
              <Button
                size="small"
                variant="outlined"
                sx={{ color: "text.secondary", flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
                onClick={onCloseMarker}
              >
                Close
              </Button>
              <Button
                size="small"
                variant="outlined"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  px: 1.5,
                  whiteSpace: "nowrap",
                  color: markerBorder,
                  borderColor: markerBorder,
                  "&:hover": {
                    borderColor: markerBorder,
                    bgcolor: `${markerBorder}14`,
                  },
                }}
                disabled={!detailPath}
                onClick={() => {
                  if (onViewDetails) {
                    onViewDetails(selectedMarker);
                    return;
                  }
                  handleViewDetails();
                }}
              >
                View Details
              </Button>
            </Stack>
          </Box>
        ) : null}
      </Box>

      {/* Desktop: Live Activity left, search centered (no overlap) */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 1000,
          display: { xs: "none", lg: "block" },
        }}
      >
        {renderLiveActivityChip()}
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "absolute",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          width: 420,
          maxWidth: "calc(100% - 360px)",
          display: { xs: "none", lg: "flex" },
        }}
      >
        {renderSearchAndFilter()}
      </Stack>

      {tourStopIndex && tourStopTotal ? (
        <Box
          sx={{
            position: "absolute",
            top: 72,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            ...glass,
            px: 2,
            py: 0.75,
            display: { xs: "none", lg: "block" },
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
            width: { xs: "calc(100vw - 24px)", sm: 340 },
            maxWidth: "calc(100vw - 24px)",
            mt: 1,
            overflow: "auto",
            maxHeight: "calc(100vh - 96px)",
          },
        }}
      >
        <Typography sx={{ color: "text.primary", fontWeight: 700, mb: 1.5 }}>Filters</Typography>

        <LiveOpsGeoFilter value={geoFilter} onChange={onGeoFilterChange} />

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

        <FormControlLabel
          sx={{ mt: 0.5 }}
          control={
            <Checkbox
              size="small"
              checked={showHotspots}
              onChange={(e) => onShowHotspotsChange?.(e.target.checked)}
              sx={{ color: "neutral.400", "&.Mui-checked": { color: "#ef4444" } }}
            />
          }
          label={
            <Typography sx={{ color: "text.primary", fontSize: 13 }}>
              Demand hotspots
            </Typography>
          }
        />
      </Popover>

      {selectedMarker ? (
        <Box
          sx={{
            position: "absolute",
            top: 72,
            left: 16,
            zIndex: 1000,
            ...glass,
            borderColor: markerBorder,
            borderWidth: 2,
            p: 2,
            minWidth: 300,
            maxWidth: 360,
            display: { xs: "none", lg: "block" },
          }}
        >
          <Typography sx={{ color: markerBorder, fontSize: 12, fontWeight: 700, mb: 0.5 }}>
            {selectedMarker.type === "driver_signup" || selectedMarker.type === "online_driver"
              ? "Driver"
              : selectedMarker.type === "ride_request"
                ? "Ride Request"
                : selectedMarker.type === "dispute"
                  ? "Dispute"
                  : selectedMarker.type === "emergency"
                    ? "Urgent"
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
            <Button
              size="small"
              variant="outlined"
              sx={{ color: "text.secondary", flex: 1, minWidth: 0, whiteSpace: "nowrap" }}
              onClick={onCloseMarker}
            >
              Close
            </Button>
            <Button
              size="small"
              variant="outlined"
              sx={{
                flex: 1,
                minWidth: 0,
                px: 1.5,
                whiteSpace: "nowrap",
                color: markerBorder,
                borderColor: markerBorder,
                "&:hover": {
                  borderColor: markerBorder,
                  bgcolor: `${markerBorder}14`,
                },
              }}
              disabled={!detailPath}
              onClick={() => {
                if (onViewDetails) {
                  onViewDetails(selectedMarker);
                  return;
                }
                handleViewDetails();
              }}
            >
              View Details
            </Button>
          </Stack>
        </Box>
      ) : null}

      {showDemandStack ? (
        <Box
          sx={{
            position: "absolute",
            top: 72,
            left: 16,
            zIndex: 1100,
            width: 340,
            minHeight: 130,
            display: { xs: "none", lg: "block" },
          }}
        >
          {/* Decorative back layers so a single zone still reads as a stack */}
          {stackedHotspots.length === 1
            ? [2, 1].map((depth) => (
                <Box
                  key={`demand-stack-peek-${depth}`}
                  aria-hidden
                  sx={{
                    position: "absolute",
                    top: depth * 10,
                    left: depth * 10,
                    right: depth * 10,
                    height: 72,
                    zIndex: 10 + (3 - depth),
                    ...glass,
                    borderColor: "#f97316",
                    borderWidth: 1.5,
                    opacity: 0.45 - depth * 0.08,
                    pointerEvents: "none",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
                  }}
                />
              ))
            : null}

          {stackedHotspots
            .slice()
            .reverse()
            .map((hotspot, reverseIndex) => {
              const depth = stackedHotspots.length - 1 - reverseIndex;
              const isFront = depth === 0;
              const notify = getDemandHotspotStaticNotifyText(hotspot);
              const offset = depth * 10;

              return (
                <Box
                  key={hotspot.id || `demand-${depth}`}
                  sx={{
                    position: "absolute",
                    top: offset,
                    left: offset,
                    right: depth === 0 ? 0 : offset,
                    zIndex: 20 + (stackedHotspots.length - depth),
                    ...glass,
                    borderColor: isFront ? "#ef4444" : "#f97316",
                    borderWidth: isFront ? 2 : 1.5,
                    p: isFront ? 2 : 1.5,
                    pr: isFront ? 5 : 1.5,
                    opacity: isFront ? 1 : Math.max(0.4, 0.78 - depth * 0.18),
                    transform: isFront ? "none" : `scale(${1 - depth * 0.04})`,
                    transformOrigin: "top left",
                    pointerEvents: isFront ? "auto" : "none",
                    boxShadow: isFront
                      ? "0 12px 28px rgba(0,0,0,0.35)"
                      : "0 6px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  {isFront ? (
                    <>
                      <IconButton
                        aria-label="Close demand cards"
                        onClick={handleCloseDemandStack}
                        size="small"
                        sx={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          zIndex: 2,
                          color: "text.secondary",
                          bgcolor: "rgba(255,255,255,0.08)",
                          border: "1px solid",
                          borderColor: "rgba(255,255,255,0.12)",
                          "&:hover": {
                            color: "text.primary",
                            bgcolor: "rgba(255,255,255,0.14)",
                          },
                        }}
                      >
                        <XMarkIcon width={18} />
                      </IconButton>
                      <Typography
                        sx={{ color: "#ef4444", fontSize: 12, fontWeight: 700, mb: 0.5 }}
                      >
                        High demand zone
                      </Typography>
                      <Typography sx={{ color: "text.primary", fontWeight: 700, fontSize: 16 }}>
                        {notify.pendingLabel || hotspot.label}
                      </Typography>
                      <Typography
                        sx={{ color: "#f97316", fontSize: 13, fontWeight: 700, mt: 1 }}
                      >
                        {notify.notifyLabel}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography sx={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>
                        {notify.pendingLabel || hotspot.label}
                      </Typography>
                      <Typography
                        sx={{ color: "#f97316", fontSize: 11, fontWeight: 700, mt: 0.5 }}
                      >
                        {notify.notifyLabel}
                      </Typography>
                    </>
                  )}
                </Box>
              );
            })}
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
              className="live-ops-legend-dot"
              sx={{
                bgcolor: item.color,
                boxShadow: `0 0 0 4px ${item.color}33, 0 0 10px ${item.color}`,
              }}
            />
            <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
              {item.label}:{" "}
              {item.isHotspot ? activeHotspotCount : (legend?.[item.key] ?? 0)}
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
        {/* <Tooltip title={mapTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          <IconButton
            onClick={toggleMapTheme}
            aria-label={mapTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            sx={{
              ...glass,
              width: 44,
              height: 44,
              color: "primary.main",
            }}
          >
            {mapTheme === "dark" ? <SunIcon width={22} /> : <MoonIcon width={22} />}
          </IconButton>
        </Tooltip> */}

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
  hotspots: PropTypes.array,
  activeHotspotCount: PropTypes.number,
  showHotspots: PropTypes.bool,
  onShowHotspotsChange: PropTypes.func,
  selectedHotspot: PropTypes.object,
  onCloseHotspot: PropTypes.func,
  locationSearch: PropTypes.string,
  onLocationSearchChange: PropTypes.func,
  onPlaceSelect: PropTypes.func,
  onCurrentLocation: PropTypes.func,
  locating: PropTypes.bool,
  mapMarkers: PropTypes.array,
  markerTypes: PropTypes.array,
  selectedMarkerTypes: PropTypes.array,
  onMarkerTypeToggle: PropTypes.func,
  onlineOnly: PropTypes.bool,
  onOnlineOnlyChange: PropTypes.func,
  selectedMarker: PropTypes.object,
  onCloseMarker: PropTypes.func,
  onViewDetails: PropTypes.func,
  onLocateRegion: PropTypes.func,
  isMapFullscreen: PropTypes.bool,
  onToggleFullscreen: PropTypes.func,
  tourStopIndex: PropTypes.number,
  tourStopTotal: PropTypes.number,
  snapshot: PropTypes.object,
  geoFilter: PropTypes.object,
  onGeoFilterChange: PropTypes.func,
};
