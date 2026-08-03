const AUTH_KEYS = ["isLogin", "user", "token"];

const PUBLIC_PATHS = ["/auth/login", "/404"];

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

export const isAuthenticated = () => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const isLogin = JSON.parse(localStorage.getItem("isLogin"));
    const token = getAuthToken();
    return Boolean(isLogin && token);
  } catch {
    return false;
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
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

  const next =
    nextPath ||
    `${window.location.pathname}${window.location.search || ""}`;
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
