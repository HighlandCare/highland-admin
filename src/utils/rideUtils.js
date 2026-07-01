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

  if (response.rideId) {
    return response;
  }

  if (response.data?.rideId) {
    return response.data;
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

    if (stored?.rideId === rideId) {
      return stored;
    }
  } catch (error) {
    return null;
  }

  return null;
};
