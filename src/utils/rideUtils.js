const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export const formatRideCurrency = (value) => {
  if (value == null || value === "" || Number.isNaN(Number(value))) {
    return "—";
  }

  return currencyFormatter.format(Number(value));
};

export const getRideList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const pickPerson = (...candidates) => {
  for (const person of candidates) {
    if (!person || typeof person !== "object") continue;
    if (
      person.fullName ||
      person.name ||
      person.email ||
      person.phone ||
      person.phoneNumber ||
      person.identifier
    ) {
      return person;
    }
  }
  return null;
};

const personDisplayName = (person) => {
  if (!person || typeof person !== "object") return null;
  const name = person.fullName?.trim() || person.name?.trim();
  if (name) return name;
  if (person.email?.trim()) return person.email.trim();
  if (person.phone?.trim()) return person.phone.trim();
  if (person.phoneNumber?.trim()) return person.phoneNumber.trim();
  if (person.identifier?.trim()) return person.identifier.trim();
  return null;
};

export const getRideCustomer = (ride) =>
  pickPerson(
    ride?.customer,
    ride?.creator,
    ride?.user,
    typeof ride?.userId === "object" ? ride.userId : null
  );

export const getRideDriver = (ride) =>
  pickPerson(
    ride?.driver,
    ride?.acceptedBy,
    typeof ride?.driverId === "object" ? ride.driverId : null
  );

export const getRideDriverName = (ride) => personDisplayName(getRideDriver(ride)) || "Unassigned";

export const getRideCustomerName = (ride) => personDisplayName(getRideCustomer(ride)) || "—";

/** Prefer scheduledAt; fall back to pre_date + pre_time for booked rides. */
export const getRideScheduledLabel = (ride) => {
  if (!ride) return null;

  if (ride.scheduledAt && ride.scheduledAt !== "false") {
    const date = new Date(ride.scheduledAt);
    if (!Number.isNaN(date.getTime())) {
      return ride.scheduledAt;
    }
  }

  const preDate = typeof ride.pre_date === "string" ? ride.pre_date.trim() : "";
  const preTime = typeof ride.pre_time === "string" ? ride.pre_time.trim() : "";
  if (preDate || preTime) {
    return [preDate, preTime].filter(Boolean).join(" ");
  }

  return null;
};

export const mergeRideDetailRecords = (cached, incoming) => {
  if (!incoming) return cached || null;
  if (!cached) return incoming;

  const customer = pickPerson(incoming.customer, cached.customer, incoming.creator, cached.creator);
  const driver = pickPerson(incoming.driver, cached.driver, incoming.acceptedBy, cached.acceptedBy);

  return {
    ...cached,
    ...incoming,
    customer: customer || incoming.customer || cached.customer || null,
    driver: driver || incoming.driver || cached.driver || null,
    from: incoming.from || cached.from || null,
    destination: incoming.destination || cached.destination || null,
    payment: incoming.payment || cached.payment || null,
    driverPayout: incoming.driverPayout || cached.driverPayout || null,
    pricing: incoming.pricing || cached.pricing || null,
    pricingTimeline: incoming.pricingTimeline || cached.pricingTimeline || null,
    waitingTotals: incoming.waitingTotals ?? cached.waitingTotals ?? null,
    stops:
      Array.isArray(incoming.stops) && incoming.stops.length
        ? incoming.stops
        : cached.stops || [],
    events: Array.isArray(incoming.events) ? incoming.events : cached.events || [],
    adjustments: Array.isArray(incoming.adjustments)
      ? incoming.adjustments
      : cached.adjustments || [],
    eventCount: incoming.eventCount ?? cached.eventCount ?? null,
    eventsTruncated: incoming.eventsTruncated ?? cached.eventsTruncated ?? false,
    scheduledAt: incoming.scheduledAt ?? cached.scheduledAt ?? null,
    pre_date: incoming.pre_date ?? cached.pre_date ?? null,
    pre_time: incoming.pre_time ?? cached.pre_time ?? null,
  };
};

export const getRideDestinationAddress = (ride) => ride?.destination?.address || "—";

export const truncateRideAddress = (address, maxLength = 36) => {
  if (!address || address === "—") {
    return "—";
  }

  const trimmed = address.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
};

export const getRidePickupAddress = (ride) => ride?.from?.address || "—";

export const getRideDriverEarning = (ride) =>
  ride?.payment?.driverAmount ?? ride?.driverAmount ?? null;

export const getRideAdminEarning = (ride) =>
  ride?.payment?.adminCommission ?? ride?.adminEarned ?? null;

export const isFoodOrderBooking = (item) =>
  item?.recordType === "food_order" ||
  item?.type === "food_order" ||
  item?.category === "food";

export const getBookingTypeMeta = (item) => {
  if (isFoodOrderBooking(item)) {
    return {
      label: "Food Order",
      color: "#a855f7",
      bgcolor: "rgba(168, 85, 247, 0.12)",
    };
  }

  if (item?.type === "chaperoneride") {
    return {
      label: "Chaperone",
      color: "#0ea5e9",
      bgcolor: "rgba(14, 165, 233, 0.12)",
    };
  }

  return {
    label: "Ride",
    color: "#3b82f6",
    bgcolor: "rgba(59, 130, 246, 0.12)",
  };
};

export const getBookingReferenceLabel = (item) => {
  if (isFoodOrderBooking(item)) {
    return item?.orderNumber ? `#${item.orderNumber}` : "Food order";
  }

  if (item?.mode === "pre" || item?.mode === "scheduled") {
    return "Scheduled ride";
  }

  return "Ride";
};

export const getBookingDestinationLabel = (item) => {
  if (isFoodOrderBooking(item)) {
    const restaurant = item?.restaurant?.businessName;
    const delivery = getRideDestinationAddress(item);
    if (restaurant && delivery !== "—") {
      return `${restaurant} → ${delivery}`;
    }
    return restaurant || delivery;
  }

  return getRideDestinationAddress(item);
};

export const getRideStatusMeta = (status) => {
  const normalized = String(status || "").toLowerCase();

  switch (normalized) {
    case "completed":
      return { color: "success", label: "Completed" };
    case "started":
      return { color: "info", label: "Started" };
    case "arrived":
      return { color: "info", label: "Arrived" };
    case "pending":
      return { color: "warning", label: "Pending" };
    case "pending_payment":
      return { color: "warning", label: "Pending payment" };
    case "cancelled":
      return { color: "neutral", label: "Cancelled" };
    case "rejected":
      return { color: "warning", label: "Rejected" };
    case "disputed":
      return { color: "error", label: "Disputed" };
    case "delivered":
      return { color: "success", label: "Delivered" };
    case "received":
    case "accepted":
    case "preparing":
    case "ready_for_pickup":
    case "assigned":
    case "heading_to_restaurant":
    case "arrived_at_restaurant":
    case "picked_up":
    case "out_for_delivery":
      return {
        color: "info",
        label: normalized.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
      };
    default:
      return {
        color: "neutral",
        label: normalized
          ? normalized.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
          : "Unknown",
      };
  }
};

/** Normalize waitingTotals for legacy (plannedWaitingSeconds) + new (plannedSeconds) shapes. */
export const normalizeWaitingTotals = (waitingTotals) => {
  if (!waitingTotals || typeof waitingTotals !== "object") {
    return null;
  }

  return {
    plannedSeconds: waitingTotals.plannedSeconds ?? waitingTotals.plannedWaitingSeconds ?? null,
    actualSeconds: waitingTotals.actualSeconds ?? waitingTotals.actualWaitingSeconds ?? null,
    extraSeconds: waitingTotals.extraSeconds ?? waitingTotals.extraWaitingSeconds ?? null,
    unusedSeconds: waitingTotals.unusedSeconds ?? waitingTotals.unusedWaitingSeconds ?? null,
  };
};

export const formatRideReason = (value) => {
  if (!value || value === "false") {
    return "—";
  }

  return value;
};

export const RIDE_STATUS_FILTER_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Pending Payment", value: "pending_payment" },
  { label: "Accepted", value: "accepted" },
  { label: "Arrived", value: "arrived" },
  { label: "Started", value: "started" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rejected", value: "rejected" },
  { label: "Disputed", value: "disputed" },
];

export const RIDE_PAYMENT_FILTER_OPTIONS = [
  { label: "All Payments", value: "" },
  { label: "Paid", value: "true" },
  { label: "Unpaid", value: "false" },
];

export const defaultRideHistoryFilters = () => ({
  status: "",
  havePaid: "",
  startDate: "",
  endDate: "",
  search: "",
});

const RIDE_HISTORY_LIST_STATE_KEY = "rideHistoryListState";

export const storeRideHistoryListState = ({ page = 1, filters } = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(
      RIDE_HISTORY_LIST_STATE_KEY,
      JSON.stringify({
        page: Math.max(Number(page) || 1, 1),
        filters: {
          ...defaultRideHistoryFilters(),
          ...(filters && typeof filters === "object" ? filters : {}),
        },
      })
    );
  } catch (error) {
    console.error("storeRideHistoryListState error:", error);
  }
};

export const getStoredRideHistoryListState = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(RIDE_HISTORY_LIST_STATE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return {
      page: Math.max(Number(parsed?.page) || 1, 1),
      filters: {
        ...defaultRideHistoryFilters(),
        ...(parsed?.filters && typeof parsed.filters === "object" ? parsed.filters : {}),
      },
    };
  } catch (error) {
    console.error("getStoredRideHistoryListState error:", error);
    return null;
  }
};

export const getRideFromResponse = (response) => {
  if (!response) {
    return null;
  }

  const looksLikeRide = (value) =>
    Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        (value.rideId ||
          value._id ||
          value.orderId ||
          value.customer ||
          value.driver ||
          value.creator ||
          value.from ||
          value.destination ||
          value.status ||
          value.recordType)
    );

  if (looksLikeRide(response) && (response.rideId || response._id || response.customer || response.creator)) {
    return response;
  }

  if (looksLikeRide(response.data)) {
    // Unwrap { success, data: ride } and { data: { data: ride } }
    if (looksLikeRide(response.data.data)) {
      return response.data.data;
    }
    return response.data;
  }

  if (looksLikeRide(response.data?.ride)) {
    return response.data.ride;
  }

  if (looksLikeRide(response.ride)) {
    return response.ride;
  }

  return null;
};

export const formatRideField = (value) => {
  if (value == null || value === "" || value === "false") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
};

export const formatRideEnumLabel = (value) => {
  const formatted = formatRideField(value);

  if (formatted === "—") {
    return formatted;
  }

  return formatted
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatRideDurationSeconds = (value) => {
  if (value == null || value === "") {
    return null;
  }

  const seconds = Number(value);

  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
};

const ROUTE_ENDPOINT_KINDS = new Set(["pickup", "final", "dropoff", "destination"]);

/** Normalize legacy flat stop fields + new waiting/timing nested shape. */
export const normalizeRideStop = (stop = {}) => {
  const timing = stop?.timing && typeof stop.timing === "object" ? stop.timing : {};
  const waiting = stop?.waiting && typeof stop.waiting === "object" ? stop.waiting : {};

  return {
    ...stop,
    plannedWaitingSeconds: stop.plannedWaitingSeconds ?? waiting.plannedSeconds ?? null,
    actualWaitingSeconds: stop.actualWaitingSeconds ?? waiting.actualSeconds ?? null,
    extraWaitingSeconds: stop.extraWaitingSeconds ?? waiting.extraSeconds ?? null,
    unusedWaitingSeconds: stop.unusedWaitingSeconds ?? waiting.unusedSeconds ?? null,
    approachingAt: stop.approachingAt ?? timing.approachingAt ?? null,
    arrivedAt: stop.arrivedAt ?? timing.arrivedAt ?? null,
    waitingStartedAt: stop.waitingStartedAt ?? timing.waitingStartedAt ?? null,
    plannedWaitingEndsAt: stop.plannedWaitingEndsAt ?? timing.plannedWaitingEndsAt ?? null,
    waitingExpiredAt: stop.waitingExpiredAt ?? timing.waitingExpiredAt ?? null,
    waitingEndedAt: stop.waitingEndedAt ?? timing.waitingEndedAt ?? null,
    departedAt: stop.departedAt ?? timing.departedAt ?? null,
    completedAt: stop.completedAt ?? timing.completedAt ?? null,
  };
};

export const getRideStops = (ride) => {
  if (!Array.isArray(ride?.stops) || !ride.stops.length) {
    return [];
  }

  const pickupAddress = getRidePickupAddress(ride);
  const destinationAddress = getRideDestinationAddress(ride);

  return [...ride.stops]
    .sort((a, b) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0))
    .filter((stop) => {
      const kind = String(stop?.kind || "").toLowerCase();

      if (ROUTE_ENDPOINT_KINDS.has(kind)) {
        return false;
      }

      const address = typeof stop?.address === "string" ? stop.address.trim() : "";

      if (address && pickupAddress !== "—" && address === pickupAddress) {
        return false;
      }

      if (address && destinationAddress !== "—" && address === destinationAddress) {
        return false;
      }

      return true;
    })
    .map(normalizeRideStop);
};

/** e.g. index 0 → "Pause Point (1)" */
export const formatPausePointLabel = (indexZeroBased) => {
  const n = Math.trunc(Number(indexZeroBased)) + 1;
  return `Pause Point (${Math.max(n, 1)})`;
};

const isRouteEndpointKind = (kind) =>
  ROUTE_ENDPOINT_KINDS.has(String(kind || "").toLowerCase());

/**
 * Intermediate pause points in route order (from full ride.stops).
 * Prefer this over getRideStops for event→number mapping so pickup address
 * filtering does not drop a stop that events still reference.
 */
export const getOrderedPausePoints = (rideOrStops) => {
  const rawStops = Array.isArray(rideOrStops)
    ? rideOrStops
    : Array.isArray(rideOrStops?.stops)
      ? rideOrStops.stops
      : [];

  return [...rawStops]
    .sort((a, b) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0))
    .filter((stop) => !isRouteEndpointKind(stop?.kind))
    .map(normalizeRideStop);
};

/** 1-based pause-point number for a stopId within intermediate pause points. */
export const getPausePointNumber = (stopId, pausePoints = []) => {
  if (stopId == null || !Array.isArray(pausePoints) || !pausePoints.length) {
    return null;
  }

  const match = String(stopId);
  const index = pausePoints.findIndex(
    (stop) =>
      String(stop?.stopId ?? "") === match ||
      String(stop?._id ?? "") === match ||
      String(stop?.id ?? "") === match
  );

  return index >= 0 ? index + 1 : null;
};

const isStopRelatedEventType = (type) => {
  const normalized = String(type || "").toUpperCase();
  return (
    normalized.includes("STOP") ||
    normalized.includes("WAITING") ||
    normalized.includes("EXTRA_WAITING") ||
    normalized.includes("FINAL_DESTINATION")
  );
};

const findStopInRide = (ride, stopId) => {
  if (stopId == null || !Array.isArray(ride?.stops)) {
    return null;
  }

  const match = String(stopId);
  return (
    ride.stops.find(
      (stop) =>
        String(stop?.stopId ?? "") === match ||
        String(stop?._id ?? "") === match ||
        String(stop?.id ?? "") === match
    ) || null
  );
};

/**
 * Resolve which route stop an event refers to (pickup / pause / destination).
 * Only uses sequence fallback for stop-related event types (not Quote/Payment).
 */
export const resolveEventStopContext = (event, ride) => {
  if (!ride || !Array.isArray(ride.stops) || !ride.stops.length) {
    return { role: null, pauseNumber: null, stop: null };
  }

  const pausePoints = getOrderedPausePoints(ride);
  const stopId = event?.stopId ?? event?.metadata?.stopId ?? event?.metadata?.stop_id;
  let stop = findStopInRide(ride, stopId);

  if (!stop && isStopRelatedEventType(event?.type)) {
    const sequence = event?.sequence ?? event?.metadata?.sequence ?? event?.metadata?.stopSequence;
    if (sequence != null && sequence !== "") {
      const seqNum = Number(sequence);
      stop =
        ride.stops.find((candidate) => Number(candidate?.sequence) === seqNum) || null;
    }
  }

  if (!stop) {
    return { role: null, pauseNumber: null, stop: null };
  }

  const kind = String(stop.kind || "").toLowerCase();

  if (kind === "pickup") {
    return { role: "pickup", pauseNumber: null, stop };
  }

  if (kind === "final" || kind === "dropoff" || kind === "destination") {
    return { role: "destination", pauseNumber: null, stop };
  }

  const pauseNumber = getPausePointNumber(stop.stopId ?? stop._id ?? stop.id, pausePoints);
  if (pauseNumber) {
    return { role: "pause", pauseNumber, stop };
  }

  // Intermediate without id match — fall back to position among pause points.
  const orderedIndex = pausePoints.findIndex(
    (candidate) =>
      candidate === stop ||
      (candidate?.stopId && candidate.stopId === stop.stopId) ||
      Number(candidate?.sequence) === Number(stop?.sequence)
  );

  return {
    role: orderedIndex >= 0 ? "pause" : null,
    pauseNumber: orderedIndex >= 0 ? orderedIndex + 1 : null,
    stop,
  };
};

/** Resolve 1-based pause point number (null for pickup/destination/non-stop events). */
export const resolveEventPausePointNumber = (event, rideOrPausePoints) => {
  if (Array.isArray(rideOrPausePoints)) {
    if (!isStopRelatedEventType(event?.type)) {
      return null;
    }
    const stopId = event?.stopId ?? event?.metadata?.stopId ?? event?.metadata?.stop_id;
    return getPausePointNumber(stopId, rideOrPausePoints);
  }

  return resolveEventStopContext(event, rideOrPausePoints).pauseNumber;
};

/** Format lifecycle event types for UI/export (STOP_* → Pause Point). */
export const formatRideEventType = (type) => {
  const normalized = String(type || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();

  const withPausePoints = normalized
    .replace(/\bnext stop\b/g, "Next Pause Point")
    .replace(/\bstops\b/g, "Pause Points")
    .replace(/\bstop\b/g, "Pause Point");

  return withPausePoints.replace(/^./, (c) => c.toUpperCase());
};

const applyStopPlaceLabel = (baseLabel, placeLabel) => {
  if (/\bNext Pause Point\b/.test(baseLabel)) {
    return baseLabel.replace(/\bNext Pause Point\b/, `Next ${placeLabel}`);
  }

  if (/\bPause Points\b/.test(baseLabel)) {
    return baseLabel.replace(/\bPause Points\b/, placeLabel);
  }

  if (/\bPause Point\b/.test(baseLabel)) {
    return baseLabel.replace(/\bPause Point\b/, placeLabel);
  }

  // Append without wrapping parens so we get "Waiting started Pause Point (1)",
  // not "Waiting started (Pause Point (1))".
  return `${baseLabel} ${placeLabel}`;
};

/**
 * Event label for the timeline Event column.
 * Pickup/destination stops use those names; intermediate stops use Pause Point (1), (2), …
 * Pass the full ride object so stopId can be resolved against ride.stops.
 */
export const formatRideEventLabel = (event, ride = null) => {
  const base = formatRideEventType(event?.type);

  if (!ride || typeof ride !== "object" || Array.isArray(ride)) {
    // Legacy: pause-points array only — number intermediate stops, never non-stop events.
    if (!isStopRelatedEventType(event?.type)) {
      return base;
    }

    const pauseNumber = resolveEventPausePointNumber(event, ride || []);
    if (!pauseNumber) {
      return base;
    }

    return applyStopPlaceLabel(base, `Pause Point (${pauseNumber})`);
  }

  const { role, pauseNumber } = resolveEventStopContext(event, ride);

  if (role === "pickup") {
    return applyStopPlaceLabel(base, "Pickup");
  }

  if (role === "destination") {
    return applyStopPlaceLabel(base, "Destination");
  }

  if (role === "pause" && pauseNumber) {
    return applyStopPlaceLabel(base, `Pause Point (${pauseNumber})`);
  }

  return base;
};

export const getRideLifecycleEvents = (rideOrResponse) => {
  if (Array.isArray(rideOrResponse)) {
    return rideOrResponse;
  }

  if (Array.isArray(rideOrResponse?.events)) {
    return rideOrResponse.events;
  }

  if (Array.isArray(rideOrResponse?.data?.events)) {
    return rideOrResponse.data.events;
  }

  if (Array.isArray(rideOrResponse?.data)) {
    return rideOrResponse.data;
  }

  if (Array.isArray(rideOrResponse?.data?.data)) {
    return rideOrResponse.data.data;
  }

  return [];
};

export const sortRideLifecycleEvents = (events = []) =>
  [...events].sort((a, b) => {
    const timeA = new Date(a?.serverTimestamp || a?.createdAt || 0).getTime();
    const timeB = new Date(b?.serverTimestamp || b?.createdAt || 0).getTime();
    return timeA - timeB;
  });

export const formatRidePaymentStatus = (havePaid, paymentStatus) => {
  if (paymentStatus && paymentStatus !== "false") {
    return formatRideEnumLabel(paymentStatus);
  }

  return havePaid ? "Paid" : "Unpaid";
};

export const formatRideCommissionRate = (rate) => {
  if (rate == null || rate === "" || Number.isNaN(Number(rate))) {
    return "—";
  }

  let percent = Number(rate);
  if (!Number.isFinite(percent)) {
    return "—";
  }

  // API may send a ratio (0.19) or a whole percent (19).
  if (percent > 0 && percent <= 1) {
    percent *= 100;
  }

  // Clear float noise around whole percents (e.g. 18.95 / 19.0000001 → 19).
  const nearestInt = Math.round(percent);
  if (Math.abs(percent - nearestInt) <= 0.1) {
    return `${nearestInt}%`;
  }

  // Keep up to 2 decimals without trailing zeros (19.5 not 19.50).
  return `${parseFloat(percent.toFixed(2))}%`;
};

export const formatRideCoordinates = (location) => {
  const lat = location?.lat;
  const long = location?.long ?? location?.lng;

  if (lat == null || long == null) {
    return "—";
  }

  return `${lat}, ${long}`;
};

const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

const parseLatLngCandidate = (value) => {
  if (value == null) {
    return null;
  }

  if (Array.isArray(value) && value.length >= 2) {
    const first = Number(value[0]);
    const second = Number(value[1]);

    if (isValidLatLng(second, first)) {
      return { lat: second, lng: first };
    }

    if (isValidLatLng(first, second)) {
      return { lat: first, lng: second };
    }

    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  if (Array.isArray(value.coordinates)) {
    return parseLatLngCandidate(value.coordinates);
  }

  const lat = Number(value.lat ?? value.latitude ?? value.Lat);
  const lng = Number(value.lng ?? value.long ?? value.longitude ?? value.Lon);

  if (!isValidLatLng(lat, lng)) {
    return null;
  }

  return { lat, lng };
};

export const parseRideLatLng = (value) => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidates = [
    value,
    value.location,
    value.geo,
    value.coords,
    value.coordinates,
    value.position,
    value.from,
    value.destination,
  ];

  for (const candidate of candidates) {
    const parsed = parseLatLngCandidate(candidate);
    if (parsed) {
      return parsed;
    }
  }

  return null;
};

const roleForStop = (stop, index, total) => {
  const kind = String(stop?.kind || "").toLowerCase();

  if (index === 0 || kind === "pickup") {
    return "pickup";
  }

  if (index === total - 1) {
    return "destination";
  }

  return "stop";
};

export const getRideRoutePoints = (ride) => {
  if (!ride) {
    return [];
  }

  const sortedStops = Array.isArray(ride.stops)
    ? [...ride.stops].sort((a, b) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0))
    : [];

  let pausePointCount = 0;
  const fromStops = sortedStops.map((stop, index) => {
    const coords = parseRideLatLng(stop);
    const role = roleForStop(stop, index, sortedStops.length);
    let label = "Pause Point";

    if (role === "pickup") {
      label = "Pickup";
    } else if (role === "destination") {
      label = "Destination";
    } else {
      label = formatPausePointLabel(pausePointCount);
      pausePointCount += 1;
    }

    return {
      address: stop?.address || "",
      label,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      role,
      sequence: Number(stop?.sequence ?? index),
    };
  });

  if (fromStops.length) {
    return fromStops;
  }

  const pickupCoords = parseRideLatLng(ride.from);
  const destinationCoords = parseRideLatLng(ride.destination);
  const points = [];

  if (pickupCoords) {
    points.push({
      ...pickupCoords,
      address: ride.from?.address || "",
      label: "Pickup",
      role: "pickup",
    });
  }

  if (destinationCoords) {
    points.push({
      ...destinationCoords,
      address: ride.destination?.address || "",
      label: "Destination",
      role: "destination",
    });
  }

  return points;
};

export const storeRideDetail = (ride) => {
  if (typeof window !== "undefined" && ride) {
    sessionStorage.setItem("selectedRide", JSON.stringify(ride));
  }
};

export const getStoredRideDetail = (rideId) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem("selectedRide"));

    if (
      stored &&
      (String(stored.rideId) === String(rideId) ||
        String(stored._id) === String(rideId) ||
        String(stored.bookingId) === String(rideId) ||
        String(stored.orderId) === String(rideId))
    ) {
      return stored;
    }
  } catch (error) {
    return null;
  }

  return null;
};

export const storeOrderDetailContext = (payload) => {
  if (typeof window !== "undefined" && payload) {
    sessionStorage.setItem("selectedOrderContext", JSON.stringify(payload));
  }
};

export const getStoredOrderDetailContext = (id) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem("selectedOrderContext"));
    if (!stored) return null;

    const candidates = [
      stored.id,
      stored.rideId,
      stored.bookingId,
      stored.orderId,
      stored._id,
      stored.entityId,
      ...(Array.isArray(stored.candidateIds) ? stored.candidateIds : []),
    ]
      .filter(Boolean)
      .map(String);

    if (!id || candidates.includes(String(id))) {
      return stored;
    }
  } catch (error) {
    return null;
  }

  return null;
};

export const orderMatchesId = (order, id) => {
  if (!order || id == null) return false;
  const target = String(id);
  return [order.rideId, order._id, order.bookingId, order.orderId, order.id]
    .filter(Boolean)
    .some((value) => String(value) === target);
};
