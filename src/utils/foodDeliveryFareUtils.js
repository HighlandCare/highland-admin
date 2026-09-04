import { formatFareDollars } from "./transportationFareUtils";

export const DEFAULT_FOOD_DELIVERY_FARE = {
  deliveryFee: 4.99,
  minimumOrder: 15,
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
    deliveryFee: Number(source.deliveryFee ?? DEFAULT_FOOD_DELIVERY_FARE.deliveryFee),
    minimumOrder: Number(source.minimumOrder ?? DEFAULT_FOOD_DELIVERY_FARE.minimumOrder),
    pricingConfigVersion: source.pricingConfigVersion ?? null,
  };
};

export const getFoodDeliveryFareLogs = (payloadOrResponse) => {
  const payload = Array.isArray(payloadOrResponse?.logs)
    ? payloadOrResponse
    : getFoodDeliveryFarePayload(payloadOrResponse);

  return payload.logs;
};

/** Normalize log row field names from API variants. */
export const normalizeFoodDeliveryFareLog = (item = {}) => ({
  ...item,
  previousDeliveryFee:
    item.previousDeliveryFee ?? item.previousDeliveryFeeDollars ?? item.previous?.deliveryFee ?? null,
  currentDeliveryFee:
    item.currentDeliveryFee ?? item.currentDeliveryFeeDollars ?? item.current?.deliveryFee ?? null,
  previousMinimumOrder:
    item.previousMinimumOrder ?? item.previousMinimumOrderDollars ?? item.previous?.minimumOrder ?? null,
  currentMinimumOrder:
    item.currentMinimumOrder ?? item.currentMinimumOrderDollars ?? item.current?.minimumOrder ?? null,
});

export const validateFoodDeliveryFareDollars = (deliveryFee, minimumOrder) => {
  const fee = Number(deliveryFee);
  const min = Number(minimumOrder);

  if (deliveryFee === "" || minimumOrder === "" || Number.isNaN(fee) || Number.isNaN(min)) {
    return "Enter both delivery fee and minimum order";
  }

  if (fee < 0 || min < 0) {
    return "Values cannot be negative";
  }

  return null;
};
