import { alpha } from "@mui/material/styles";

const withAlphas = (color) => {
  return {
    ...color,
    alpha4: alpha(color.main, 0.04),
    alpha8: alpha(color.main, 0.08),
    alpha12: alpha(color.main, 0.12),
    alpha30: alpha(color.main, 0.3),
    alpha50: alpha(color.main, 0.5),
  };
};

export const brand = {
  primary: "#00828A",
  secondary: "#040D14",
};

export const primary = withAlphas({
  lightest: "#E6F4F5",
  light: "#33A0A7",
  main: brand.primary,
  dark: "#006870",
  darkest: "#004548",
  contrastText: "#FFFFFF",
});

export const secondary = withAlphas({
  lightest: "#E8EAEB",
  light: "#1A2833",
  main: brand.secondary,
  dark: "#030A0F",
  darkest: "#020508",
  contrastText: "#FFFFFF",
});

export const gradients = {
  sidebar: `linear-gradient(180deg, ${brand.secondary} 0%, #061820 55%, #004247 100%)`,
  brand: `linear-gradient(135deg, ${brand.secondary} 0%, ${brand.primary} 100%)`,
  brandRadial: `radial-gradient(circle at 40% 50%, ${brand.primary} 0%, ${brand.secondary} 100%)`,
  button: `linear-gradient(135deg, #00959E 0%, ${brand.primary} 100%)`,
  buttonHover: `linear-gradient(135deg, ${brand.primary} 0%, #006870 100%)`,
};

export const neutral = {
  50: "#F8F9FA",
  100: "#F3F4F6",
  200: "#E5E7EB",
  300: "#D2D6DB",
  400: "#9DA4AE",
  500: "#6C737F",
  600: "#4D5761",
  700: "#2F3746",
  800: "#1C2536",
  900: "#111927",
  60: "#8D2729",
  125: brand.secondary,
  90: alpha(brand.primary, 0.2),
  75: brand.primary,
  25: "#33A0A7",
  1080: brand.primary,
};

export const success = withAlphas({
  lightest: "#F0FDF9",
  light: "#3FC79A",
  main: "#10B981",
  dark: "#0B815A",
  darkest: "#134E48",
  contrastText: "#FFFFFF",
});

export const info = withAlphas({
  lightest: "#ECFDFF",
  light: "#CFF9FE",
  main: "#06AED4",
  dark: "#0E7090",
  darkest: "#164C63",
  contrastText: "#FFFFFF",
});

export const warning = withAlphas({
  lightest: "#FFFAEB",
  light: "#FEF0C7",
  main: "#F79009",
  dark: "#B54708",
  darkest: "#7A2E0E",
  contrastText: "#FFFFFF",
});

export const error = withAlphas({
  lightest: "#FEF3F2",
  light: "#FEE4E2",
  main: "#F04438",
  dark: "#B42318",
  darkest: "#7A271A",
  contrastText: "#FFFFFF",
});
