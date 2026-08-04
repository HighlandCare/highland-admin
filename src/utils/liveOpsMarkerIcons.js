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

/** Glyphs drawn in a 40×40 badge (same visual language as the legend chips) */
const BADGE_GLYPHS = {
  customer_signup: `
    <circle cx="20" cy="15" r="4.5" fill="#fff"/>
    <path d="M12 28c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>
  `,
  driver_signup: `
    <path d="M11 24h18v2.4c0 .8-.7 1.4-1.5 1.4h-1.2c-.2-1.2-1.2-2-2.4-2s-2.2.8-2.4 2h-4.8c-.2-1.2-1.2-2-2.4-2s-2.2.8-2.4 2h-1.2c-.8 0-1.5-.6-1.5-1.4V24z" fill="#fff"/>
    <path d="M12.5 24l1.8-5.6c.3-1 1.2-1.6 2.2-1.6h8.5c1 0 1.9.6 2.2 1.6l1.8 5.6H12.5z" fill="#fff"/>
    <circle cx="16" cy="27.5" r="1.6" fill="#111827"/>
    <circle cx="24" cy="27.5" r="1.6" fill="#111827"/>
  `,
  online_driver: `
    <path d="M10 23.5h20v2.6c0 .8-.7 1.4-1.5 1.4h-1.3c-.2-1.3-1.3-2.2-2.5-2.2s-2.3.9-2.5 2.2h-6c-.2-1.3-1.3-2.2-2.5-2.2s-2.3.9-2.5 2.2H11.5c-.8 0-1.5-.6-1.5-1.4v-2.6z" fill="#fff"/>
    <path d="M11.8 23.5l2-6c.3-1.1 1.3-1.8 2.4-1.8h9.6c1.1 0 2.1.7 2.4 1.8l2 6H11.8z" fill="#fff"/>
    <circle cx="16" cy="27" r="1.7" fill="#111827"/>
    <circle cx="24" cy="27" r="1.7" fill="#111827"/>
  `,
  ride_request: `
    <circle cx="20" cy="16" r="4" fill="none" stroke="#fff" stroke-width="2.6"/>
    <circle cx="20" cy="16" r="1.5" fill="#fff"/>
    <path d="M20 10v3M20 22v3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
  `,
  chaperoneride: `
    <circle cx="20" cy="16" r="4" fill="none" stroke="#fff" stroke-width="2.6"/>
    <circle cx="20" cy="16" r="1.5" fill="#fff"/>
  `,
  food_order: `
    <path d="M14 12v12M14 12c0-2 1.4-3.2 2.8-3.2M18 12v12M18 12c0-2 1.4-3.2 2.8-3.2M27 10.5v13M24 10.5h6c0 2.8-1.4 4.6-3 5.2v8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
  `,
  emergency: `
    <path d="M20 11l8.5 14.5H11.5L20 11z" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M20 17v4M20 23h.01" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
  `,
  dispute: `
    <path d="M20 11l8.5 14.5H11.5L20 11z" fill="none" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M20 17v4M20 23h.01" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
  `,
  user_location: `
    <circle cx="20" cy="20" r="5.5" fill="none" stroke="#fff" stroke-width="2.6"/>
    <circle cx="20" cy="20" r="2.2" fill="#fff"/>
    <path d="M20 11v3M20 26v3M11 20h3M26 20h3" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
  `,
  default: `
    <circle cx="20" cy="17" r="4" fill="none" stroke="#fff" stroke-width="2.6"/>
    <circle cx="20" cy="17" r="1.5" fill="#fff"/>
  `,
};

function glyphForType(type) {
  return BADGE_GLYPHS[type] || BADGE_GLYPHS.default;
}

function resolveColor(type, colorKey) {
  if (type === "user_location") return "#7c3aed";
  const meta = TYPE_META[type];
  const key = colorKey || meta?.colorKey || "blue";
  return MARKER_COLORS[key] ?? MARKER_COLORS.blue;
}

function markerPixelSize(type) {
  if (type === "emergency" || type === "dispute") return 48;
  if (type === "customer_signup" || type === "driver_signup") return 44;
  if (type === "online_driver") return 44;
  return 42;
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

/** Circle badge SVG — matches legend icons and renders reliably on Google Maps */
export function buildLiveOpsMarkerSvg(type, colorKey) {
  const fill = resolveColor(type, colorKey);
  const glyph = glyphForType(type);
  const size = markerPixelSize(type);
  const isUrgent = type === "emergency" || type === "dispute";
  const pulseRing = isUrgent
    ? `<circle cx="20" cy="20" r="18.5" fill="none" stroke="${fill}" stroke-width="2.5" opacity="0.45"/>`
    : type === "online_driver"
      ? `<circle cx="20" cy="20" r="18.5" fill="none" stroke="${fill}" stroke-width="2" opacity="0.35"/>`
      : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
  ${pulseRing}
  <circle cx="20" cy="20" r="17" fill="${fill}" stroke="#ffffff" stroke-width="2.5"/>
  ${glyph}
</svg>`.trim();
}

export function getLiveOpsMarkerMeta(type) {
  return TYPE_META[type] ?? { colorKey: "blue", label: "Marker" };
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
export function buildLeafletMarkerIcon(L, type, colorKey) {
  const svg = buildLiveOpsMarkerSvg(type, colorKey);
  const size = markerPixelSize(type);
  const color = resolveColor(type, colorKey);
  const pulse =
    type === "online_driver" || type === "emergency" || type === "dispute"
      ? `<span style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};animation:liveOpsPulse 1.6s ease-out infinite;pointer-events:none"></span>`
      : "";

  return L.divIcon({
    className: "live-ops-leaflet-marker",
    html: `<div class="live-ops-marker-wrap" style="position:relative;width:${size}px;height:${size}px">${pulse}${svg}</div>
      <style>@keyframes liveOpsPulse{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.55);opacity:0}}</style>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/** Tiny legend chip SVG (circle + glyph preview) */
export function buildLegendIconSvg(type, size = 16) {
  const fill = resolveColor(type);
  const glyph =
    type === "customer_signup"
      ? `<circle cx="8" cy="6" r="2.2" fill="#fff"/><path d="M3.5 13c0-2 2-3.2 4.5-3.2S12.5 11 12.5 13" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>`
      : type === "driver_signup" || type === "online_driver"
        ? `<path d="M3.5 10.2h9v1.2c0 .4-.3.7-.7.7H11c-.1-.6-.6-1-1.2-1s-1.1.4-1.2 1H7.4c-.1-.6-.6-1-1.2-1s-1.1.4-1.2 1H4.2c-.4 0-.7-.3-.7-.7v-1.2z" fill="#fff"/><path d="M4.2 10.2l.8-2.4c.1-.4.5-.7 1-.7h3.9c.4 0 .8.3 1 .7l.8 2.4H4.2z" fill="#fff"/>`
        : type === "food_order"
          ? `<path d="M5.5 4.2v7.5M5.5 4.2c0-1 .7-1.6 1.4-1.6M7.2 4.2v7.5M10.8 3.5v8.2M9.2 3.5h3.2c0 1.5-.7 2.4-1.6 2.7v4" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`
          : type === "emergency" || type === "dispute"
            ? `<path d="M8 3.2l4.4 7.6H3.6L8 3.2z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M8 6.4v2M8 10h.01" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`
            : `<circle cx="8" cy="7" r="3.2" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="8" cy="7" r="1.1" fill="#fff"/>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="7.2" fill="${fill}"/>
  ${glyph}
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
