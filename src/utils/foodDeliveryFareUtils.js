import { formatFareDollars } from "./transportationFareUtils";

export const DEFAULT_FOOD_DELIVERY_FARE = {
  perMileRate: 1.45,
  minimumFare: 4.99,
};

export const formatFoodFareDollars = formatFareDollars;

export const getFoodDeliveryFarePayload = (response) => {
  const data = response?.data && typeof response.data === "object" ? response.data : response;

  if (!data || typeof data !== "object") {
    return { defaults: DEFAULT_FOOD_DELIVERY_FARE, active: null, logs: [], total: 0 };
  }

  return {
    defaults: data.defaults || DEFAULT_FOOD_DELIVERY_FARE,
    active: data.active || null,
    logs: Array.isArray(data.logs) ? data.logs : [],
    total: Number(data.total ?? data.pagination?.total ?? data.logs?.length) || 0,
  };
};

export const getActiveFoodDeliveryFare = (payloadOrResponse) => {
  const payload =
    payloadOrResponse?.defaults ||
    payloadOrResponse?.active ||
    Array.isArray(payloadOrResponse?.logs)
      ? payloadOrResponse
      : getFoodDeliveryFarePayload(payloadOrResponse);

  const source = payload.active || payload.defaults || DEFAULT_FOOD_DELIVERY_FARE;

  return {
    perMileRate: Number(source.perMileRate ?? DEFAULT_FOOD_DELIVERY_FARE.perMileRate),
    minimumFare: Number(source.minimumFare ?? DEFAULT_FOOD_DELIVERY_FARE.minimumFare),
    pricingConfigVersion: source.pricingConfigVersion ?? null,
  };
};

export const getFoodDeliveryFareLogs = (payloadOrResponse) => {
  const payload = Array.isArray(payloadOrResponse?.logs)
    ? payloadOrResponse
    : getFoodDeliveryFarePayload(payloadOrResponse);

  return payload.logs;
};

export const validateFoodDeliveryFareDollars = (perMileRate, minimumFare) => {
  const mile = Number(perMileRate);
  const min = Number(minimumFare);

  if (perMileRate === "" || minimumFare === "" || Number.isNaN(mile) || Number.isNaN(min)) {
    return "Enter both per-mile rate and minimum fare";
  }

  if (mile <= 0 || min <= 0) {
    return "Rates must be greater than zero";
  }

  return null;
};
