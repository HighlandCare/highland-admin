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

/** GET /admin/food-delivery-fare */
export const getFoodDeliveryFare = async ({ limit = 50 } = {}) => {
  try {
    const params = new URLSearchParams({
      limit: String(Math.min(Number(limit) || 50, 200)),
    });

    const response = await Action.get(`admin/food-delivery-fare?${params.toString()}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("getFoodDeliveryFare error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to load food delivery fare"));
  }
};

/** POST /admin/food-delivery-fare — publish new version (dollars) */
export const publishFoodDeliveryFare = async ({ perMileRate, minimumFare }) => {
  try {
    const payload = {
      perMileRate: Number(perMileRate),
      minimumFare: Number(minimumFare),
    };

    const response = await Action.post("admin/food-delivery-fare", payload, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("publishFoodDeliveryFare error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to publish food delivery fare"));
  }
};
