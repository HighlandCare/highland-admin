import { baseURL } from "./config";
import axios from "axios";
import { toast } from "react-toastify";
import { getAuthSessionState, redirectToLogin } from "../utils/authSession";

// const getAuthToken = () => {
//   const userData = "0000e6b7bf46a9d485ff211b9b2a2df3bd6eb67aae41";

//   return userData;
// };

export const Action = axios.create({
  baseURL,
});

// Action.interceptors.request.use(function (config) {
//   const token = getAuthToken();
//   config.headers["admin-token"] = token;
//   return config;
// });

Action.interceptors.request.use(function (config) {
  // Block outbound API calls once a JWT is known-expired so protected pages
  // don't briefly load before the login redirect.
  if (typeof window !== "undefined") {
    const url = String(config?.url || "");
    const isLoginRequest = /\/login(?:\?|$)/i.test(url);
    if (!isLoginRequest && getAuthSessionState() === "expired") {
      redirectToLogin({ reason: "expired" });
      return Promise.reject(new Error("Session expired"));
    }
  }
  return config;
});

Action.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url || "");
    const isLoginRequest = /\/login(?:\?|$)/i.test(requestUrl);

    if (!error.response) {
      console.error(
        "[API] No response (network/CORS). Check NEXT_PUBLIC_BASE_URL and that cura-main is running.",
        {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          code: error.code,
          message: error.message,
        }
      );
    }

    if (status === 401 && !isLoginRequest) {
      // Clear any in-flight error toasts so only the login-page message remains.
      toast.dismiss();
      redirectToLogin({ reason: "expired" });
    }

    return Promise.reject(error);
  }
);
