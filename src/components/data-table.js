import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  LinearProgress,
  Stack,
  Table,
  Typography,
} from "@mui/material";
import { ConsolePagination } from "./console-pagination";
import Loader from "./Loader";
import { SearchField } from "./search-field";

export const ROWS_PER_PAGE = 10;
export const SEARCH_DEBOUNCE_MS = 150;

export const dataTableLoadingOverlaySx = {
  alignItems: "center",
  bgcolor: "rgba(255, 255, 255, 0.4)",
  display: "flex",
  inset: 0,
  justifyContent: "center",
  pointerEvents: "none",
  position: "absolute",
  zIndex: 2,
};

/**
 * Keeps filters/table mounted while data loads.
 * Uses a thin progress bar + light overlay (not a heavy full-page spinner).
 */
export const DataTableLoadingShell = ({ children, loading = false }) => (
  <Box sx={{ position: "relative", width: "100%" }}>
    {loading ? (
      <LinearProgress
        sx={{
          borderRadius: "3px 3px 0 0",
          height: 3,
          left: 0,
          position: "absolute",
          right: 0,
          top: 0,
          zIndex: 3,
        }}
      />
    ) : null}
    {loading ? (
      <Box sx={dataTableLoadingOverlaySx}>
        <Loader size="sm" />
      </Box>
    ) : null}
    <Box
      sx={{
        opacity: loading ? 0.65 : 1,
        pointerEvents: loading ? "none" : "auto",
        transition: "opacity 80ms linear",
      }}
    >
      {children}
    </Box>
  </Box>
);

DataTableLoadingShell.propTypes = {
  children: PropTypes.node,
  loading: PropTypes.bool,
};

export const dataTableScrollSx = {
  maxWidth: "100%",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  width: "100%",
};

export const getResponsiveTableMinWidth = (minWidth = 800) => ({
  xs: Math.min(minWidth, 640),
  sm: Math.min(minWidth, 720),
  md: minWidth,
});

/** Filter bar card (Admintory-style). */
export const dataTableFilterCardSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "neutral.200",
  borderRadius: 3,
  boxShadow: "0 1px 2px rgba(17, 25, 39, 0.04), 0 10px 28px rgba(17, 25, 39, 0.05)",
  maxWidth: "100%",
  overflow: "visible",
  width: "100%",
};

/** Table card. */
export const dataTableCardSx = {
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "neutral.200",
  borderRadius: 3,
  boxShadow: "0 1px 2px rgba(17, 25, 39, 0.04), 0 10px 28px rgba(17, 25, 39, 0.05)",
  maxWidth: "100%",
  overflow: "hidden",
  width: "100%",
};

export const dataTableSx = {
  "& .MuiTableHead-root .MuiTableCell-root": {
    backgroundColor: "background.paper",
    borderBottom: "1px solid",
    borderColor: "neutral.200",
    color: "neutral.600",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    padding: { xs: "12px 12px", sm: "14px 18px" },
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  "& .MuiTableBody-root .MuiTableCell-root": {
    borderBottom: "1px solid",
    borderColor: "neutral.100",
    color: "neutral.800",
    fontSize: 13.5,
    padding: { xs: "14px 12px", sm: "15px 18px" },
    verticalAlign: "middle",
  },
  "& .MuiTableBody-root .MuiTableRow-root": {
    transition: "background-color 120ms ease",
    "&:hover": {
      bgcolor: "neutral.50",
    },
  },
  "& .MuiTableBody-root .MuiTableRow-root:last-of-type .MuiTableCell-root": {
    borderBottom: 0,
  },
};

export const tableActionButtonSx = {
  borderRadius: 2,
  minWidth: 72,
  px: 2,
  textTransform: "none",
};

const filterControlSx = {
  width: { xs: "100%", sm: "auto" },
  "& > *": { width: { xs: "100%", sm: "auto" } },
  "& .MuiFormControl-root": {
    width: { xs: "100%", sm: "auto" },
    minWidth: { xs: "100%", sm: 140 },
  },
  "& .MuiFormLabel-root, & .MuiInputLabel-root": {
    fontSize: 12,
    fontWeight: 700,
    color: "text.primary",
    mb: 0.75,
    position: "static",
    transform: "none",
  },
  "& .MuiOutlinedInput-root": {
    bgcolor: "neutral.100",
    borderRadius: 2.5,
    fontSize: 13,
    height: 44,
    "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
    "&:hover": { bgcolor: "neutral.50" },
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "neutral.200" },
    "&.Mui-focused": { bgcolor: "background.paper" },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "primary.main",
      borderWidth: 1,
    },
  },
  "& .MuiSelect-select": {
    alignItems: "center",
    display: "flex",
    py: 1.25,
    pl: 1.75,
    pr: 3.5,
  },
  "& .MuiButton-root": {
    borderRadius: 2.5,
    height: 44,
    textTransform: "none",
    width: { xs: "100%", sm: "auto" },
  },
  "& .MuiButton-outlined": {
    borderColor: "neutral.200",
    color: "text.primary",
  },
};

/**
 * Admintory-style filter toolbar.
 * Prefer page-level titles (pageTitleSx). Optional `title` is for section cards only.
 * Search is debounced so tables stay responsive while typing.
 */
export const DataTableToolbar = ({
  actions,
  onSearchChange,
  searchDebounceMs = SEARCH_DEBOUNCE_MS,
  searchPlaceholder = "Search",
  searchValue = "",
  title,
}) => {
  const [localValue, setLocalValue] = useState(searchValue ?? "");
  const emittedValueRef = useRef(searchValue ?? "");

  useEffect(() => {
    const nextValue = searchValue ?? "";
    if (nextValue === emittedValueRef.current) {
      return;
    }
    emittedValueRef.current = nextValue;
    setLocalValue(nextValue);
  }, [searchValue]);

  useEffect(() => {
    if (localValue === emittedValueRef.current) {
      return undefined;
    }

    if (searchDebounceMs <= 0) {
      emittedValueRef.current = localValue;
      onSearchChange?.(localValue);
      return undefined;
    }

    const timer = setTimeout(() => {
      emittedValueRef.current = localValue;
      onSearchChange?.(localValue);
    }, searchDebounceMs);

    return () => clearTimeout(timer);
  }, [localValue, onSearchChange, searchDebounceMs]);

  const flushSearch = () => {
    if (localValue === emittedValueRef.current) {
      return;
    }
    emittedValueRef.current = localValue;
    onSearchChange?.(localValue);
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.25 } }}>
      {title ? (
        <Typography
          fontWeight={700}
          sx={{ mb: 2, fontSize: { xs: "1.15rem", sm: "1.25rem" }, letterSpacing: "-0.01em" }}
          variant="h5"
        >
          {title}
        </Typography>
      ) : null}

      <Stack
        alignItems={{ xs: "stretch", md: "flex-end" }}
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ width: "100%" }}
      >
        <Box sx={{ flex: { md: "1 1 auto" }, minWidth: { md: 0 }, width: "100%" }}>
          <SearchField
            fullWidth
            onChange={setLocalValue}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                flushSearch();
              }
            }}
            placeholder={searchPlaceholder}
            value={localValue}
          />
        </Box>

        {actions ? (
          <Stack
            alignItems={{ xs: "stretch", sm: "flex-end" }}
            direction={{ xs: "column", sm: "row" }}
            flexShrink={0}
            spacing={1.25}
            sx={filterControlSx}
          >
            {actions}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
};

DataTableToolbar.propTypes = {
  actions: PropTypes.node,
  onSearchChange: PropTypes.func,
  searchDebounceMs: PropTypes.number,
  searchPlaceholder: PropTypes.string,
  searchValue: PropTypes.string,
  title: PropTypes.string,
};

/**
 * Shared pagination for all data tables.
 * Accepts ConsolePagination props, or legacy MUI TablePagination-shaped props.
 */
export const DataTablePagination = (props = {}) => {
  const isLegacyMuiShape =
    props.currentPage == null && (props.page != null || props.count != null);

  if (!isLegacyMuiShape) {
    return <ConsolePagination {...props} />;
  }

  const rowsPerPage = Math.max(Number(props.rowsPerPage) || ROWS_PER_PAGE, 1);
  const totalRecords = Math.max(Number(props.count) || 0, 0);
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage) || 1);
  const currentPage = Math.min(Math.max((Number(props.page) || 0) + 1, 1), totalPages);

  return (
    <ConsolePagination
      currentPage={currentPage}
      itemLabel={props.itemLabel || "results"}
      onPageChange={(nextPage) => props.onPageChange?.(null, nextPage - 1)}
      onRowsPerPageChange={
        typeof props.onRowsPerPageChange === "function"
          ? (limit) =>
              props.onRowsPerPageChange({
                target: { value: String(limit) },
              })
          : undefined
      }
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={props.rowsPerPageOptions || [10, 20, 50]}
      totalPages={totalPages}
      totalRecords={totalRecords}
      variant={props.variant}
    />
  );
};

DataTablePagination.propTypes = {
  count: PropTypes.number,
  currentPage: PropTypes.number,
  itemLabel: PropTypes.string,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  totalPages: PropTypes.number,
  totalRecords: PropTypes.number,
  variant: PropTypes.oneOf(["full", "compact"]),
};

export const DataTable = ({
  children,
  empty = false,
  minWidth = 800,
  pagination,
  toolbar,
}) => {
  const tableCard = (
    <Card sx={dataTableCardSx}>
      {empty ? (
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            justifyContent: "center",
            minHeight: 260,
            px: 3,
            py: 8,
          }}
        >
          <Typography color="text.primary" fontWeight={700} variant="subtitle1">
            No results found
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ maxWidth: 360, textAlign: "center" }}
            variant="body2"
          >
            Try adjusting your search or filters.
          </Typography>
        </Box>
      ) : (
        <Box sx={dataTableScrollSx}>
          <Box sx={{ minWidth: getResponsiveTableMinWidth(minWidth), width: "100%" }}>
            <Table sx={dataTableSx}>{children}</Table>
          </Box>
        </Box>
      )}

      {pagination ? (
        <DataTablePagination {...pagination} variant="full" />
      ) : null}
    </Card>
  );

  if (!toolbar) {
    return tableCard;
  }

  return (
    <Stack spacing={2.5} sx={{ width: "100%" }}>
      <Card sx={dataTableFilterCardSx}>{toolbar}</Card>
      {tableCard}
    </Stack>
  );
};

DataTable.propTypes = {
  children: PropTypes.node,
  empty: PropTypes.bool,
  minWidth: PropTypes.number,
  pagination: PropTypes.object,
  toolbar: PropTypes.node,
};

export const paginateItems = (items, page) => {
  const safePage = Math.max(page, 1);
  const start = (safePage - 1) * ROWS_PER_PAGE;

  return items.slice(start, start + ROWS_PER_PAGE);
};

export const getClientPaginationProps = ({
  currentPage = 1,
  itemLabel = "results",
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage = ROWS_PER_PAGE,
  totalItems = 0,
}) => {
  const safeRows = Math.max(Number(rowsPerPage) || ROWS_PER_PAGE, 1);
  const totalPages = Math.max(1, Math.ceil(totalItems / safeRows));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  return getServerPaginationProps({
    currentPage: safeCurrentPage,
    itemLabel,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPage: safeRows,
    totalPages,
    totalRecords: totalItems,
  });
};

export const getPaginationMeta = (items = {}) => ({
  currentPage: items.current_page ?? items.currentPage ?? 1,
  totalPages: items.total_pages ?? items.totalPages ?? 1,
  totalRecords:
    items.total_records ??
    items.totalRecords ??
    items.total ??
    (items.total_pages ?? items.totalPages ?? 1) * ROWS_PER_PAGE,
});

export const getServerPaginationMeta = (response, page, currentItemCount, rowsPerPage = ROWS_PER_PAGE) => {
  const safeRows = Math.max(Number(rowsPerPage) || ROWS_PER_PAGE, 1);
  const apiTotalPages =
    response?.pagination?.totalPages ??
    response?.total_pages ??
    response?.totalPages;

  if (apiTotalPages != null) {
    return {
      currentPage: page,
      totalPages: Math.max(Number(apiTotalPages) || 1, 1),
      totalRecords:
        response?.pagination?.total ??
        response?.total_records ??
        response?.totalRecords ??
        response?.total_drivers ??
        response?.total ??
        Math.max(Number(apiTotalPages) || 1, 1) * safeRows,
    };
  }

  const hasMore = currentItemCount >= safeRows;
  const safePage = Math.max(page, 1);

  return {
    currentPage: safePage,
    totalPages: hasMore ? safePage + 1 : safePage,
    totalRecords:
      response?.pagination?.total ??
      response?.total_records ??
      response?.totalRecords ??
      response?.total_drivers ??
      (hasMore ? safePage * safeRows + 1 : (safePage - 1) * safeRows + currentItemCount),
  };
};

/** Props for ConsolePagination / DataTablePagination (1-based page). */
export const getServerPaginationProps = ({
  currentPage = 1,
  itemLabel = "results",
  onPageChange,
  onRowsPerPageChange,
  rowsPerPage = ROWS_PER_PAGE,
  rowsPerPageOptions = [10, 20, 50],
  totalPages = 1,
  totalRecords,
}) => {
  const safeRows = Math.max(Number(rowsPerPage) || ROWS_PER_PAGE, 1);
  const safeTotalPages = Math.max(Number(totalPages) || 1, 1);
  const safeCurrentPage = Math.min(Math.max(Number(currentPage) || 1, 1), safeTotalPages);
  const count = totalRecords ?? safeTotalPages * safeRows;

  return {
    currentPage: safeCurrentPage,
    itemLabel,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPage: safeRows,
    rowsPerPageOptions,
    totalPages: safeTotalPages,
    totalRecords: count,
  };
};

export const defaultSortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Name A-Z", value: "name-asc" },
  { label: "Name Z-A", value: "name-desc" },
];

export const filterBySearch = (items, search, getSearchText) => {
  if (!search.trim()) {
    return items;
  }

  const query = search.trim().toLowerCase();

  return items.filter((item) => getSearchText(item).toLowerCase().includes(query));
};

export const sortItems = (items, sortValue, getSortValues) => {
  const sorted = [...items];

  sorted.sort((a, b) => {
    const values = getSortValues(a, b);

    switch (sortValue) {
      case "oldest":
        return values.dateA - values.dateB;
      case "name-asc":
        return values.nameA.localeCompare(values.nameB);
      case "name-desc":
        return values.nameB.localeCompare(values.nameA);
      case "newest":
      default:
        return values.dateB - values.dateA;
    }
  });

  return sorted;
};
