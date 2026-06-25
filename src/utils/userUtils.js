import { getListFromResponse } from "./listUtils";

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
