import { MARKER_COLORS } from "./googleMaps";

const TYPE_META = {
  customer_signup: { colorKey: "green", label: "Customer" },
  driver_signup: { colorKey: "yellow", label: "Driver signup" },
  online_driver: { colorKey: "orange", label: "Online driver" },
  ride_request: { colorKey: "blue", label: "Ride request" },
  food_order: { colorKey: "purple", label: "Food order" },
  emergency: { colorKey: "red", label: "Urgent" },
  dispute: { colorKey: "red", label: "Dispute" },
  chaperoneride: { colorKey: "blue", label: "Active ride" },
};

function markerShouldPulse(type) {
  return type === "online_driver" || type === "emergency" || type === "dispute";
}

export function resolveMarkerColor(type, colorKey) {
  if (type === "user_location") return "#7c3aed";
  const meta = TYPE_META[type];
  const key = colorKey || meta?.colorKey || "blue";
  return MARKER_COLORS[key] ?? MARKER_COLORS.blue;
}

function markerPixelSize(type) {
  if (type === "emergency" || type === "dispute") return 28;
  if (type === "user_location") return 26;
  return 24;
}

function glowSvgId(type, colorKey) {
  return `glow-${type || "marker"}-${colorKey || "default"}`.replace(/[^a-z0-9-]/gi, "");
}

export function svgToDataUrl(svg) {
  if (!svg) return "";
  const normalized = String(svg).replace(/\s+/g, " ").trim();

  if (typeof btoa !== "undefined") {
    try {
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(normalized)))}`;
    } catch (error) {
      // Fall through to URI encoding.
    }
  }

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(normalized)}`;
}

export function getGlowMarkerClassName(type, selected = false) {
  const classes = ["live-ops-glow-marker"];
  if (markerShouldPulse(type)) classes.push("is-pulse");
  if (selected) classes.push("is-selected");
  if (type === "user_location") classes.push("is-user");
  return classes.join(" ");
}

export function buildGlowMarkerHtml(type, colorKey, size) {
  const color = resolveMarkerColor(type, colorKey);
  const pixelSize = size || markerPixelSize(type);
  const pulseClass = markerShouldPulse(type) ? " is-pulse" : "";
  return `<span class="live-ops-glow-marker${pulseClass}" style="--marker-color:${color};width:${pixelSize}px;height:${pixelSize}px">
    <span class="live-ops-glow-marker__aura"></span>
    <span class="live-ops-glow-marker__halo"></span>
    <span class="live-ops-glow-marker__core"></span>
    <span class="live-ops-glow-marker__hotspot"></span>
  </span>`;
}

/** Soft glowing circle — native Google Maps + Leaflet fallback */
export function buildLiveOpsMarkerSvg(type, colorKey) {
  const fill = resolveMarkerColor(type, colorKey);
  const size = markerPixelSize(type);
  const gid = glowSvgId(type, colorKey);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
  <defs>
    <radialGradient id="${gid}-outer" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${fill}" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="${fill}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${fill}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${gid}-mid" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${fill}" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="${fill}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${fill}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="${gid}-core" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="${fill}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${fill}" stop-opacity="1"/>
    </radialGradient>
  </defs>
  <circle cx="24" cy="24" r="22" fill="url(#${gid}-outer)"/>
  <circle cx="24" cy="24" r="15" fill="url(#${gid}-mid)"/>
  <circle cx="24" cy="24" r="7.5" fill="url(#${gid}-core)" stroke="#ffffff" stroke-width="2.2" opacity="0.98"/>
  <circle cx="24" cy="24" r="2.8" fill="#ffffff" opacity="0.88"/>
</svg>`.trim();
}

export function getLiveOpsMarkerMeta(type) {
  return TYPE_META[type] ?? { colorKey: "blue", label: "Marker" };
}

/** @deprecated Numbered clusters removed — kept for compatibility */
export function buildClusterMarkerIcon() {
  return undefined;
}

/** Google Maps Marker icon descriptor */
export function buildGoogleMapsMarkerIcon(type, colorKey) {
  if (typeof window === "undefined" || !window.google?.maps) return undefined;

  const svg = buildLiveOpsMarkerSvg(type, colorKey);
  const size = markerPixelSize(type);
  const url = svgToDataUrl(svg);

  try {
    return {
      url,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2),
    };
  } catch (error) {
    return { url };
  }
}

/** Leaflet DivIcon HTML/config — pass L from leaflet */
export function buildLeafletMarkerIcon(L, type, colorKey, sizeOverride) {
  const size = sizeOverride || markerPixelSize(type);
  const html = buildGlowMarkerHtml(type, colorKey, size);

  return L.divIcon({
    className: "live-ops-leaflet-marker",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/** Tiny legend chip — glowing circle preview */
export function buildLegendIconSvg(type, size = 16) {
  const fill = resolveMarkerColor(type);
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="7.5" fill="${fill}" opacity="0.22"/>
  <circle cx="8" cy="8" r="5" fill="${fill}" opacity="0.45"/>
  <circle cx="8" cy="8" r="3" fill="${fill}" stroke="#fff" stroke-width="1.2"/>
  <circle cx="8" cy="8" r="1" fill="#fff" opacity="0.9"/>
</svg>`.trim();
}

export function buildLegendIconDataUrl(type, size = 16) {
  return svgToDataUrl(buildLegendIconSvg(type, size));
}

/** Separate markers that share the same coordinates so urgent/signup icons don't stack invisibly */
export function spreadOverlappingMarkers(markers = [], radiusMeters = 40) {
  if (!markers.length) return [];

  const groups = new Map();

  markers.forEach((marker) => {
    const lat = Number(marker.lat);
    const lng = Number(marker.lng);
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(marker);
  });

  const spread = [];

  groups.forEach((group) => {
    if (group.length === 1) {
      spread.push(group[0]);
      return;
    }

    const sorted = [...group].sort((a, b) => {
      const priority = (type) => {
        if (type === "emergency" || type === "dispute") return 0;
        if (type === "ride_request" || type === "food_order") return 1;
        if (type === "customer_signup" || type === "driver_signup") return 2;
        return 3;
      };
      return priority(a.type) - priority(b.type);
    });

    const angleStep = (2 * Math.PI) / sorted.length;
    const latRadius = radiusMeters / 111320;

    sorted.forEach((marker, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const lngRadius =
        radiusMeters / (111320 * Math.max(Math.cos((marker.lat * Math.PI) / 180), 0.2));

      spread.push({
        ...marker,
        lat: marker.lat + latRadius * Math.cos(angle),
        lng: marker.lng + lngRadius * Math.sin(angle),
      });
    });
  });

  return spread;
}
