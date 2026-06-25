module.exports = {
  exportPathMap: async function (defaultPathMap) {
    return {
      "/users/index": { page: "/users" },
      "/about/index": { page: "/about" },
      "/chaperone/index": { page: "/chaperone" },
      "/chaperone/detail/index": { page: "/chaperone/detail" },
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
