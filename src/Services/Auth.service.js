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
    const response = await Action.get(`faq`);
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
    const response = await Action.patch(`deleteuser/${_id}`);
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
