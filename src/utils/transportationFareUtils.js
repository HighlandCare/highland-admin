
export const DEFAULT_TRANSPORTATION_FARE = {
  perMileRate: 1.45,
  minimumFare: 10,
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

export const formatFareDollars = (value) => {
  if (value == null || value === "" || Number.isNaN(Number(value))) {
    return "—";
  }

  return currencyFormatter.format(Number(value));
};

export const getTransportationFarePayload = (response) => {
  const data = response?.data && typeof response.data === "object" ? response.data : response;

  if (!data || typeof data !== "object") {
    return { defaults: DEFAULT_TRANSPORTATION_FARE, active: null, logs: [] };
  }

  return {
    defaults: data.defaults || DEFAULT_TRANSPORTATION_FARE,
    active: data.active || null,
    logs: Array.isArray(data.logs) ? data.logs : [],
  };
};

export const getActiveTransportationFare = (payloadOrResponse) => {
  const payload =
    payloadOrResponse?.defaults || payloadOrResponse?.active || Array.isArray(payloadOrResponse?.logs)
      ? payloadOrResponse
      : getTransportationFarePayload(payloadOrResponse);

  const source = payload.active || payload.defaults || DEFAULT_TRANSPORTATION_FARE;

  return {
    perMileRate: Number(source.perMileRate ?? DEFAULT_TRANSPORTATION_FARE.perMileRate),
    minimumFare: Number(source.minimumFare ?? DEFAULT_TRANSPORTATION_FARE.minimumFare),
    pricingConfigVersion: source.pricingConfigVersion ?? null,
  };
};

export const getTransportationFareLogs = (payloadOrResponse) => {
  const payload = Array.isArray(payloadOrResponse?.logs)
    ? payloadOrResponse
    : getTransportationFarePayload(payloadOrResponse);

  return payload.logs;
};

export const validateFareDollars = (perMileRate, minimumFare) => {
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
