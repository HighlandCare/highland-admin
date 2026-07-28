import { getDashboardAnalytics } from "../Services/Auth.service";

export const formatCompactCurrency = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(Number(value));
};

const emptyMonthly = { hasData: false, categories: [], series: [] };
const emptyStatusDistribution = { hasData: false, labels: [], values: [] };

const normalizeMonthly = (monthly) => {
  if (!monthly || typeof monthly !== "object") {
    return emptyMonthly;
  }

  const categories = Array.isArray(monthly.categories) ? monthly.categories : [];
  const series = Array.isArray(monthly.series) ? monthly.series : [];
  const hasData =
    typeof monthly.hasData === "boolean"
      ? monthly.hasData
      : series.some((entry) =>
          Array.isArray(entry?.data) ? entry.data.some((value) => Number(value) > 0) : false
        );

  return {
    hasData,
    categories,
    series,
  };
};

const normalizeStatusDistribution = (statusDistribution) => {
  if (!statusDistribution || typeof statusDistribution !== "object") {
    return emptyStatusDistribution;
  }

  const labels = Array.isArray(statusDistribution.labels) ? statusDistribution.labels : [];
  const values = Array.isArray(statusDistribution.values) ? statusDistribution.values : [];
  const hasData =
    typeof statusDistribution.hasData === "boolean"
      ? statusDistribution.hasData
      : labels.length > 0 && values.some((value) => Number(value) > 0);

  return {
    hasData,
    labels,
    values,
  };
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const loadDashboardAnalytics = async ({ latestLimit = 10, year } = {}) => {
  const response = await getDashboardAnalytics({ latestLimit, year });
  const data = response?.data && typeof response.data === "object" ? response.data : response;

  if (!data || typeof data !== "object") {
    throw new Error("Invalid dashboard analytics response");
  }

  const adminEarnings = toNumber(data.adminEarnings);
  const driverEarningsTotal = toNumber(data.driverEarningsTotal);
  const rides = Array.isArray(data.rides) ? data.rides : [];

  return {
    totalUsers: toNumber(data.totalUsers),
    activeUsers: toNumber(data.activeUsers),
    totalDrivers: toNumber(data.totalDrivers),
    activeDrivers: toNumber(data.activeDrivers),
    totalRides: toNumber(data.totalRides),
    completedRides: toNumber(data.completedRides),
    adminEarnings,
    driverEarningsTotal,
    hasAdminEarnings:
      typeof data.hasAdminEarnings === "boolean" ? data.hasAdminEarnings : adminEarnings > 0,
    hasDriverEarnings:
      typeof data.hasDriverEarnings === "boolean"
        ? data.hasDriverEarnings
        : driverEarningsTotal > 0,
    rides,
    monthly: normalizeMonthly(data.monthly),
    statusDistribution: normalizeStatusDistribution(data.statusDistribution),
  };
};
