import PropTypes from "prop-types";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import { InputAdornment, SvgIcon, TextField } from "@mui/material";

/** Soft gray search field (Admintory-style) with left-aligned icon + placeholder. */
export const searchFieldSx = {
  "& .MuiOutlinedInput-root": {
    alignItems: "center",
    bgcolor: "neutral.100",
    borderRadius: 2.5,
    boxSizing: "border-box",
    columnGap: 0,
    display: "flex",
    fontSize: 14,
    gap: 0,
    height: 44,
    justifyContent: "flex-start",
    minHeight: 44,
    pl: 1.25,
    pr: 1.5,
    py: 0,
    transition: "background-color 120ms ease, box-shadow 120ms ease",
    "&:hover": {
      bgcolor: "neutral.50",
    },
    "&.Mui-focused": {
      bgcolor: "background.paper",
      boxShadow: "0 0 0 3px rgba(0, 130, 138, 0.12)",
    },
  },
  "& .MuiOutlinedInput-input, & .MuiInputBase-input, & input": {
    boxSizing: "border-box",
    height: 44,
    lineHeight: "44px",
    margin: 0,
    paddingBottom: "0 !important",
    paddingLeft: "0 !important",
    paddingRight: "0 !important",
    paddingTop: "0 !important",
    textAlign: "left !important",
    textIndent: "0 !important",
  },
  "& .MuiInputAdornment-root, & .MuiInputAdornment-positionStart": {
    alignItems: "center",
    height: "auto",
    marginLeft: "0 !important",
    marginRight: "4px !important",
    maxHeight: "none",
    width: "auto",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "transparent",
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "neutral.200",
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "primary.main",
    borderWidth: 1,
  },
};

export function SearchField({
  fullWidth = false,
  onChange,
  onKeyDown,
  placeholder = "Search",
  sx = {},
  value = "",
  ...rest
}) {
  return (
    <TextField
      fullWidth={fullWidth}
      onChange={(event) => onChange?.(event.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      size="small"
      value={value}
      variant="outlined"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start" sx={{ mr: "4px !important", ml: 0 }}>
            <SvgIcon
              fontSize="small"
              sx={{ color: "neutral.400", display: "block", flexShrink: 0 }}
            >
              <MagnifyingGlassIcon />
            </SvgIcon>
          </InputAdornment>
        ),
      }}
      sx={{ ...searchFieldSx, ...sx }}
      {...rest}
    />
  );
}

SearchField.propTypes = {
  fullWidth: PropTypes.bool,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  placeholder: PropTypes.string,
  sx: PropTypes.object,
  value: PropTypes.string,
};
