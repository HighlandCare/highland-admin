import Head from "next/head";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  Stack,
  Typography,
} from "@mui/material";
import UsersIcon from "@heroicons/react/24/solid/UsersIcon";
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
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, parseCoordinateQuery } from "../utils/googleMaps";
import {
  enrichLiveOpsItem,
  resolveLiveOpsDetailPath,
  resolveLiveOpsListPath,
} from "../utils/liveOpsNavigation";
import { storeDisputeDetail } from "../utils/disputeUtils";
import { storeOrderDetailContext, storeRideDetail } from "../utils/rideUtils";
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

const MARKER_TYPE_FILTERS = [
  { key: "customer_signup", label: "Customers" },
  { key: "driver_signup", label: "Drivers" },
  { key: "ride_request", label: "Pending rides" },
  { key: "food_order", label: "Food orders" },
  { key: "online_driver", label: "Online drivers" },
  { key: "emergency", label: "Urgent" },
];

const DEFAULT_MARKER_TYPES = MARKER_TYPE_FILTERS.map((item) => item.key);

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
  const [selectedMarkerTypes, setSelectedMarkerTypes] = useState(DEFAULT_MARKER_TYPES);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [mapViewCenter, setMapViewCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_MAP_ZOOM);
  const [userLocation, setUserLocation] = useState(null);
  const [fitToMarkers, setFitToMarkers] = useState(false);
  const [mapFitKey, setMapFitKey] = useState(0);
  const [locating, setLocating] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [clock, setClock] = useState("");
  const [tourStopIndex, setTourStopIndex] = useState(null);
  const [tourStopTotal, setTourStopTotal] = useState(0);
  const [isSignupsOpen, setIsSignupsOpen] = useState(false);
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
      const response = await getLiveOpsSnapshot({
        region,
        categories: "all",
        onlineOnly: false,
      });

      if (response?.status && response?.data) {
        setSnapshot((prev) => mergeLiveOpsSnapshot(prev, response.data));
      }
    } catch (error) {
      console.error("Live ops snapshot failed:", error);
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    const loginStatus =
      typeof window !== "undefined" ? JSON.parse(localStorage.getItem("isLogin")) : null;
    setIsLogin(loginStatus);
    if (!loginStatus) router.push("/auth/login");
  }, [router]);

  useEffect(() => {
    if (!isLogin) return undefined;
    loadSnapshot();

    const interval = setInterval(loadSnapshot, 4000);
    return () => clearInterval(interval);
  }, [isLogin, loadSnapshot]);

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

  const handleMarkerTypeToggle = (key) => {
    setSelectedMarkerTypes((prev) => {
      if (prev.includes(key)) {
        // Keep at least one type selected so the map never looks "stuck empty" by accident.
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const filteredMarkers = useMemo(() => {
    const markers = snapshot?.markers ?? [];
    return markers.filter((marker) => {
      if (onlineOnly) {
        return marker.type === "online_driver" && marker.available !== false;
      }
      if (marker.type === "dispute") {
        return selectedMarkerTypes.includes("emergency") || selectedMarkerTypes.includes("dispute");
      }
      return selectedMarkerTypes.includes(marker.type);
    });
  }, [snapshot?.markers, selectedMarkerTypes, onlineOnly]);

  const filteredLegend = useMemo(() => {
    const counts = {
      customer_signup: 0,
      driver_signup: 0,
      ride_request: 0,
      food_order: 0,
      online_driver: 0,
      emergency: 0,
    };
    filteredMarkers.forEach((marker) => {
      if (Object.prototype.hasOwnProperty.call(counts, marker.type)) {
        counts[marker.type] += 1;
      }
    });
    return counts;
  }, [filteredMarkers]);

  useEffect(() => {
    if (!selectedMarker) return;
    const stillVisible = filteredMarkers.some((marker) => marker.id === selectedMarker.id);
    if (!stillVisible) setSelectedMarker(null);
  }, [filteredMarkers, selectedMarker]);

  const regionCenter = useMemo(
    () => snapshot?.region?.center ?? DEFAULT_MAP_CENTER,
    [snapshot]
  );

  const mapCenter = mapViewCenter ?? regionCenter;

  const handlePlaceSelect = useCallback(
    (place) => {
      clearLocationTour();
      setMapViewCenter({ lat: place.lat, lng: place.lng });
      setMapZoom(place.marker ? 15 : 14);
      setFitToMarkers(false);
      if (place.address) setLocationSearch(place.address);

      if (place.marker) {
        setSelectedMarker(place.marker);
        return;
      }

      setSelectedMarker(null);

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

  const requestFitToMarkers = useCallback(() => {
    setFitToMarkers(true);
    setMapFitKey((key) => key + 1);
  }, []);

  const handleMapFitComplete = useCallback(() => {
    setFitToMarkers(false);
  }, []);

  const handleLocateRegion = useCallback(() => {
    clearLocationTour();
    setMapViewCenter(DEFAULT_MAP_CENTER);
    setMapZoom(DEFAULT_MAP_ZOOM);
    setFitToMarkers(false);
    setUserLocation(null);
    setSelectedMarker(null);
    setLocationSearch("");
  }, [clearLocationTour]);

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
          authId: sourceItem?.authId || markerMatch?.authId,
          userId: sourceItem?.userId || markerMatch?.userId,
          customerId: sourceItem?.customerId || markerMatch?.customerId,
          driverId: sourceItem?.driverId || markerMatch?.driverId,
          chaperoneId: sourceItem?.chaperoneId || markerMatch?.chaperoneId,
          rideId: sourceItem?.rideId || markerMatch?.rideId,
          bookingId: sourceItem?.bookingId || markerMatch?.bookingId,
          orderId: sourceItem?.orderId || markerMatch?.orderId,
          disputeId: sourceItem?.disputeId || markerMatch?.disputeId,
          emergencyId: sourceItem?.emergencyId || markerMatch?.emergencyId,
          entityId: sourceItem?.entityId || markerMatch?.entityId,
          status: sourceItem?.status || markerMatch?.status,
          category: sourceItem?.category || markerMatch?.category,
          href: sourceItem?.href || markerMatch?.href,
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

  const handleViewDetails = useCallback(
    (marker) => {
      const enriched = enrichLiveOpsItem(marker, snapshot);
      const path = resolveLiveOpsDetailPath(enriched);
      if (!path || path === "#") {
        return;
      }

      const detailId = (() => {
        try {
          return new URL(path, "http://local").searchParams.get("id");
        } catch {
          return null;
        }
      })();

      if (path.startsWith("/disputes/")) {
        storeDisputeDetail({
          ...enriched,
          disputeId: detailId || enriched.disputeId || enriched.emergencyId,
          rideId: enriched.rideId || enriched.bookingId,
          key: detailId || enriched.disputeId || enriched.emergencyId || enriched.rideId,
        });
      } else if (path.startsWith("/orders/")) {
        storeOrderDetailContext({
          ...enriched,
          orderId: detailId || enriched.orderId || enriched.rideId,
          rideId: detailId || enriched.orderId || enriched.rideId,
          id: detailId || enriched.orderId || enriched.rideId,
          candidateIds: [
            detailId,
            enriched.orderId,
            enriched.rideId,
            enriched.bookingId,
          ].filter(Boolean),
        });
        storeRideDetail({
          ...enriched,
          rideId: detailId || enriched.orderId || enriched.rideId,
          orderId: detailId || enriched.orderId || enriched.rideId,
          _id: detailId || enriched.orderId || enriched.rideId,
        });
      } else if (path.startsWith("/ride-history/")) {
        storeRideDetail({
          ...enriched,
          rideId: detailId || enriched.rideId || enriched.bookingId || enriched.orderId,
          _id: detailId || enriched.rideId || enriched.bookingId || enriched.orderId,
        });
      }

      if (isMapFullscreen) {
        setMapFullscreen(false);
      }
      router.push(path);
    },
    [isMapFullscreen, router, setMapFullscreen, snapshot]
  );

  const handleViewAllSignups = useCallback(
    (filterKey) => {
      if (isMapFullscreen) {
        setMapFullscreen(false);
      }
      setIsSignupsOpen(false);
      router.push(resolveLiveOpsListPath(filterKey));
    },
    [isMapFullscreen, router, setMapFullscreen]
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
              px: { xs: 1.5, md: 2.5 },
              py: { xs: 1, md: 1.25 },
              gap: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              flexShrink: 0,
            }}
          >
            <Stack
              direction="row"
              spacing={{ xs: 0.75, md: 1.5 }}
              alignItems="center"
              sx={{ minWidth: 0 }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: 14, sm: 16, md: 20 },
                  color: "text.primary",
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                }}
              >
                LIVE OPERATIONS
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  {" MAP"}
                </Box>
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={{ xs: 0.75, md: 2 }}
              alignItems="center"
              sx={{ flexShrink: 0 }}
            >
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: 13,
                  display: { xs: "none", lg: "block" },
                }}
              >
                {clock}
              </Typography>
              <Button
                onClick={() => setIsSignupsOpen(true)}
                aria-label="Open live signups"
                variant="outlined"
                sx={{
                  display: { xs: "inline-flex", lg: "none" },
                  minWidth: 40,
                  px: { xs: 1, sm: 1.5 },
                  py: 0.75,
                  borderColor: "divider",
                  borderRadius: "10px",
                  color: "primary.main",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                <UsersIcon width={18} />
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" }, ml: 0.75, fontSize: 13 }}
                >
                  Live Signups
                </Box>
              </Button>
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
                      zoom={mapZoom ?? snapshot?.region?.zoom ?? DEFAULT_MAP_ZOOM}
                      markers={filteredMarkers}
                      selectedMarker={selectedMarker}
                      userLocation={userLocation}
                      fitToMarkers={fitToMarkers}
                      mapFitKey={mapFitKey}
                      mapZoom={mapZoom}
                      onFitComplete={handleMapFitComplete}
                      onMarkerSelect={handleMarkerSelect}
                    />
                    <LiveOpsMapOverlays
                      legend={filteredLegend}
                      locationSearch={locationSearch}
                      onLocationSearchChange={setLocationSearch}
                      onPlaceSelect={handlePlaceSelect}
                      onCurrentLocation={handleCurrentLocation}
                      locating={locating}
                      mapMarkers={filteredMarkers}
                      markerTypes={MARKER_TYPE_FILTERS}
                      selectedMarkerTypes={selectedMarkerTypes}
                      onMarkerTypeToggle={handleMarkerTypeToggle}
                      onlineOnly={onlineOnly}
                      onOnlineOnlyChange={setOnlineOnly}
                      selectedMarker={selectedMarker}
                      onCloseMarker={() => {
                        clearLocationTour();
                        setSelectedMarker(null);
                      }}
                      onViewDetails={handleViewDetails}
                      onLocateRegion={handleLocateRegion}
                      isMapFullscreen={isMapFullscreen}
                      onToggleFullscreen={toggleFullscreen}
                      tourStopIndex={tourStopIndex}
                      tourStopTotal={tourStopTotal}
                    />
                  </>
                )}
              </Box>

              {!isMapFullscreen ? (
                <Box
                  sx={{
                    display: { xs: "none", lg: "flex" },
                    height: "100%",
                    minHeight: 0,
                    flexShrink: 0,
                  }}
                >
                  <LiveOpsRightPanel
                    feed={snapshot?.feed ?? []}
                    stats={snapshot?.stats}
                    filter={feedFilter}
                    onFilterChange={setFeedFilter}
                    onFeedItemClick={handleFeedItemClick}
                    onViewAllSignups={handleViewAllSignups}
                  />
                </Box>
              ) : null}
            </Box>

            <Drawer
              anchor="right"
              open={isSignupsOpen && !isMapFullscreen}
              onClose={() => setIsSignupsOpen(false)}
              PaperProps={{
                sx: {
                  width: "min(360px, 100vw)",
                  height: "100%",
                  maxHeight: "100%",
                  overflow: "hidden",
                },
              }}
            >
              <LiveOpsRightPanel
                mobile
                onClose={() => setIsSignupsOpen(false)}
                feed={snapshot?.feed ?? []}
                stats={snapshot?.stats}
                filter={feedFilter}
                onFilterChange={setFeedFilter}
                onFeedItemClick={(item) => {
                  setIsSignupsOpen(false);
                  handleFeedItemClick(item);
                }}
                onViewAllSignups={handleViewAllSignups}
              />
            </Drawer>

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
