import { getListFromResponse } from "./listUtils";
import { getMediaUrl } from "./driverUtils";

export const getCustomerAuthId = (record) => {
  if (!record) {
    return null;
  }

  if (record.user && typeof record.user === "object") {
    return record.user._id ?? null;
  }

  if (typeof record.user === "string") {
    return record.user;
  }

  return record.userId ?? null;
};

const getUserRoleValues = (record) => {
  if (!record) {
    return [];
  }

  return [
    record.userType,
    record.role,
    record.userRole,
    record.type,
    record?.user?.userType,
    record?.user?.role,
    record?.user?.userRole,
    record?.user?.type,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
};

export const isAdminUser = (record) => {
  const roles = getUserRoleValues(record);

  return roles.some(
    (role) =>
      role === "admin" ||
      role === "administrator" ||
      role === "superadmin" ||
      role === "super_admin" ||
      role === "super-admin" ||
      role.includes("admin")
  );
};

export const filterOutAdminUsers = (users = []) => users.filter((user) => !isAdminUser(user));

export const excludeAdminUsersFromResponse = (response) => {
  const users = getListFromResponse(response);
  const filteredUsers = filterOutAdminUsers(users);
  const removedCount = users.length - filteredUsers.length;

  if (!removedCount) {
    return response;
  }

  if (Array.isArray(response)) {
    return filteredUsers;
  }

  if (Array.isArray(response?.data)) {
    const totalRecords = response.total_records ?? response.totalRecords;
    const nextTotal =
      typeof totalRecords === "number"
        ? Math.max(0, totalRecords - removedCount)
        : totalRecords != null && totalRecords !== ""
          ? Math.max(0, Number(totalRecords) - removedCount)
          : filteredUsers.length;

    return {
      ...response,
      data: filteredUsers,
      ...(response.total_records !== undefined
        ? { total_records: Number.isFinite(nextTotal) ? nextTotal : filteredUsers.length }
        : {}),
      ...(response.totalRecords !== undefined
        ? { totalRecords: Number.isFinite(nextTotal) ? nextTotal : filteredUsers.length }
        : {}),
    };
  }

  return {
    ...response,
    data: filteredUsers,
  };
};

export const isUserBlocked = (record) => {
  if (!record) {
    return false;
  }

  if (typeof record.user?.isDeleted === "boolean") {
    return record.user.isDeleted;
  }

  if (typeof record.isDeleted === "boolean") {
    return record.isDeleted;
  }

  if (typeof record.user?.isBlocked === "boolean") {
    return record.user.isBlocked;
  }

  if (typeof record.isBlocked === "boolean") {
    return record.isBlocked;
  }

  if (typeof record.user?.isApproved === "boolean") {
    return !record.user.isApproved;
  }

  if (typeof record.isApproved === "boolean") {
    return !record.isApproved;
  }

  return false;
};

export const getUserAccountStatusMeta = (record) =>
  isUserBlocked(record)
    ? { color: "error", label: "Blocked" }
    : { color: "success", label: "Active" };

export const getIsBlockedFromResponse = (response, fallback = false) => {
  const user = response?.data?.user ?? response?.data ?? response?.user ?? response;

  if (typeof user?.isDeleted === "boolean") {
    return user.isDeleted;
  }

  if (typeof user?.isBlocked === "boolean") {
    return user.isBlocked;
  }

  if (typeof user?.isApproved === "boolean") {
    return !user.isApproved;
  }

  if (typeof response?.data?.isDeleted === "boolean") {
    return response.data.isDeleted;
  }

  if (typeof response?.data?.isBlocked === "boolean") {
    return response.data.isBlocked;
  }

  if (typeof response?.data?.isApproved === "boolean") {
    return !response.data.isApproved;
  }

  return fallback;
};

export const setUserListInResponse = (response, users) => {
  if (Array.isArray(response)) {
    return users;
  }

  if (Array.isArray(response?.data)) {
    return {
      ...response,
      data: users,
    };
  }

  return response;
};

export const isSameUserRecord = (a, b) => {
  if (!a || !b) {
    return false;
  }

  if (a._id && b._id && a._id === b._id) {
    return true;
  }

  const authIdA = getCustomerAuthId(a);
  const authIdB = getCustomerAuthId(b);

  return Boolean(authIdA && authIdB && authIdA === authIdB);
};

export const mergeUserBlockUpdate = (record, isBlocked) => {
  if (record?.user && typeof record.user === "object") {
    return {
      ...record,
      user: {
        ...record.user,
        isDeleted: isBlocked,
        notificationOn: !isBlocked,
      },
    };
  }

  return {
    ...record,
    isDeleted: isBlocked,
  };
};

export const updateUserBlockInList = (response, targetUser, isBlocked) => {
  const nextList = getListFromResponse(response).map((entry) =>
    isSameUserRecord(entry, targetUser) ? mergeUserBlockUpdate(entry, isBlocked) : entry
  );

  return setUserListInResponse(response, nextList);
};

export const removeUserFromList = (response, targetUser) => {
  const nextList = getListFromResponse(response).filter(
    (entry) => !isSameUserRecord(entry, targetUser)
  );

  if (Array.isArray(response)) {
    return nextList;
  }

  if (Array.isArray(response?.data)) {
    const totalRecords = response.total_records ?? response.totalRecords;
    const nextTotal =
      typeof totalRecords === "number" ? Math.max(0, totalRecords - 1) : totalRecords;

    return {
      ...response,
      data: nextList,
      ...(response.total_records !== undefined ? { total_records: nextTotal } : {}),
      ...(response.totalRecords !== undefined ? { totalRecords: nextTotal } : {}),
    };
  }

  return setUserListInResponse(response, nextList);
};

export const getUserDisplayName = (record) =>
  record?.user?.fullName || record?.fullName || "Unknown user";

export const getUserProfileImage = (record) => {
  if (!record) {
    return null;
  }

  const image =
    record?.user?.image?.file ??
    record?.user?.image ??
    record?.image?.file ??
    record?.image;

  return getMediaUrl(image);
};

export const getUserDeleteId = (record) =>
  getCustomerAuthId(record) || record?._id || null;

export const storeUserDetail = (user) => {
  try {
    sessionStorage.setItem("selectedUser", JSON.stringify(user));
  } catch (error) {
    console.error("Unable to store user detail:", error);
  }
};

export const getStoredUserDetail = (id) => {
  if (!id || typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem("selectedUser"));

    if (!stored) {
      return null;
    }

    if (stored._id === id || getCustomerAuthId(stored) === id) {
      return stored;
    }

    return null;
  } catch (error) {
    console.error("Unable to read stored user detail:", error);
    return null;
  }
};
