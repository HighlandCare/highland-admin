import { getListFromResponse } from "./listUtils";
import {
  formatRideCurrency,
  formatRidePaymentStatus,
  formatRideReason,
  getRideAdminEarning,
  getRideCustomerName,
  getRideDestinationAddress,
  getRideDriverEarning,
  getRideDriverName,
  getRidePickupAddress,
} from "./rideUtils";

export const getDisputeList = (response) => getListFromResponse(response);

export const getDisputeRideId = (record) => {
  if (!record) {
    return null;
  }

  if (typeof record.rideId === "string" && record.rideId) {
    return record.rideId;
  }

  if (record.ride?.rideId) {
    return record.ride.rideId;
  }

  if (record.ride?._id) {
    return record.ride._id;
  }

  if (record.rideId && typeof record.rideId === "object") {
    return record.rideId.rideId || record.rideId._id || null;
  }

  return null;
};

export const getDisputeId = (record) =>
  record?.disputeId || record?._id || record?.dispute?._id || null;

export const normalizeDisputeWorkflowStatus = (status) => {
  const normalized = String(status || "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

  // Ride API uses "disputed"; in Disputes UI that means not yet actioned → Open
  if (!normalized || normalized === "disputed" || normalized === "pending") {
    return "open";
  }

  if (["underreview", "review", "in-review"].includes(normalized)) {
    return "under-review";
  }

  return normalized;
};

export const getDisputeStatusMeta = (status) => {
  const normalized = normalizeDisputeWorkflowStatus(status);

  switch (normalized) {
    case "open":
      return { color: "warning", label: "Open" };
    case "under-review":
      return { color: "info", label: "Under Review" };
    case "approved":
      return { color: "success", label: "Approved" };
    case "rejected":
      return { color: "error", label: "Rejected" };
    case "resolved":
      return { color: "success", label: "Resolved" };
    case "closed":
      return { color: "neutral", label: "Closed" };
    default:
      return { color: "warning", label: "Open" };
  }
};

export const isDisputeActionableStatus = (status) => {
  const normalized = normalizeDisputeWorkflowStatus(status);

  return !["resolved", "approved", "rejected", "closed", "completed"].includes(normalized);
};

const getNestedRide = (dispute) => {
  if (!dispute) {
    return null;
  }

  if (dispute.ride && typeof dispute.ride === "object") {
    return dispute.ride;
  }

  if (dispute.rideId && typeof dispute.rideId === "object") {
    return dispute.rideId;
  }

  return null;
};

export const normalizeDisputeRow = (record, { source = "ride" } = {}) => {
  if (!record) {
    return null;
  }

  const nestedRide = getNestedRide(record);
  const ride = nestedRide || (record.rideId && record.customer ? record : null) || record;
  const rideId = getDisputeRideId(record) || (typeof record?.rideId === "string" ? record.rideId : null);
  const disputeId =
    source === "dispute"
      ? record?._id || record?.disputeId || null
      : record?.disputeId || null;

  const status = normalizeDisputeWorkflowStatus(
    record.disputeStatus || record.status || ride?.status || "open"
  );

  return {
    key: disputeId || rideId,
    disputeId,
    rideId,
    source,
    status,
    havePaid: ride?.havePaid ?? record.havePaid ?? false,
    customer: ride?.customer || record.customer || null,
    driver: ride?.driver || record.driver || null,
    from: ride?.from || record.from || null,
    destination: ride?.destination || record.destination || null,
    estFare: ride?.estFare ?? record.estFare ?? null,
    distance: ride?.distance || record.distance || null,
    payment: ride?.payment || record.payment || null,
    adminEarned: ride?.adminEarned ?? record.adminEarned ?? null,
    numberOfPassenger: ride?.numberOfPassenger ?? record.numberOfPassenger ?? null,
    reasonOfDispute:
      record.reasonOfDispute ||
      ride?.reasonOfDispute ||
      record.reason ||
      record.description ||
      "",
    adminNotes:
      record.adminNotes ||
      record.notes ||
      record.admin_notes ||
      record.reviewNotes ||
      ride?.adminNotes ||
      "",
    createdAt: record.createdAt || ride?.createdAt || null,
    updatedAt: record.updatedAt || ride?.updatedAt || null,
    rideEndTime: ride?.rideEndTime || record.rideEndTime || null,
    rideStartTime: ride?.rideStartTime || record.rideStartTime || null,
    type: ride?.type || record.type || null,
    mode: ride?.mode || record.mode || null,
    rawDispute: source === "dispute" ? record : null,
    rawRide: ride?.customer ? ride : record.customer ? record : null,
  };
};

/** Union unpaid disputed rides with dispute records, matched by ride id. */
export const mergeDisputeSources = (unpaidRides = [], disputes = []) => {
  const byRideId = new Map();

  unpaidRides.forEach((ride) => {
    const row = normalizeDisputeRow(ride, { source: "ride" });
    if (!row?.rideId && !row?.key) {
      return;
    }
    byRideId.set(String(row.rideId || row.key), row);
  });

  disputes.forEach((dispute) => {
    const row = normalizeDisputeRow(dispute, { source: "dispute" });
    if (!row) {
      return;
    }

    const rideKey = row.rideId ? String(row.rideId) : null;
    const existing = rideKey ? byRideId.get(rideKey) : null;

    if (existing) {
      byRideId.set(rideKey, {
        ...existing,
        ...row,
        disputeId: row.disputeId || existing.disputeId,
        rideId: existing.rideId || row.rideId,
        customer: existing.customer || row.customer,
        driver: existing.driver || row.driver,
        from: existing.from || row.from,
        destination: existing.destination || row.destination,
        payment: existing.payment || row.payment,
        estFare: existing.estFare ?? row.estFare,
        distance: existing.distance || row.distance,
        havePaid: existing.havePaid ?? row.havePaid,
        reasonOfDispute: existing.reasonOfDispute || row.reasonOfDispute,
        adminNotes: row.adminNotes || existing.adminNotes,
        status: row.status || existing.status,
        source: "merged",
        rawRide: existing.rawRide || row.rawRide,
        rawDispute: row.rawDispute || existing.rawDispute,
        key: row.disputeId || existing.key,
      });
      return;
    }

    byRideId.set(String(row.disputeId || row.rideId || row.key), row);
  });

  return Array.from(byRideId.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
};

export const getDisputeDetailId = (row) => row?.disputeId || row?.rideId || row?.key || null;

/** ID used for review / approve / reject endpoints. */
export const getDisputeActionId = (row) => row?.disputeId || row?.rideId || null;

export const canReviewDispute = (row) =>
  Boolean(getDisputeActionId(row) && isDisputeActionableStatus(row?.status));

export const getDisputeAdminNotes = (row) => {
  if (!row) {
    return "";
  }

  const value =
    row.adminNotes ||
    row.notes ||
    row.admin_notes ||
    row.reviewNotes ||
    row.rawDispute?.adminNotes ||
    row.rawDispute?.notes ||
    "";

  return typeof value === "string" ? value.trim() : "";
};

export const applyDisputeActionLocally = (row, action, notes = "") => {
  const trimmedNotes = typeof notes === "string" ? notes.trim() : "";
  const nextStatus =
    action === "review" ? "under-review" : action === "approve" ? "approved" : "rejected";

  return {
    ...row,
    adminNotes: trimmedNotes || getDisputeAdminNotes(row),
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };
};

export {
  formatRideCurrency,
  formatRidePaymentStatus,
  formatRideReason,
  getRideAdminEarning,
  getRideCustomerName,
  getRideDestinationAddress,
  getRideDriverEarning,
  getRideDriverName,
  getRidePickupAddress,
};

export const storeDisputeDetail = (row) => {
  try {
    sessionStorage.setItem("selectedDispute", JSON.stringify(row));
  } catch (error) {
    console.error("Unable to store dispute detail:", error);
  }
};

export const getStoredDisputeDetail = (id) => {
  if (!id || typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem("selectedDispute"));
    if (!stored) {
      return null;
    }

    if (
      String(stored.disputeId) === String(id) ||
      String(stored.rideId) === String(id) ||
      String(stored.key) === String(id)
    ) {
      return stored;
    }
  } catch (error) {
    console.error("Unable to read stored dispute detail:", error);
  }

  return null;
};

export const getDisputeFromResponse = (response) => {
  if (!response) {
    return null;
  }

  if (response._id || response.rideId || response.disputeId) {
    return normalizeDisputeRow(response, { source: "dispute" });
  }

  if (response.data) {
    return getDisputeFromResponse(response.data);
  }

  return null;
};
