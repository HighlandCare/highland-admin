import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import ChevronDoubleLeftIcon from "@heroicons/react/24/outline/ChevronDoubleLeftIcon";
import ChevronDoubleRightIcon from "@heroicons/react/24/outline/ChevronDoubleRightIcon";
import ChevronLeftIcon from "@heroicons/react/24/outline/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/react/24/outline/ChevronRightIcon";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { brand } from "../theme/colors";

const buildPageList = (currentPage, totalPages) => {
  const total = Math.max(Number(totalPages) || 1, 1);
  const current = Math.min(Math.max(Number(currentPage) || 1, 1), total);

  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set([1, total, current, current - 1, current + 1, current - 2, current + 2]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const withGaps = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      withGaps.push("…");
    }
    withGaps.push(page);
  });

  return withGaps;
};

const NavIconButton = ({ disabled, label, onClick, children }) => (
  <IconButton
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    size="small"
    sx={{
      border: "1px solid",
      borderColor: "neutral.200",
      borderRadius: 1.25,
      color: "text.secondary",
      height: 32,
      width: 32,
      "&:hover": { bgcolor: "neutral.50" },
      "&.Mui-disabled": { borderColor: "neutral.100", opacity: 0.4 },
    }}
  >
    <SvgIcon fontSize="small">{children}</SvgIcon>
  </IconButton>
);

NavIconButton.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

const PageNumberButton = ({ active, onClick, page }) => (
  <Box
    component="button"
    onClick={onClick}
    type="button"
    sx={{
      alignItems: "center",
      bgcolor: active ? brand.primary : "transparent",
      border: "1px solid",
      borderColor: active ? brand.primary : "transparent",
      borderRadius: 1.25,
      color: active ? "#fff" : "text.secondary",
      cursor: "pointer",
      display: "inline-flex",
      fontSize: 13,
      fontWeight: active ? 700 : 500,
      height: 32,
      justifyContent: "center",
      minWidth: 32,
      p: 0,
      px: 0.75,
      "&:hover": {
        bgcolor: active ? brand.primary : alpha(brand.primary, 0.08),
      },
    }}
  >
    {page}
  </Box>
);

PageNumberButton.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func,
  page: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

/**
 * Console / Admintory pagination.
 * variant="compact" → page controls only (table header).
 * variant="full" → showing text + rows + go-to + pages (table footer).
 */
export function ConsolePagination({
  currentPage = 1,
  itemLabel = "results",
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage = 10,
  rowsPerPageOptions = [10, 20, 50],
  totalPages = 1,
  totalRecords = 0,
  variant = "full",
}) {
  const safeTotalPages = Math.max(Number(totalPages) || 1, 1);
  const safePage = Math.min(Math.max(Number(currentPage) || 1, 1), safeTotalPages);
  const safeRows = Math.max(Number(rowsPerPage) || 10, 1);
  const safeTotal = Math.max(Number(totalRecords) || 0, 0);
  const start = safeTotal === 0 ? 0 : (safePage - 1) * safeRows + 1;
  const end = Math.min(safePage * safeRows, safeTotal);
  const pages = buildPageList(safePage, safeTotalPages);
  const [pageInput, setPageInput] = useState(String(safePage));
  const isCompact = variant === "compact";

  useEffect(() => {
    setPageInput(String(safePage));
  }, [safePage]);

  const goToPage = () => {
    const parsed = Number.parseInt(String(pageInput).trim(), 10);

    if (!Number.isFinite(parsed)) {
      setPageInput(String(safePage));
      return;
    }

    const nextPage = Math.min(Math.max(parsed, 1), safeTotalPages);
    setPageInput(String(nextPage));

    if (nextPage !== safePage) {
      onPageChange?.(nextPage);
    }
  };

  const pageControls = (
    <Stack alignItems="center" direction="row" spacing={0.35}>
      {!isCompact ? (
        <NavIconButton
          disabled={safePage <= 1}
          label="First page"
          onClick={() => onPageChange?.(1)}
        >
          <ChevronDoubleLeftIcon />
        </NavIconButton>
      ) : null}
      <NavIconButton
        disabled={safePage <= 1}
        label="Previous page"
        onClick={() => onPageChange?.(safePage - 1)}
      >
        <ChevronLeftIcon />
      </NavIconButton>

      {pages.map((page, index) =>
        page === "…" ? (
          <Typography
            color="text.secondary"
            key={`gap-${index}`}
            sx={{ px: 0.5, fontSize: 13 }}
            variant="body2"
          >
            …
          </Typography>
        ) : (
          <PageNumberButton
            active={page === safePage}
            key={page}
            onClick={() => onPageChange?.(page)}
            page={page}
          />
        )
      )}

      <NavIconButton
        disabled={safePage >= safeTotalPages}
        label="Next page"
        onClick={() => onPageChange?.(safePage + 1)}
      >
        <ChevronRightIcon />
      </NavIconButton>
      {!isCompact ? (
        <NavIconButton
          disabled={safePage >= safeTotalPages}
          label="Last page"
          onClick={() => onPageChange?.(safeTotalPages)}
        >
          <ChevronDoubleRightIcon />
        </NavIconButton>
      ) : null}
    </Stack>
  );

  if (isCompact) {
    return pageControls;
  }

  return (
    <Box
      sx={{
        alignItems: { xs: "stretch", md: "center" },
        borderTop: "1px solid",
        borderColor: "neutral.200",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 1.5,
        justifyContent: "space-between",
        px: { xs: 2, sm: 2.5 },
        py: 1.75,
      }}
    >
      <Typography color="text.secondary" sx={{ fontSize: 13 }} variant="body2">
        {safeTotal === 0
          ? `Showing 0 ${itemLabel}`
          : `Showing ${start}–${end} of ${safeTotal} ${itemLabel} • Page ${safePage} of ${safeTotalPages}`}
      </Typography>

      <Stack
        alignItems="center"
        direction="row"
        flexWrap="wrap"
        justifyContent={{ xs: "space-between", md: "flex-end" }}
        spacing={1.25}
        useFlexGap
      >
        {typeof onRowsPerPageChange === "function" ? (
          <Stack alignItems="center" direction="row" spacing={1}>
            <Typography color="text.secondary" sx={{ fontSize: 13 }} variant="body2">
              Rows
            </Typography>
            <FormControl size="small">
              <Select
                onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
                sx={{
                  bgcolor: "neutral.100",
                  borderRadius: 1.5,
                  fontSize: 13,
                  height: 32,
                  minWidth: 64,
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                  "& .MuiSelect-select": { py: 0.5, pr: 3, pl: 1.5 },
                }}
                value={safeRows}
              >
                {rowsPerPageOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        ) : null}

        <Stack alignItems="center" direction="row" spacing={0.75}>
          <Typography color="text.secondary" sx={{ fontSize: 13 }} variant="body2">
            Go to
          </Typography>
          <TextField
            inputProps={{
              "aria-label": "Page number",
              inputMode: "numeric",
              min: 1,
              max: safeTotalPages,
              pattern: "[0-9]*",
              style: {
                padding: 0,
                height: 30,
                lineHeight: "30px",
                textAlign: "center",
              },
            }}
            onBlur={goToPage}
            onChange={(event) => {
              const next = event.target.value.replace(/[^\d]/g, "");
              setPageInput(next);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                goToPage();
              }
            }}
            size="small"
            sx={{
              width: 56,
              "& .MuiOutlinedInput-root": {
                alignItems: "center",
                bgcolor: "neutral.100",
                borderRadius: 1.5,
                boxSizing: "border-box",
                display: "flex",
                fontSize: 13,
                height: 32,
                minHeight: 32,
                px: 1,
                py: 0,
              },
              "& .MuiOutlinedInput-input": {
                boxSizing: "border-box",
                height: 30,
                lineHeight: "30px",
                p: 0,
                textAlign: "center",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "transparent",
              },
            }}
            value={pageInput}
          />
          <Button
            onClick={goToPage}
            size="small"
            sx={{
              borderRadius: 1.5,
              color: "#fff",
              height: 32,
              minHeight: 32,
              minWidth: 52,
              px: 1.25,
              py: 0,
              textTransform: "none",
            }}
            variant="contained"
          >
            Go
          </Button>
        </Stack>

        {pageControls}
      </Stack>
    </Box>
  );
}

ConsolePagination.propTypes = {
  currentPage: PropTypes.number,
  itemLabel: PropTypes.string,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  rowsPerPage: PropTypes.number,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  totalPages: PropTypes.number,
  totalRecords: PropTypes.number,
  variant: PropTypes.oneOf(["full", "compact"]),
};
