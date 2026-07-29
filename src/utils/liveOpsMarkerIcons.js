import { MARKER_COLORS } from "./googleMaps";

const TYPE_META = {
  customer_signup: { colorKey: "green", label: "Customer" },
  driver_signup: { colorKey: "yellow", label: "Driver signup" },
  online_driver: { colorKey: "orange", label: "Online driver" },
  ride_request: { colorKey: "blue", label: "Ride request" },
  food_order: { colorKey: "purple", label: "Food order" },
  emergency: { colorKey: "red", label: "Urgent" },
  chaperoneride: { colorKey: "blue", label: "Active ride" },
};

/** Simple silhouette glyphs drawn inside the marker pin */
const GLYPHS = {
  user: `
    <circle cx="20" cy="15" r="4.2" fill="#fff"/>
    <path d="M12.5 27c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
  `,
  car: `
    <path d="M11 22.5h18v2.2c0 .7-.6 1.3-1.3 1.3h-1.1c-.2-1.1-1.1-1.9-2.2-1.9s-2 .8-2.2 1.9h-4.4c-.2-1.1-1.1-1.9-2.2-1.9s-2 .8-2.2 1.9h-1.1c-.7 0-1.3-.6-1.3-1.3v-2.2z" fill="#fff"/>
    <path d="M12.2 22.5l1.6-5.1c.3-.9 1.1-1.5 2.1-1.5h8.2c.9 0 1.8.6 2.1 1.5l1.6 5.1H12.2z" fill="#fff"/>
    <circle cx="15.8" cy="25.8" r="1.35" fill="#111827"/>
    <circle cx="24.2" cy="25.8" r="1.35" fill="#111827"/>
  `,
  carLive: `
    <path d="M10 22.2h20v2.4c0 .7-.6 1.3-1.3 1.3h-1.2c-.2-1.2-1.2-2-2.3-2s-2.1.8-2.3 2h-5.8c-.2-1.2-1.2-2-2.3-2s-2.1.8-2.3 2H11.3c-.7 0-1.3-.6-1.3-1.3v-2.4z" fill="#fff"/>
    <path d="M11.4 22.2l1.8-5.4c.3-1 1.2-1.6 2.2-1.6h9.2c1 0 1.9.6 2.2 1.6l1.8 5.4H11.4z" fill="#fff"/>
    <circle cx="15.6" cy="25.6" r="1.5" fill="#111827"/>
    <circle cx="24.4" cy="25.6" r="1.5" fill="#111827"/>
  `,
  pin: `
    <path d="M20 12.2c-2.9 0-5.2 2.3-5.2 5.2 0 3.9 5.2 9.4 5.2 9.4s5.2-5.5 5.2-9.4c0-2.9-2.3-5.2-5.2-5.2zm0 7.1a2 2 0 110-4 2 2 0 010 4z" fill="#fff"/>
  `,
  food: `
    <path d="M14 13.5v10.5M14 13.5c0-1.8 1.2-2.8 2.4-2.8M17 13.5v10.5M17 13.5c0-1.8 1.2-2.8 2.4-2.8M26 12.2v12.3M23.2 12.2h5.6c0 2.6-1.3 4.2-2.8 4.8v7.5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
  `,
  alert: `
    <path d="M20 12.5l7.8 13.5H12.2L20 12.5z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M20 18.2v3.4M20 24.2h.01" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
  `,
  you: `
    <circle cx="20" cy="20" r="5" fill="none" stroke="#fff" stroke-width="2.4"/>
    <circle cx="20" cy="20" r="2" fill="#fff"/>
    <path d="M20 11v2.5M20 26.5V29M11 20h2.5M26.5 20H29" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
  `,
};

function glyphForType(type) {
  switch (type) {
    case "customer_signup":
      return GLYPHS.user;
    case "driver_signup":
      return GLYPHS.car;
    case "online_driver":
      return GLYPHS.carLive;
    case "ride_request":
    case "chaperoneride":
      return GLYPHS.pin;
    case "food_order":
      return GLYPHS.food;
    case "emergency":
      return GLYPHS.alert;
    case "user_location":
      return GLYPHS.you;
    default:
      return GLYPHS.pin;
  }
}

function resolveColor(type, colorKey) {
  if (type === "user_location") return "#7c3aed";
  const meta = TYPE_META[type];
  const key = colorKey || meta?.colorKey || "blue";
  return MARKER_COLORS[key] ?? MARKER_COLORS.blue;
}

/** SVG pin used by Google Maps (data URL) and Leaflet (inline HTML) */
export function buildLiveOpsMarkerSvg(type, colorKey) {
  const fill = resolveColor(type, colorKey);
  const glyph = glyphForType(type);

  // Online drivers use a floating car badge (easier to track while moving)
  if (type === "online_driver") {
    return `
<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="18" fill="${fill}" stroke="#ffffff" stroke-width="2.5"/>
  ${glyph}
</svg>`.trim();
  }

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
  <path d="M20 3C10.8 3 3.5 10.3 3.5 19.5c0 11.2 13.7 23.2 15.8 25.1a1.1 1.1 0 001.4 0C23 42.7 36.5 30.7 36.5 19.5 36.5 10.3 29.2 3 20 3z" fill="rgba(0,0,0,0.22)"/>
  <path d="M20 1.5C10.3 1.5 2.5 9.3 2.5 19c0 11.8 14.4 24.4 16.7 26.4a1.2 1.2 0 001.6 0C23.1 43.4 37.5 30.8 37.5 19 37.5 9.3 29.7 1.5 20 1.5z" fill="${fill}"/>
  <circle cx="20" cy="19" r="11.2" fill="rgba(255,255,255,0.16)"/>
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
  const isLiveCar = type === "online_driver";
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(isLiveCar ? 44 : 40, isLiveCar ? 44 : 48),
    anchor: new window.google.maps.Point(isLiveCar ? 22 : 20, isLiveCar ? 22 : 46),
  };
}

/** Leaflet DivIcon HTML/config — pass L from leaflet */
export function buildLeafletMarkerIcon(L, type, colorKey) {
  const svg = buildLiveOpsMarkerSvg(type, colorKey);
  const isLiveCar = type === "online_driver";
  const size = isLiveCar ? 44 : 40;
  const height = isLiveCar ? 44 : 48;
  const color = resolveColor(type, colorKey);
  const pulse = isLiveCar
    ? `<span style="position:absolute;inset:0;border-radius:50%;border:2px solid ${color};animation:liveOpsPulse 1.6s ease-out infinite;pointer-events:none"></span>`
    : "";

  return L.divIcon({
    className: "live-ops-marker",
    html: `<div style="position:relative;width:${size}px;height:${height}px;line-height:0">${pulse}${svg}</div>
      <style>@keyframes liveOpsPulse{0%{transform:scale(.85);opacity:.7}100%{transform:scale(1.55);opacity:0}}</style>`,
    iconSize: [size, height],
    iconAnchor: [size / 2, isLiveCar ? size / 2 : height - 2],
    popupAnchor: [0, isLiveCar ? -size / 2 : -40],
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
          : type === "emergency"
            ? `<path d="M8 3.2l4.4 7.6H3.6L8 3.2z" fill="none" stroke="#fff" stroke-width="1.3"/><path d="M8 6.4v2M8 10h.01" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`
            : `<circle cx="8" cy="7" r="3.2" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="8" cy="7" r="1.1" fill="#fff"/>`;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="7.2" fill="${fill}"/>
  ${glyph}
</svg>`.trim();
}
