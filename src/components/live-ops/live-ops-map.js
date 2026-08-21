import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import dynamic from "next/dynamic";
import { GoogleMap, TrafficLayer, useJsApiLoader } from "@react-google-maps/api";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  getGoogleMapsApiKey,
  getLiveOpsMapBackground,
  getLiveOpsMapStyles,
  GOOGLE_MAP_LIBRARIES,
  sanitizeLiveOpsMarkers,
} from "../../utils/googleMaps";
import { liveOpsGlass } from "../../theme/live-ops-page-theme";
import { clusterLiveOpsMarkers } from "../../utils/liveOpsClusters";
import { useSmoothLiveOpsMarkers } from "../../hooks/useSmoothLiveOpsMarkers";
import { useLiveOpsUi } from "../../contexts/live-ops-ui-context";
import LiveOpsGlowMarker from "./live-ops-glow-marker";
import LiveOpsDemandHotspotsLayer from "./live-ops-demand-hotspots-layer";

const LiveOpsLeafletMap = dynamic(() => import("./live-ops-leaflet-map"), {
  ssr: false,
});

function MapEngineBadge({ engine, reason }) {
  const theme = useTheme();
  const glass = liveOpsGlass(theme);
  const isGoogle = engine === "google";

  return (
    <Box
      sx={{
        position: "absolute",
        top: { xs: 64, md: 68 },
        left: 16,
        zIndex: 1200,
        ...glass,
        px: 1.5,
        py: 0.75,
        display: "flex",
        alignItems: "center",
        gap: 1,
        maxWidth: "min(420px, calc(100% - 32px))",
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: isGoogle ? "#22c55e" : "#f59e0b",
          boxShadow: isGoogle
            ? "0 0 10px rgba(34,197,94,.55)"
            : "0 0 10px rgba(245,158,11,.55)",
        }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ color: "text.primary", fontSize: 12, fontWeight: 800, lineHeight: 1.2 }}>
          Active map: {isGoogle ? "Google Maps" : "Leaflet (fallback)"}
        </Typography>
        {reason ? (
          <Typography sx={{ color: "text.secondary", fontSize: 11, mt: 0.25, lineHeight: 1.3 }}>
            {reason}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}

MapEngineBadge.propTypes = {
  engine: PropTypes.oneOf(["google", "leaflet"]).isRequired,
  reason: PropTypes.string,
};

export default function LiveOpsMap({
  center,
  zoom,
  markers,
  hotspots = [],
  showHotspots = true,
  selectedMarker,
  selectedHotspot,
  showTraffic,
  userLocation,
  fitToMarkers,
  mapFitKey = 0,
  mapZoom,
  onFitComplete,
  onMarkerSelect,
  onHotspotSelect,
  onMapReady,
}) {
  const mapRef = useRef(null);
  const lastFitKeyRef = useRef(null);
  const lastCameraRef = useRef("");
  const { mapTheme } = useLiveOpsUi();
  const [authFailed, setAuthFailed] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const apiKey = getGoogleMapsApiKey();

  const safeMarkers = useSmoothLiveOpsMarkers(sanitizeLiveOpsMarkers(markers));
  const mapItems = useMemo(() => clusterLiveOpsMarkers(safeMarkers), [safeMarkers]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "highland-live-ops-map",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const mapCenter = useMemo(
    () => ({
      lat: center?.lat ?? DEFAULT_MAP_CENTER.lat,
      lng: center?.lng ?? DEFAULT_MAP_CENTER.lng,
    }),
    [center?.lat, center?.lng]
  );

  const initialZoom = zoom ?? mapZoom ?? DEFAULT_MAP_ZOOM;

  useEffect(() => {
    window.gm_authFailure = () => setAuthFailed(true);
    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  const fitMapToMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps || !safeMarkers.length) return false;

    const bounds = new window.google.maps.LatLngBounds();
    safeMarkers.forEach((marker) => {
      bounds.extend({ lat: marker.lat, lng: marker.lng });
    });
    map.fitBounds(bounds, 72);
    const fittedZoom = map.getZoom();
    if (Number.isFinite(fittedZoom) && fittedZoom > 14) {
      map.setZoom(14);
    }
    return true;
  }, [safeMarkers]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || !fitToMarkers || !safeMarkers.length) return;
    if (lastFitKeyRef.current === mapFitKey) return;

    lastFitKeyRef.current = mapFitKey;
    if (fitMapToMarkers()) {
      onFitComplete?.();
    }
  }, [fitMapToMarkers, fitToMarkers, isLoaded, mapFitKey, onFitComplete, safeMarkers.length]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || fitToMarkers || mapZoom == null) return;

    const map = mapRef.current;
    const cameraKey = `${mapCenter.lat},${mapCenter.lng},${mapZoom}`;
    if (lastCameraRef.current === cameraKey) return;
    lastCameraRef.current = cameraKey;

    map.panTo(mapCenter);
    map.setZoom(mapZoom);
  }, [fitToMarkers, isLoaded, mapCenter, mapZoom]);

  useEffect(() => {
    if (loadError || authFailed) {
      setUseFallback(true);
    }
  }, [loadError, authFailed]);

  useEffect(() => {
    if (isLoaded) onMapReady?.(true);
  }, [isLoaded, onMapReady]);

  const mapStyles = useMemo(() => getLiveOpsMapStyles(mapTheme), [mapTheme]);
  const mapBackground = getLiveOpsMapBackground(mapTheme);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setOptions({
      styles: mapStyles,
      backgroundColor: mapBackground,
    });
  }, [mapBackground, mapStyles]);

  const googleUnavailable = !apiKey || useFallback || loadError || authFailed;
  const leafletReason = !apiKey
    ? "Google Maps API key is missing"
    : authFailed
      ? "Google Maps key is not authorized for this site"
      : loadError
        ? "Google Maps failed to load"
        : "Google Maps unavailable";

  if (googleUnavailable) {
    return (
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        {/* <MapEngineBadge engine="leaflet" reason={leafletReason} /> */}
        <LiveOpsLeafletMap
          center={mapCenter}
          zoom={initialZoom}
          mapZoom={mapZoom}
          markers={safeMarkers}
          hotspots={hotspots}
          showHotspots={showHotspots}
          showTraffic={showTraffic}
          userLocation={userLocation}
          fitToMarkers={fitToMarkers}
          mapFitKey={mapFitKey}
          onFitComplete={onFitComplete}
          onMarkerSelect={onMarkerSelect}
          onHotspotSelect={onHotspotSelect}
        />
      </Box>
    );
  }

  if (!isLoaded) {
    return (
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
        Loading Google Maps…
      </Box>
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      {/* <MapEngineBadge engine="google" /> */}
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        defaultCenter={mapCenter}
        defaultZoom={initialZoom}
        onLoad={(map) => {
          mapRef.current = map;
          setMapInstance(map);
          onMapReady?.(true);
        }}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.LEFT_BOTTOM,
          },
          gestureHandling: "greedy",
          backgroundColor: mapBackground,
          clickableIcons: false,
        }}
      >
        {showTraffic ? <TrafficLayer /> : null}

        <LiveOpsDemandHotspotsLayer
          hotspots={hotspots}
          showHotspots={showHotspots}
          onHotspotSelect={onHotspotSelect}
        />

        {mapInstance
          ? mapItems.map((item) => (
              <LiveOpsGlowMarker
                key={item.marker.id || `${item.marker.lat}-${item.marker.lng}`}
                lat={item.lat ?? item.marker.lat}
                lng={item.lng ?? item.marker.lng}
                type={item.marker.type}
                color={item.marker.color}
                selected={selectedMarker?.id === item.marker.id}
                title={`${item.marker.title || ""}${
                  item.marker.subtitle ? ` — ${item.marker.subtitle}` : ""
                }`}
                onClick={() => onMarkerSelect?.(item.marker)}
              />
            ))
          : null}

        {mapInstance && userLocation?.lat != null && userLocation?.lng != null ? (
          <LiveOpsGlowMarker
            lat={userLocation.lat}
            lng={userLocation.lng}
            type="user_location"
            title="Your location"
          />
        ) : null}
      </GoogleMap>
    </Box>
  );
}

LiveOpsMap.propTypes = {
  center: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  zoom: PropTypes.number,
  markers: PropTypes.array,
  hotspots: PropTypes.array,
  showHotspots: PropTypes.bool,
  selectedMarker: PropTypes.object,
  selectedHotspot: PropTypes.object,
  showTraffic: PropTypes.bool,
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  fitToMarkers: PropTypes.bool,
  mapFitKey: PropTypes.number,
  mapZoom: PropTypes.number,
  onFitComplete: PropTypes.func,
  onMarkerSelect: PropTypes.func,
  onHotspotSelect: PropTypes.func,
  onMapReady: PropTypes.func,
};
