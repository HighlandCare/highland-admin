import {
  createTheme,
  filledInputClasses,
  inputLabelClasses,
  outlinedInputClasses,
  paperClasses,
  tableCellClasses,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { gradients, primary, secondary } from "./colors";

// Used only to create transitions
const muiTheme = createTheme();

export function createComponents(config) {
  const { palette } = config;

  return {
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 0,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "capitalize",
        },
        containedPrimary: {
          background: gradients.button,
          boxShadow: "none",
          color: primary.contrastText,
          "&:hover": {
            background: gradients.buttonHover,
            boxShadow: "none",
          },
        },
        containedSecondary: {
          background: gradients.brand,
          boxShadow: "none",
          color: secondary.contrastText,
          "&:hover": {
            background: gradients.sidebar,
            boxShadow: "none",
          },
        },
        sizeSmall: {
          padding: "6px 16px",
        },
        sizeMedium: {
          padding: "8px 20px",
        },
        sizeLarge: {
          padding: "11px 24px",
        },
        textSizeSmall: {
          padding: "7px 12px",
        },
        textSizeMedium: {
          padding: "9px 16px",
        },
        textSizeLarge: {
          padding: "12px 16px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          [`&.${paperClasses.elevation1}`]: {
            boxShadow: "0px 5px 22px rgba(0, 0, 0, 0.04), 0px 0px 0px 0.5px rgba(0, 0, 0, 0.03)",
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "32px 24px",
          "&:last-child": {
            paddingBottom: "32px",
          },
        },
      },
    },
    MuiCardHeader: {
      defaultProps: {
        titleTypographyProps: {
          variant: "h6",
        },
        subheaderTypographyProps: {
          variant: "body2",
        },
      },
      styleOverrides: {
        root: {
          padding: "32px 24px 16px",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
        },
        html: {
          MozOsxFontSmoothing: "grayscale",
          WebkitFontSmoothing: "antialiased",
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          width: "100%",
        },
        body: {
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          minHeight: "100%",
          textTransform: "capitalize",
          width: "100%",
        },
        "input, textarea, select, [contenteditable='true'], .ql-editor, code, pre, kbd, samp": {
          textTransform: "none",
        },
        '[data-email="true"], [data-email="true"] *': {
          textTransform: "lowercase !important",
        },
        'input[type="email"]': {
          textTransform: "lowercase !important",
        },
        '[data-brand="true"]': {
          textTransform: "uppercase",
        },
        ".Toastify__toast-body": {
          textTransform: "capitalize",
        },
        ".Toastify__toast-container": {
          left: "50%",
          maxWidth: "calc(100vw - 32px)",
          transform: "translateX(-50%)",
          width: "auto",
        },
        "@media only screen and (max-width: 480px)": {
          ".Toastify__toast-container--top-right": {
            right: "auto",
            top: "1rem",
          },
        },
        "#__next": {
          display: "flex",
          flex: "1 1 auto",
          flexDirection: "column",
          height: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          width: "100%",
        },
        ".quill": {
          maxWidth: "100%",
          width: "100%",
        },
        ".ql-toolbar.ql-snow": {
          flexWrap: "wrap",
          rowGap: "8px",
        },
        ".ql-container.ql-snow": {
          maxWidth: "100%",
        },
        "#nprogress": {
          pointerEvents: "none",
        },
        "#nprogress .bar": {
          backgroundColor: primary.main,
          height: 3,
          left: 0,
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 2000,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          "&::placeholder": {
            opacity: 1,
          },
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        input: {
          fontSize: 14,
          fontWeight: 500,
          lineHeight: "24px",
          "&::placeholder": {
            color: palette.text.secondary,
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          borderRadius: 8,
          borderStyle: "solid",
          borderWidth: 1,
          overflow: "hidden",
          borderColor: palette.neutral[200],
          transition: muiTheme.transitions.create(["border-color", "box-shadow"]),
          "&:hover": {
            backgroundColor: palette.action.hover,
          },
          "&:before": {
            display: "none",
          },
          "&:after": {
            display: "none",
          },
          [`&.${filledInputClasses.disabled}`]: {
            backgroundColor: "transparent",
          },
          [`&.${filledInputClasses.focused}`]: {
            backgroundColor: "transparent",
            borderColor: palette.primary.main,
            boxShadow: `${palette.primary.main} 0 0 0 2px`,
          },
          [`&.${filledInputClasses.error}`]: {
            borderColor: palette.error.main,
            boxShadow: `${palette.error.main} 0 0 0 2px`,
          },
        },
        input: {
          fontSize: 14,
          fontWeight: 500,
          lineHeight: "24px",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: palette.action.hover,
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              borderColor: palette.neutral[200],
            },
          },
          [`&.${outlinedInputClasses.focused}`]: {
            backgroundColor: "transparent",
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              borderColor: palette.primary.main,
              borderWidth: "2px",
            },
          },
          [`&.${outlinedInputClasses.error}`]: {
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              borderColor: palette.error.main,
            },
          },
          [`&.${outlinedInputClasses.error}.${outlinedInputClasses.focused}`]: {
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              borderColor: palette.error.main,
              borderWidth: "2px",
            },
          },
        },
        input: {
          fontSize: 14,
          fontWeight: 500,
          lineHeight: "24px",
        },
        notchedOutline: {
          borderColor: palette.neutral[200],
          transition: muiTheme.transitions.create(["border-color", "border-width"]),
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 500,
          [`&.${inputLabelClasses.filled}`]: {
            transform: "translate(12px, 18px) scale(1)",
          },
          [`&.${inputLabelClasses.shrink}`]: {
            [`&.${inputLabelClasses.standard}`]: {
              transform: "translate(0, -1.5px) scale(0.85)",
            },
            [`&.${inputLabelClasses.filled}`]: {
              transform: "translate(12px, 6px) scale(0.85)",
            },
            [`&.${inputLabelClasses.outlined}`]: {
              backgroundColor: palette.background.paper,
              paddingLeft: 4,
              paddingRight: 4,
              transform: "translate(14px, -9px) scale(0.85)",
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        outlined: {
          [`&.${inputLabelClasses.shrink}`]: {
            backgroundColor: palette.background.paper,
            paddingLeft: 4,
            paddingRight: 4,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.71,
          minWidth: "auto",
          paddingLeft: 0,
          paddingRight: 0,
          textTransform: "capitalize",
          "& + &": {
            marginLeft: 24,
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: "separate",
          borderSpacing: 0,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: muiTheme.transitions.create(["background-color"], {
            duration: muiTheme.transitions.duration.shorter,
          }),
          "&:hover": {
            backgroundColor: palette.neutral[50],
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "none",
          fontSize: 14,
          lineHeight: 1.5,
        },
        body: {
          color: palette.neutral[700],
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          [`& .${tableCellClasses.root}`]: {
            backgroundColor: palette.background.paper,
            borderBottom: `1px solid ${palette.neutral[200]}`,
            color: palette.neutral[500],
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: 0,
            lineHeight: 1.4,
            padding: { xs: "10px 12px", sm: "12px 24px" },
            textTransform: "capitalize",
          },
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          borderTop: `1px solid ${palette.neutral[100]}`,
          color: palette.neutral[600],
        },
        toolbar: {
          minHeight: 56,
          paddingLeft: 16,
          paddingRight: 16,
        },
        displayedRows: {
          fontSize: 13,
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "filled",
      },
    },
  };
}
