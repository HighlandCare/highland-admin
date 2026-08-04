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

export const getRideDriverName = (ride) => ride?.driver?.fullName?.trim() || "Unassigned";

export const getRideCustomerName = (ride) => ride?.customer?.fullName?.trim() || "—";

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

  if (response.rideId || response._id) {
    return response;
  }

  if (response.data?.rideId || response.data?._id) {
    return response.data;
  }

  if (response.data?.ride) {
    return response.data.ride;
  }

  if (response.ride) {
    return response.ride;
  }

  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    const nested = response.data;
    if (nested.customer || nested.driver || nested.from || nested.destination || nested.status) {
      return nested;
    }
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

export const formatRidePaymentStatus = (havePaid) => (havePaid ? "Paid" : "Unpaid");

export const formatRideCommissionRate = (rate) => {
  if (rate == null || rate === "" || Number.isNaN(Number(rate))) {
    return "—";
  }

  const numericRate = Number(rate);

  if (numericRate <= 1) {
    return `${(numericRate * 100).toFixed(2)}%`;
  }

  return `${numericRate.toFixed(2)}%`;
};

export const formatRideCoordinates = (location) => {
  const lat = location?.lat;
  const long = location?.long ?? location?.lng;

  if (lat == null || long == null) {
    return "—";
  }

  return `${lat}, ${long}`;
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
