export const DEFAULT_COMMISSION_LIMITS = {
  minPercent: 12,
  maxPercent: 28,
  defaultPercent: 15,
};

export const SERVICE_CATEGORIES = {
  TRANSPORTATION: "transportation",
  FOOD_BEVERAGE: "food_beverage",
  SENIOR_CARE: "senior_care",
};

/** Categories enabled in the admin UI. */
export const SERVICE_CATEGORY_OPTIONS = [
  { value: SERVICE_CATEGORIES.TRANSPORTATION, label: "Transportation" },
  { value: SERVICE_CATEGORIES.FOOD_BEVERAGE, label: "Food & Beverage" },
];

/** Convert API value (15 or 0.15) to display percent (15). */
export const toCommissionPercent = (value) => {
  if (value == null || value === "") {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (numeric > 0 && numeric <= 1) {
    return Number((numeric * 100).toFixed(2));
  }

  return Number(numeric.toFixed(2));
};

export const getCommissionLimits = (payload) => {
  const limits = payload?.data?.limits || payload?.limits || {};
  return {
    minPercent: Number(limits.minPercent) || DEFAULT_COMMISSION_LIMITS.minPercent,
    maxPercent: Number(limits.maxPercent) || DEFAULT_COMMISSION_LIMITS.maxPercent,
    defaultPercent: Number(limits.defaultPercent) || DEFAULT_COMMISSION_LIMITS.defaultPercent,
  };
};

export const formatServiceCategoryLabel = (value) => {
  const known = {
    [SERVICE_CATEGORIES.TRANSPORTATION]: "Transportation",
    [SERVICE_CATEGORIES.FOOD_BEVERAGE]: "Food & Beverage",
    [SERVICE_CATEGORIES.SENIOR_CARE]: "Senior Care",
  };

  if (known[value]) {
    return known[value];
  }

  return String(value || "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const resolveAdminName = (entry) => {
  if (typeof entry?.updatedByName === "string" && entry.updatedByName.trim()) {
    return entry.updatedByName.trim();
  }
  if (typeof entry?.changedByName === "string" && entry.changedByName.trim()) {
    return entry.changedByName.trim();
  }

  const actor = entry?.updatedBy || entry?.changedBy;
  if (actor && typeof actor === "object") {
    return actor.fullName?.trim() || null;
  }

  return null;
};

const resolveAdminEmail = (entry) => {
  if (typeof entry?.updatedByEmail === "string" && entry.updatedByEmail.trim()) {
    return entry.updatedByEmail.trim().toLowerCase();
  }
  if (typeof entry?.changedByEmail === "string" && entry.changedByEmail.trim()) {
    return entry.changedByEmail.trim().toLowerCase();
  }

  const actor = entry?.updatedBy || entry?.changedBy;
  if (actor && typeof actor === "object" && typeof actor.email === "string") {
    const email = actor.email.trim();
    return email ? email.toLowerCase() : null;
  }

  return null;
};

export const normalizeCommissionLog = (entry) => {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  return {
    _id: entry._id || entry.id || null,
    serviceCategory: entry.serviceCategory || entry.category || null,
    previousCommissionRate: toCommissionPercent(
      entry.previousCommissionRate ?? entry.previousPercent ?? entry.previousRate
    ),
    currentSetRate: toCommissionPercent(
      entry.currentSetRate ??
        entry.newPercent ??
        entry.commissionPercent ??
        entry.currentRate
    ),
    updatedByName: resolveAdminName(entry),
    updatedByEmail: resolveAdminEmail(entry),
    updatedBy: entry.updatedBy || entry.changedBy || null,
    updatedAt: entry.updatedAt || entry.changedAt || entry.createdAt || null,
    sequence: entry.sequence != null ? Number(entry.sequence) : null,
    note: entry.note || null,
  };
};

export const getCommissionLogs = (payload) => {
  const data = payload?.data || payload || {};
  const raw =
    data.logs ||
    data.items ||
    data.serviceCategories ||
    (Array.isArray(data) ? data : null) ||
    [];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(normalizeCommissionLog).filter(Boolean);
};

export const getCommissionLogsTotal = (payload) => {
  const data = payload?.data || payload || {};
  const total = data.total ?? data.pagination?.total;
  if (Number.isFinite(Number(total))) {
    return Number(total);
  }
  return getCommissionLogs(payload).length;
};

export const getActiveCommissionRates = (payload) => {
  const data = payload?.data || payload || {};
  const raw = data.activeRates || data.serviceCategories || [];
  if (!Array.isArray(raw)) {
    return {};
  }

  const map = {};
  raw.forEach((entry) => {
    const key = entry?.serviceCategory || entry?.category;
    if (!key) return;
    map[key] = {
      serviceCategory: key,
      commissionPercent: toCommissionPercent(entry.commissionPercent ?? entry.currentSetRate),
      updatedByName: resolveAdminName(entry),
      updatedAt: entry.updatedAt || null,
    };
  });
  return map;
};

export const getActiveCommissionRate = (payload, serviceCategory) => {
  const map = getActiveCommissionRates(payload);
  if (map[serviceCategory]) {
    return map[serviceCategory];
  }

  const logs = getCommissionLogs(payload).filter(
    (log) => log.serviceCategory === serviceCategory
  );
  if (logs[0]?.currentSetRate != null) {
    return {
      serviceCategory,
      commissionPercent: logs[0].currentSetRate,
      updatedByName: logs[0].updatedByName,
      updatedAt: logs[0].updatedAt,
    };
  }

  return null;
};

export const formatCommissionActor = (changedBy, changedByName) => {
  if (typeof changedByName === "string" && changedByName.trim()) {
    return changedByName.trim();
  }

  if (!changedBy || typeof changedBy !== "object") {
    if (typeof changedBy === "string" && changedBy.trim()) {
      return changedBy.trim();
    }
    return "—";
  }

  return changedBy.fullName?.trim() || changedBy.email?.trim() || "Admin";
};

export const validateCommissionPercent = (value, limits = DEFAULT_COMMISSION_LIMITS) => {
  const percent = Number(value);

  if (!Number.isFinite(percent)) {
    return "Enter a valid commission percentage";
  }

  if (percent < limits.minPercent || percent > limits.maxPercent) {
    return `Please enter a commission percentage between ${limits.minPercent}% and ${limits.maxPercent}%`;
  }

  return null;
};
