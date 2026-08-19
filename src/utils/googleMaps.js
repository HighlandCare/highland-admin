export function getGoogleMapsApiKey() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    ""
  );
}

export function getServerGoogleMapsApiKey() {
  return (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    ""
  );
}

export const DEFAULT_MAP_CENTER = { lat: 39.8283, lng: -98.5795 };
/** Continental United States overview */
export const DEFAULT_MAP_ZOOM = 4;

/** Map only — Places runs through /api/maps/* routes */
export const GOOGLE_MAP_LIBRARIES = [];

/** Light theme aligned with Highland admin palette */
export const LIVE_OPS_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#f8fafb" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4d5761" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#111927" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ visibility: "on", color: "#e6f4f5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d2d6db" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dcecee" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#b8dde0" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit.station",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#b8dde0" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#00828A" }],
  },
];

export const MARKER_COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  blue: "#3b82f6",
  purple: "#a855f7",
  red: "#ef4444",
  orange: "#f97316",
};

/** Parse "lat, lng" or "lat lng" coordinate strings */
export function parseCoordinateQuery(query) {
  const match = String(query)
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}

/** Keep only markers with valid coordinates for Google Maps */
export function sanitizeLiveOpsMarkers(markers) {
  return (markers ?? [])
    .filter((marker) => {
      const lat = Number(marker?.lat);
      const lng = Number(marker?.lng);
      return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      );
    })
    .map((marker) => ({
      ...marker,
      lat: Number(marker.lat),
      lng: Number(marker.lng),
    }));
}

export function getMapsSetupHelp(origin) {
  const host = origin || "http://localhost:3001";
  return [
    `Add this URL to your Google API key HTTP referrers: ${host}/*`,
    "Also add: http://localhost:3000/* and your production admin domain.",
    "Enable: Maps JavaScript API, Places API, Geocoding API.",
    "Ensure billing is enabled on the Google Cloud project.",
    "If the key is restricted to Android/iOS only, create a separate Browser key for admin.",
  ];
}
