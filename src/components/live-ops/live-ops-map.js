import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import dynamic from "next/dynamic";
import { GoogleMap, TrafficLayer, useJsApiLoader } from "@react-google-maps/api";
import { Box, Typography } from "@mui/material";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  getGoogleMapsApiKey,
  getMapsSetupHelp,
  GOOGLE_MAP_LIBRARIES,
  LIVE_OPS_MAP_STYLES,
  sanitizeLiveOpsMarkers,
} from "../../utils/googleMaps";
import {
  clusterLiveOpsMarkers,
  findZoomToSplit,
  markerDisplaySize,
} from "../../utils/liveOpsClusters";
import { useSmoothLiveOpsMarkers } from "../../hooks/useSmoothLiveOpsMarkers";
import LiveOpsHtmlMarker from "./live-ops-html-marker";
import LiveOpsClusterMarker from "./live-ops-cluster-marker";

const LiveOpsLeafletMap = dynamic(() => import("./live-ops-leaflet-map"), {
  ssr: false,
});

function FallbackNotice({ details }) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1100,
        px: 2,
        py: 1,
        borderRadius: "10px",
        bgcolor: "rgba(120, 53, 15, 0.92)",
        border: "1px solid rgba(251, 191, 36, 0.35)",
        maxWidth: "90%",
      }}
    >
      <Typography sx={{ color: "#fde68a", fontSize: 12, fontWeight: 700 }}>
        Using fallback map — Google Maps key is not authorized for this site.
      </Typography>
      <Typography sx={{ color: "#fcd34d", fontSize: 11, mt: 0.25 }}>
        {details[0]}
      </Typography>
    </Box>
  );
}

FallbackNotice.propTypes = {
  details: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default function LiveOpsMap({
  center,
  zoom,
  markers,
  selectedMarker,
  showTraffic,
  userLocation,
  fitToMarkers,
  mapFitKey = 0,
  mapZoom,
  onFitComplete,
  onMarkerSelect,
  onMapReady,
}) {
  const mapRef = useRef(null);
  const lastFitKeyRef = useRef(null);
  const lastCameraRef = useRef("");
  const zoomDebounceRef = useRef(null);
  const [authFailed, setAuthFailed] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [viewZoom, setViewZoom] = useState(zoom ?? mapZoom ?? DEFAULT_MAP_ZOOM);
  const [expandedIds, setExpandedIds] = useState([]);
  const apiKey = getGoogleMapsApiKey();

  const mergedMarkers = useMemo(() => {
    const base = sanitizeLiveOpsMarkers(markers);
    const selectedLat = Number(selectedMarker?.lat);
    const selectedLng = Number(selectedMarker?.lng);
    if (
      !selectedMarker?.id ||
      !Number.isFinite(selectedLat) ||
      !Number.isFinite(selectedLng)
    ) {
      return base;
    }

    // Keep the spread position if this marker was already placed, otherwise use raw coords.
    const existing = base.find((marker) => marker.id === selectedMarker.id);
    const withoutDup = base.filter((marker) => marker.id !== selectedMarker.id);

    return [
      ...withoutDup,
      {
        ...selectedMarker,
        ...(existing || {}),
        lat: existing?.lat ?? selectedLat,
        lng: existing?.lng ?? selectedLng,
        type: selectedMarker.type || existing?.type || "driver_signup",
        color: selectedMarker.color || existing?.color || "yellow",
        title:
          selectedMarker.title ||
          selectedMarker.label ||
          existing?.title ||
          "Selected",
      },
    ];
  }, [markers, selectedMarker]);

  const safeMarkers = useSmoothLiveOpsMarkers(mergedMarkers);
  const expandedIdSet = useMemo(() => new Set(expandedIds), [expandedIds]);

  const clusteredItems = useMemo(
    () => clusterLiveOpsMarkers(safeMarkers, viewZoom, { expandedIds: expandedIdSet }),
    [expandedIdSet, safeMarkers, viewZoom]
  );

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

  const setupHelp = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return getMapsSetupHelp(origin);
  }, []);

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
    setViewZoom(Math.min(fittedZoom || 14, 14));
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
    setViewZoom(mapZoom);
    setExpandedIds([]);
  }, [fitToMarkers, isLoaded, mapCenter, mapZoom]);

  const handleClusterClick = useCallback((cluster) => {
    const map = mapRef.current;
    const members = cluster?.members || [];
    if (!map || !window.google?.maps || !members.length) return;

    if (members.length === 1) {
      onMarkerSelect?.(members[0]);
      return;
    }

    const currentZoom = map.getZoom() || viewZoom;
    const splitZoom = findZoomToSplit(members, currentZoom);

    if (splitZoom != null) {
      setExpandedIds([]);
      map.panTo({ lat: cluster.lat, lng: cluster.lng });
      map.setZoom(splitZoom);
      setViewZoom(splitZoom);
      return;
    }

    setExpandedIds(members.map((marker) => marker.id).filter(Boolean));
    map.panTo({ lat: cluster.lat, lng: cluster.lng });
  }, [onMarkerSelect, viewZoom]);

  useEffect(() => {
    if (loadError || authFailed) {
      setUseFallback(true);
    }
  }, [loadError, authFailed]);

  useEffect(() => {
    if (isLoaded) onMapReady?.(true);
  }, [isLoaded, onMapReady]);

  const googleUnavailable = !apiKey || useFallback || loadError || authFailed;

  if (googleUnavailable) {
    return (
      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
        {apiKey && (loadError || authFailed) ? (
          <FallbackNotice details={setupHelp} />
        ) : null}
        <LiveOpsLeafletMap
          center={mapCenter}
          zoom={zoom}
          mapZoom={mapZoom}
          markers={safeMarkers}
          showTraffic={showTraffic}
          userLocation={userLocation}
          fitToMarkers={fitToMarkers}
          mapFitKey={mapFitKey}
          onFitComplete={onFitComplete}
          onMarkerSelect={onMarkerSelect}
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
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={mapCenter}
        zoom={viewZoom}
        onLoad={(map) => {
          mapRef.current = map;
          setMapInstance(map);
          const initialZoom = map.getZoom();
          if (Number.isFinite(initialZoom)) setViewZoom(initialZoom);
          onMapReady?.(true);
        }}
        onZoomChanged={() => {
          const nextZoom = mapRef.current?.getZoom();
          if (!Number.isFinite(nextZoom)) return;
          if (zoomDebounceRef.current) clearTimeout(zoomDebounceRef.current);
          zoomDebounceRef.current = setTimeout(() => {
            setViewZoom((current) => {
              if (current !== nextZoom) {
                setExpandedIds((ids) => (ids.length ? [] : ids));
              }
              return current === nextZoom ? current : nextZoom;
            });
          }, 60);
        }}
        options={{
          styles: LIVE_OPS_MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.LEFT_BOTTOM,
          },
          gestureHandling: "greedy",
          backgroundColor: "#f8fafb",
          clickableIcons: false,
        }}
      >
        {showTraffic ? <TrafficLayer /> : null}

        {/* Overlay markers need a mounted map; gate on mapInstance */}
        {mapInstance
          ? clusteredItems.map((item) =>
              item.kind === "cluster" ? (
                <LiveOpsClusterMarker
                  key={item.id}
                  lat={item.lat}
                  lng={item.lng}
                  count={item.count}
                  members={item.members}
                  onClick={() => handleClusterClick(item)}
                />
              ) : (
                <LiveOpsHtmlMarker
                  key={item.marker.id || `${item.marker.lat}-${item.marker.lng}`}
                  lat={item.marker.lat}
                  lng={item.marker.lng}
                  type={item.marker.type}
                  color={item.marker.color}
                  size={markerDisplaySize(item.marker.type, viewZoom)}
                  selected={selectedMarker?.id === item.marker.id}
                  title={`${item.marker.title || ""}${
                    item.marker.subtitle ? ` — ${item.marker.subtitle}` : ""
                  }`}
                  onClick={() => onMarkerSelect?.(item.marker)}
                />
              )
            )
          : null}

        {mapInstance && userLocation?.lat != null && userLocation?.lng != null ? (
          <LiveOpsHtmlMarker
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
  selectedMarker: PropTypes.object,
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
  onMapReady: PropTypes.func,
};
