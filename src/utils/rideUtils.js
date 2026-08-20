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
    waitingTotals: incoming.waitingTotals ?? cached.waitingTotals ?? null,
    stops:
      Array.isArray(incoming.stops) && incoming.stops.length
        ? incoming.stops
        : cached.stops || [],
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

  return item?.mode === "scheduled" ? "Scheduled ride" : "Ride";
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
      return { color: "info", label: status.replace(/_/g, " ") };
    default:
      return { color: "neutral", label: status || "Unknown" };
  }
};

export const formatRideReason = (value) => {
  if (!value || value === "false") {
    return "—";
  }

  return value;
};

export const RIDE_STATUS_FILTER_OPTIONS = [
  { label: "All Statuses", value: "" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Started", value: "started" },
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
    });
};

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

  let unlabeledStopCount = 0;
  const fromStops = sortedStops.map((stop, index) => {
    const coords = parseRideLatLng(stop);
    const role = roleForStop(stop, index, sortedStops.length);
    let label = "Stop";

    if (role === "pickup") {
      label = "Pickup";
    } else if (role === "destination") {
      label = "Destination";
    } else {
      unlabeledStopCount += 1;
      label = `Stop ${unlabeledStopCount}`;
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
