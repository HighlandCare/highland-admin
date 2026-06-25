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

export const getDriverPersonaStatus = (driver) => {
  if (!driver) {
    return "";
  }

  if (typeof driver.user === "object" && driver.user?.personaStatus) {
    return driver.user.personaStatus;
  }

  return driver.personaStatus ?? "";
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

export const getPersonaStatusFromResponse = (response) =>
  response?.data?.personaStatus ?? response?.personaStatus ?? "approved";

export const mergePersonaStatusUpdate = (driver, status = "approved") => ({
  ...driver,
  personaStatus: status,
  ...(driver?.user && typeof driver.user === "object"
    ? { user: { ...driver.user, personaStatus: status } }
    : {}),
});

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

export const updateDriverPersonaInList = (response, targetDriver, personaStatus) => {
  const nextList = getDriverList(response).map((entry) =>
    isSameDriverRecord(entry, targetDriver)
      ? mergePersonaStatusUpdate(entry, personaStatus)
      : entry
  );

  return setDriverListInResponse(response, nextList);
};

export const isPersonaApproved = (status) => String(status || "").toLowerCase() === "approved";

export const getPersonaStatusMeta = (status) =>
  isPersonaApproved(status)
    ? { color: "success", label: "Approved" }
    : { color: "warning", label: "Pending" };

export const isDriverBlocked = (driver) => !driver?.isApproved;

export const getDriverAccountStatusMeta = (driver) =>
  isDriverBlocked(driver)
    ? { color: "error", label: "Blocked" }
    : { color: "success", label: "Active" };

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
    if (stored?._id === id) {
      return stored;
    }
  } catch (error) {
    return null;
  }

  return null;
};
