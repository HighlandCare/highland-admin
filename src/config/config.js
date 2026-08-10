const normalizeBaseUrl = (url) => {
  if (!url) {
    return "";
  }

  let trimmed = String(url).trim().replace(/^["']|["']$/g, "");

  // Axios needs http(s):// — bare "localhost:1120/..." becomes protocol "localhost:"
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

export const baseURL = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
