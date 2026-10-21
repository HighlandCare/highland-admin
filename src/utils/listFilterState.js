/**
 * Restore list filters only when returning from that list's detail page.
 * Visiting the list from any other page clears saved state (same as ride history).
 */

export const LIST_FILTER_KEYS = {
  users: "users",
  chaperone: "chaperone",
  disputes: "disputes",
  helpFeedback: "helpFeedback",
  driverEarnings: "driverEarnings",
  restaurants: "restaurants",
  feedback: "feedback",
};

const stateStorageKey = (key) => `listFilterState:${key}`;
const restoreFlagKey = (key) => `listFilterRestoreOnce:${key}`;

export const storeListFilterState = (key, state = {}) => {
  if (typeof window === "undefined" || !key) {
    return;
  }

  try {
    sessionStorage.setItem(
      stateStorageKey(key),
      JSON.stringify({
        page: Math.max(Number(state.page) || 1, 1),
        ...(state.limit != null ? { limit: Math.max(Number(state.limit) || 1, 1) } : {}),
        filters:
          state.filters && typeof state.filters === "object" ? state.filters : {},
      })
    );
  } catch (error) {
    console.error("storeListFilterState error:", error);
  }
};

/** Mark that the next visit to the list should restore saved filters (detail → back). */
export const markListFilterRestore = (key) => {
  if (typeof window === "undefined" || !key) {
    return;
  }

  try {
    sessionStorage.setItem(restoreFlagKey(key), "1");
  } catch (error) {
    console.error("markListFilterRestore error:", error);
  }
};

export const clearListFilterState = (key) => {
  if (typeof window === "undefined" || !key) {
    return;
  }

  try {
    sessionStorage.removeItem(stateStorageKey(key));
    sessionStorage.removeItem(restoreFlagKey(key));
  } catch (error) {
    console.error("clearListFilterState error:", error);
  }
};

export const getStoredListFilterState = (key) => {
  if (typeof window === "undefined" || !key) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(stateStorageKey(key));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return {
      page: Math.max(Number(parsed?.page) || 1, 1),
      ...(parsed?.limit != null
        ? { limit: Math.max(Number(parsed.limit) || 1, 1) }
        : {}),
      filters:
        parsed?.filters && typeof parsed.filters === "object" ? parsed.filters : {},
    };
  } catch (error) {
    console.error("getStoredListFilterState error:", error);
    return null;
  }
};

/**
 * Restore list filters only after returning from detail.
 * Visiting the list from any other page clears saved state and returns null.
 */
export const consumeListFilterState = (key, { forceRestore = false } = {}) => {
  if (typeof window === "undefined" || !key) {
    return null;
  }

  try {
    const shouldRestore =
      forceRestore || sessionStorage.getItem(restoreFlagKey(key)) === "1";
    sessionStorage.removeItem(restoreFlagKey(key));

    if (!shouldRestore) {
      sessionStorage.removeItem(stateStorageKey(key));
      return null;
    }

    const stored = getStoredListFilterState(key);
    sessionStorage.removeItem(stateStorageKey(key));
    return stored;
  } catch (error) {
    console.error("consumeListFilterState error:", error);
    return null;
  }
};

const normalizePath = (url = "") => String(url).split("?")[0];

/**
 * Clear saved filters when navigating away from the list (except to its detail pages).
 * Use on the list page.
 */
export const createListFilterRouteGuard = (key, { listPath, detailPaths = [] }) => {
  const allowed = [listPath, ...detailPaths].filter(Boolean);

  return (url) => {
    const path = normalizePath(url);
    if (allowed.some((allowedPath) => path === allowedPath || path.startsWith(`${allowedPath}/`))) {
      return;
    }
    clearListFilterState(key);
  };
};

/**
 * Clear saved filters when leaving detail for anywhere except the list.
 * Use on the detail page.
 */
export const createDetailFilterRouteGuard = (key, { listPath }) => (url) => {
  const path = normalizePath(url);
  if (path === listPath) {
    return;
  }
  clearListFilterState(key);
};
