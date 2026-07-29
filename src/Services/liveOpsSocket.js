import { io } from "socket.io-client";
import { parseCoordinateQuery } from "../utils/googleMaps";

const LIVE_OPS_EVENTS = [
  "live-ops:driver.location",
  "live-ops:driver.presence",
  "live-ops:marker.upsert",
  "live-ops:marker.remove",
  "live-ops:feed.event",
  "live-ops:stats.patch",
  "live-ops:legend.patch",
  "live-ops:refresh",
];

export function getLiveOpsSocketUrl() {
  return (
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_SOCKET_CONNECTION_URL ||
    ""
  );
}

/**
 * Connect admin Live Ops client to the Highland socket server.
 * Returns { disconnect, setRegion, syncNow }.
 */
export function connectLiveOpsSocket({
  region,
  onEvent,
  onConnectionChange,
} = {}) {
  const url = getLiveOpsSocketUrl();
  if (!url) {
    console.warn("[live-ops] NEXT_PUBLIC_SOCKET_URL is not set");
    onConnectionChange?.("missing_url");
    return { disconnect: () => {}, setRegion: () => {}, syncNow: () => {} };
  }

  const socket = io(url, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1500,
  });

  let activeRegion = region || "all";

  const joinRoom = (nextRegion) => {
    activeRegion = nextRegion || "all";
    socket.emit("adminJoinLiveOps", { region: activeRegion }, () => {});
  };

  const syncNow = () => {
    if (!socket.connected) return;
    socket.emit("adminSyncLiveOps", {}, () => {});
  };

  const handleConnect = () => {
    onConnectionChange?.("connected");
    joinRoom(activeRegion);
  };

  socket.on("connect", handleConnect);
  socket.on("disconnect", () => onConnectionChange?.("disconnected"));
  socket.on("connect_error", (err) => {
    console.error("[live-ops] socket connect_error:", err.message);
    onConnectionChange?.("error");
  });

  LIVE_OPS_EVENTS.forEach((eventName) => {
    socket.on(eventName, (payload) => {
      onEvent?.(eventName, payload);
    });
  });

  if (socket.connected) {
    handleConnect();
  }

  return {
    setRegion: (nextRegion) => {
      if (socket.connected) joinRoom(nextRegion);
      else activeRegion = nextRegion || "all";
    },
    syncNow,
    disconnect: () => {
      try {
        socket.emit("adminLeaveLiveOps", {}, () => {});
        socket.removeAllListeners();
        socket.disconnect();
      } catch {
        // ignore cleanup errors
      }
    },
  };
}

function recountLegend(markers = []) {
  return {
    customer_signup: markers.filter((m) => m.type === "customer_signup").length,
    driver_signup: markers.filter((m) => m.type === "driver_signup").length,
    ride_request: markers.filter((m) => m.type === "ride_request").length,
    food_order: markers.filter((m) => m.type === "food_order").length,
    online_driver: markers.filter((m) => m.type === "online_driver").length,
    emergency: markers.filter((m) => m.type === "emergency").length,
  };
}

/**
 * Keep live KPIs in sync with map markers.
 * allowShrink=true after remove/offline so counts can drop in realtime.
 */
function patchStatsFromMarkers(stats = {}, markers = [], { allowShrink = false } = {}) {
  const onlineDrivers = markers.filter((m) => m.type === "online_driver").length;
  const activeRides = markers.filter((m) => m.type === "ride_request").length;
  const activeFoodDeliveries = markers.filter((m) => m.type === "food_order").length;
  const liveBookings = activeRides + activeFoodDeliveries;
  const pick = (apiValue, localValue) =>
    allowShrink ? localValue : Math.max(Number(apiValue) || 0, localValue);

  return {
    ...stats,
    driversOnline: pick(stats.driversOnline, onlineDrivers),
    activeRides: pick(stats.activeRides, activeRides),
    activeFoodDeliveries: pick(stats.activeFoodDeliveries, activeFoodDeliveries),
    liveBookings: pick(stats.liveBookings, liveBookings),
  };
}

function upsertMarker(markers, marker) {
  if (!marker?.id) return markers;
  const next = [...markers];
  const idx = next.findIndex((item) => item.id === marker.id);
  const enriched = { ...marker, _fromSocket: true };
  if (idx >= 0) next[idx] = { ...next[idx], ...enriched };
  else next.unshift(enriched);
  return next;
}

/** Build map markers from feed rows that carry coordinates. */
export function markersFromFeed(feed = []) {
  const result = [];
  for (const item of feed) {
    if (!item?.id) continue;
    const parsed = parseCoordinateQuery(item.location);
    const lat = Number(item.lat ?? parsed?.lat);
    const lng = Number(item.lng ?? parsed?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    result.push({
      id: item.id,
      type: item.type,
      color: item.color || "blue",
      lat,
      lng,
      title: item.detail || item.label || "Activity",
      subtitle: item.label || "",
      phone: item.phone || "",
      category: item.category,
      timestamp: item.timestamp,
      _fromFeed: true,
    });
  }
  return result;
}

/** Merge HTTP snapshot with live socket/feed markers so polls don't wipe the map. */
export function mergeLiveOpsSnapshot(prev, incoming) {
  if (!incoming) return prev || null;
  if (!prev) {
    const feedMarkers = markersFromFeed(incoming.feed);
    const byId = new Map();
    [...feedMarkers, ...(incoming.markers || [])].forEach((m) => {
      if (m?.id) byId.set(m.id, m);
    });
    const markers = [...byId.values()];
    return {
      ...incoming,
      markers,
      legend: recountLegend(markers),
    };
  }

  const byId = new Map();

  // Start with HTTP markers
  (incoming.markers || []).forEach((m) => {
    if (m?.id) byId.set(m.id, m);
  });

  // Overlay feed-derived coords
  markersFromFeed(incoming.feed || prev.feed).forEach((m) => {
    if (!byId.has(m.id)) byId.set(m.id, m);
  });

  // Keep / prefer live socket markers (online cars, etc.)
  (prev.markers || []).forEach((m) => {
    if (!m?.id) return;
    const existing = byId.get(m.id);
    if (!existing) {
      byId.set(m.id, m);
      return;
    }
    if (m._fromSocket || m.type === "online_driver") {
      byId.set(m.id, {
        ...existing,
        ...m,
        lat: Number.isFinite(Number(m.lat)) ? Number(m.lat) : existing.lat,
        lng: Number.isFinite(Number(m.lng)) ? Number(m.lng) : existing.lng,
      });
    }
  });

  const markers = [...byId.values()];
  const mergedStats = {
    ...(incoming.stats || {}),
  };
  return {
    ...incoming,
    markers,
    legend: recountLegend(markers),
    // Prefer API totals, but never drop below what live socket markers already show
    stats: patchStatsFromMarkers(mergedStats, markers, { allowShrink: false }),
    feed: incoming.feed?.length ? incoming.feed : prev.feed,
  };
}

function emptySnapshot() {
  return {
    markers: [],
    feed: [],
    stats: {},
    legend: recountLegend([]),
    region: { key: "all", center: { lat: 24.86, lng: 67.0 }, zoom: 11 },
  };
}

/** Apply a socket delta onto the current live-ops snapshot. */
export function applyLiveOpsSocketEvent(snapshot, eventName, payload) {
  const next = {
    ...(snapshot || emptySnapshot()),
    markers: Array.isArray(snapshot?.markers) ? [...snapshot.markers] : [],
    feed: Array.isArray(snapshot?.feed) ? [...snapshot.feed] : [],
    stats: { ...(snapshot?.stats || {}) },
    legend: { ...(snapshot?.legend || {}) },
  };

  switch (eventName) {
    case "live-ops:marker.upsert": {
      const marker = payload?.marker;
      if (!marker?.id) break;
      next.markers = upsertMarker(next.markers, marker);
      next.legend = recountLegend(next.markers);
      next.stats = patchStatsFromMarkers(next.stats, next.markers);
      break;
    }
    case "live-ops:marker.remove": {
      const id = payload?.id;
      if (!id) break;
      next.markers = next.markers.filter((item) => item.id !== id);
      next.legend = recountLegend(next.markers);
      next.stats = patchStatsFromMarkers(next.stats, next.markers, {
        allowShrink: true,
      });
      break;
    }
    case "live-ops:driver.location": {
      const marker = payload?.marker;
      const id = payload?.id || marker?.id || (payload?.authId ? `driver-online-${payload.authId}` : null);
      if (!id) break;

      if (marker) {
        next.markers = upsertMarker(next.markers, { ...marker, id });
      } else if (payload.lat != null && payload.lng != null) {
        const idx = next.markers.findIndex((item) => item.id === id);
        if (idx >= 0) {
          next.markers[idx] = {
            ...next.markers[idx],
            lat: Number(payload.lat),
            lng: Number(payload.lng),
            available: payload.available ?? next.markers[idx].available,
            _fromSocket: true,
            timestamp: payload.at || new Date().toISOString(),
          };
        } else {
          next.markers = upsertMarker(next.markers, {
            id,
            type: "online_driver",
            color: "orange",
            lat: Number(payload.lat),
            lng: Number(payload.lng),
            title: "Online driver",
            subtitle: "Live location",
            available: payload.available ?? true,
            timestamp: payload.at || new Date().toISOString(),
          });
        }
      }
      next.legend = recountLegend(next.markers);
      next.stats = patchStatsFromMarkers(next.stats, next.markers);
      break;
    }
    case "live-ops:driver.presence": {
      const goingOffline = payload?.isOnline === false && payload?.authId;
      if (goingOffline) {
        next.markers = next.markers.filter(
          (item) => item.id !== `driver-online-${payload.authId}`
        );
      } else if (payload?.marker) {
        next.markers = upsertMarker(next.markers, payload.marker);
      } else if (
        payload?.isOnline &&
        payload?.authId &&
        payload.lat != null &&
        payload.lng != null
      ) {
        next.markers = upsertMarker(next.markers, {
          id: `driver-online-${payload.authId}`,
          type: "online_driver",
          color: "yellow",
          lat: Number(payload.lat),
          lng: Number(payload.lng),
          title: "Online driver",
          subtitle: "Just came online",
          available: true,
        });
      }
      next.legend = recountLegend(next.markers);
      next.stats = patchStatsFromMarkers(next.stats, next.markers, {
        allowShrink: Boolean(goingOffline),
      });
      break;
    }
    case "live-ops:feed.event": {
      const item = payload?.item;
      if (!item?.id) break;
      next.feed = [item, ...next.feed.filter((entry) => entry.id !== item.id)].slice(
        0,
        40
      );
      const feedMarker = markersFromFeed([item])[0];
      if (feedMarker) {
        next.markers = upsertMarker(next.markers, feedMarker);
        next.legend = recountLegend(next.markers);
        next.stats = patchStatsFromMarkers(next.stats, next.markers);
      }
      break;
    }
    case "live-ops:stats.patch": {
      // Authoritative DB counts from socket server — apply as-is
      next.stats = {
        ...next.stats,
        ...(payload || {}),
      };
      delete next.stats.at;
      break;
    }
    case "live-ops:legend.patch": {
      next.legend = { ...next.legend, ...(payload || {}) };
      delete next.legend.at;
      break;
    }
    default:
      break;
  }

  next.refreshedAt = payload?.at || new Date().toISOString();
  return next;
}
