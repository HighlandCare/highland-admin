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

export const SERVICE_CATEGORIES = {
  TRANSPORTATION: "transportation",
  FOOD_BEVERAGE: "food_beverage",
  SENIOR_CARE: "senior_care",
};

/** GET /admin/commission-rate — append-only logs (newest first) */
export const listCommissionLogs = async ({
  limit = 50,
  skip = 0,
  serviceCategory,
} = {}) => {
  try {
    const params = new URLSearchParams({
      limit: String(Math.min(Number(limit) || 50, 200)),
      skip: String(Number(skip) || 0),
    });

    if (serviceCategory) {
      params.set("serviceCategory", String(serviceCategory));
    }

    const response = await Action.get(`admin/commission-rate?${params.toString()}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("listCommissionLogs error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to load commission logs"));
  }
};

/** POST /admin/commission-rate — create a new immutable log entry */
export const createCommissionLog = async ({ serviceCategory, commissionPercent }) => {
  try {
    const payload = {
      serviceCategory,
      commissionPercent: Number(commissionPercent),
    };

    const response = await Action.post("admin/commission-rate", payload, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("createCommissionLog error:", error?.response?.data || error.message);
    throw new Error(
      getApiErrorMessage(error, "Please enter a commission percentage between 12% and 28%")
    );
  }
};

/** Alias — same logs as GET /admin/commission-rate */
export const getCommissionRateHistory = listCommissionLogs;

export const listCommissionCategories = listCommissionLogs;
export const getCommissionRate = listCommissionLogs;
export const updateCommissionCategory = createCommissionLog;
export const updateCommissionRate = createCommissionLog;
