const ID_PREFIXES = [
  "driver-online-",
  "customer_signup-",
  "driver_signup-",
  "ride_request-",
  "food_order-",
  "online_driver-",
  "emergency-",
  "dispute-",
  "urgent-",
  "customer-",
  "driver-",
  "ride-",
  "food-",
  "booking-",
  "order-",
  "signup-",
];

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value == null) continue;
    if (typeof value === "object") {
      const nested = firstNonEmpty(
        value._id,
        value.id,
        value.authId,
        value.userId,
        value.rideId,
        value.disputeId,
        value.orderId
      );
      if (nested) return nested;
      continue;
    }
    const text = String(value).trim();
    if (text && text !== "undefined" && text !== "null") return text;
  }
  return null;
}

function stripKnownPrefix(id) {
  if (!id) return null;
  let value = String(id).trim();
  if (!value || value === "undefined" || value === "null") return null;

  // Keep stripping known live-ops prefixes (e.g. urgent-<mongoId>).
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of ID_PREFIXES) {
      if (value.toLowerCase().startsWith(prefix) && value.length > prefix.length) {
        value = value.slice(prefix.length);
        changed = true;
        break;
      }
    }
  }

  return value || null;
}

function cleanEntityId(...values) {
  for (const value of values) {
    const raw = firstNonEmpty(value);
    if (!raw) continue;
    const cleaned = stripKnownPrefix(raw);
    if (cleaned) return cleaned;
  }
  return null;
}

function resolveExplicitPath(item) {
  const path = firstNonEmpty(item?.href, item?.path, item?.detailUrl, item?.url, item?.link);
  if (!path) return null;
  if (path.startsWith("/")) return path;
  return null;
}

function isDisputeLike(item) {
  if (!item) return false;
  if (item.type === "emergency" || item.type === "dispute") return true;
  const status = String(item.status || item.disputeStatus || "").toLowerCase();
  if (status === "disputed" || status === "emergency" || status === "urgent") return true;
  if (item.disputeId || item.emergencyId) return true;
  const id = String(item.id || "").toLowerCase();
  if (id.startsWith("urgent-") || id.startsWith("emergency-") || id.startsWith("dispute-")) {
    return true;
  }
  return false;
}

function isOrderLike(item) {
  if (!item) return false;
  const type = String(item.type || "").toLowerCase();
  if (type === "ride_request" || type === "food_order" || type === "chaperoneride") return true;
  if (type === "order" || type === "booking" || type === "ride") return true;
  const category = String(item.category || "").toLowerCase();
  if (
    ["rides", "food", "senior_care", "transportation", "contractors", "babysitting", "cleaning", "pet_care"].includes(
      category
    )
  ) {
    return true;
  }
  return Boolean(item.rideId || item.bookingId || item.orderId);
}

export function resolveLiveOpsEntityId(item) {
  if (!item) return null;

  const type = String(item.type || "").toLowerCase();
  const strippedId = stripKnownPrefix(item.id);

  if (type === "customer_signup" || type === "customer") {
    return firstNonEmpty(
      item.customerId,
      item.userId,
      item.authId,
      item.user,
      item.entityId,
      item.refId,
      item._id,
      strippedId
    );
  }

  if (type === "driver_signup" || type === "online_driver" || type === "driver") {
    return firstNonEmpty(
      item.authId,
      item.driverId,
      item.chaperoneId,
      item.userId,
      item.user,
      item.driver,
      item.entityId,
      item.refId,
      item._id,
      strippedId
    );
  }

  if (isDisputeLike(item)) {
    return cleanEntityId(
      item.disputeId,
      item.emergencyId,
      item.rideId,
      item.bookingId,
      item.ride,
      item.dispute,
      item.entityId,
      item.refId,
      item._id,
      item.id
    );
  }

  if (isOrderLike(item) || type === "ride_request" || type === "food_order" || type === "chaperoneride") {
    return cleanEntityId(
      item.rideId,
      item.bookingId,
      item.orderId,
      item.ride,
      item.order,
      item.booking,
      item.entityId,
      item.refId,
      item._id,
      item.id
    );
  }

  return cleanEntityId(
    item.entityId,
    item.refId,
    item._id,
    item.rideId,
    item.bookingId,
    item.orderId,
    item.disputeId,
    item.authId,
    item.userId,
    item.driverId,
    item.customerId,
    item.id
  );
}

/** Detail routes that exist in this admin app. Missing screens resolve to "#". */
const DETAIL_ROUTES = {
  customer: "/users/detail",
  driver: "/chaperone/detail",
  dispute: "/disputes/detail",
  ride: "/ride-history/detail",
};

function buildDetailPath(basePath, id) {
  if (!basePath || !id) return "#";
  return `${basePath}?id=${encodeURIComponent(id)}`;
}

function resolveDisputeDetailId(item) {
  return cleanEntityId(
    item?.disputeId,
    item?.emergencyId,
    item?.dispute?._id,
    item?.dispute?.id,
    item?.dispute?.disputeId,
    item?.rideId,
    item?.bookingId,
    item?.entityId,
    item?.refId,
    item?._id,
    item?.id
  );
}

function resolveRideDetailId(item) {
  return cleanEntityId(
    item?.rideId,
    item?.bookingId,
    item?.orderId,
    item?.ride?._id,
    item?.ride?.rideId,
    item?.ride?.id,
    item?.booking?._id,
    item?.order?._id,
    item?.entityId,
    item?.refId,
    item?._id,
    item?.id
  );
}

export function resolveLiveOpsDetailPath(item) {
  if (!item) return "#";

  const explicit = resolveExplicitPath(item);
  if (explicit) return explicit;

  const type = String(item.type || "").toLowerCase();

  if (type === "customer_signup" || type === "customer") {
    return buildDetailPath(DETAIL_ROUTES.customer, resolveLiveOpsEntityId(item));
  }

  if (type === "driver_signup" || type === "online_driver" || type === "driver") {
    return buildDetailPath(DETAIL_ROUTES.driver, resolveLiveOpsEntityId(item));
  }

  // Disputes / emergencies → Disputes detail
  if (type === "emergency" || type === "dispute" || isDisputeLike(item)) {
    return buildDetailPath(DETAIL_ROUTES.dispute, resolveDisputeDetailId(item));
  }

  // Rides / food orders / bookings → Ride History detail
  if (
    type === "ride_request" ||
    type === "food_order" ||
    type === "chaperoneride" ||
    type === "ride" ||
    type === "booking" ||
    type === "order" ||
    isOrderLike(item)
  ) {
    return buildDetailPath(DETAIL_ROUTES.ride, resolveRideDetailId(item));
  }

  return "#";
}

export function collectLiveOpsIdCandidates(item) {
  if (!item) return [];

  const type = String(item.type || "").toLowerCase();
  const stripped = stripKnownPrefix(item.id);
  let values = [];

  if (type === "customer_signup" || type === "customer") {
    values = [item.customerId, item.userId, item.authId, item.entityId, item.refId, item._id, stripped, item.id];
  } else if (type === "driver_signup" || type === "online_driver" || type === "driver") {
    values = [
      item.authId,
      item.driverId,
      item.chaperoneId,
      item.userId,
      item.entityId,
      item.refId,
      item._id,
      stripped,
      item.id,
    ];
  } else if (isDisputeLike(item)) {
    values = [
      item.disputeId,
      item.emergencyId,
      item.rideId,
      item.bookingId,
      item.entityId,
      item.refId,
      item._id,
      stripped,
      item.id,
    ];
  } else {
    values = [
      item.rideId,
      item.bookingId,
      item.orderId,
      item.entityId,
      item.refId,
      item._id,
      stripped,
      item.id,
    ];
  }

  const unique = [];
  for (const value of values) {
    const resolved = firstNonEmpty(value);
    if (resolved && !unique.includes(resolved)) {
      unique.push(resolved);
    }
  }
  return unique;
}

export function resolveLiveOpsListPath(filter = "all") {
  switch (filter) {
    case "customer_signup":
      return "/users";
    case "driver_signup":
      return "/chaperone";
    case "ride_request":
    case "food_order":
      return "/ride-history";
    case "emergency":
      return "/disputes";
    default:
      return "/users";
  }
}

/** Merge marker/feed rows that share an id so detail redirects have the best IDs. */
export function enrichLiveOpsItem(item, snapshot) {
  if (!item) return null;

  const markers = snapshot?.markers ?? [];
  const feed = snapshot?.feed ?? [];
  const matchId = item.id;

  const markerMatch = matchId
    ? markers.find((entry) => entry.id === matchId)
    : null;
  const feedMatch = matchId ? feed.find((entry) => entry.id === matchId) : null;

  return {
    ...(feedMatch || {}),
    ...(markerMatch || {}),
    ...item,
    authId: item.authId || markerMatch?.authId || feedMatch?.authId,
    userId: item.userId || markerMatch?.userId || feedMatch?.userId,
    customerId: item.customerId || markerMatch?.customerId || feedMatch?.customerId,
    driverId: item.driverId || markerMatch?.driverId || feedMatch?.driverId,
    chaperoneId: item.chaperoneId || markerMatch?.chaperoneId || feedMatch?.chaperoneId,
    rideId:
      item.rideId ||
      markerMatch?.rideId ||
      feedMatch?.rideId ||
      item.ride?.rideId ||
      item.meta?.rideId ||
      item.payload?.rideId,
    bookingId:
      item.bookingId ||
      markerMatch?.bookingId ||
      feedMatch?.bookingId ||
      item.booking?._id ||
      item.meta?.bookingId ||
      item.payload?.bookingId,
    orderId:
      item.orderId ||
      markerMatch?.orderId ||
      feedMatch?.orderId ||
      item.order?._id ||
      item.meta?.orderId ||
      item.payload?.orderId,
    disputeId: item.disputeId || markerMatch?.disputeId || feedMatch?.disputeId,
    emergencyId: item.emergencyId || markerMatch?.emergencyId || feedMatch?.emergencyId,
    entityId: item.entityId || markerMatch?.entityId || feedMatch?.entityId,
    status: item.status || markerMatch?.status || feedMatch?.status,
    category: item.category || markerMatch?.category || feedMatch?.category,
    href: item.href || markerMatch?.href || feedMatch?.href,
    type: item.type || markerMatch?.type || feedMatch?.type,
  };
}
