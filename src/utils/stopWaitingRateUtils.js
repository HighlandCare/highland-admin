import { formatFareDollars } from "./transportationFareUtils";

export const DEFAULT_STOP_WAITING_RATE = {
  waitingRatePerMinute: 0.5,
};

export const formatWaitingRateDollars = formatFareDollars;

export const getStopWaitingRatePayload = (response) => {
  const data = response?.data && typeof response.data === "object" ? response.data : response;

  if (!data || typeof data !== "object") {
    return { defaults: DEFAULT_STOP_WAITING_RATE, active: null, logs: [] };
  }

  return {
    defaults: data.defaults || DEFAULT_STOP_WAITING_RATE,
    active: data.active || null,
    logs: Array.isArray(data.logs) ? data.logs : [],
  };
};

export const getActiveStopWaitingRate = (payloadOrResponse) => {
  const payload =
    payloadOrResponse?.defaults ||
    payloadOrResponse?.active ||
    Array.isArray(payloadOrResponse?.logs)
      ? payloadOrResponse
      : getStopWaitingRatePayload(payloadOrResponse);

  const source = payload.active || payload.defaults || DEFAULT_STOP_WAITING_RATE;

  return {
    waitingRatePerMinute: Number(
      source.waitingRatePerMinute ?? DEFAULT_STOP_WAITING_RATE.waitingRatePerMinute
    ),
    pricingConfigVersion: source.pricingConfigVersion ?? null,
  };
};

export const getStopWaitingRateLogs = (payloadOrResponse) => {
  const payload = Array.isArray(payloadOrResponse?.logs)
    ? payloadOrResponse
    : getStopWaitingRatePayload(payloadOrResponse);

  return payload.logs;
};

export const validateWaitingRateDollars = (waitingRatePerMinute) => {
  const rate = Number(waitingRatePerMinute);

  if (waitingRatePerMinute === "" || Number.isNaN(rate)) {
    return "Enter a stop waiting rate";
  }

  if (rate <= 0) {
    return "Rate must be greater than zero";
  }

  return null;
};
