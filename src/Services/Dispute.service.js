import { Action } from "../config/action";

export const getDisputes = async (page = 1, limit = 20, filters = {}) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (filters.status) {
      params.set("status", filters.status);
    }

    const response = await Action.get(`admin/disputes?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Response Error:", error.response.data);
    } else if (error.request) {
      console.error("Request Error:", error.request);
    } else {
      console.error("General Error:", error.message);
    }
    throw error;
  }
};

export const getDisputeById = async (disputeId) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.get(`admin/disputes/${disputeId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Response Error:", error.response.data);
    } else if (error.request) {
      console.error("Request Error:", error.request);
    } else {
      console.error("General Error:", error.message);
    }
    throw error;
  }
};

export const reviewDispute = async (disputeId, adminNotes) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.patch(
      `admin/disputes/${disputeId}/review`,
      { adminNotes },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Response Error:", error.response.data);
    } else if (error.request) {
      console.error("Request Error:", error.request);
    } else {
      console.error("General Error:", error.message);
    }
    throw error;
  }
};

export const approveDispute = async (disputeId, payload = {}) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.patch(`admin/disputes/${disputeId}/approve`, payload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Response Error:", error.response.data);
    } else if (error.request) {
      console.error("Request Error:", error.request);
    } else {
      console.error("General Error:", error.message);
    }
    throw error;
  }
};

export const rejectDispute = async (disputeId, payload = {}) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.patch(`admin/disputes/${disputeId}/reject`, payload, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Response Error:", error.response.data);
    } else if (error.request) {
      console.error("Request Error:", error.request);
    } else {
      console.error("General Error:", error.message);
    }
    throw error;
  }
};
