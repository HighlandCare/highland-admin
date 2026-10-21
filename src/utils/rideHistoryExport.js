import { getRideHistory } from "../Services/Auth.service";
import { downloadCsv, downloadExcel } from "./exportUtils";
import { formatDateTime } from "./dateUtils";
import {
  formatPausePointLabel,
  formatRideEventLabel,
  getBookingDestinationLabel,
  getRideAdminEarning,
  getRideCustomerName,
  getRideDriverEarning,
  getRideDriverName,
  getRideLifecycleEvents,
  getRideList,
  getRidePickupAddress,
  getRideStatusMeta,
  normalizeRideStop,
  sortRideLifecycleEvents,
} from "./rideUtils";

/** API max when export=true */
const EXPORT_PAGE_SIZE = 2000;

/** Core booking columns (stops are appended dynamically per export). */
export const RIDE_HISTORY_BASE_EXPORT_COLUMNS = [
  { key: "recordType", label: "Record Type" },
  { key: "rideId", label: "Booking / Ride ID" },
  { key: "status", label: "Status" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "havePaid", label: "Have Paid" },
  { key: "date", label: "Created At" },
  { key: "paidAt", label: "Paid At" },
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
  { key: "stopsCount", label: "Stops Count" },
];

export const RIDE_HISTORY_TAIL_EXPORT_COLUMNS = [
  { key: "eventsTimeline", label: "Events Timeline" },
];

/** Per-stop fields expanded as Stop 1 … Stop N columns. */
const STOP_EXPORT_FIELDS = [
  { key: "Label", label: "Label" },
  { key: "Address", label: "Address" },
  { key: "State", label: "State" },
  { key: "PlannedWaiting", label: "Planned Waiting" },
  { key: "ActualWaiting", label: "Actual Waiting" },
  { key: "ExtraWaiting", label: "Extra Waiting" },
  { key: "ApproachingAt", label: "Approaching At" },
  { key: "ArrivedAt", label: "Arrived At" },
  { key: "WaitingStartedAt", label: "Waiting Started" },
  { key: "WaitingEndedAt", label: "Waiting Ended" },
  { key: "DepartedAt", label: "Departed At" },
  { key: "CompletedAt", label: "Completed At" },
  { key: "SkipReason", label: "Skip Reason" },
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

const formatStopStateLabel = (state) => {
  if (!state) {
    return "";
  }

  return String(state)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
};

const formatStopExportLabel = (stop, pausePointIndexRef) => {
  const kind = String(stop?.kind || "").toLowerCase();

  if (kind === "pickup") {
    return "Pickup";
  }

  if (kind === "final" || kind === "dropoff" || kind === "destination") {
    return "Destination";
  }

  const label = formatPausePointLabel(pausePointIndexRef.current);
  pausePointIndexRef.current += 1;
  return label;
};

const getSortedStops = (stops = []) =>
  [...stops]
    .map(normalizeRideStop)
    .sort((a, b) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0));

/** Flatten each stop into Stop N * field keys on the row. */
export const flattenStopsForExport = (stops = []) => {
  const sorted = getSortedStops(stops);
  const pausePointIndexRef = { current: 0 };
  const fields = {};

  sorted.forEach((stop, index) => {
    const n = index + 1;
    const prefix = `stop${n}`;

    fields[`${prefix}Label`] = formatStopExportLabel(stop, pausePointIndexRef);
    fields[`${prefix}Address`] = cleanDisplayValue(stop?.address);
    fields[`${prefix}State`] = formatStopStateLabel(stop?.state);
    fields[`${prefix}PlannedWaiting`] = formatSecondsForExport(stop?.plannedWaitingSeconds);
    fields[`${prefix}ActualWaiting`] = formatSecondsForExport(stop?.actualWaitingSeconds);
    fields[`${prefix}ExtraWaiting`] = formatSecondsForExport(stop?.extraWaitingSeconds);
    fields[`${prefix}ApproachingAt`] = cleanDisplayValue(formatDateTime(stop?.approachingAt));
    fields[`${prefix}ArrivedAt`] = cleanDisplayValue(formatDateTime(stop?.arrivedAt));
    fields[`${prefix}WaitingStartedAt`] = cleanDisplayValue(
      formatDateTime(stop?.waitingStartedAt)
    );
    fields[`${prefix}WaitingEndedAt`] = cleanDisplayValue(formatDateTime(stop?.waitingEndedAt));
    fields[`${prefix}DepartedAt`] = cleanDisplayValue(formatDateTime(stop?.departedAt));
    fields[`${prefix}CompletedAt`] = cleanDisplayValue(formatDateTime(stop?.completedAt));
    fields[`${prefix}SkipReason`] = cleanDisplayValue(stop?.skipReason);
  });

  return { fields, stopsCount: sorted.length };
};

export const buildStopExportColumns = (maxStops = 0) => {
  const columns = [];

  for (let n = 1; n <= maxStops; n += 1) {
    STOP_EXPORT_FIELDS.forEach((field) => {
      columns.push({
        key: `stop${n}${field.key}`,
        label: `Stop ${n} ${field.label}`,
      });
    });
  }

  return columns;
};

export const buildRideHistoryExportColumns = (maxStops = 0) => [
  ...RIDE_HISTORY_BASE_EXPORT_COLUMNS,
  ...buildStopExportColumns(maxStops),
  ...RIDE_HISTORY_TAIL_EXPORT_COLUMNS,
];

/** @deprecated Prefer buildRideHistoryExportColumns(maxStops) for dynamic stop columns. */
export const RIDE_HISTORY_EXPORT_COLUMNS = buildRideHistoryExportColumns(0);

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
  const stops = Array.isArray(booking?.stops) ? booking.stops : [];
  const { fields: stopFields, stopsCount } = flattenStopsForExport(stops);
  const events = getRideLifecycleEvents(booking);

  return {
    recordType:
      booking?.recordType || (booking?.type === "food_order" ? "food_order" : "ride"),
    rideId: booking?.rideId || booking?.orderId || booking?._id || "",
    status: statusMeta.label,
    paymentStatus: cleanDisplayValue(booking?.paymentStatus),
    havePaid: formatYesNo(booking?.havePaid),
    date: cleanDisplayValue(formatDateTime(booking?.createdAt)),
    paidAt: cleanDisplayValue(formatDateTime(booking?.paidAt)),
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
    stopsCount: stopsCount || "",
    ...stopFields,
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

const getMaxStopsCount = (rows = []) =>
  rows.reduce((max, row) => {
    const count = Number(row?.stopsCount) || 0;
    return count > max ? count : max;
  }, 0);

export const exportRideHistory = async (filters = {}, format = "csv") => {
  const rows = await fetchRideHistoryForExport(filters);

  if (!rows.length) {
    throw new Error("No ride history data found for the selected filters");
  }

  const columns = buildRideHistoryExportColumns(getMaxStopsCount(rows));

  if (format === "excel") {
    downloadExcel(columns, rows, buildExportFilename(filters, "xls"));
  } else {
    downloadCsv(columns, rows, buildExportFilename(filters, "csv"));
  }

  return rows.length;
};
