import { Action } from "../config/action";

export const getUsers = async (page, limit = 10) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.get(`getallusers?page=${page}&limit=${limit}`, {
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

export const getUserById = async (userId) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.get(`admin/users/${encodeURIComponent(userId)}`, {
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

/**
 * Paginated customer transactions + spend analytics.
 * @param {string} userId - profile id or auth id
 * @param {object} params - page, limit, status, serviceCategory, referenceType, from, to
 */
export const getUserTransactions = async (userId, params = {}) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });
    const qs = query.toString();
    const response = await Action.get(
      `admin/users/${encodeURIComponent(userId)}/transactions${qs ? `?${qs}` : ""}`,
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

export const getChap = async (page, limit = 10) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));

    const response = await Action.get(`admin/getallchaperone?page=${page}&limit=${limit}`, {
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

export const getChaperoneById = async (chaperoneId) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.get(`admin/getchaperone/${chaperoneId}`, {
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

export const getDriverEarnings = async (page, limit = 10) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));

    const response = await Action.get(`admin/all-driver-earnings?page=${page}&limit=${limit}`, {
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

export const getDriverEarningsById = async (driverId) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.get(`admin/driver-earnings/${driverId}`, {
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

export const getDashboardAnalytics = async ({ latestLimit = 10, year } = {}) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const params = new URLSearchParams();

    if (latestLimit != null) {
      params.set("latestLimit", String(Math.min(Math.max(Number(latestLimit) || 10, 1), 50)));
    }

    if (year != null && year !== "") {
      params.set("year", String(year));
    }

    const query = params.toString();
    const response = await Action.get(
      `admin/dashboard-analytics${query ? `?${query}` : ""}`,
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

export const getDriverTransactions = async (driverId) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.get(`admin/driver-earnings/${driverId}`, {
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

export const getRideHistory = async (page, limit = 20, filters = {}) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (filters.status) {
      params.set("status", filters.status);
    }

    if (filters.havePaid === true || filters.havePaid === "true") {
      params.set("havePaid", "true");
    } else if (filters.havePaid === false || filters.havePaid === "false") {
      params.set("havePaid", "false");
    }

    if (filters.startDate) {
      params.set("startDate", filters.startDate);
    }

    if (filters.endDate) {
      params.set("endDate", filters.endDate);
    }

    if (filters.search?.trim()) {
      params.set("search", filters.search.trim());
    }

    if (filters.type) {
      params.set("type", filters.type);
    }

    const response = await Action.get(`admin/ride-history?${params.toString()}`, {
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

export const getRideById = async (rideId) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));

    const response = await Action.get(`admin/ride-history/${rideId}`, {
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

/**
 * Multi-destination ride traceability: the consolidated audit (stops, timing,
 * pricing, payment, adjustments) and the raw event log behind it.
 */
export const getRideAudit = async (rideId) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));

    const response = await Action.get(`admin/rides/${rideId}/audit`, {
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

export const getRideEvents = async (rideId, page = 1, limit = 100) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    const response = await Action.get(
      `admin/rides/${rideId}/events?${params.toString()}`,
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

export const getRideAdjustments = async (page = 1, limit = 20, filters = {}) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      status: filters.status || "pending_review",
    });

    if (filters.type) {
      params.set("type", filters.type);
    }

    const response = await Action.get(`admin/ride-adjustments?${params.toString()}`, {
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

/**
 * Records an operator decision on a waiting deviation. Deliberately non-financial:
 * the customer paid the amount authorized before the ride and this does not
 * charge or refund anything.
 */
export const reviewRideAdjustment = async (adjustmentId, status, reviewNotes = "") => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));

    const response = await Action.post(
      `admin/ride-adjustments/${adjustmentId}/review`,
      { status, reviewNotes },
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

export const updateDriverPersonaStatus = async (driverId, personaStatus = "approved") => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.patch(
      `admin/drivers/${driverId}/persona-status`,
      { personaStatus },
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

export const getFAQ = async () => {
  try {
    const response = await Action.get(`admin/faq`);
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

export const addFAQ = async (contentType, items) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.post(
      `/admin/faq`,
      {
        contentType,
        item: items,
      },
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

export const getFeedbacks = async (page, limit = 10) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.get(`getallfeedback?page=${page}&limit=${limit}`, {
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

export const replyToCustomer = async (feedID, subject, reply) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.post(
      `/admin/replyfeedback/${feedID}`,
      {
        subject,
        reply,
      },
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

export const getAbout = async () => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));

    const response = await Action.get(`admin/about`, {
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

export const addAbout = async (contentType = "about", title) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.post(
      `/admin/about`,
      {
        contentType,
        title,
      },
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

export const getTerms = async () => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));

    const response = await Action.get(`admin/terms`, {
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

export const addTerms = async (contentType = "terms", title) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.post(
      `/admin/terms`,
      {
        contentType,
        title,
      },
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

export const getPrivacy = async () => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));

    const response = await Action.get(`admin/privacy`, {
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

export const addPrivacy = async (contentType = "privacy", title) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.post(
      `/admin/privacy`,
      {
        contentType,
        title,
      },
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

export const deleteUsers = async (_id) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.patch(
      `admin/deleteuser/${_id}`,
      {},
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

export const deleteDriver = async (chaperoneId) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.patch(
      `admin/deletedriver/${chaperoneId}`,
      {},
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

export const updateChapStatus = async (chaperonId, status) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.patch(
      `admin/updatedriverstatus/${chaperonId}`,
      {
        status: status,
      },
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

export const updateUserStatus = async (customerAuthId, status) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.patch(
      `admin/updateuserstatus/${customerAuthId}`,
      {
        status: status,
      },
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

export const addUser = async (email, password, name) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.post(
      `admin/createUser`,
      {
        email,
        password,
        name,
      },
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

export const formatApiErrorMessage = (message) => {
  if (!message) {
    return "Unable to sign in. Please try again.";
  }

  const cleaned = String(message).replace(/"/g, "");

  const fieldLabels = {
    email: "Email",
    password: "Password",
    userType: "User type",
    deviceToken: "Device token",
    deviceType: "Device type",
  };

  const requiredMatch = cleaned.match(/^(\w+) is required$/i);
  if (requiredMatch) {
    const field = requiredMatch[1];
    return `${fieldLabels[field] || field} is required.`;
  }

  return cleaned;
};

export const getLoginErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return formatApiErrorMessage(error.response.data.message);
  }

  // Axios sets no `response` when the browser never reached the API
  // (wrong base URL, backend down, CORS, connection refused).
  if (!error?.response) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "(missing NEXT_PUBLIC_BASE_URL)";
    return `Cannot reach API at ${base}. Start cura-main (port 1120) or fix highland-admin/.env, then restart next dev.`;
  }

  if (typeof error?.message === "string" && !error.message.startsWith("Error in adminLogin")) {
    return formatApiErrorMessage(error.message);
  }

  return "Unable to sign in. Please try again.";
};

export const adminLogin = async (payload) => {
  try {
    const response = await Action.post("/login", payload);
    return response.data;
  } catch (error) {
    throw new Error(getLoginErrorMessage(error));
  }
};

export const getRestaurants = async (page = 1, limit = 20, filters = {}) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (filters.status) params.set("status", filters.status);
    if (filters.search?.trim()) params.set("search", filters.search.trim());

    const response = await Action.get(`admin/restaurants?${params.toString()}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    return response.data;
  } catch (error) {
    console.error("getRestaurants error:", error?.response?.data || error.message);
    throw error;
  }
};

export const getRestaurantById = async (restaurantId) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.get(
      `admin/restaurants/${encodeURIComponent(restaurantId)}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error("getRestaurantById error:", error?.response?.data || error.message);
    throw error;
  }
};

export const updateRestaurantApproval = async (restaurantId, approved) => {
  try {
    const authToken = JSON.parse(localStorage.getItem("token"));
    const response = await Action.patch(
      `admin/restaurants/${encodeURIComponent(restaurantId)}/approval`,
      { approved },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error("updateRestaurantApproval error:", error?.response?.data || error.message);
    throw error;
  }
};
