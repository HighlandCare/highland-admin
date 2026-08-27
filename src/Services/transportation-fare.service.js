import { Action } from "../config/action";

const authHeaders = () => {
  const authToken = JSON.parse(localStorage.getItem("token"));
  return { Authorization: `Bearer ${authToken}` };
};

const getApiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error.trim();
  }
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  return fallback;
};

/** GET /admin/transportation-fare */
export const getTransportationFare = async ({ limit = 50 } = {}) => {
  try {
    const params = new URLSearchParams({
      limit: String(Math.min(Number(limit) || 50, 200)),
    });

    const response = await Action.get(`admin/transportation-fare?${params.toString()}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("getTransportationFare error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to load transportation fare"));
  }
};

/** POST /admin/transportation-fare — publish new version (dollars) */
export const publishTransportationFare = async ({ perMileRate, minimumFare }) => {
  try {
    const payload = {
      perMileRate: Number(perMileRate),
      minimumFare: Number(minimumFare),
    };

    const response = await Action.post("admin/transportation-fare", payload, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("publishTransportationFare error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to publish transportation fare"));
  }
};
