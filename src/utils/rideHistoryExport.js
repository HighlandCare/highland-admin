import { getRideHistory } from "../Services/Auth.service";
import { downloadCsv, downloadExcel } from "./exportUtils";
import { formatDateTime } from "./dateUtils";
import {
  formatPausePointLabel,
  formatRideEventLabel,
  getBookingDestinationLabel,
  getBookingReferenceLabel,
  getBookingTypeMeta,
  getOrderedPausePoints,
  getRideAdminEarning,
  getRideCustomerName,
  getRideDriverEarning,
  getRideDriverName,
  getRideLifecycleEvents,
  getRideList,
  getRidePickupAddress,
  getRideStatusMeta,
  getRideStops,
  normalizeRideStop,
  sortRideLifecycleEvents,
} from "./rideUtils";

/** API max when export=true */
const EXPORT_PAGE_SIZE = 2000;

export const RIDE_HISTORY_EXPORT_COLUMNS = [
  { key: "recordType", label: "Record Type" },
  { key: "bookingLabel", label: "Booking Label" },
  { key: "rideId", label: "Booking / Ride ID" },
  { key: "orderNumber", label: "Order Number" },
  { key: "reference", label: "Reference" },
  { key: "type", label: "Type" },
  { key: "category", label: "Category" },
  { key: "mode", label: "Mode" },
  { key: "pricingMode", label: "Pricing Mode" },
  { key: "status", label: "Status" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "havePaid", label: "Have Paid" },
  { key: "isTestRide", label: "Test Ride" },
  { key: "date", label: "Created At" },
  { key: "paidAt", label: "Paid At" },
  { key: "scheduledAt", label: "Scheduled At" },
  { key: "rideStartTime", label: "Ride Start" },
  { key: "rideEndTime", label: "Ride End" },
  { key: "driver", label: "Driver" },
  { key: "user", label: "Customer" },
  { key: "restaurant", label: "Restaurant" },
  { key: "pickup", label: "Pickup" },
  { key: "destination", label: "Destination / Route" },
  { key: "distance", label: "Distance" },
  { key: "fare", label: "Fare / Total" },
  { key: "driverEarning", label: "Driver Earning" },
  { key: "adminEarning", label: "Admin Earning" },
  { key: "pausePointCount", label: "Pause Point Count" },
  { key: "pausePointsTimeline", label: "Pause Points Timeline" },
  { key: "eventCount", label: "Event Count" },
  { key: "eventsTruncated", label: "Events Truncated" },
  { key: "eventsTimeline", label: "Events Timeline" },
];

const formatMoneyForExport = (value) => {
  if (value == null || value === "" || Number.isNaN(Number(value))) {
    return "";
  }
  return Number(Number(value).toFixed(2));
};

const cleanDisplayValue = (value) => {
  if (value == null || value === "" || value === "—") {
    return "";
  }
  return String(value);
};

const formatYesNo = (value) => {
  if (value === true || value === "true") {
    return "Yes";
  }
  if (value === false || value === "false") {
    return "No";
  }
  return "";
};

const resolveFareAmount = (booking) => {
  const paymentTotal = booking?.payment?.totalAmount;
  if (paymentTotal != null && paymentTotal !== "") {
    return paymentTotal;
  }
  if (booking?.lockedFare != null && booking.lockedFare !== "") {
    return booking.lockedFare;
  }
  return booking?.estFare;
};

const formatSecondsForExport = (seconds) => {
  if (seconds == null || seconds === "" || Number.isNaN(Number(seconds))) {
    return "";
  }
  const total = Math.max(0, Math.round(Number(seconds)));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins <= 0) {
    return `${secs}s`;
  }
  return secs ? `${mins}m ${secs}s` : `${mins}m`;
};

const formatStopStateLabel = (state) =>
  String(state || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

/**
 * Build a readable pause-point timeline from booking.stops
 * (supports legacy flat fields + nested timing/waiting).
 */
export const formatPausePointsTimeline = (stops = [], booking = null) => {
  if (!Array.isArray(stops) || !stops.length) {
    return "";
  }

  // Prefer filtered intermediate pause points when a booking is available so
  // numbers match the detail UI (Pause Point (1), (2), …).
  const pausePoints = booking ? getRideStops(booking) : null;
  const sorted =
    pausePoints && pausePoints.length
      ? pausePoints
      : [...stops]
          .map(normalizeRideStop)
          .sort((a, b) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0));

  return sorted
    .map((stop, index) => {
      const parts = [
        formatPausePointLabel(index),
        stop?.state ? formatStopStateLabel(stop.state) : null,
        stop?.address ? `Address: ${stop.address}` : null,
        stop?.plannedWaitingSeconds != null
          ? `Planned wait: ${formatSecondsForExport(stop.plannedWaitingSeconds)}`
          : null,
        stop?.actualWaitingSeconds != null
          ? `Actual wait: ${formatSecondsForExport(stop.actualWaitingSeconds)}`
          : null,
        stop?.extraWaitingSeconds != null && Number(stop.extraWaitingSeconds) > 0
          ? `Extra wait: ${formatSecondsForExport(stop.extraWaitingSeconds)}`
          : null,
        stop?.approachingAt ? `Approaching: ${formatDateTime(stop.approachingAt)}` : null,
        stop?.arrivedAt ? `Arrived: ${formatDateTime(stop.arrivedAt)}` : null,
        stop?.waitingStartedAt ? `Waiting started: ${formatDateTime(stop.waitingStartedAt)}` : null,
        stop?.waitingEndedAt ? `Waiting ended: ${formatDateTime(stop.waitingEndedAt)}` : null,
        stop?.departedAt ? `Departed: ${formatDateTime(stop.departedAt)}` : null,
        stop?.completedAt ? `Completed: ${formatDateTime(stop.completedAt)}` : null,
        stop?.skipReason ? `Skip reason: ${stop.skipReason}` : null,
      ].filter(Boolean);

      return parts.join(" | ");
    })
    .join(" || ");
};

/** Flatten chronological events[] for CSV/Excel. */
export const formatEventsTimeline = (events = [], booking = null) => {
  if (!Array.isArray(events) || !events.length) {
    return "";
  }

  return sortRideLifecycleEvents(events)
    .map((event) => {
      const time = formatDateTime(event?.serverTimestamp || event?.clientTimestamp);
      const label = formatRideEventLabel(event, booking);
      return `${cleanDisplayValue(time)}: ${label}`;
    })
    .join(" || ");
};

export const mapRideToExportRow = (booking) => {
  const statusMeta = getRideStatusMeta(booking?.status);
  const typeMeta = getBookingTypeMeta(booking);
  const recordType = booking?.recordType || (booking?.type === "food_order" ? "food_order" : "ride");
  const pausePoints = getOrderedPausePoints(booking);
  const events = getRideLifecycleEvents(booking);
  const eventCount =
    booking?.eventCount != null ? Number(booking.eventCount) : events.length || "";

  return {
    recordType,
    bookingLabel: cleanDisplayValue(booking?.bookingLabel) || typeMeta.label,
    rideId: booking?.rideId || booking?.orderId || booking?._id || "",
    orderNumber: cleanDisplayValue(booking?.orderNumber),
    reference: getBookingReferenceLabel(booking),
    type: typeMeta.label,
    category: cleanDisplayValue(booking?.category),
    mode: cleanDisplayValue(booking?.mode),
    pricingMode: cleanDisplayValue(booking?.pricingMode),
    status: statusMeta.label,
    paymentStatus: cleanDisplayValue(booking?.paymentStatus),
    havePaid: formatYesNo(booking?.havePaid),
    isTestRide: formatYesNo(booking?.isTestRide),
    date: cleanDisplayValue(formatDateTime(booking?.createdAt)),
    paidAt: cleanDisplayValue(formatDateTime(booking?.paidAt)),
    scheduledAt: cleanDisplayValue(formatDateTime(booking?.scheduledAt)),
    rideStartTime: cleanDisplayValue(formatDateTime(booking?.rideStartTime)),
    rideEndTime: cleanDisplayValue(formatDateTime(booking?.rideEndTime)),
    driver: cleanDisplayValue(getRideDriverName(booking)),
    user: cleanDisplayValue(getRideCustomerName(booking)),
    restaurant: cleanDisplayValue(booking?.restaurant?.businessName),
    pickup: cleanDisplayValue(getRidePickupAddress(booking)),
    destination: cleanDisplayValue(getBookingDestinationLabel(booking)),
    distance: cleanDisplayValue(booking?.distance),
    fare: formatMoneyForExport(resolveFareAmount(booking)),
    driverEarning: formatMoneyForExport(
      booking?.payment?.driverAmount ?? getRideDriverEarning(booking)
    ),
    adminEarning: formatMoneyForExport(
      booking?.adminEarned ?? booking?.payment?.adminCommission ?? getRideAdminEarning(booking)
    ),
    pausePointCount: pausePoints.length || "",
    pausePointsTimeline: formatPausePointsTimeline(
      Array.isArray(booking?.stops) ? booking.stops : [],
      booking
    ),
    eventCount: eventCount === 0 ? "" : eventCount,
    eventsTruncated: formatYesNo(booking?.eventsTruncated),
    eventsTimeline: formatEventsTimeline(events, booking),
  };
};

const getExportTotalPages = (response) => {
  const totalPages =
    response?.pagination?.totalPages ??
    response?.total_pages ??
    response?.totalPages ??
    response?.data?.total_pages ??
    response?.data?.totalPages;

  return Math.max(Number(totalPages) || 1, 1);
};

const getExportCurrentPage = (response, fallback = 1) => {
  const current =
    response?.pagination?.page ??
    response?.current_page ??
    response?.currentPage ??
    response?.data?.current_page ??
    fallback;

  return Math.max(Number(current) || fallback, 1);
};

/**
 * Fetch all booking-history rows for export using:
 * GET /admin/ride-history?export=true&limit=2000&page=N + active filters
 */
export const fetchRideHistoryForExport = async (filters = {}) => {
  const exportFilters = {
    ...filters,
    export: true,
    recordType: filters.recordType || filters.service || "ride",
    type: filters.type || filters.bookingType || "ride",
  };

  let page = 1;
  let allItems = [];
  let totalPages = 1;

  do {
    const response = await getRideHistory(page, EXPORT_PAGE_SIZE, exportFilters);
    const items = getRideList(response);
    allItems = allItems.concat(items);

    totalPages = getExportTotalPages(response);
    const currentPage = getExportCurrentPage(response, page);

    if (currentPage >= totalPages || !items.length) {
      break;
    }

    page = currentPage + 1;
  } while (page <= totalPages && page <= 500);

  return allItems.map(mapRideToExportRow);
};

const buildExportFilename = (filters = {}, extension) => {
  const stamp = new Date().toISOString().slice(0, 10);
  const parts = ["ride-history", stamp];

  if (filters.status) {
    parts.push(String(filters.status));
  }
  if (filters.startDate || filters.from) {
    parts.push(`from-${filters.startDate || filters.from}`);
  }
  if (filters.endDate || filters.to) {
    parts.push(`to-${filters.endDate || filters.to}`);
  }

  return `${parts.join("_")}.${extension}`;
};

export const exportRideHistory = async (filters = {}, format = "csv") => {
  const rows = await fetchRideHistoryForExport(filters);

  if (!rows.length) {
    throw new Error("No ride history data found for the selected filters");
  }

  if (format === "excel") {
    downloadExcel(RIDE_HISTORY_EXPORT_COLUMNS, rows, buildExportFilename(filters, "xls"));
  } else {
    downloadCsv(RIDE_HISTORY_EXPORT_COLUMNS, rows, buildExportFilename(filters, "csv"));
  }

  return rows.length;
};
