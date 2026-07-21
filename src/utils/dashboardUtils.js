import { ROWS_PER_PAGE } from "../components/data-table";
import { fetchAllPages, getListFromResponse } from "./listUtils";
import { isDriverBlocked } from "./driverUtils";
import { filterOutAdminUsers, isUserBlocked } from "./userUtils";
import {
  getRideAdminEarning,
  getRideDriverEarning,
  getRideList,
} from "./rideUtils";
import {
  getChap,
  getDriverEarnings,
  getRideHistory,
  getUsers,
} from "../Services/Auth.service";

export const getTotalCount = (response, fallbackList = []) => {
  const candidates = [
    response?.total_records,
    response?.totalRecords,
    response?.total_drivers,
    response?.total,
    response?.data?.total_records,
    response?.data?.totalRecords,
    response?.data?.total,
  ];

  for (const candidate of candidates) {
    if (candidate == null || candidate === "") {
      continue;
    }

    const total = Number(candidate);
    if (Number.isFinite(total) && total >= 0) {
      return total;
    }
  }

  const list = fallbackList.length ? fallbackList : getListFromResponse(response);
  return list.length;
};

export const sumNumericField = (items, getValue) =>
  items.reduce((sum, item) => {
    const value = Number(getValue(item));
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

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

export const buildMonthlyRideSeries = (rides = []) => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const rideCounts = Array(12).fill(0);

  rides.forEach((ride) => {
    const dateValue = ride?.createdAt || ride?.rideStartTime || ride?.scheduledAt;
    if (!dateValue) {
      return;
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return;
    }

    rideCounts[date.getMonth()] += 1;
  });

  const hasData = rideCounts.some((count) => count > 0);

  return {
    hasData,
    categories: months,
    series: [{ name: "Rides", data: rideCounts }],
  };
};

export const buildRideStatusDistribution = (rides = []) => {
  const counts = {};

  rides.forEach((ride) => {
    const status = String(ride?.status || "").trim().toLowerCase();
    if (!status) {
      return;
    }

    const label = status.charAt(0).toUpperCase() + status.slice(1);
    counts[label] = (counts[label] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = labels.map((label) => counts[label]);

  return {
    hasData: labels.length > 0,
    labels,
    values,
  };
};

export const loadDashboardAnalytics = async () => {
  const pageSize = ROWS_PER_PAGE;

  const [users, drivers, rides, earningsDrivers] = await Promise.all([
    fetchAllPages((page) => getUsers(page, pageSize), { pageSize }),
    fetchAllPages((page) => getChap(page, pageSize), { pageSize }),
    fetchAllPages((page) => getRideHistory(page, pageSize), {
      getItems: getRideList,
      pageSize,
    }),
    fetchAllPages((page) => getDriverEarnings(page, pageSize), { pageSize }),
  ]);

  const customers = filterOutAdminUsers(users);
  const activeUsers = customers.filter((user) => !isUserBlocked(user)).length;
  const activeDrivers = drivers.filter((driver) => !isDriverBlocked(driver)).length;
  const completedRides = rides.filter(
    (ride) => String(ride?.status || "").toLowerCase() === "completed"
  ).length;

  const adminEarningsFromRides = sumNumericField(rides, getRideAdminEarning);
  const driverEarningsFromRides = sumNumericField(rides, getRideDriverEarning);
  const driverEarningsFromReport = sumNumericField(
    earningsDrivers,
    (driver) => driver?.totalEarned
  );

  const monthly = buildMonthlyRideSeries(rides);
  const statusDistribution = buildRideStatusDistribution(rides);

  return {
    totalUsers: customers.length,
    activeUsers,
    totalDrivers: drivers.length,
    activeDrivers,
    totalRides: rides.length,
    completedRides,
    adminEarnings: adminEarningsFromRides,
    driverEarningsTotal: driverEarningsFromReport || driverEarningsFromRides,
    hasAdminEarnings: adminEarningsFromRides > 0,
    hasDriverEarnings: (driverEarningsFromReport || driverEarningsFromRides) > 0,
    rides,
    monthly,
    statusDistribution,
  };
};
