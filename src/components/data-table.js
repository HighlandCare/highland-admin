import PropTypes from "prop-types";
import MagnifyingGlassIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import {
  Box,
  Card,
  InputAdornment,
  Stack,
  SvgIcon,
  Table,
  TablePagination,
  TextField,
  Typography,
} from "@mui/material";
import { Scrollbar } from "./scrollbar";

export const dataTableScrollSx = {
  maxWidth: "100%",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  width: "100%",
};

export const getResponsiveTableMinWidth = (minWidth = 800) => ({
  xs: Math.min(minWidth, 560),
  sm: Math.min(minWidth, 720),
  md: minWidth,
});

export const dataTableCardSx = {
  border: "1px solid",
  borderColor: "neutral.200",
  borderRadius: 3,
  boxShadow: "none",
  maxWidth: "100%",
  overflow: "hidden",
  width: "100%",
};

export const dataTableSx = {
  "& .MuiTableCell-head": {
    backgroundColor: "background.paper",
    borderBottom: "1px solid",
    borderColor: "neutral.200",
    color: "neutral.500",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0,
    padding: { xs: "10px 12px", sm: "12px 24px" },
    whiteSpace: "nowrap",
  },
  "& .MuiTableCell-body": {
    borderBottom: "1px solid",
    borderColor: "neutral.100",
    padding: { xs: "14px 12px", sm: "18px 24px" },
  },
  "& .MuiTableRow-root:last-child .MuiTableCell-body": {
    borderBottom: 0,
  },
};

export const tableActionButtonSx = {
  borderRadius: 2,
  minWidth: 72,
  px: 2,
  textTransform: "capitalize",
};

export const DataTableToolbar = ({
  actions,
  onSearchChange,
  searchPlaceholder = "Search",
  searchValue = "",
  title,
}) => (
  <Box
    sx={{
      borderBottom: "1px solid",
      borderColor: "neutral.100",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      px: { xs: 2, sm: 3 },
      py: { xs: 2, sm: 2.5 },
    }}
  >
    <Typography fontWeight={700} sx={{ flexShrink: 0, fontSize: { xs: "1.25rem", sm: "1.5rem" } }} variant="h5">
      {title}
    </Typography>

    <Stack
      alignItems={{ xs: "stretch", md: "center" }}
      direction={{ xs: "column", md: "row" }}
      spacing={1.5}
      sx={{ width: "100%" }}
    >
      <TextField
        fullWidth
        onChange={(event) => onSearchChange?.(event.target.value)}
        placeholder={searchPlaceholder}
        size="small"
        value={searchValue}
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ alignItems: "center", height: "auto", mr: 0.5 }}>
              <SvgIcon fontSize="small" sx={{ color: "neutral.400", display: "block" }}>
                <MagnifyingGlassIcon />
              </SvgIcon>
            </InputAdornment>
          ),
        }}
        sx={{
          flex: { md: "1 1 auto" },
          minWidth: { md: 0 },
          width: "100%",
          "& .MuiOutlinedInput-root": {
            alignItems: "center",
            bgcolor: "background.paper",
            borderRadius: 2,
            display: "flex",
            fontSize: 14,
            minHeight: 42,
            px: 1.5,
            py: 0,
            width: "100%",
          },
          "& .MuiOutlinedInput-input": {
            alignItems: "center",
            display: "flex",
            height: "auto",
            lineHeight: 1.5,
            py: 1.25,
          },
          "& .MuiInputAdornment-root": {
            alignItems: "center",
            height: "auto",
            maxHeight: "none",
            marginTop: 0,
          },
        }}
      />

      <Stack
        alignItems={{ xs: "stretch", sm: "center" }}
        direction={{ xs: "column", sm: "row" }}
        flexShrink={0}
        spacing={1.5}
        sx={{ width: { xs: "100%", md: "auto" } }}
      >
        {actions && (
          <Box sx={{ width: { xs: "100%", sm: "auto" }, "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } } }}>
            {actions}
          </Box>
        )}
      </Stack>
    </Stack>
  </Box>
);

DataTableToolbar.propTypes = {
  actions: PropTypes.node,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  searchValue: PropTypes.string,
  title: PropTypes.string,
};

export const DataTablePagination = (props) => (
  <TablePagination
    component="div"
    sx={{
      borderTop: "1px solid",
      borderColor: "neutral.100",
      color: "neutral.500",
      "& .MuiTablePagination-toolbar": {
        flexWrap: "wrap",
        gap: 1,
        justifyContent: { xs: "center", sm: "flex-end" },
        minHeight: 56,
        px: { xs: 1.5, sm: 3 },
        py: { xs: 1, sm: 0 },
      },
      "& .MuiTablePagination-spacer": {
        display: { xs: "none", sm: "block" },
      },
      "& .MuiTablePagination-displayedRows": {
        fontSize: 13,
        fontWeight: 500,
      },
      "& .MuiIconButton-root": {
        border: "1px solid",
        borderColor: "neutral.200",
        borderRadius: 2,
        mx: 0.5,
        p: 0.75,
        "&:hover": {
          backgroundColor: "neutral.50",
        },
        "&.Mui-disabled": {
          borderColor: "neutral.100",
          opacity: 0.45,
        },
      },
    }}
    {...props}
  />
);

DataTablePagination.propTypes = {
  count: PropTypes.number,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
};

export const DataTable = ({
  children,
  empty = false,
  minWidth = 800,
  pagination,
  toolbar,
}) => {
  if (empty) {
    return (
      <Card sx={dataTableCardSx}>
        {toolbar}
        <Box
          sx={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: 1,
            justifyContent: "center",
            minHeight: 240,
            px: 3,
            py: 8,
          }}
        >
          <Typography color="text.secondary" fontWeight={600} variant="subtitle1">
            No results found
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Try adjusting your search or filters.
          </Typography>
        </Box>
        {pagination && <DataTablePagination {...pagination} />}
      </Card>
    );
  }

  return (
    <Card sx={dataTableCardSx}>
      {toolbar}
      <Box sx={dataTableScrollSx}>
        <Scrollbar>
          <Box sx={{ minWidth: getResponsiveTableMinWidth(minWidth), width: "100%" }}>
            <Table sx={dataTableSx}>{children}</Table>
          </Box>
        </Scrollbar>
      </Box>
      {pagination && <DataTablePagination {...pagination} />}
    </Card>
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

export const getClientPaginationProps = ({ currentPage = 1, onPageChange, totalItems = 0 }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / ROWS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  return getServerPaginationProps({
    currentPage: safeCurrentPage,
    onPageChange,
    totalPages,
    totalRecords: totalItems,
  });
};

export const ROWS_PER_PAGE = 10;

export const getPaginationMeta = (items = {}) => ({
  currentPage: items.current_page ?? items.currentPage ?? 1,
  totalPages: items.total_pages ?? items.totalPages ?? 1,
  totalRecords:
    items.total_records ??
    items.totalRecords ??
    items.total ??
    (items.total_pages ?? items.totalPages ?? 1) * ROWS_PER_PAGE,
});

export const getServerPaginationMeta = (response, page, currentItemCount) => {
  const apiTotalPages = response?.total_pages ?? response?.totalPages;

  if (apiTotalPages != null) {
    return {
      currentPage: page,
      totalPages: Math.max(Number(apiTotalPages) || 1, 1),
      totalRecords:
        response?.total_records ??
        response?.totalRecords ??
        response?.total_drivers ??
        response?.total ??
        Math.max(Number(apiTotalPages) || 1, 1) * ROWS_PER_PAGE,
    };
  }

  const hasMore = currentItemCount >= ROWS_PER_PAGE;
  const safePage = Math.max(page, 1);

  return {
    currentPage: safePage,
    totalPages: hasMore ? safePage + 1 : safePage,
    totalRecords:
      response?.total_records ??
      response?.totalRecords ??
      response?.total_drivers ??
      (hasMore ? safePage * ROWS_PER_PAGE + 1 : (safePage - 1) * ROWS_PER_PAGE + currentItemCount),
  };
};

export const getServerPaginationProps = ({ currentPage = 1, onPageChange, totalPages = 1, totalRecords }) => {
  const safeTotalPages = Math.max(totalPages, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safeTotalPages);
  const count = totalRecords ?? safeTotalPages * ROWS_PER_PAGE;

  return {
    component: "div",
    count,
    labelDisplayedRows: () => `${safeCurrentPage} of ${safeTotalPages}`,
    labelRowsPerPage: "",
    onPageChange: (event, nextPageIndex) => {
      const nextPage = nextPageIndex + 1;
      if (nextPage >= 1 && nextPage <= safeTotalPages) {
        onPageChange?.(nextPage);
      }
    },
    page: safeCurrentPage - 1,
    rowsPerPage: ROWS_PER_PAGE,
    rowsPerPageOptions: [],
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
