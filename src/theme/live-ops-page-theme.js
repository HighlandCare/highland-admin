import { createTheme } from "@mui/material/styles";

const DARK = {
  background: {
    default: "#0b1220",
    paper: "#121a2b",
  },
  text: {
    primary: "#e8eef6",
    secondary: "#94a3b8",
    disabled: "#64748b",
  },
  divider: "rgba(148, 163, 184, 0.16)",
  action: {
    active: "#94a3b8",
    hover: "rgba(148, 163, 184, 0.08)",
    selected: "rgba(0, 130, 138, 0.22)",
    disabled: "rgba(148, 163, 184, 0.38)",
    disabledBackground: "rgba(148, 163, 184, 0.12)",
  },
};

export function createLiveOpsPageTheme(parentTheme, mode = "dark") {
  const isDark = mode === "dark";

  if (!isDark) {
    return parentTheme;
  }

  return createTheme(parentTheme, {
    palette: {
      mode: "dark",
      background: DARK.background,
      text: DARK.text,
      divider: DARK.divider,
      action: {
        ...parentTheme.palette.action,
        ...DARK.action,
      },
    },
  });
}

export function liveOpsGlass(theme) {
  const dark = theme.palette.mode === "dark";

  return {
    bgcolor: dark ? "rgba(12, 18, 32, 0.88)" : "rgba(255, 255, 255, 0.94)",
    backdropFilter: "blur(14px)",
    border: "1px solid",
    borderColor: dark ? "rgba(148, 163, 184, 0.16)" : "divider",
    borderRadius: "14px",
    boxShadow: dark
      ? "0 12px 32px rgba(0, 0, 0, 0.38)"
      : "0 8px 28px rgba(15, 23, 42, 0.08)",
  };
}
