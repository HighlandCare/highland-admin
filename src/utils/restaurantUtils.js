import { formatDateTime, formatRelativeDate } from "./dateUtils";

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export const hasRestaurantDetailValue = (value) => {
  if (value == null) return false;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed !== "" && trimmed !== "—" && trimmed.toLowerCase() !== "n/a" && trimmed !== "false";
  }
  return true;
};

export const pickRestaurantValue = (...values) => {
  for (const value of values) {
    if (hasRestaurantDetailValue(value)) return value;
  }
  return null;
};

const unwrapPayload = (response) => {
  if (!response || typeof response !== "object") return null;

  // { status, data: restaurant | { restaurant, owner, stats, tickets } }
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    return response.data;
  }

  if (response.restaurant || response._id || response.businessName) {
    return response;
  }

  return null;
};

/**
 * Normalize GET /admin/restaurants/:id into a flat restaurant profile
 * with owner, stats, fees, hours, location, and last support tickets.
 */
export const getRestaurantFromResponse = (response) => {
  const payload = unwrapPayload(response);
  if (!payload) return null;

  const restaurant =
    payload.restaurant && typeof payload.restaurant === "object" && !Array.isArray(payload.restaurant)
      ? payload.restaurant
      : payload;

  if (!restaurant || typeof restaurant !== "object") return null;

  const ownerSource =
    (restaurant.owner && typeof restaurant.owner === "object" && restaurant.owner) ||
    (payload.owner && typeof payload.owner === "object" && payload.owner) ||
    {};

  const statsSource =
    (restaurant.stats && typeof restaurant.stats === "object" && restaurant.stats) ||
    (payload.stats && typeof payload.stats === "object" && payload.stats) ||
    {};

  const feesSource =
    (restaurant.fees && typeof restaurant.fees === "object" && restaurant.fees) ||
    (payload.fees && typeof payload.fees === "object" && payload.fees) ||
    {};

  const locationSource =
    (restaurant.location && typeof restaurant.location === "object" && restaurant.location) ||
    (payload.location && typeof payload.location === "object" && payload.location) ||
    (restaurant.address && typeof restaurant.address === "object" && restaurant.address) ||
    {};

  const ticketsSource =
    restaurant.supportTickets ||
    restaurant.tickets ||
    restaurant.recentTickets ||
    restaurant.lastTickets ||
    payload.supportTickets ||
    payload.tickets ||
    payload.recentTickets ||
    payload.lastTickets ||
    [];

  return {
    ...restaurant,
    owner: {
      fullName: pickRestaurantValue(
        ownerSource.fullName,
        ownerSource.name,
        restaurant.ownerName,
        restaurant.ownerFullName,
        payload.ownerName
      ),
      email: pickRestaurantValue(ownerSource.email, restaurant.ownerEmail, payload.ownerEmail),
      phone: pickRestaurantValue(
        ownerSource.phone,
        ownerSource.phoneNumber,
        restaurant.ownerPhone,
        payload.ownerPhone
      ),
    },
    stats: {
      orderCount: pickRestaurantValue(
        restaurant.orderCount,
        statsSource.orderCount,
        payload.orderCount
      ),
      openTicketCount: pickRestaurantValue(
        restaurant.openTicketCount,
        statsSource.openTicketCount,
        payload.openTicketCount
      ),
    },
    fees: {
      deliveryFee: pickRestaurantValue(
        restaurant.deliveryFee,
        feesSource.deliveryFee,
        feesSource.delivery
      ),
      serviceFee: pickRestaurantValue(
        restaurant.serviceFee,
        feesSource.serviceFee,
        feesSource.service
      ),
      platformFee: pickRestaurantValue(
        restaurant.platformFee,
        restaurant.commissionRate,
        feesSource.platformFee,
        feesSource.commission
      ),
    },
    location: {
      address: pickRestaurantValue(
        typeof restaurant.address === "string" ? restaurant.address : null,
        locationSource.formatted,
        locationSource.full,
        locationSource.address,
        locationSource.street,
        restaurant.street,
        restaurant.locationAddress
      ),
      city: pickRestaurantValue(restaurant.city, locationSource.city),
      state: pickRestaurantValue(restaurant.state, locationSource.state),
      zipCode: pickRestaurantValue(
        restaurant.zipCode,
        restaurant.zip,
        locationSource.zipCode,
        locationSource.zip
      ),
      coordinates:
        locationSource.coordinates ||
        restaurant.coordinates ||
        restaurant.geo?.coordinates ||
        null,
      latitude: pickRestaurantValue(restaurant.latitude, restaurant.lat, locationSource.latitude),
      longitude: pickRestaurantValue(
        restaurant.longitude,
        restaurant.lng,
        restaurant.lon,
        locationSource.longitude
      ),
    },
    hours:
      restaurant.hours ||
      restaurant.openingHours ||
      restaurant.businessHours ||
      restaurant.operatingHours ||
      payload.hours ||
      null,
    stripeConnectId: pickRestaurantValue(
      restaurant.stripeConnectId,
      restaurant.stripeAccountId,
      restaurant.stripe?.connectId,
      restaurant.stripe?.accountId,
      payload.stripeConnectId
    ),
    isApproved: restaurant.isApproved === true || payload.isApproved === true,
    isOnline:
      typeof restaurant.isOnline === "boolean"
        ? restaurant.isOnline
        : typeof restaurant.online === "boolean"
          ? restaurant.online
          : typeof payload.isOnline === "boolean"
            ? payload.isOnline
            : null,
    supportTickets: Array.isArray(ticketsSource) ? ticketsSource.slice(0, 5) : [],
  };
};

export const getRestaurantBusinessName = (restaurant) =>
  pickRestaurantValue(restaurant?.businessName, restaurant?.name, "Restaurant");

export const getRestaurantCuisine = (restaurant) =>
  pickRestaurantValue(restaurant?.cuisine, restaurant?.cuisineType, restaurant?.category);

export const formatRestaurantCurrency = (value) => {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
};

export const formatRestaurantFeeValue = (value) => {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  // Values <= 1 (or common commission rates) may be ratios; otherwise currency.
  if (num > 0 && num <= 1) {
    return `${(num * 100).toFixed(num * 100 % 1 === 0 ? 0 : 2)}%`;
  }
  if (num > 1 && num <= 100 && !Number.isInteger(num)) {
    return `${num}%`;
  }
  if (num > 0 && num <= 100 && String(value).includes("%")) {
    return `${num}%`;
  }
  // Prefer currency for fee amounts; show percent only when clearly a rate field handled above.
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
};

export const formatRestaurantPercent = (value) => {
  if (value == null || value === "") return null;
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  if (num > 0 && num <= 1) {
    return `${(num * 100).toFixed(num * 100 % 1 === 0 ? 0 : 2)}%`;
  }
  return `${num}%`;
};

export const formatRestaurantDateTime = (value) => {
  if (!hasRestaurantDetailValue(value)) return null;
  const formatted = formatDateTime(value);
  return formatted === "—" ? null : formatted;
};

export const formatRestaurantRelativeDate = (value) => {
  if (!hasRestaurantDetailValue(value)) return null;
  const formatted = formatRelativeDate(value);
  return formatted === "—" ? null : formatted;
};

export const formatRestaurantCoordinates = (restaurant) => {
  const coords = restaurant?.location?.coordinates;
  if (Array.isArray(coords) && coords.length >= 2) {
    return `${coords[1]}, ${coords[0]}`;
  }
  const lat = restaurant?.location?.latitude;
  const lng = restaurant?.location?.longitude;
  if (hasRestaurantDetailValue(lat) && hasRestaurantDetailValue(lng)) {
    return `${lat}, ${lng}`;
  }
  return null;
};

const capitalize = (value) => {
  if (!value) return "";
  return String(value).charAt(0).toUpperCase() + String(value).slice(1);
};

const formatHourRange = (entry) => {
  if (!entry) return "Closed";
  if (typeof entry === "string") return entry;
  if (entry.closed === true || entry.isClosed === true) return "Closed";
  const open = pickRestaurantValue(entry.open, entry.openTime, entry.from, entry.start);
  const close = pickRestaurantValue(entry.close, entry.closeTime, entry.to, entry.end);
  if (open && close) return `${open} – ${close}`;
  if (open) return open;
  return null;
};

export const getRestaurantHoursFields = (restaurant) => {
  const hours = restaurant?.hours;
  if (!hours) return [];

  if (Array.isArray(hours)) {
    return hours
      .map((entry, index) => {
        const day = pickRestaurantValue(entry.day, entry.name, `Day ${index + 1}`);
        return { label: capitalize(day), value: formatHourRange(entry), hideEmpty: true };
      })
      .filter((field) => hasRestaurantDetailValue(field.value));
  }

  if (typeof hours === "object") {
    const lowerKeyMap = Object.keys(hours).reduce((acc, key) => {
      acc[key.toLowerCase()] = key;
      return acc;
    }, {});

    const orderedKeys = [
      ...DAY_ORDER.map((day) => lowerKeyMap[day]).filter(Boolean),
      ...Object.keys(hours).filter((key) => !DAY_ORDER.includes(key.toLowerCase())),
    ];

    return orderedKeys.map((key) => ({
      label: capitalize(key),
      value: formatHourRange(hours[key]),
      hideEmpty: true,
    }));
  }

  return [];
};

export const getRestaurantTicketSubject = (ticket) =>
  pickRestaurantValue(ticket?.subject, ticket?.title, ticket?.reason, ticket?.message, "Support ticket");

export const getRestaurantTicketStatus = (ticket) =>
  pickRestaurantValue(ticket?.status, ticket?.state);

export const getRestaurantTicketStatusColor = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("open") || normalized.includes("pending")) return "warning";
  if (normalized.includes("close") || normalized.includes("resolve")) return "success";
  return "neutral";
};

export const capitalizeRestaurantLabel = capitalize;
