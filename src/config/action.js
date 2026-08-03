import { baseURL } from "./config";
import axios from "axios";
import { redirectToLogin } from "../utils/authSession";

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

Action.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    console.log(error.response, "error.response");
    const status = error.response?.status;
    const requestUrl = String(error.config?.url || "");
    const isLoginRequest = /\/login(?:\?|$)/i.test(requestUrl);

    if (status === 401 && !isLoginRequest) {
      redirectToLogin({ reason: "expired" });
    }

    return Promise.reject(error);
  }
);
