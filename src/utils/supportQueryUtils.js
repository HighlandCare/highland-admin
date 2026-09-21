const SUPPORT_QUERY_STORAGE_KEY = "highland_support_query_detail";

export const SUPPORT_QUERY_STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const SUPPORT_QUERY_STATUS_OPTIONS = SUPPORT_QUERY_STATUSES.filter(
  (item) => item.value !== "all"
);

export const SUPPORT_QUERY_CATEGORIES = [
  { value: "all", label: "All categories" },
  { value: "account", label: "Account" },
  { value: "payment", label: "Payment" },
  { value: "ride", label: "Ride" },
  { value: "food_order", label: "Food order" },
  { value: "app_issue", label: "App issue" },
  { value: "feedback", label: "Feedback" },
  { value: "other", label: "Other" },
];

export const SUPPORT_QUERY_ROLES = [
  { value: "all", label: "All roles" },
  { value: "user", label: "User" },
  { value: "chaperone", label: "Driver" },
  { value: "restaurant", label: "Restaurant" },
  { value: "admin", label: "Admin" },
];

const LABEL_MAP = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
  account: "Account",
  payment: "Payment",
  ride: "Ride",
  food_order: "Food order",
  app_issue: "App issue",
  feedback: "Feedback",
  other: "Other",
  user: "User",
  chaperone: "Driver",
  restaurant: "Restaurant",
  admin: "Admin",
};

export const formatSupportLabel = (value) => {
  if (!value) {
    return "—";
  }
  return LABEL_MAP[value] || String(value).replace(/_/g, " ");
};

export const getSupportStatusMeta = (status) => {
  switch (status) {
    case "open":
      return { color: "warning", label: "Open" };
    case "in_progress":
      return { color: "info", label: "In progress" };
    case "resolved":
      return { color: "success", label: "Resolved" };
    case "closed":
      return { color: "neutral", label: "Closed" };
    default:
      return { color: "neutral", label: formatSupportLabel(status) };
  }
};

export const getSubmitterImageUrl = (submitter) => {
  const image = submitter?.image;
  if (!image) {
    return null;
  }
  if (typeof image === "string") {
    return image;
  }
  return image.file || image.url || null;
};

export const getSupportQueryId = (item) => item?.id || item?._id || null;

export const getSupportQueryFromResponse = (response) => {
  if (!response) {
    return null;
  }
  if (response.data && typeof response.data === "object" && !Array.isArray(response.data)) {
    return response.data;
  }
  if (response.id || response._id || response.messages) {
    return response;
  }
  return null;
};

export const getSupportQueriesFromResponse = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response)) {
    return response;
  }
  return [];
};

export const getSupportQueriesPagination = (response, fallbackPage = 1) => {
  const pagination = response?.pagination || {};
  return {
    page: Number(pagination.page ?? fallbackPage) || 1,
    limit: Number(pagination.limit) || 10,
    total: Number(pagination.total ?? 0) || 0,
    totalPages: Math.max(Number(pagination.totalPages) || 1, 1),
    hasNextPage: Boolean(pagination.hasNextPage),
    hasPrevPage: Boolean(pagination.hasPrevPage),
  };
};

export const validateSupportReply = (message, attachments = []) => {
  const text = String(message || "").trim();
  if (!text) {
    return "Enter a reply message";
  }
  if (text.length > 5000) {
    return "Reply must be 5000 characters or fewer";
  }
  if (attachments.length > 5) {
    return "You can attach up to 5 files";
  }

  const allowed = /\.(jpe?g|png|gif|webp|pdf|docx?)$/i;
  for (const file of attachments) {
    if (!file) continue;
    if (file.size > 10 * 1024 * 1024) {
      return "Each attachment must be 10 MB or smaller";
    }
    if (file.name && !allowed.test(file.name)) {
      return "Attachments must be images, PDF, or Word documents";
    }
  }

  return null;
};

export const storeSupportQueryDetail = (item) => {
  if (typeof window === "undefined" || !item) {
    return;
  }
  try {
    sessionStorage.setItem(SUPPORT_QUERY_STORAGE_KEY, JSON.stringify(item));
  } catch (error) {
    console.error("storeSupportQueryDetail error:", error);
  }
};

export const getStoredSupportQueryDetail = () => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(SUPPORT_QUERY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("getStoredSupportQueryDetail error:", error);
    return null;
  }
};

export const formatFileSize = (bytes) => {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) {
    return "";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const isImageAttachment = (file = {}) => {
  const type = String(file.fileType || file.type || "").toLowerCase();
  if (type.startsWith("image/")) {
    return true;
  }

  const name = String(file.fileName || file.name || file.url || "").toLowerCase();
  return /\.(jpe?g|png|gif|webp)(\?|#|$)/i.test(name);
};

export const getAttachmentUrl = (file = {}) => file.url || file.file || null;

export const getAttachmentLabel = (file = {}) =>
  file.fileName || file.name || (isImageAttachment(file) ? "Image" : "Attachment");
