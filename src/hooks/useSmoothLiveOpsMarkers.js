import { useEffect, useMemo, useRef, useState } from "react";

function renderedMarkersEqual(a = [], b = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].id !== b[i].id || a[i].lat !== b[i].lat || a[i].lng !== b[i].lng) {
      return false;
    }
  }
  return true;
}

function buildMarkersSignature(markers = []) {
  return markers
    .map((marker) => `${marker.id}|${marker.lat}|${marker.lng}|${marker.type ?? ""}`)
    .join(";");
}

/**
 * Smoothly interpolate online-driver marker positions between socket updates.
 * Other marker types snap immediately.
 */
export function useSmoothLiveOpsMarkers(markers = [], durationMs = 900) {
  const [rendered, setRendered] = useState(markers);
  const positionsRef = useRef(new Map());
  const targetsRef = useRef(new Map());
  const rafRef = useRef(0);
  const markersRef = useRef(markers);

  markersRef.current = markers;

  const markersKey = useMemo(() => buildMarkersSignature(markers), [markers]);

  useEffect(() => {
    const currentMarkers = markersRef.current;
    const nextTargets = new Map();
    const nextMarkers = [];

    currentMarkers.forEach((marker) => {
      const lat = Number(marker.lat);
      const lng = Number(marker.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      nextMarkers.push(marker);
      nextTargets.set(marker.id, { lat, lng, marker });

      if (!positionsRef.current.has(marker.id)) {
        positionsRef.current.set(marker.id, { lat, lng });
      }
    });

    for (const id of [...positionsRef.current.keys()]) {
      if (!nextTargets.has(id)) positionsRef.current.delete(id);
    }

    targetsRef.current = nextTargets;

    const hasMovingOnline = nextMarkers.some((marker) => {
      if (marker.type !== "online_driver") return false;
      const pos = positionsRef.current.get(marker.id);
      const target = nextTargets.get(marker.id);
      if (!pos || !target) return false;
      return pos.lat !== target.lat || pos.lng !== target.lng;
    });

    const commitRendered = (next) => {
      setRendered((prev) => (renderedMarkersEqual(prev, next) ? prev : next));
    };

    if (!hasMovingOnline) {
      commitRendered(
        nextMarkers.map((marker) => {
          const pos = positionsRef.current.get(marker.id);
          return pos ? { ...marker, lat: pos.lat, lng: pos.lng } : marker;
        })
      );
      return undefined;
    }

    const startedAt = performance.now();
    const starts = new Map();
    nextTargets.forEach((target, id) => {
      const from = positionsRef.current.get(id) || target;
      starts.set(id, { lat: from.lat, lng: from.lng });
    });

    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / durationMs);
      const ease = 1 - (1 - t) ** 3;

      nextTargets.forEach((target, id) => {
        const from = starts.get(id) || target;
        const isOnline = target.marker?.type === "online_driver";
        if (!isOnline) {
          positionsRef.current.set(id, { lat: target.lat, lng: target.lng });
          return;
        }
        positionsRef.current.set(id, {
          lat: from.lat + (target.lat - from.lat) * ease,
          lng: from.lng + (target.lng - from.lng) * ease,
        });
      });

      commitRendered(
        markersRef.current
          .map((marker) => {
            const pos = positionsRef.current.get(marker.id);
            if (!pos) return null;
            return { ...marker, lat: pos.lat, lng: pos.lng };
          })
          .filter(Boolean)
      );

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [markersKey, durationMs]);

  return rendered;
}

/** Markers within radiusKm of a center point (for location search focus). */
export function filterMarkersNearLocation(markers = [], center, radiusKm = 25) {
  if (!center || center.lat == null || center.lng == null) return markers;

  const lat = Number(center.lat);
  const lng = Number(center.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return markers;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;

  return markers.filter((marker) => {
    const mLat = Number(marker.lat);
    const mLng = Number(marker.lng);
    if (!Number.isFinite(mLat) || !Number.isFinite(mLng)) return false;
    const dLat = toRad(mLat - lat);
    const dLng = toRad(mLng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(mLat)) * Math.sin(dLng / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= radiusKm;
  });
}
