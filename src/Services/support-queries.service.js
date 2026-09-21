import { Action } from "../config/action";

const authHeaders = (extra = {}) => {
  const authToken = JSON.parse(localStorage.getItem("token"));
  return { Authorization: `Bearer ${authToken}`, ...extra };
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

/** GET /admin/support-queries */
export const listSupportQueries = async ({
  page = 1,
  limit = 10,
  status,
  role,
  category,
  from,
  to,
  search,
  submitterId,
} = {}) => {
  try {
    const params = new URLSearchParams({
      page: String(Math.max(Number(page) || 1, 1)),
      limit: String(Math.min(Math.max(Number(limit) || 10, 1), 100)),
    });

    if (status && status !== "all") {
      params.set("status", String(status));
    }
    if (role && role !== "all") {
      params.set("role", String(role));
    }
    if (category && category !== "all") {
      params.set("category", String(category));
    }
    if (from) {
      params.set("from", String(from));
    }
    if (to) {
      params.set("to", String(to));
    }
    if (search && String(search).trim()) {
      params.set("search", String(search).trim().slice(0, 100));
    }
    if (submitterId) {
      params.set("submitterId", String(submitterId));
    }

    const response = await Action.get(`admin/support-queries?${params.toString()}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("listSupportQueries error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to load support queries"));
  }
};

/** GET /admin/support-queries/:id */
export const getSupportQueryById = async (id) => {
  try {
    const response = await Action.get(`admin/support-queries/${id}`, {
      headers: authHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("getSupportQueryById error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to load support query"));
  }
};

/**
 * POST /admin/support-queries/:id/replies
 * Uses multipart when files are attached; otherwise JSON.
 */
export const replyToSupportQuery = async (id, { message, status, attachments = [] } = {}) => {
  try {
    const hasFiles = Array.isArray(attachments) && attachments.length > 0;
    let payload;
    let headers;

    if (hasFiles) {
      payload = new FormData();
      payload.append("message", String(message || ""));
      if (status) {
        payload.append("status", String(status));
      }
      attachments.forEach((file) => {
        if (file) {
          payload.append("attachments", file);
        }
      });
      headers = authHeaders();
    } else {
      payload = { message: String(message || "") };
      if (status) {
        payload.status = String(status);
      }
      headers = authHeaders({ "Content-Type": "application/json" });
    }

    const response = await Action.post(`admin/support-queries/${id}/replies`, payload, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("replyToSupportQuery error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to send reply"));
  }
};

/** PATCH /admin/support-queries/:id/status */
export const updateSupportQueryStatus = async (id, status) => {
  try {
    const response = await Action.patch(
      `admin/support-queries/${id}/status`,
      { status },
      {
        headers: authHeaders({ "Content-Type": "application/json" }),
      }
    );
    return response.data;
  } catch (error) {
    console.error("updateSupportQueryStatus error:", error?.response?.data || error.message);
    throw new Error(getApiErrorMessage(error, "Failed to update status"));
  }
};
