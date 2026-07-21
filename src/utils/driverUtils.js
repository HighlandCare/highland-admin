import { baseURL } from "../config/config";
import { ROWS_PER_PAGE } from "../components/data-table";

export const mediaBaseURL = baseURL.replace(/\/api\/v\d+\/?$/, "/");

export const getDriverList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

export const setDriverListInResponse = (response, drivers) => {
  if (Array.isArray(response)) {
    return drivers;
  }

  if (Array.isArray(response?.data?.data)) {
    return {
      ...response,
      data: {
        ...response.data,
        data: drivers,
      },
    };
  }

  return {
    ...response,
    data: drivers,
  };
};

export const hasServerPagination = (response) =>
  response?.total_pages != null || response?.totalPages != null;

export const getDriverPaginationMeta = (response, page = 1) => {
  const drivers = getDriverList(response);
  const totalRecords =
    response?.total_records ?? response?.totalRecords ?? response?.total ?? drivers.length;

  if (hasServerPagination(response)) {
    return {
      currentPage: response?.current_page ?? response?.currentPage ?? page,
      drivers,
      totalPages: Math.max(response?.total_pages ?? response?.totalPages ?? 1, 1),
      totalRecords,
      useClientPagination: false,
    };
  }

  const totalPages = Math.max(1, Math.ceil(drivers.length / ROWS_PER_PAGE));

  return {
    currentPage: Math.min(Math.max(page, 1), totalPages),
    drivers,
    totalPages,
    totalRecords,
    useClientPagination: true,
  };
};

export const paginateDrivers = (drivers, page, useClientPagination) => {
  if (!useClientPagination) {
    return drivers;
  }

  const start = (page - 1) * ROWS_PER_PAGE;
  return drivers.slice(start, start + ROWS_PER_PAGE);
};

export const getMediaUrl = (file) => {
  if (!file) {
    return null;
  }

  if (String(file).startsWith("http")) {
    return file;
  }

  return `${mediaBaseURL}${file}`;
};

export const getDriverProfileImage = (driver) =>
  getMediaUrl(driver?.user?.image?.file ?? driver?.user?.image) ??
  getMediaUrl(driver?.idCard?.file);

export const getDriverDisplayName = (driver) =>
  driver?.user?.fullName?.trim() ||
  (driver?.vehicleNo ? `Driver ${driver.vehicleNo}` : "Unknown Driver");

export const getDriverStatusLabel = (driver) => {
  if (!driver?.isApproved) {
    return { color: "warning", label: "Pending Review" };
  }

  if (driver?.status === "inRide") {
    return { color: "info", label: "In Ride" };
  }

  if (driver?.status === "idle") {
    return { color: "neutral", label: "Idle" };
  }

  return { color: "success", label: "Approved" };
};

export const normalizePersonaStatus = (status) => String(status ?? "").trim().toLowerCase();

export const getDriverPersonaStatus = (driver) => {
  if (!driver) {
    return "";
  }

  const userStatus = typeof driver.user === "object" ? driver.user?.personaStatus : undefined;
  const driverStatus = driver.personaStatus;

  return userStatus ?? driverStatus ?? "";
};

export const getDriverUserId = (driver) => {
  if (!driver) {
    return null;
  }

  if (driver.user && typeof driver.user === "object") {
    return driver.user._id ?? null;
  }

  if (typeof driver.user === "string") {
    return driver.user;
  }

  return driver.userId ?? driver._id ?? null;
};

export const getPersonaInquiryId = (driver) =>
  driver?.user?.personaInquiryId ?? driver?.personaInquiryId ?? "";

export const hasPersonaInquiry = (driver) => Boolean(getPersonaInquiryId(driver));

const ADMIN_PERSONA_DECLINED_KEY = "adminPersonaDeclinedUserIds";

const getAdminPersonaDeclinedIds = () => {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    return new Set(JSON.parse(sessionStorage.getItem(ADMIN_PERSONA_DECLINED_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

export const setAdminPersonaDeclined = (userId, declined) => {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  const ids = getAdminPersonaDeclinedIds();

  if (declined) {
    ids.add(userId);
  } else {
    ids.delete(userId);
  }

  sessionStorage.setItem(ADMIN_PERSONA_DECLINED_KEY, JSON.stringify([...ids]));
};

export const isAdminPersonaDeclined = (driver) => {
  if (!driver) {
    return false;
  }

  if (driver.adminPersonaDeclinedByAdmin) {
    return true;
  }

  const userId = getDriverUserId(driver);

  return Boolean(userId && getAdminPersonaDeclinedIds().has(userId));
};

export const getPersonaStatusFromResponse = (response, fallback = "") =>
  response?.data?.personaStatus ?? response?.personaStatus ?? fallback;

export const mergePersonaStatusUpdate = (driver, status = "approved", options = {}) => {
  const { adminDeclined = false, clearAdminDeclined = false } = options;
  const declinedByAdmin =
    adminDeclined || (clearAdminDeclined ? false : driver?.adminPersonaDeclinedByAdmin);

  return {
    ...driver,
    personaStatus: status,
    adminPersonaDeclinedByAdmin: declinedByAdmin,
    ...(driver?.user && typeof driver.user === "object"
      ? {
          user: {
            ...driver.user,
            personaStatus: status,
          },
        }
      : {}),
  };
};

export const isSameDriverRecord = (a, b) => {
  if (!a || !b) {
    return false;
  }

  if (a._id && b._id && a._id === b._id) {
    return true;
  }

  const userIdA = getDriverUserId(a);
  const userIdB = getDriverUserId(b);

  return Boolean(userIdA && userIdB && userIdA === userIdB);
};

export const updateDriverPersonaInList = (response, targetDriver, personaStatus, options = {}) => {
  const nextList = getDriverList(response).map((entry) =>
    isSameDriverRecord(entry, targetDriver)
      ? mergePersonaStatusUpdate(entry, personaStatus, options)
      : entry
  );

  return setDriverListInResponse(response, nextList);
};

export const isPersonaApproved = (status) => normalizePersonaStatus(status) === "approved";

export const isPersonaDeclined = (driverOrStatus) => {
  if (typeof driverOrStatus === "object" && driverOrStatus !== null) {
    return (
      normalizePersonaStatus(getDriverPersonaStatus(driverOrStatus)) === "declined" &&
      isAdminPersonaDeclined(driverOrStatus)
    );
  }

  return normalizePersonaStatus(driverOrStatus) === "declined";
};

const PERSONA_UNDER_REVIEW_STATUSES = [
  "completed",
  "created",
  "expired",
  "failed",
  "in_progress",
  "needs_review",
  "pending",
  "rejected",
  "started",
  "under_review",
];

export const isPersonaUnderReview = (status) => {
  const normalized = normalizePersonaStatus(status);
  return !normalized || PERSONA_UNDER_REVIEW_STATUSES.includes(normalized);
};

export const getPersonaStatusMeta = (driverOrStatus) => {
  const driver =
    typeof driverOrStatus === "object" && driverOrStatus !== null ? driverOrStatus : null;
  const status = driver ? getDriverPersonaStatus(driver) : driverOrStatus;
  const normalized = normalizePersonaStatus(status);

  if (normalized === "approved") {
    return { color: "success", label: "Approved" };
  }

  if (normalized === "declined" || normalized === "decline") {
    if (driver && isAdminPersonaDeclined(driver)) {
      return { color: "error", label: "Declined" };
    }

    return hasPersonaInquiry(driver)
      ? { color: "warning", label: "Pending Persona Review" }
      : { color: "warning", label: "Pending" };
  }

  if (!normalized) {
    return { color: "warning", label: "Pending" };
  }

  if (PERSONA_UNDER_REVIEW_STATUSES.includes(normalized)) {
    return { color: "warning", label: "Pending Persona Review" };
  }

  return { color: "warning", label: "Pending Persona Review" };
};

export const isDriverBlocked = (driver) => !driver?.isApproved;

export const getDriverAccountStatusMeta = (driver) => {
  if (isDriverBlocked(driver)) {
    return { color: "error", label: "Blocked" };
  }

  if (!isPersonaApproved(getDriverPersonaStatus(driver))) {
    return { color: "warning", label: "Inactive" };
  }

  return { color: "success", label: "Active" };
};

export const getIsApprovedFromResponse = (response) =>
  response?.data?.isApproved ?? response?.isApproved ?? true;

export const mergeDriverApprovalUpdate = (driver, isApproved) => ({
  ...driver,
  isApproved,
});

export const updateDriverApprovalInList = (response, targetDriver, isApproved) => {
  const nextList = getDriverList(response).map((entry) =>
    isSameDriverRecord(entry, targetDriver)
      ? mergeDriverApprovalUpdate(entry, isApproved)
      : entry
  );

  return setDriverListInResponse(response, nextList);
};

export const removeDriverFromList = (response, targetDriver) => {
  const nextList = getDriverList(response).filter(
    (entry) => !isSameDriverRecord(entry, targetDriver)
  );

  if (Array.isArray(response)) {
    return nextList;
  }

  const totalRecords = response?.total_records ?? response?.totalRecords;
  const nextTotal =
    typeof totalRecords === "number" ? Math.max(0, totalRecords - 1) : totalRecords;

  if (Array.isArray(response?.data?.data)) {
    return {
      ...response,
      data: {
        ...response.data,
        data: nextList,
      },
      ...(response.total_records !== undefined ? { total_records: nextTotal } : {}),
      ...(response.totalRecords !== undefined ? { totalRecords: nextTotal } : {}),
    };
  }

  if (Array.isArray(response?.data)) {
    return {
      ...response,
      data: nextList,
      ...(response.total_records !== undefined ? { total_records: nextTotal } : {}),
      ...(response.totalRecords !== undefined ? { totalRecords: nextTotal } : {}),
    };
  }

  return setDriverListInResponse(response, nextList);
};

export const storeDriverDetail = (driver) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("selectedDriver", JSON.stringify(driver));
  }
};

export const getStoredDriverDetail = (id) => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem("selectedDriver"));

    if (!stored) {
      return null;
    }

    if (stored._id === id || stored?.summary?.chaperoneId === id) {
      return stored;
    }

    return null;
  } catch (error) {
    return null;
  }
};

const formatBooleanLabel = (value, trueLabel, falseLabel) => {
  if (typeof value !== "boolean") {
    return null;
  }

  return value ? trueLabel : falseLabel;
};

export const normalizeChaperoneDetailResponse = (response) => {
  const payload = response?.data ?? response;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (payload.summary || payload.personalInformation || payload.vehicleAndLicense) {
    return {
      summary: payload.summary || {},
      personalInformation: payload.personalInformation || {},
      vehicleAndLicense: payload.vehicleAndLicense || {},
      walletAndPayments: payload.walletAndPayments || {},
      mediaAndDocuments: payload.mediaAndDocuments || {},
      transactionHistory: Array.isArray(payload.transactionHistory)
        ? payload.transactionHistory
        : [],
    };
  }

  return null;
};

export const getChaperoneDetailDisplayName = (detail) =>
  detail?.summary?.fullName ||
  detail?.personalInformation?.fullName ||
  "Unknown Driver";

export const getChaperoneDetailEmail = (detail) =>
  detail?.summary?.email || detail?.personalInformation?.email || null;

export const getChaperoneMediaUrl = (media) => getMediaUrl(media?.file ?? media);

export const getChaperoneApprovalLabel = (detail) =>
  formatBooleanLabel(detail?.summary?.isApproved, "Approved", "Pending") || "—";

export const getChaperoneOnlineLabel = (detail) =>
  formatBooleanLabel(detail?.summary?.isOnline, "Online", "Offline") || "—";

export const getChaperoneBlockedLabel = (detail) => {
  const blocked =
    detail?.summary?.isBlocked ?? detail?.personalInformation?.isBlocked;

  return formatBooleanLabel(blocked, "Blocked", "Active") || "—";
};

export const getChaperoneVerifiedLabel = (detail) =>
  formatBooleanLabel(detail?.personalInformation?.isVerified, "Verified", "Unverified") ||
  "—";

export const getChaperoneRideStatusLabel = (detail) => {
  const rideStatus = detail?.summary?.rideStatus;
  const activeRide = detail?.summary?.activeRide;

  if (rideStatus) {
    return rideStatus;
  }

  if (activeRide && typeof activeRide === "object") {
    return activeRide.status || "In Ride";
  }

  if (activeRide) {
    return "In Ride";
  }

  return "Idle";
};
