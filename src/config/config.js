const normalizeBaseUrl = (url) => {
  if (!url) {
    return "";
  }

  const trimmed = String(url).trim();
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

export const baseURL = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
