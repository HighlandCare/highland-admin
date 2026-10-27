/** Admin map: fixed driver count shown in demand notification banner (no radius text). */
export const DEMAND_NOTIFY_DISPLAY_DRIVER_COUNT = 10;

export function getDemandHotspotStaticNotifyText(hotspot) {
  const pending = Number(hotspot?.pendingCount) || 0;
  const drivers = DEMAND_NOTIFY_DISPLAY_DRIVER_COUNT;
  return {
    pendingLabel: `High demand — ${pending} pending ride${pending === 1 ? "" : "s"}`,
    notifyLabel: `High demand notification sending to (${drivers}) drivers`,
  };
}

/** Map circle size — visible at city zoom without covering the whole metro area. */
export function getHotspotDisplayRadiusMeters(radiusMeters) {
  const logical = Number(radiusMeters);
  const base = Number.isFinite(logical) && logical > 0 ? logical : 1200;
  return Math.min(4500, Math.max(2200, Math.round(base * 1.75)));
}

export function normalizeHotspotCoords(hotspot) {
  const lat = Number(hotspot?.lat);
  const lng = Number(hotspot?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
