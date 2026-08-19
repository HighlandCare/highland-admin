import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  GoogleMap,
  OverlayView,
  OverlayViewF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { Box, Stack, Typography } from "@mui/material";
import { brand } from "../../theme/colors";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  getGoogleMapsApiKey,
  GOOGLE_MAP_LIBRARIES,
  LIVE_OPS_MAP_STYLES,
} from "../../utils/googleMaps";
import { getRideRoutePoints } from "../../utils/rideUtils";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

const MARKER_COLORS = {
  pickup: "#22c55e",
  stop: "#0ea5e9",
  destination: "#ef4444",
};

const ROUTE_LINE = {
  clickable: false,
  geodesic: true,
  strokeColor: brand.primary,
  strokeOpacity: 1,
  strokeWeight: 6,
  zIndex: 3,
};

const toLatLngLiteral = (point) => ({ lat: Number(point.lat), lng: Number(point.lng) });

const hasMapCoords = (point) =>
  Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng));

const geocodeAddress = (geocoder, address) =>
  new Promise((resolve) => {
    if (!address) {
      resolve(null);
      return;
    }

    geocoder.geocode({ address }, (results, status) => {
      const location = results?.[0]?.geometry?.location;
      if (status === "OK" && location) {
        resolve({ lat: location.lat(), lng: location.lng() });
        return;
      }

      resolve(null);
    });
  });

const spreadStackedPoints = (points) => {
  const groups = new Map();

  points.forEach((point, index) => {
    const key = `${Number(point.lat).toFixed(5)},${Number(point.lng).toFixed(5)}`;
    const indexes = groups.get(key) || [];
    indexes.push(index);
    groups.set(key, indexes);
  });

  const next = points.map((point) => ({ ...point }));

  groups.forEach((indexes) => {
    if (indexes.length < 2) {
      return;
    }

    indexes.forEach((index, offset) => {
      const angle = (Math.PI * 2 * offset) / indexes.length;
      next[index] = {
        ...next[index],
        lat: next[index].lat + Math.cos(angle) * 0.0002,
        lng: next[index].lng + Math.sin(angle) * 0.0002,
      };
    });
  });

  return next;
};

const toPathPoint = (point) => {
  if (!point) {
    return null;
  }

  const lat = typeof point.lat === "function" ? point.lat() : Number(point.lat);
  const lng = typeof point.lng === "function" ? point.lng() : Number(point.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
};

const extractDirectionsPath = (result) => {
  const route = result?.routes?.[0];
  if (!route) {
    return [];
  }

  if (Array.isArray(route.overview_path) && route.overview_path.length) {
    return route.overview_path.map(toPathPoint).filter(Boolean);
  }

  return (route.legs || []).flatMap((leg) =>
    (leg.steps || []).flatMap((step) => (step.path || []).map(toPathPoint).filter(Boolean))
  );
};

const requestDrivingLeg = (service, origin, destination) =>
  new Promise((resolve) => {
    service.route(
      {
        destination,
        origin,
        provideRouteAlternatives: false,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        resolve(status === "OK" ? extractDirectionsPath(result) : [origin, destination]);
      }
    );
  });

const getMarkerLetter = (point) => {
  if (point.role === "pickup") {
    return "P";
  }

  if (point.role === "destination") {
    return "D";
  }

  return String(point.label.replace(/\D/g, "") || "S");
};

const buildRoutePinSvg = (color, letter) => `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
  <path d="M18 2C10.3 2 4 8.3 4 16.1c0 10.6 14 29.4 14 29.4s14-18.8 14-29.4C32 8.3 25.7 2 18 2z" fill="${color}" stroke="#ffffff" stroke-width="2.2"/>
  <circle cx="18" cy="16" r="8.2" fill="#ffffff"/>
  <text x="18" y="20.4" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" font-weight="700" fill="${color}">${letter}</text>
</svg>`.trim();

const LegendDot = ({ color, label }) => (
  <Stack alignItems="center" direction="row" spacing={0.75}>
    <Box
      sx={{
        bgcolor: color,
        border: "2px solid #fff",
        borderRadius: "50% 50% 50% 0",
        boxShadow: "0 0 0 1px rgba(17, 25, 39, 0.12)",
        height: 12,
        transform: "rotate(-45deg)",
        width: 12,
      }}
    />
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
  </Stack>
);

LegendDot.propTypes = {
  color: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

const RoutePinMarker = ({ point, hovered, onHover, onLeave }) => {
  const color = MARKER_COLORS[point.role] || MARKER_COLORS.stop;
  const letter = getMarkerLetter(point);
  const svg = useMemo(() => buildRoutePinSvg(color, letter), [color, letter]);
  const zIndex = point.role === "destination" ? 4 : point.role === "pickup" ? 3 : 2;

  const getPixelPositionOffset = useCallback(
    (width, height) => ({
      x: -(width / 2),
      y: -height,
    }),
    []
  );

  return (
    <OverlayViewF
      getPixelPositionOffset={getPixelPositionOffset}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      position={{ lat: point.lat, lng: point.lng }}
      zIndex={hovered ? 20 : zIndex}
    >
      <Box
        onMouseEnter={() => onHover(point)}
        onMouseLeave={onLeave}
        sx={{
          cursor: "pointer",
          filter: "drop-shadow(0 4px 8px rgba(15, 23, 42, 0.28))",
          height: 48,
          lineHeight: 0,
          position: "relative",
          width: 36,
          "& svg": { display: "block" },
        }}
      >
        {hovered ? (
          <Box
            sx={{
              bgcolor: "rgba(17, 25, 39, 0.94)",
              borderRadius: "10px",
              bottom: "calc(100% + 8px)",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.28)",
              left: "50%",
              maxWidth: 280,
              minWidth: 168,
              pointerEvents: "none",
              position: "absolute",
              px: 1.25,
              py: 0.9,
              transform: "translateX(-50%)",
              whiteSpace: "normal",
              zIndex: 2,
            }}
          >
            <Typography
              sx={{ color: "#fff", display: "block", fontWeight: 700, lineHeight: 1.3 }}
              variant="caption"
            >
              {point.label}
            </Typography>
            <Typography
              sx={{ color: "rgba(255,255,255,0.9)", display: "block", lineHeight: 1.4, mt: 0.25 }}
              variant="caption"
            >
              {point.address || "Location recorded for this stop"}
            </Typography>
          </Box>
        ) : null}
        <Box dangerouslySetInnerHTML={{ __html: svg }} />
      </Box>
    </OverlayViewF>
  );
};

RoutePinMarker.propTypes = {
  hovered: PropTypes.bool,
  onHover: PropTypes.func.isRequired,
  onLeave: PropTypes.func.isRequired,
  point: PropTypes.shape({
    address: PropTypes.string,
    label: PropTypes.string,
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired,
    role: PropTypes.string,
  }).isRequired,
};

export function RideRouteMap({ ride }) {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mappedPoints, setMappedPoints] = useState([]);
  const [authFailed, setAuthFailed] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const apiKey = getGoogleMapsApiKey();
  const points = useMemo(() => getRideRoutePoints(ride), [ride]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "highland-live-ops-map",
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAP_LIBRARIES,
  });

  const mapCenter = useMemo(() => {
    const first = mappedPoints.find(hasMapCoords) || points.find(hasMapCoords);
    if (!first) {
      return DEFAULT_MAP_CENTER;
    }

    return { lat: Number(first.lat), lng: Number(first.lng) };
  }, [mappedPoints, points]);

  useEffect(() => {
    window.gm_authFailure = () => setAuthFailed(true);
    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  useEffect(() => {
    const known = spreadStackedPoints(points.filter(hasMapCoords));
    setMappedPoints(known);

    if (!isLoaded || !window.google?.maps || !points.length) {
      return undefined;
    }

    let active = true;
    const geocoder = new window.google.maps.Geocoder();

    const resolvePoints = async () => {
      const resolved = [];

      for (const point of points) {
        if (hasMapCoords(point)) {
          resolved.push({ ...point, lat: Number(point.lat), lng: Number(point.lng) });
          continue;
        }

        const geocoded = await geocodeAddress(geocoder, point.address);
        if (!active) {
          return;
        }

        if (geocoded) {
          resolved.push({ ...point, ...geocoded });
        }
      }

      if (active) {
        setMappedPoints(spreadStackedPoints(resolved));
      }
    };

    resolvePoints();

    return () => {
      active = false;
    };
  }, [isLoaded, points]);

  useEffect(() => {
    if (!mapInstance || !window.google?.maps || mappedPoints.length < 2) {
      return undefined;
    }

    const straightPath = mappedPoints.map(toLatLngLiteral);
    const line = new window.google.maps.Polyline({
      ...ROUTE_LINE,
      map: mapInstance,
      path: straightPath,
    });

    let active = true;
    const service = new window.google.maps.DirectionsService();

    const buildDrivingPath = async () => {
      const merged = [];

      for (let index = 0; index < mappedPoints.length - 1; index += 1) {
        const origin = toLatLngLiteral(mappedPoints[index]);
        const destination = toLatLngLiteral(mappedPoints[index + 1]);
        const segment = await requestDrivingLeg(service, origin, destination);

        if (!active) {
          return;
        }

        if (!merged.length) {
          merged.push(...segment);
        } else if (segment.length > 1) {
          merged.push(...segment.slice(1));
        }
      }

      if (active && merged.length > 1) {
        line.setPath(merged);
      }
    };

    buildDrivingPath();

    return () => {
      active = false;
      line.setMap(null);
    };
  }, [mapInstance, mappedPoints]);

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    setMapInstance(map);

    if (!window.google?.maps || !mappedPoints.length) {
      return;
    }

    if (mappedPoints.length === 1) {
      map.setCenter(mappedPoints[0]);
      map.setZoom(14);
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    mappedPoints.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }));
    map.fitBounds(bounds, 56);
  }, [mappedPoints]);

  useEffect(() => {
    if (mapRef.current) {
      handleMapLoad(mapRef.current);
    }
  }, [handleMapLoad]);

  if (!points.length) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "neutral.50",
          border: "1px solid",
          borderColor: "neutral.200",
          borderRadius: 2,
          display: "flex",
          height: 360,
          justifyContent: "center",
          px: 2,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          No map locations were recorded for this ride.
        </Typography>
      </Box>
    );
  }

  if (!apiKey || loadError || authFailed) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "neutral.50",
          border: "1px solid",
          borderColor: "neutral.200",
          borderRadius: 2,
          display: "flex",
          height: 360,
          justifyContent: "center",
          px: 2,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          Map could not be loaded. Check the Google Maps API key.
        </Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        sx={{
          alignItems: "center",
          bgcolor: "neutral.50",
          border: "1px solid",
          borderColor: "neutral.200",
          borderRadius: 2,
          display: "flex",
          height: 360,
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary" variant="body2">
          Loading map…
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          border: "1px solid",
          borderColor: "neutral.200",
          borderRadius: 2,
          height: { xs: 280, md: 380 },
          overflow: "hidden",
        }}
      >
        <GoogleMap
          center={mapCenter}
          mapContainerStyle={MAP_CONTAINER_STYLE}
          onLoad={handleMapLoad}
          options={{
            clickableIcons: false,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            styles: LIVE_OPS_MAP_STYLES,
          }}
          zoom={DEFAULT_MAP_ZOOM}
        >
          {mappedPoints.map((point, index) => (
            <RoutePinMarker
              key={`${point.role}-${point.sequence ?? index}-${index}`}
              hovered={hoveredPoint === point}
              onHover={setHoveredPoint}
              onLeave={() => setHoveredPoint(null)}
              point={point}
            />
          ))}
        </GoogleMap>
      </Box>
      <Stack direction="row" flexWrap="wrap" spacing={2} sx={{ mt: 1.25, px: 0.5 }}>
        <LegendDot color={MARKER_COLORS.pickup} label="Pickup" />
        {mappedPoints.some((point) => point.role === "stop") ? (
          <LegendDot color={MARKER_COLORS.stop} label="Stop" />
        ) : null}
        <LegendDot color={MARKER_COLORS.destination} label="Destination" />
      </Stack>
    </Box>
  );
}

RideRouteMap.propTypes = {
  ride: PropTypes.object,
};
