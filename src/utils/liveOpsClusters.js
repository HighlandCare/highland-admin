/** Live-ops map marker layout — always individual dots, never numbered clusters. */

export function markerDisplaySize(type) {
  if (type === "emergency" || type === "dispute") return 28;
  if (type === "user_location") return 26;
  return 24;
}

/** Used by legend / styling helpers */
export function clusterColor(members = []) {
  const types = new Set(members.map((item) => item.type));
  if (types.has("emergency") || types.has("dispute")) return "#ef4444";
  if (types.has("online_driver")) return "#f97316";
  if (types.has("driver_signup")) return "#eab308";
  if (types.has("ride_request") || types.has("chaperoneride")) return "#3b82f6";
  if (types.has("customer_signup")) return "#22c55e";
  return "#00828A";
}

function coordKey(lat, lng) {
  return `${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

/** Tiny fixed ring when several markers share the exact same coordinates. */
function stableSpreadPosition(index, total, baseLat, baseLng) {
  if (total <= 1) {
    return { lat: baseLat, lng: baseLng };
  }

  const radiusMeters = 4;
  const angle = ((2 * Math.PI) / total) * index - Math.PI / 2;
  const latRadius = radiusMeters / 111320;
  const lngRadius = radiusMeters / (111320 * Math.max(Math.cos((baseLat * Math.PI) / 180), 0.2));

  return {
    lat: baseLat + latRadius * Math.cos(angle),
    lng: baseLng + lngRadius * Math.sin(angle),
  };
}

function buildDuplicateSpreadMap(markers = []) {
  const groups = new Map();
  markers.forEach((marker) => {
    const lat = Number(marker.lat);
    const lng = Number(marker.lng);
    const key = coordKey(lat, lng);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(marker);
  });

  const spread = new Map();
  groups.forEach((group) => {
    const sorted = [...group].sort((a, b) => String(a.id || "").localeCompare(String(b.id || "")));
    const baseLat = Number(sorted[0].lat);
    const baseLng = Number(sorted[0].lng);

    sorted.forEach((marker, index) => {
      spread.set(marker.id || coordKey(marker.lat, marker.lng), stableSpreadPosition(index, sorted.length, baseLat, baseLng));
    });
  });

  return spread;
}

/**
 * Render every marker as its own glowing dot at real coordinates.
 * Only exact duplicate GPS points get a small fixed geographic spread.
 */
export function clusterLiveOpsMarkers(markers = []) {
  const list = (markers || []).filter(
    (marker) => Number.isFinite(Number(marker?.lat)) && Number.isFinite(Number(marker?.lng))
  );
  if (!list.length) return [];

  const spreadMap = buildDuplicateSpreadMap(list);

  return list.map((marker) => {
    const lat = Number(marker.lat);
    const lng = Number(marker.lng);
    const position = spreadMap.get(marker.id || coordKey(lat, lng)) || { lat, lng };

    return {
      kind: "marker",
      marker,
      lat: position.lat,
      lng: position.lng,
    };
  });
}
