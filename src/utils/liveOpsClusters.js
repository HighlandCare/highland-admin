/** Web-Mercator pixel clustering so nearby live-ops pins don't stack into a blob. */

export function latLngToWorldPx(lat, lng, zoom) {
  const scale = 256 * 2 ** zoom;
  const x = ((Number(lng) + 180) / 360) * scale;
  const sinLat = Math.sin((Number(lat) * Math.PI) / 180);
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - Math.max(-0.9999, Math.min(0.9999, sinLat)))) / (4 * Math.PI)) *
    scale;
  return { x, y };
}

export function spiderRadiusMeters(lat, zoom, pixelGap = 52) {
  const metersPerPixel =
    (156543.03392 * Math.cos((Number(lat) * Math.PI) / 180)) / 2 ** Math.max(zoom, 1);
  return Math.max(12, metersPerPixel * pixelGap);
}

export function markerDisplaySize(type, zoom) {
  const urgent = type === "emergency" || type === "dispute";
  if (zoom <= 10) return urgent ? 24 : 22;
  if (zoom <= 12) return urgent ? 28 : 26;
  if (zoom <= 14) return urgent ? 34 : 32;
  if (zoom <= 15) return urgent ? 40 : 36;
  return urgent ? 44 : 40;
}

export function clusterDisplaySize(count) {
  return Math.min(54, 34 + Math.min(Number(count) || 1, 14));
}

export function clusterColor(members = []) {
  const types = new Set(members.map((item) => item.type));
  if (types.has("emergency") || types.has("dispute")) return "#ef4444";
  if (types.has("online_driver")) return "#f97316";
  if (types.has("ride_request") || types.has("chaperoneride")) return "#3b82f6";
  if (types.has("driver_signup")) return "#eab308";
  if (types.has("customer_signup")) return "#22c55e";
  return "#00828A";
}

function clusterRadiusPx(zoom) {
  if (zoom <= 8) return 44;
  if (zoom <= 11) return 50;
  if (zoom <= 13) return 54;
  if (zoom <= 15) return 48;
  return 42;
}

function clusterPoints(list, zoom) {
  const radius = clusterRadiusPx(zoom);
  const radiusSq = radius * radius;
  const points = list.map((marker) => ({
    marker,
    ...latLngToWorldPx(marker.lat, marker.lng, zoom),
  }));

  const used = new Set();
  const result = [];

  points.forEach((point, index) => {
    if (used.has(index)) return;

    const members = [point];
    used.add(index);
    let cx = point.x;
    let cy = point.y;

    for (let next = index + 1; next < points.length; next += 1) {
      if (used.has(next)) continue;
      const dx = points[next].x - cx / members.length;
      const dy = points[next].y - cy / members.length;
      if (dx * dx + dy * dy <= radiusSq) {
        members.push(points[next]);
        used.add(next);
        cx += points[next].x;
        cy += points[next].y;
      }
    }

    if (members.length === 1) {
      result.push({ kind: "marker", marker: members[0].marker });
      return;
    }

    const lat = members.reduce((sum, item) => sum + Number(item.marker.lat), 0) / members.length;
    const lng = members.reduce((sum, item) => sum + Number(item.marker.lng), 0) / members.length;
    const ids = members
      .map((item) => item.marker.id)
      .filter(Boolean)
      .sort()
      .join("|");

    result.push({
      kind: "cluster",
      id: `cluster-${ids || `${lat.toFixed(5)}-${lng.toFixed(5)}`}`,
      lat,
      lng,
      count: members.length,
      members: members.map((item) => item.marker),
    });
  });

  return result;
}

/** Lowest zoom above `fromZoom` where this group splits into more than one pin/cluster. */
export function findZoomToSplit(members = [], fromZoom = 12, maxZoom = 18) {
  if (!members.length) return null;
  const start = Math.max(1, Math.floor(Number(fromZoom) || 12) + 1);
  for (let zoom = start; zoom <= maxZoom; zoom += 1) {
    const result = clusterPoints(members, zoom);
    if (result.length > 1) return zoom;
    if (result.length === 1 && result[0].kind === "marker") return zoom;
  }
  return null;
}

/** Fan overlapping pins into a circle so every item in a cluster is visible. */
export function spiderfyClusterMembers(members = [], zoom = 16) {
  if (members.length <= 1) return members;

  const lat = members.reduce((sum, item) => sum + Number(item.lat), 0) / members.length;
  const lng = members.reduce((sum, item) => sum + Number(item.lng), 0) / members.length;
  const size = markerDisplaySize(members[0]?.type, zoom);
  const pixelRadius = Math.max(size + 12, 36) * (members.length > 8 ? 1.25 : 1);
  const radiusMeters = spiderRadiusMeters(lat, zoom, pixelRadius);
  const angleStep = (2 * Math.PI) / members.length;
  const latRadius = radiusMeters / 111320;
  const lngRadius = radiusMeters / (111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));

  return members.map((marker, index) => {
    const angle = angleStep * index - Math.PI / 2;
    return {
      ...marker,
      lat: lat + latRadius * Math.cos(angle),
      lng: lng + lngRadius * Math.sin(angle),
    };
  });
}

/**
 * Group markers that overlap on screen at the current zoom.
 * Returns a mix of { kind: "marker", marker } and { kind: "cluster", ... }.
 */
export function clusterLiveOpsMarkers(markers = [], zoom = 12, options = {}) {
  const list = (markers || []).filter(
    (marker) => Number.isFinite(Number(marker?.lat)) && Number.isFinite(Number(marker?.lng))
  );
  if (!list.length) return [];

  const z = Math.max(1, Math.floor(Number(zoom) || 12));
  const expandedIds = options.expandedIds instanceof Set ? options.expandedIds : null;

  if (!expandedIds?.size) {
    return clusterPoints(list, z);
  }

  const expanded = [];
  const rest = [];
  list.forEach((marker) => {
    if (expandedIds.has(marker.id)) expanded.push(marker);
    else rest.push(marker);
  });

  const clustered = clusterPoints(rest, z);
  const spiderfied = spiderfyClusterMembers(expanded, z).map((marker) => ({
    kind: "marker",
    marker,
  }));

  return [...clustered, ...spiderfied];
}
