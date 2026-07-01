const normalizeBaseUrl = (url) => {
  if (!url) {
    return "";
  }

  const trimmed = String(url).trim();
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
};

module.exports = {
  env: {
    NEXT_PUBLIC_BASE_URL: normalizeBaseUrl(
      process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || process.env.URL
    ),
  },
  exportPathMap: async function (defaultPathMap) {
    return {
      "/users/index": { page: "/users" },
      "/about/index": { page: "/about" },
      "/chaperone/index": { page: "/chaperone" },
      "/chaperone/detail/index": { page: "/chaperone/detail" },
      "/driver-earnings/index": { page: "/driver-earnings" },
      "/ride-history/index": { page: "/ride-history" },
      "/ride-history/detail/index": { page: "/ride-history/detail" },
      "/faq/index": { page: "/faq" },
      "/feedback/index": { page: "/feedback" },
      "/policy/index": { page: "/policy" },
      "/terms/index": { page: "/terms" },
      "/": { page: "/" },
      "/404": { page: "/404" },
    };
  },

  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};
