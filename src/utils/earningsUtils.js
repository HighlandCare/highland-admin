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
  driver?.fullName || driver?.email || "Unknown driver";

export const getEarningsDriverImage = (driver) => {
  if (!driver) {
    return null;
  }

  // Earnings API: { image: { file, fileType, _id } }
  const candidates = [
    driver?.image?.file,
    typeof driver?.image === "string" ? driver.image : null,
    driver?.user?.image?.file,
    typeof driver?.user?.image === "string" ? driver.user.image : null,
    driver?.profileImage?.file,
    typeof driver?.profileImage === "string" ? driver.profileImage : null,
    driver?.profilePhoto?.file,
    typeof driver?.profilePhoto === "string" ? driver.profilePhoto : null,
  ];

  for (const candidate of candidates) {
    const url = getMediaUrl(candidate);
    if (url) {
      return url;
    }
  }

  return null;
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

  const value = record.totalEarned ?? record.earnings ?? record.user?.totalEarned;

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

export const summarizeEarningsAnalytics = (response) => {
  const drivers = getListFromResponse(response);

  const totalEarned = drivers.reduce((sum, driver) => {
    const value = Number(driver?.totalEarned);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const totalWallet = drivers.reduce((sum, driver) => {
    const value = Number(driver?.walletBalance);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const totalRides = drivers.reduce((sum, driver) => {
    const value = Number(driver?.rideCount);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const topEarners = [...drivers]
    .filter((driver) => Number(driver?.totalEarned) > 0)
    .sort((a, b) => Number(b.totalEarned || 0) - Number(a.totalEarned || 0))
    .slice(0, 8);

  const averageEarned = drivers.length ? totalEarned / drivers.length : 0;

  return {
    drivers,
    driversCount: drivers.length,
    totalEarned,
    totalWallet,
    totalRides,
    averageEarned,
    topEarners,
    hasEarnings: totalEarned > 0 || totalWallet > 0 || drivers.length > 0,
  };
};
