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

/** GET /admin/stop-waiting-rate */
export const getStopWaitingRate = async ({ limit = 50 } = {}) => {
  try {
    const params = new URLSearchParams({
      limit: String(Math.min(Number(limit) || 50, 200)),
    });

    const response = await Action.get(`admin/stop-waiting-rate?${params.toString()}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("getStopWaitingRate error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to load stop waiting rate"));
  }
};

/** POST /admin/stop-waiting-rate — publish new version (dollars) */
export const publishStopWaitingRate = async ({ waitingRatePerMinute }) => {
  try {
    const payload = {
      waitingRatePerMinute: Number(waitingRatePerMinute),
    };

    const response = await Action.post("admin/stop-waiting-rate", payload, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("publishStopWaitingRate error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to publish stop waiting rate"));
  }
};
