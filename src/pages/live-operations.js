import Head from "next/head";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import BellIcon from "@heroicons/react/24/solid/BellIcon";
import MagnifyingGlassIcon from "@heroicons/react/24/solid/MagnifyingGlassIcon";
import ArrowsPointingOutIcon from "@heroicons/react/24/solid/ArrowsPointingOutIcon";
import ArrowsPointingInIcon from "@heroicons/react/24/solid/ArrowsPointingInIcon";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import BaseLayout from "../layouts/BaseLayout";
import Loader from "../components/Loader";
import LiveOpsMapOverlays from "../components/live-ops/live-ops-map-overlays";
import LiveOpsRightPanel from "../components/live-ops/live-ops-right-panel";
import LiveOpsStatsBar from "../components/live-ops/live-ops-stats-bar";
import { getLiveOpsSnapshot } from "../Services/liveOps.service";
import {
  applyLiveOpsSocketEvent,
  connectLiveOpsSocket,
  mergeLiveOpsSnapshot,
} from "../Services/liveOpsSocket";
import { OverviewRideAnalytics } from "../sections/overview/overview-ride-analytics";
import { OverviewRideStatus } from "../sections/overview/overview-ride-status";
import { loadDashboardAnalytics } from "../utils/dashboardUtils";
import { useLiveOpsUi } from "../contexts/live-ops-ui-context";
import { parseCoordinateQuery } from "../utils/googleMaps";
import { filterMarkersNearLocation } from "../hooks/useSmoothLiveOpsMarkers";
import { toast } from "react-toastify";

const LiveOpsMap = dynamic(() => import("../components/live-ops/live-ops-map"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        color: "text.secondary",
      }}
    >
      Loading map…
    </Box>
  ),
});

const SIDE_NAV_WIDTH = 280;
const TOP_NAV_HEIGHT = 64;
const STOP_TOUR_DELAY_MS = 2200;

const DEFAULT_CATEGORIES = [
  "rides",
  "food",
  "senior_care",
  "transportation",
  "contractors",
  "babysitting",
  "cleaning",
  "pet_care",
  "other",
];

function resolveBookingStops(item, markers = []) {
  if (Array.isArray(item?.stops) && item.stops.length) {
    return item.stops.filter(
      (stop) => Number.isFinite(Number(stop?.lat)) && Number.isFinite(Number(stop?.lng))
    );
  }

  const marker = markers.find((entry) => entry.id === item?.id);
  if (Array.isArray(marker?.stops) && marker.stops.length) {
    return marker.stops.filter(
      (stop) => Number.isFinite(Number(stop?.lat)) && Number.isFinite(Number(stop?.lng))
    );
  }

  const fromLocation =
    parseCoordinateQuery(item?.location) || parseCoordinateQuery(marker?.subtitle);
  const lat = Number(item?.lat ?? marker?.lat ?? fromLocation?.lat);
  const lng = Number(item?.lng ?? marker?.lng ?? fromLocation?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return [{ lat, lng, label: item?.location || marker?.title || "Location", kind: "location" }];
  }

  return [];
}

const Page = () => {
  const router = useRouter();
  const { isMapFullscreen, setMapFullscreen } = useLiveOpsUi();
  const [isLogin, setIsLogin] = useState(null);
  const [viewMode, setViewMode] = useState("map");
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState(null);
  const [feedFilter, setFeedFilter] = useState("all");
  const [region, setRegion] = useState("all");
  const [selectedCategories, setSelectedCategories] = useState(DEFAULT_CATEGORIES);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [mapViewCenter, setMapViewCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [fitToMarkers, setFitToMarkers] = useState(true);
  const [locating, setLocating] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [clock, setClock] = useState("");
  const [tourStopIndex, setTourStopIndex] = useState(null);
  const [tourStopTotal, setTourStopTotal] = useState(0);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const tourTimerRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const socketApiRef = useRef(null);

  const clearLocationTour = useCallback(() => {
    if (tourTimerRef.current) {
      clearTimeout(tourTimerRef.current);
      tourTimerRef.current = null;
    }
    setTourStopIndex(null);
    setTourStopTotal(0);
  }, []);

  const loadSnapshot = useCallback(async () => {
    try {
      const categoriesParam =
        selectedCategories.length === DEFAULT_CATEGORIES.length
          ? "all"
          : selectedCategories.join(",");

      const response = await getLiveOpsSnapshot({
        region,
        categories: categoriesParam,
        onlineOnly,
      });

      if (response?.status && response?.data) {
        setSnapshot((prev) => mergeLiveOpsSnapshot(prev, response.data));
      }
    } catch (error) {
      console.error("Live ops snapshot failed:", error);
    } finally {
      setLoading(false);
    }
  }, [region, selectedCategories, onlineOnly]);

  useEffect(() => {
    const loginStatus =
      typeof window !== "undefined" ? JSON.parse(localStorage.getItem("isLogin")) : null;
    setIsLogin(loginStatus);
    if (!loginStatus) router.push("/auth/login");
  }, [router]);

  useEffect(() => {
    if (!isLogin) return undefined;
    loadSnapshot();

    // Fallback poll — slower when socket is connected
    const interval = setInterval(loadSnapshot, socketStatus === "connected" ? 60000 : 15000);
    return () => clearInterval(interval);
  }, [isLogin, loadSnapshot, socketStatus]);

  useEffect(() => {
    if (!isLogin || viewMode !== "map") return undefined;

    const scheduleSoftRefresh = () => {
      if (refreshTimerRef.current) return;
      refreshTimerRef.current = setTimeout(() => {
        refreshTimerRef.current = null;
        loadSnapshot();
      }, 800);
    };

    const connection = connectLiveOpsSocket({
      region,
      onConnectionChange: setSocketStatus,
      onEvent: (eventName, payload) => {
        if (eventName === "live-ops:refresh") {
          scheduleSoftRefresh();
          return;
        }

        setSnapshot((prev) => {
          const next = applyLiveOpsSocketEvent(prev, eventName, payload);

          if (
            (eventName === "live-ops:driver.location" ||
              eventName === "live-ops:marker.upsert") &&
            (payload?.marker?.id || payload?.id || payload?.authId)
          ) {
            const liveId =
              payload?.marker?.id ||
              payload?.id ||
              (payload?.authId ? `driver-online-${payload.authId}` : null);
            setSelectedMarker((current) => {
              if (!current || !liveId || current.id !== liveId) return current;
              const lat = Number(payload?.marker?.lat ?? payload?.lat);
              const lng = Number(payload?.marker?.lng ?? payload?.lng);
              return {
                ...current,
                ...(payload.marker || {}),
                lat: Number.isFinite(lat) ? lat : current.lat,
                lng: Number.isFinite(lng) ? lng : current.lng,
              };
            });
          }

          return next;
        });
      },
    });

    socketApiRef.current = connection;
    connection.syncNow?.();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      socketApiRef.current = null;
      connection?.disconnect?.();
    };
  }, [isLogin, viewMode, loadSnapshot]);

  useEffect(() => {
    socketApiRef.current?.setRegion?.(region);
    socketApiRef.current?.syncNow?.();
  }, [region]);

  useEffect(() => {
    if (!isLogin || viewMode !== "analytics") return;
    loadDashboardAnalytics().then(setAnalytics).catch(console.error);
  }, [isLogin, viewMode]);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "America/Chicago",
        })
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => () => clearLocationTour(), [clearLocationTour]);

  const handleCategoryToggle = (key) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const regionCenter = useMemo(
    () => snapshot?.region?.center ?? { lat: 32.7767, lng: -96.797 },
    [snapshot]
  );

  const mapCenter = mapViewCenter ?? regionCenter;

  const handlePlaceSelect = useCallback(
    (place) => {
      clearLocationTour();
      setMapViewCenter({ lat: place.lat, lng: place.lng });
      setMapZoom(14);
      setFitToMarkers(false);
      setSelectedMarker(null);
      if (place.address) setLocationSearch(place.address);

      const nearby = filterMarkersNearLocation(snapshot?.markers ?? [], place, 30);
      const onlineNearby = nearby.filter((m) => m.type === "online_driver").length;
      const signupNearby = nearby.filter(
        (m) => m.type === "driver_signup" || m.type === "customer_signup"
      ).length;

      if (nearby.length) {
        toast.info(
          `${nearby.length} live items near here (${onlineNearby} online drivers, ${signupNearby} signups)`
        );
      } else {
        toast.info("No live signups or online drivers near this location yet.");
      }
    },
    [clearLocationTour, snapshot?.markers]
  );

  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        clearLocationTour();
        setUserLocation(next);
        setMapViewCenter(next);
        setMapZoom(15);
        setFitToMarkers(false);
        setSelectedMarker(null);
        setLocationSearch(`${next.lat.toFixed(5)}, ${next.lng.toFixed(5)}`);
        setLocating(false);
        toast.success("Centered map on your current location.");
      },
      (error) => {
        setLocating(false);
        toast.error(error.message || "Unable to get your current location.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [clearLocationTour]);

  const handleLocateRegion = useCallback(() => {
    clearLocationTour();
    setMapViewCenter(null);
    setMapZoom(null);
    setUserLocation(null);
    setFitToMarkers(true);
    setSelectedMarker(null);
    setLocationSearch("");
  }, [clearLocationTour]);

  const handleRegionChange = useCallback(
    (nextRegion) => {
      clearLocationTour();
      setRegion(nextRegion);
      setMapViewCenter(null);
      setMapZoom(null);
      setUserLocation(null);
      setFitToMarkers(true);
      setSelectedMarker(null);
      setLocationSearch("");
    },
    [clearLocationTour]
  );

  const startLocationTour = useCallback(
    (stops, sourceItem) => {
      clearLocationTour();
      if (!stops.length) {
        const isSignup =
          sourceItem?.type === "driver_signup" || sourceItem?.type === "customer_signup";
        toast.info(
          isSignup
            ? "No signup location available for this item."
            : "No map locations available for this booking."
        );
        return;
      }

      const markerMatch = (snapshot?.markers ?? []).find((entry) => entry.id === sourceItem?.id);
      setTourStopTotal(stops.length);

      const showStop = (index) => {
        const stop = stops[index];
        setTourStopIndex(index + 1);
        setMapViewCenter({ lat: Number(stop.lat), lng: Number(stop.lng) });
        setMapZoom(15);
        setFitToMarkers(false);
        setLocationSearch(stop.label || `${stop.lat}, ${stop.lng}`);
        setSelectedMarker({
          id: sourceItem?.id || markerMatch?.id || `tour-stop-${index}`,
          type: sourceItem?.type || markerMatch?.type || "ride_request",
          color: sourceItem?.color || markerMatch?.color || "blue",
          lat: Number(stop.lat),
          lng: Number(stop.lng),
          title:
            sourceItem?.detail ||
            sourceItem?.label ||
            markerMatch?.title ||
            "Booking",
          subtitle:
            sourceItem?.label ||
            `${stop.kind ? `${stop.kind}: ` : ""}${stop.label || "Location"}`,
          phone: sourceItem?.phone || markerMatch?.phone || "",
          stops,
        });

        if (index < stops.length - 1) {
          tourTimerRef.current = setTimeout(() => showStop(index + 1), STOP_TOUR_DELAY_MS);
        } else {
          tourTimerRef.current = setTimeout(() => {
            setTourStopIndex(null);
            setTourStopTotal(0);
          }, STOP_TOUR_DELAY_MS);
        }
      };

      showStop(0);
    },
    [clearLocationTour, snapshot?.markers]
  );

  const handleFeedItemClick = useCallback(
    (item) => {
      const stops = resolveBookingStops(item, snapshot?.markers ?? []);
      startLocationTour(stops, item);
    },
    [snapshot?.markers, startLocationTour]
  );

  const handleMarkerSelect = useCallback(
    (marker) => {
      const stops = resolveBookingStops(marker, snapshot?.markers ?? []);
      if (stops.length > 1) {
        startLocationTour(stops, marker);
        return;
      }
      clearLocationTour();
      setSelectedMarker(marker);
      if (marker?.lat != null && marker?.lng != null) {
        setMapViewCenter({ lat: marker.lat, lng: marker.lng });
        setMapZoom(15);
        setFitToMarkers(false);
      }
    },
    [clearLocationTour, snapshot?.markers, startLocationTour]
  );

  const toggleFullscreen = () => {
    setMapFullscreen(!isMapFullscreen);
  };

  if (isLogin === null) {
    return (
      <BaseLayout>
        <Loader />
      </BaseLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Live Operations | Highland Care Admin</title>
      </Head>

      <Box
        sx={{
          position: "fixed",
          top: {
            xs: isMapFullscreen ? 0 : TOP_NAV_HEIGHT,
            lg: 0,
          },
          left: {
            xs: 0,
            lg: isMapFullscreen ? 0 : SIDE_NAV_WIDTH,
          },
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          color: "text.primary",
          zIndex: isMapFullscreen ? 1400 : 1,
        }}
      >
        {!isMapFullscreen ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2.5,
              py: 1.25,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              flexShrink: 0,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: 16, md: 20 },
                  color: "text.primary",
                  letterSpacing: "0.04em",
                }}
              >
                LIVE OPERATIONS MAP
              </Typography>
              <Chip
                size="small"
                label={
                  socketStatus === "connected"
                    ? "● LIVE"
                    : socketStatus === "missing_url"
                      ? "○ SOCKET OFF"
                      : "○ CONNECTING"
                }
                sx={{
                  bgcolor:
                    socketStatus === "connected" ? "success.alpha12" : "warning.alpha12",
                  color: socketStatus === "connected" ? "success.dark" : "warning.dark",
                  fontWeight: 800,
                  fontSize: 11,
                  height: 24,
                  animation: socketStatus === "connected" ? "pulse 2s infinite" : "none",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.55 },
                  },
                }}
              />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: 13,
                  display: { xs: "none", md: "block" },
                }}
              >
                {clock}
              </Typography>
              <Box
                sx={{
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: "10px",
                  bgcolor: "neutral.50",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <MagnifyingGlassIcon width={16} style={{ color: "currentColor", opacity: 0.55 }} />
                <Typography sx={{ color: "text.secondary", fontSize: 12 }}>Search</Typography>
              </Box>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  bgcolor: "neutral.50",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid",
                  borderColor: "divider",
                  color: "text.secondary",
                }}
              >
                <BellIcon width={18} />
              </Box>
              <Tooltip title="Full screen map">
                <IconButton
                  onClick={toggleFullscreen}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "10px",
                    color: "primary.main",
                  }}
                >
                  <ArrowsPointingOutIcon width={18} />
                </IconButton>
              </Tooltip>
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={() => setViewMode("map")}
                  sx={{
                    px: 2,
                    color: viewMode === "map" ? "primary.contrastText" : "text.secondary",
                    bgcolor: viewMode === "map" ? "primary.main" : "transparent",
                    borderColor: "divider",
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: viewMode === "map" ? "primary.dark" : "action.hover",
                    },
                  }}
                >
                  Map View
                </Button>
                {/* <Button
                  onClick={() => setViewMode("analytics")}
                  sx={{
                    px: 2,
                    color: viewMode === "analytics" ? "primary.contrastText" : "text.secondary",
                    bgcolor: viewMode === "analytics" ? "primary.main" : "transparent",
                    borderColor: "divider",
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": {
                      bgcolor: viewMode === "analytics" ? "primary.dark" : "action.hover",
                    },
                  }}
                >
                  Analytics View
                </Button> */}
              </ButtonGroup>
            </Stack>
          </Stack>
        ) : null}

        {viewMode === "map" ? (
          <>
            <Box sx={{ flex: 1, display: "flex", minHeight: 0 }}>
              <Box sx={{ flex: 1, position: "relative", minWidth: 0 }}>
                {loading && !snapshot ? (
                  <Loader minHeight="100%" />
                ) : (
                  <>
                    <LiveOpsMap
                      center={mapCenter}
                      zoom={snapshot?.region?.zoom ?? 11}
                      markers={snapshot?.markers ?? []}
                      selectedMarker={selectedMarker}
                      showTraffic={showTraffic}
                      userLocation={userLocation}
                      fitToMarkers={fitToMarkers}
                      mapZoom={mapZoom}
                      onMarkerSelect={handleMarkerSelect}
                    />
                    <LiveOpsMapOverlays
                      legend={snapshot?.legend}
                      locationSearch={locationSearch}
                      onLocationSearchChange={setLocationSearch}
                      onPlaceSelect={handlePlaceSelect}
                      onCurrentLocation={handleCurrentLocation}
                      locating={locating}
                      region={region}
                      regionOptions={snapshot?.region?.options ?? [{ key: "dfw", label: "DFW" }]}
                      onRegionChange={handleRegionChange}
                      categories={snapshot?.categories ?? []}
                      selectedCategories={selectedCategories}
                      onCategoryToggle={handleCategoryToggle}
                      onlineOnly={onlineOnly}
                      onOnlineOnlyChange={setOnlineOnly}
                      showTraffic={showTraffic}
                      onShowTrafficChange={setShowTraffic}
                      selectedMarker={selectedMarker}
                      onCloseMarker={() => {
                        clearLocationTour();
                        setSelectedMarker(null);
                      }}
                      onLocateRegion={handleLocateRegion}
                      isMapFullscreen={isMapFullscreen}
                      onToggleFullscreen={toggleFullscreen}
                      tourStopIndex={tourStopIndex}
                      tourStopTotal={tourStopTotal}
                    />
                    {isMapFullscreen ? (
                      <Tooltip title="Exit full screen">
                        <IconButton
                          onClick={toggleFullscreen}
                          sx={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            zIndex: 1200,
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            color: "primary.main",
                            boxShadow: 2,
                            "&:hover": { bgcolor: "neutral.50" },
                          }}
                        >
                          <ArrowsPointingInIcon width={20} />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </>
                )}
              </Box>

              {!isMapFullscreen ? (
                <LiveOpsRightPanel
                  feed={snapshot?.feed ?? []}
                  stats={snapshot?.stats}
                  filter={feedFilter}
                  onFilterChange={setFeedFilter}
                  onFeedItemClick={handleFeedItemClick}
                />
              ) : null}
            </Box>

            {!isMapFullscreen ? <LiveOpsStatsBar stats={snapshot?.stats} /> : null}
          </>
        ) : (
          <Box sx={{ p: 3, flex: 1, overflow: "auto", bgcolor: "background.default" }}>
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ color: "text.primary", fontWeight: 700 }}>
                Platform Analytics
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                <Box sx={{ flex: 1, minHeight: 320 }}>
                  <OverviewRideAnalytics
                    chartSeries={analytics?.monthly?.series ?? []}
                    categories={analytics?.monthly?.categories ?? []}
                    loading={!analytics}
                  />
                </Box>
                <Box sx={{ flex: 1, minHeight: 320 }}>
                  <OverviewRideStatus
                    labels={analytics?.statusDistribution?.labels ?? []}
                    series={analytics?.statusDistribution?.values ?? []}
                    loading={!analytics}
                  />
                </Box>
              </Stack>
            </Stack>
          </Box>
        )}
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
