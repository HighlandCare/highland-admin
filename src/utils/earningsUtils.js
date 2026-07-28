import { getMediaUrl } from "./driverUtils";
import { getListFromResponse } from "./listUtils";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export const formatEarningsCurrency = (value) => {
  if (value == null || value === "" || Number.isNaN(Number(value))) {
    return "—";
  }

  return currencyFormatter.format(Number(value));
};

export const getEarningsDriverId = (driver) =>
  driver?._id || driver?.userId || driver?.user?._id || null;

export const getEarningsDriverName = (driver) =>
  driver?.fullName ||
  driver?.name ||
  driver?.user?.fullName ||
  driver?.user?.name ||
  driver?.email ||
  driver?.user?.email ||
  "Unknown driver";

export const getEarningsDriverEmail = (driver) =>
  driver?.email || driver?.user?.email || driver?.userEmail || null;

export const getEarningsDriverPhone = (driver) =>
  driver?.phone ||
  driver?.phoneNumber ||
  driver?.mobile ||
  driver?.user?.phone ||
  driver?.user?.phoneNumber ||
  null;

export const getEarningsDriverImage = (driver) => {
  if (!driver) {
    return null;
  }

  const candidates = [
    driver?.image?.file,
    driver?.image?.url,
    driver?.image?.path,
    typeof driver?.image === "string" ? driver.image : null,
    driver?.user?.image?.file,
    driver?.user?.image?.url,
    typeof driver?.user?.image === "string" ? driver.user.image : null,
    driver?.profileImage?.file,
    driver?.profileImage?.url,
    typeof driver?.profileImage === "string" ? driver.profileImage : null,
    driver?.profilePhoto?.file,
    driver?.profilePhoto?.url,
    typeof driver?.profilePhoto === "string" ? driver.profilePhoto : null,
    driver?.avatar?.file,
    driver?.avatar?.url,
    typeof driver?.avatar === "string" ? driver.avatar : null,
    driver?.photo?.file,
    typeof driver?.photo === "string" ? driver.photo : null,
  ];

  for (const candidate of candidates) {
    const url = getMediaUrl(candidate);
    if (url) {
      return url;
    }
  }

  return null;
};

const PROFILE_FIELD_LABELS = {
  fullName: "Full Name",
  name: "Full Name",
  email: "Email",
  phone: "Phone",
  phoneNumber: "Phone",
  mobile: "Phone",
  gender: "Gender",
  dob: "Date of Birth",
  dateOfBirth: "Date of Birth",
  address: "Address",
  location: "Location",
  city: "City",
  state: "State",
  zipCode: "Zip Code",
  zip: "Zip Code",
  personaStatus: "Persona Status",
  isVerified: "Verified",
  verified: "Verified",
  isApproved: "Approved",
  approvalStatus: "Approval Status",
  status: "Status",
  online: "Online",
  isOnline: "Online",
  vehicleNo: "Vehicle No",
  vehicleNumber: "Vehicle No",
  vehicleType: "Vehicle Type",
  rating: "Rating",
  userType: "User Type",
  deviceType: "Device Type",
  createdAt: "Joined",
  updatedAt: "Last Updated",
  lastActiveAt: "Last Active",
  lastActive: "Last Active",
};

const PROFILE_SKIP_KEYS = new Set([
  "_id",
  "id",
  "userId",
  "authId",
  "chaperoneId",
  "driverId",
  "stripeId",
  "stripeAccountId",
  "stripe_account_id",
  "stripeConnectId",
  "password",
  "token",
  "otp",
  "fcmToken",
  "deviceToken",
  "image",
  "profileImage",
  "profilePhoto",
  "avatar",
  "photo",
  "idCard",
  "user",
  "driver",
  "data",
  "summary",
  "transactions",
  "transactionHistory",
  "withdrawals",
  "withdrawalHistory",
  "walletHistory",
  "totalEarned",
  "total_earned",
  "earned",
  "earnings",
  "walletBalance",
  "wallet_balance",
  "wallet",
  "remainingBalance",
  "totalWithdrawn",
  "total_withdrawn",
  "rideCount",
  "ride_count",
  "totalRides",
  "total_rides",
  "rides",
  "success",
  "message",
]);

const isIdLikeKey = (key) => {
  const normalized = String(key || "");
  return (
    normalized === "_id" ||
    normalized === "id" ||
    /(?:^|_)id$/i.test(normalized) ||
    /Id$/.test(normalized) ||
    /(?:^|_)ids$/i.test(normalized)
  );
};

const formatProfileFieldValue = (key, value) => {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "object") {
    return null;
  }

  const text = String(value).trim();
  if (!text) {
    return null;
  }

  if (
    key === "createdAt" ||
    key === "updatedAt" ||
    key === "lastActiveAt" ||
    key === "lastActive" ||
    key === "dob" ||
    key === "dateOfBirth"
  ) {
    return text;
  }

  if (key === "personaStatus" || key === "approvalStatus" || key === "status") {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  if (key === "email" || text.includes("@")) {
    return text.toLowerCase();
  }

  return text;
};

/** Collect user/profile display fields from an earnings driver record (no IDs). */
export const getEarningsDriverProfileFields = (driver) => {
  if (!driver || typeof driver !== "object") {
    return [];
  }

  const source = {
    ...(driver.user && typeof driver.user === "object" ? driver.user : {}),
    ...driver,
  };

  const preferredOrder = [
    "fullName",
    "name",
    "email",
    "phone",
    "phoneNumber",
    "mobile",
    "gender",
    "dob",
    "dateOfBirth",
    "address",
    "location",
    "city",
    "state",
    "zipCode",
    "zip",
    "personaStatus",
    "isVerified",
    "verified",
    "isApproved",
    "approvalStatus",
    "online",
    "isOnline",
    "vehicleNo",
    "vehicleNumber",
    "vehicleType",
    "rating",
    "userType",
    "deviceType",
    "createdAt",
    "updatedAt",
    "lastActiveAt",
    "lastActive",
  ];

  const usedLabels = new Set();
  const fields = [];

  const pushField = (key, rawValue) => {
    if (PROFILE_SKIP_KEYS.has(key) || isIdLikeKey(key)) {
      return;
    }

    const label = PROFILE_FIELD_LABELS[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).replace(/_/g, " ");
    if (usedLabels.has(label)) {
      return;
    }

    const value = formatProfileFieldValue(key, rawValue);
    if (value == null) {
      return;
    }

    usedLabels.add(label);
    fields.push({ key, label, value });
  };

  preferredOrder.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      pushField(key, source[key]);
    }
  });

  Object.keys(source).forEach((key) => {
    if (preferredOrder.includes(key)) {
      return;
    }
    pushField(key, source[key]);
  });

  return fields;
};

/** Prefer non-empty detail values, keep cached profile fields when API omits them. */
export const mergeEarningsDriverRecords = (cached, detail) => {
  if (!detail && !cached) {
    return null;
  }

  if (!detail) {
    return cached;
  }

  if (!cached) {
    return detail;
  }

  const prefer = (next, prev) => (next != null && next !== "" ? next : prev);

  return {
    ...cached,
    ...detail,
    fullName: prefer(detail.fullName, cached.fullName),
    name: prefer(detail.name, cached.name),
    email: prefer(detail.email, cached.email),
    phone: prefer(detail.phone, cached.phone),
    phoneNumber: prefer(detail.phoneNumber, cached.phoneNumber),
    image: prefer(detail.image, cached.image),
    profileImage: prefer(detail.profileImage, cached.profileImage),
    profilePhoto: prefer(detail.profilePhoto, cached.profilePhoto),
    avatar: prefer(detail.avatar, cached.avatar),
    isVerified: detail.isVerified ?? cached.isVerified,
    personaStatus: prefer(detail.personaStatus, cached.personaStatus),
    createdAt: prefer(detail.createdAt, cached.createdAt),
    updatedAt: prefer(detail.updatedAt, cached.updatedAt),
    walletBalance: detail.walletBalance ?? cached.walletBalance,
    totalEarned: detail.totalEarned ?? cached.totalEarned,
    totalWithdrawn: detail.totalWithdrawn ?? cached.totalWithdrawn,
    transactions: Array.isArray(detail.transactions) ? detail.transactions : cached.transactions,
  };
};

export const getDriverStripeId = (record) => {
  if (!record) {
    return null;
  }

  const candidates = [
    record.stripeId,
    record.stripeAccountId,
    record.stripe_account_id,
    record.stripeConnectId,
    record.user?.stripeId,
    record.user?.stripeAccountId,
    record.stripe?.id,
    record.stripe?.accountId,
  ];

  const value = candidates.find((item) => typeof item === "string" && item.trim());
  return value ? value.trim() : null;
};

export const getStripeConnectionStatus = (record) => {
  if (!record) {
    return { connected: false, label: "Not Connected", stripeId: null };
  }

  if (
    record.isStripeConnected === true ||
    record.stripeConnected === true ||
    record.user?.isStripeConnected === true ||
    record.user?.stripeConnected === true
  ) {
    return {
      connected: true,
      label: "Connected",
      stripeId: getDriverStripeId(record),
    };
  }

  if (
    record.isStripeConnected === false ||
    record.stripeConnected === false ||
    record.user?.isStripeConnected === false ||
    record.user?.stripeConnected === false
  ) {
    return { connected: false, label: "Not Connected", stripeId: null };
  }

  const stripeId = getDriverStripeId(record);
  return stripeId
    ? { connected: true, label: "Connected", stripeId }
    : { connected: false, label: "Not Connected", stripeId: null };
};

export const getDriverWalletBalance = (record) => {
  if (!record) {
    return null;
  }

  const value =
    record.walletBalance ??
    record.wallet_balance ??
    record.wallet ??
    record.remainingBalance ??
    record.user?.walletBalance ??
    record.user?.wallet;

  if (value == null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const getDriverTotalEarned = (record) => {
  if (!record) {
    return null;
  }

  const value =
    record.totalEarned ??
    record.total_earned ??
    record.earned ??
    record.earnings ??
    record.user?.totalEarned;

  if (value == null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const getDriverTotalWithdrawn = (record) => {
  if (!record) {
    return null;
  }

  const value =
    record.totalWithdrawn ??
    record.total_withdrawn ??
    record.withdrawn ??
    record.user?.totalWithdrawn;

  if (value == null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const getDriverRideCount = (record) => {
  if (!record) {
    return null;
  }

  const value =
    record.rideCount ??
    record.ride_count ??
    record.totalRides ??
    record.total_rides ??
    record.rides;

  if (value == null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const findMatchingEarningsDriver = (earningsDrivers, driver) => {
  if (!driver || !Array.isArray(earningsDrivers) || !earningsDrivers.length) {
    return null;
  }

  const candidateIds = [
    driver._id,
    driver.user?._id,
    driver.userId,
    getEarningsDriverId(driver),
  ]
    .filter(Boolean)
    .map(String);

  const driverEmail = driver?.user?.email || driver?.email;

  return (
    earningsDrivers.find((item) => {
      const earningsId = getEarningsDriverId(item);
      if (earningsId && candidateIds.includes(String(earningsId))) {
        return true;
      }

      if (
        driverEmail &&
        item?.email &&
        String(item.email).toLowerCase() === String(driverEmail).toLowerCase()
      ) {
        return true;
      }

      return false;
    }) || null
  );
};

export const storeEarningsDetail = (driver) => {
  try {
    sessionStorage.setItem("selectedEarningsDriver", JSON.stringify(driver));
  } catch (error) {
    console.error("Unable to store earnings detail:", error);
  }
};

export const getStoredEarningsDetail = (id) => {
  if (!id || typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(sessionStorage.getItem("selectedEarningsDriver"));

    if (!stored) {
      return null;
    }

    if (getEarningsDriverId(stored) === id) {
      return stored;
    }

    return null;
  } catch (error) {
    console.error("Unable to read stored earnings detail:", error);
    return null;
  }
};

const toNumberOrNull = (value) => {
  if (value == null || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getTransactionDate = (transaction) =>
  transaction?.createdAt ||
  transaction?.updatedAt ||
  transaction?.date ||
  transaction?.transactionDate ||
  transaction?.withdrawnAt ||
  transaction?.timestamp ||
  null;

export const normalizeDriverTransactions = (payload) => {
  const sourceLists = [
    Array.isArray(payload) ? payload : null,
    Array.isArray(payload?.data) ? payload.data : null,
    Array.isArray(payload?.transactions) ? payload.transactions : null,
    Array.isArray(payload?.transactionHistory) ? payload.transactionHistory : null,
    Array.isArray(payload?.withdrawals) ? payload.withdrawals : null,
    Array.isArray(payload?.walletHistory) ? payload.walletHistory : null,
    Array.isArray(payload?.withdrawalHistory) ? payload.withdrawalHistory : null,
    Array.isArray(payload?.data?.transactions) ? payload.data.transactions : null,
    Array.isArray(payload?.data?.transactionHistory) ? payload.data.transactionHistory : null,
    Array.isArray(payload?.data?.withdrawals) ? payload.data.withdrawals : null,
    Array.isArray(payload?.data?.walletHistory) ? payload.data.walletHistory : null,
  ].filter(Boolean);

  const list = sourceLists[0] || [];

  return list
    .map((transaction, index) => {
      const amount = toNumberOrNull(
        transaction?.amount ??
          transaction?.total_amount ??
          transaction?.withdrawalAmount ??
          transaction?.withdrawAmount ??
          transaction?.debitAmount ??
          transaction?.value
      );

      const paidAmount = toNumberOrNull(
        transaction?.paid_amount ?? transaction?.paidAmount ?? transaction?.driverEarning
      );

      const remainingBalance = toNumberOrNull(
        transaction?.remainingBalance ??
          transaction?.remainingWallet ??
          transaction?.walletBalance ??
          transaction?.balanceAfter ??
          transaction?.currentBalance ??
          transaction?.balance
      );

      const date = getTransactionDate(transaction);
      const status = transaction?.status || transaction?.type || transaction?.transactionType || null;
      const fromName =
        transaction?.sendBy?.fullName ||
        transaction?.sendBy?.email ||
        transaction?.from?.fullName ||
        transaction?.senderName ||
        null;

      if (amount == null && paidAmount == null && remainingBalance == null && !date) {
        return null;
      }

      return {
        id: transaction?._id || transaction?.id || `txn-${index}`,
        amount,
        paidAmount,
        remainingBalance,
        date,
        status,
        fromName,
        serviceCategory: transaction?.serviceCategory || null,
        type: status || "Transaction",
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
};

export const getTransactionsFromDriverRecord = (driver) => {
  if (!driver) {
    return [];
  }

  return normalizeDriverTransactions({
    transactions: driver.transactions,
    withdrawals: driver.withdrawals,
    walletHistory: driver.walletHistory,
    transactionHistory: driver.transactionHistory,
    withdrawalHistory: driver.withdrawalHistory,
    data: driver.data,
  });
};

/**
 * Normalize `GET admin/driver-earnings/:id`
 * Shape:
 * {
 *   success: true,
 *   data: {
 *     driver: { _id, email, phone, fullName, image, ... },
 *     walletBalance, totalEarned, totalWithdrawn, transactions, stripeAccountId
 *   }
 * }
 */
export const normalizeDriverEarningsByIdResponse = (response) => {
  if (!response || typeof response !== "object") {
    return null;
  }

  const payload =
    response.data && typeof response.data === "object" && !Array.isArray(response.data)
      ? response.data
      : response;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  const profile =
    (payload.driver && typeof payload.driver === "object" && !Array.isArray(payload.driver)
      ? payload.driver
      : null) ||
    (payload.user && typeof payload.user === "object" && !Array.isArray(payload.user)
      ? payload.user
      : null) ||
    {};

  const hasProfile = Boolean(
    profile._id || profile.email || profile.fullName || profile.phone || profile.image
  );
  const hasEarnings =
    payload.totalEarned != null ||
    payload.walletBalance != null ||
    payload.totalWithdrawn != null ||
    Array.isArray(payload.transactions) ||
    payload._id ||
    payload.email ||
    payload.fullName;

  if (!hasProfile && !hasEarnings) {
    return null;
  }

  const { driver: _omitDriver, user: _omitUser, ...earningsRoot } = payload;

  return {
    ...profile,
    ...earningsRoot,
    _id: profile._id || earningsRoot._id || null,
    fullName: profile.fullName || profile.name || earningsRoot.fullName || earningsRoot.name || null,
    email: profile.email || earningsRoot.email || null,
    phone:
      profile.phone ||
      profile.phoneNumber ||
      earningsRoot.phone ||
      earningsRoot.phoneNumber ||
      null,
    image: profile.image || earningsRoot.image || profile.profileImage || null,
    isVerified: profile.isVerified ?? earningsRoot.isVerified ?? null,
    personaStatus: profile.personaStatus || earningsRoot.personaStatus || null,
    createdAt: profile.createdAt || earningsRoot.createdAt || null,
    updatedAt: profile.updatedAt || earningsRoot.updatedAt || null,
    walletBalance:
      payload.walletBalance != null ? payload.walletBalance : profile.walletBalance ?? null,
    totalEarned: payload.totalEarned != null ? payload.totalEarned : profile.totalEarned ?? null,
    totalWithdrawn:
      payload.totalWithdrawn != null ? payload.totalWithdrawn : profile.totalWithdrawn ?? null,
    transactions: Array.isArray(payload.transactions)
      ? payload.transactions
      : Array.isArray(profile.transactions)
        ? profile.transactions
        : [],
  };
};

export const getEarningsChaperoneIdCandidates = (driver) => {
  if (!driver) {
    return [];
  }

  return [
    driver.chaperoneId,
    driver.driverId,
    driver._id,
    driver.userId,
    driver.user?._id,
    driver.authId,
    getEarningsDriverId(driver),
  ].filter(Boolean);
};

const pickSummaryNumber = (...candidates) => {
  for (const candidate of candidates) {
    if (candidate == null || candidate === "") {
      continue;
    }

    const number = Number(candidate);
    if (Number.isFinite(number)) {
      return number;
    }
  }

  return 0;
};

const hasOwnSummaryValue = (...candidates) =>
  candidates.some((candidate) => candidate != null && candidate !== "");

const getResponseSummary = (response) => {
  if (response?.summary && typeof response.summary === "object") {
    return response.summary;
  }

  if (response?.data?.summary && typeof response.data.summary === "object") {
    return response.data.summary;
  }

  return {};
};

/** True when the API returned aggregate earnings totals (not only total_drivers). */
export const hasEarningsApiTotals = (response) => {
  if (!response || typeof response !== "object") {
    return false;
  }

  const summary = getResponseSummary(response);

  return hasOwnSummaryValue(
    summary.totalEarned,
    summary.total_earned,
    summary.walletBalance,
    summary.wallet_balance,
    summary.totalRides,
    summary.total_rides,
    response.total_earned,
    response.totalEarned,
    response.total_wallet_balance,
    response.totalWalletBalance,
    response.total_rides,
    response.totalRides,
    response.data?.total_earned,
    response.data?.totalEarned,
    response.data?.total_wallet_balance,
    response.data?.totalWalletBalance,
    response.data?.total_rides,
    response.data?.totalRides
  );
};

export const summarizeEarningsAnalytics = (response) => {
  const drivers = getListFromResponse(response);
  const summary = getResponseSummary(response);
  const root = response?.data && !Array.isArray(response.data) && typeof response.data === "object"
    ? response.data
    : response;

  const listTotalEarned = drivers.reduce(
    (sum, driver) => sum + (getDriverTotalEarned(driver) ?? 0),
    0
  );
  const listTotalWallet = drivers.reduce(
    (sum, driver) => sum + (getDriverWalletBalance(driver) ?? 0),
    0
  );
  const listTotalRides = drivers.reduce(
    (sum, driver) => sum + (getDriverRideCount(driver) ?? 0),
    0
  );

  const driversCount = pickSummaryNumber(
    summary.drivers,
    summary.total_drivers,
    root?.total_drivers,
    root?.totalDrivers,
    response?.total_drivers,
    response?.totalDrivers,
    response?.total_records,
    response?.totalRecords,
    drivers.length
  );

  const totalEarned = pickSummaryNumber(
    summary.totalEarned,
    summary.total_earned,
    root?.total_earned,
    root?.totalEarned,
    response?.total_earned,
    response?.totalEarned,
    listTotalEarned
  );

  const totalWallet = pickSummaryNumber(
    summary.walletBalance,
    summary.wallet_balance,
    root?.total_wallet_balance,
    root?.totalWalletBalance,
    response?.total_wallet_balance,
    response?.totalWalletBalance,
    listTotalWallet
  );

  const totalRides = pickSummaryNumber(
    summary.totalRides,
    summary.total_rides,
    root?.total_rides,
    root?.totalRides,
    response?.total_rides,
    response?.totalRides,
    listTotalRides
  );

  const topEarners = [...drivers]
    .map((driver) => ({
      ...driver,
      totalEarned: getDriverTotalEarned(driver) ?? 0,
    }))
    .filter((driver) => driver.totalEarned > 0)
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, 8);

  const averageEarned = driversCount ? totalEarned / driversCount : 0;

  return {
    drivers,
    driversCount,
    totalEarned,
    totalWallet,
    totalRides,
    averageEarned,
    topEarners,
    hasApiTotals: hasEarningsApiTotals(response),
    hasEarnings: totalEarned > 0 || totalWallet > 0 || totalRides > 0 || driversCount > 0,
  };
};
