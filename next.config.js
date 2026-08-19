const normalizeBaseUrl = (url) => {
  if (!url) {
    return "";
  }

  let trimmed = String(url).trim().replace(/^["']|["']$/g, "");

  // Axios needs a real protocol. "localhost:1120/..." → "Unsupported protocol localhost:"
  if (trimmed && !/^https?:\/\//i.test(trimmed)) {
    trimmed = `http://${trimmed}`;
  }

  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

// Only use the explicit API base — never fall back to Vercel/Next `URL`
const apiBaseUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);

if (!apiBaseUrl) {
  console.warn(
    "[highland-admin] NEXT_PUBLIC_BASE_URL is missing. Set it in .env (e.g. http://127.0.0.1:1120/api/v1)"
  );
} else {
  console.log("[highland-admin] API base URL:", apiBaseUrl);
}

module.exports = {
  env: {
    NEXT_PUBLIC_BASE_URL: apiBaseUrl,
  },
  exportPathMap: async function (defaultPathMap) {
    return {
      "/users/index": { page: "/users" },
      "/users/detail/index": { page: "/users/detail" },
      "/about/index": { page: "/about" },
      "/chaperone/index": { page: "/chaperone" },
      "/chaperone/detail/index": { page: "/chaperone/detail" },
      "/restaurants/index": { page: "/restaurants" },
      "/restaurants/detail/index": { page: "/restaurants/detail" },
      "/driver-earnings/index": { page: "/driver-earnings" },
      "/ride-history/index": { page: "/ride-history" },
      "/ride-history/detail/index": { page: "/ride-history/detail" },
      "/orders/detail/index": { page: "/orders/detail" },
      "/disputes/index": { page: "/disputes" },
      "/disputes/detail/index": { page: "/disputes/detail" },
      "/faq/index": { page: "/faq" },
      "/feedback/index": { page: "/feedback" },
      "/policy/index": { page: "/policy" },
      "/terms/index": { page: "/terms" },
      "/": { page: "/" },
      "/404": { page: "/404" },
    };
  },

  reactStrictMode: true,
  transpilePackages: ["country-state-city"],
  images: {
    unoptimized: true,
  },
};
