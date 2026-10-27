const AUTH_KEYS = ["isLogin", "user", "token"];

const PUBLIC_PATHS = ["/auth/login", "/404"];
const SESSION_EXPIRED_TOAST_KEY = "auth:session-expired-toast";
/** Small skew so near-expiry tokens are treated as expired before the first API call. */
const EXPIRY_SKEW_MS = 5_000;

let isRedirectingToLogin = false;

export const isPublicPath = (pathname = "") => {
  const path = String(pathname).split("?")[0];
  return PUBLIC_PATHS.some((publicPath) => path === publicPath || path.startsWith(`${publicPath}/`));
};

export const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem("token");
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return localStorage.getItem("token");
  }
};

/** Returns JWT `exp` in milliseconds, or null if the token is not a JWT / has no exp. */
export const getTokenExpiryMs = (token = getAuthToken()) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token = getAuthToken()) => {
  const expiryMs = getTokenExpiryMs(token);
  if (expiryMs == null) {
    return false;
  }
  return Date.now() >= expiryMs - EXPIRY_SKEW_MS;
};

/**
 * @returns {"authenticated" | "missing" | "expired"}
 */
export const getAuthSessionState = () => {
  if (typeof window === "undefined") {
    return "missing";
  }

  let isLogin = false;
  try {
    isLogin = Boolean(JSON.parse(localStorage.getItem("isLogin")));
  } catch {
    isLogin = false;
  }

  const token = getAuthToken();

  if (!isLogin || !token) {
    return "missing";
  }

  if (isTokenExpired(token)) {
    return "expired";
  }

  return "authenticated";
};

export const isAuthenticated = () => getAuthSessionState() === "authenticated";

export const isAuthRedirecting = () => isRedirectingToLogin;

export const isUnauthorizedError = (error) => error?.response?.status === 401;

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const markSessionExpiredToast = () => {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(SESSION_EXPIRED_TOAST_KEY, "1");
};

export const consumeSessionExpiredToast = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const shouldShow = sessionStorage.getItem(SESSION_EXPIRED_TOAST_KEY) === "1";
  if (shouldShow) {
    sessionStorage.removeItem(SESSION_EXPIRED_TOAST_KEY);
  }
  return shouldShow;
};

export const redirectToLogin = ({ reason, nextPath } = {}) => {
  if (typeof window === "undefined") {
    return;
  }

  const currentPath = window.location.pathname || "";
  if (isPublicPath(currentPath) || isRedirectingToLogin) {
    return;
  }

  isRedirectingToLogin = true;
  clearAuthSession();

  if (reason === "expired") {
    markSessionExpiredToast();
  }

  const next = nextPath || `${window.location.pathname}${window.location.search || ""}`;
  const params = new URLSearchParams();

  if (next && next !== "/" && !isPublicPath(next)) {
    params.set("next", next);
  }
  if (reason) {
    params.set("reason", reason);
  }

  const query = params.toString();
  window.location.replace(query ? `/auth/login?${query}` : "/auth/login");
};
