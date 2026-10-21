import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import ArrowDownTrayIcon from "@heroicons/react/24/outline/ArrowDownTrayIcon";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Card,
  FormControl,
  Menu,
  MenuItem,
  Select,
  Stack,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import Loader from "../../components/Loader";
import { DateRangeFilter } from "../../components/date-range-filter";
import { SearchField } from "../../components/search-field";
import { exportRideHistory } from "../../utils/rideHistoryExport";
import {
  dataTableCardSx,
  dataTableFilterCardSx,
  dataTableScrollSx,
  DataTablePagination,
  getResponsiveTableMinWidth,
  getServerPaginationMeta,
  getServerPaginationProps,
  sortItems,
} from "../../components/data-table";
import { StatusBadge, TableQuickActions } from "../../components/table-cells";
import { formatDateTime } from "../../utils/dateUtils";
import {
  formatRideCurrency,
  getBookingDestinationLabel,
  getBookingReferenceLabel,
  getRideAdminEarning,
  getRideCustomerName,
  getRideDriverEarning,
  getRideDriverName,
  getRideList,
  getRideStatusMeta,
  isFoodOrderBooking,
  RIDE_PAYMENT_FILTER_OPTIONS,
  RIDE_STATUS_FILTER_OPTIONS,
  storeRideDetail,
  markRideHistoryListRestore,
  storeRideHistoryListState,
  truncateRideAddress,
} from "../../utils/rideUtils";

const rideSortValue = "newest";
const SEARCH_DEBOUNCE_MS = 250;

const headCellSx = {
  color: "neutral.500",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
  borderBottom: "1px solid",
  borderColor: "neutral.200",
  bgcolor: "background.paper",
  py: 1.5,
  px: { xs: 1.5, sm: 2 },
};

const bodyCellSx = {
  borderBottom: "1px solid",
  borderColor: "neutral.100",
  py: 1.75,
  px: { xs: 1.5, sm: 2 },
  verticalAlign: "middle",
};

const nameCellSx = {
  fontWeight: 600,
  maxWidth: { xs: 100, sm: 140, md: 160 },
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const addressTextSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const filterSelectSx = {
  bgcolor: "neutral.100",
  borderRadius: 2.5,
  flexShrink: 0,
  fontSize: 13,
  height: 44,
  minWidth: 132,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
  "&:hover": { bgcolor: "neutral.50" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "neutral.200" },
  "&.Mui-focused": { bgcolor: "background.paper" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "primary.main",
    borderWidth: 1,
  },
  "& .MuiSelect-select": {
    alignItems: "center",
    display: "flex",
    py: 1.25,
    pl: 1.75,
    pr: 3.5,
  },
};

export const RideHistoryTable = (props) => {
  const {
    filters = { status: "", havePaid: "", startDate: "", endDate: "", search: "" },
    items: initialItems = {},
    onFiltersChange = () => {},
    onPageChange = () => {},
    onRowsPerPageChange,
    page = 1,
    rowsPerPage = 20,
  } = props;
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const filtersRef = useRef(filters);

  filtersRef.current = filters;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedSearch = searchInput.trim();
      const currentSearch = filtersRef.current.search ?? "";

      if (trimmedSearch !== currentSearch) {
        onFiltersChange({
          ...filtersRef.current,
          search: trimmedSearch,
        });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInput, onFiltersChange]);

  const pageRides = useMemo(() => getRideList(items), [items]);
  const isEmpty = !pageRides.length && !(items?.total_records ?? items?.totalRecords);

  const rows = useMemo(() => {
    if (!pageRides.length) {
      return [];
    }

    return sortItems(pageRides, rideSortValue, (a, b) => ({
      dateA: new Date(a?.createdAt || 0).getTime(),
      dateB: new Date(b?.createdAt || 0).getTime(),
      nameA: getRideDriverName(a),
      nameB: getRideDriverName(b),
    }));
  }, [pageRides]);

  const paginationMeta = useMemo(
    () => getServerPaginationMeta(items, page, pageRides.length, rowsPerPage),
    [items, page, pageRides.length, rowsPerPage]
  );

  const commitSearch = () => {
    const trimmedSearch = searchInput.trim();
    if (trimmedSearch !== (filters.search ?? "")) {
      onFiltersChange({
        ...filters,
        search: trimmedSearch,
      });
    }
  };

  const handleViewBooking = (booking) => {
    storeRideHistoryListState({ page, limit: rowsPerPage, filters });
    markRideHistoryListRestore();
    storeRideDetail(booking);
    if (isFoodOrderBooking(booking)) {
      router.push(`/orders/detail?id=${booking.orderId || booking.rideId}`);
      return;
    }
    router.push(`/ride-history/detail?id=${booking.rideId}`);
  };

  const handleStatusFilterChange = (event) => {
    onFiltersChange({
      ...filters,
      status: event.target.value,
    });
  };

  const handlePaymentFilterChange = (event) => {
    onFiltersChange({
      ...filters,
      havePaid: event.target.value,
    });
  };

  const handleDateRangeChange = ({ startDate, endDate }) => {
    onFiltersChange({
      ...filters,
      startDate: startDate || "",
      endDate: endDate || "",
    });
  };

  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  const handleExport = async (format) => {
    handleExportClose();

    try {
      setIsExporting(true);
      const count = await exportRideHistory(
        {
          ...filters,
          search: (filters.search ?? searchInput ?? "").trim(),
        },
        format
      );
      toast.success(
        `Exported ${count} ride${count === 1 ? "" : "s"} to ${format === "excel" ? "Excel" : "CSV"}`
      );
    } catch (error) {
      console.error("Ride history export failed:", error);
      toast.error(error.message || "Unable to export ride history");
    } finally {
      setIsExporting(false);
    }
  };

  const paginationProps = getServerPaginationProps({
    currentPage: page,
    itemLabel: "bookings",
    onPageChange,
    onRowsPerPageChange,
    rowsPerPage,
    totalPages: paginationMeta.totalPages,
    totalRecords: paginationMeta.totalRecords,
  });

  return (
    <Stack spacing={2.5} sx={{ width: "100%" }}>
      <Card sx={dataTableFilterCardSx}>
        <Box sx={{ px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.25 } }}>
          <Stack
            alignItems={{ xs: "stretch", lg: "flex-end" }}
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            sx={{ width: "100%" }}
          >
            <Box sx={{ flex: "1 1 240px", minWidth: { xs: "100%", sm: 200 } }}>
              <SearchField
                fullWidth
                onChange={setSearchInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitSearch();
                  }
                }}
                placeholder="Search name, email, phone, or ride ID"
                value={searchInput}
              />
            </Box>

            <FormControl size="small" sx={{ flexShrink: 0 }}>
              <Typography
                sx={{ display: "block", fontSize: 12, fontWeight: 700, mb: 0.75 }}
                variant="caption"
              >
                Status
              </Typography>
              <Select
                displayEmpty
                onChange={handleStatusFilterChange}
                sx={filterSelectSx}
                value={filters.status ?? ""}
              >
                {RIDE_STATUS_FILTER_OPTIONS.map((option) => (
                  <MenuItem key={option.label} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flexShrink: 0 }}>
              <Typography
                sx={{ display: "block", fontSize: 12, fontWeight: 700, mb: 0.75 }}
                variant="caption"
              >
                Payment
              </Typography>
              <Select
                displayEmpty
                onChange={handlePaymentFilterChange}
                sx={filterSelectSx}
                value={filters.havePaid ?? ""}
              >
                {RIDE_PAYMENT_FILTER_OPTIONS.map((option) => (
                  <MenuItem key={option.label} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ flexShrink: 0 }}>
              <Typography
                sx={{ display: "block", fontSize: 12, fontWeight: 700, mb: 0.75 }}
                variant="caption"
              >
                Date
              </Typography>
              <DateRangeFilter
                endDate={filters.endDate ?? ""}
                onChange={handleDateRangeChange}
                startDate={filters.startDate ?? ""}
                sx={{
                  bgcolor: "neutral.100",
                  borderColor: "transparent",
                  borderRadius: 2.5,
                  height: 44,
                  minWidth: 140,
                  "&:hover": { bgcolor: "neutral.50", borderColor: "neutral.200" },
                }}
                variant="pill"
              />
            </Box>

            <Button
              disabled={isExporting}
              onClick={handleExportClick}
              size="medium"
              startIcon={
                isExporting ? null : (
                  <SvgIcon fontSize="small">
                    <ArrowDownTrayIcon />
                  </SvgIcon>
                )
              }
              sx={{
                borderColor: "neutral.200",
                borderRadius: 2.5,
                color: "text.primary",
                flexShrink: 0,
                height: 44,
                minWidth: 100,
                textTransform: "none",
              }}
              variant="outlined"
            >
              {isExporting ? <Loader inline size="xs" /> : "Export"}
            </Button>

            <Menu
              anchorEl={exportAnchorEl}
              onClose={handleExportClose}
              open={Boolean(exportAnchorEl)}
            >
              <MenuItem disabled={isExporting} onClick={() => handleExport("csv")}>
                Export as CSV
              </MenuItem>
              <MenuItem disabled={isExporting} onClick={() => handleExport("excel")}>
                Export as Excel
              </MenuItem>
            </Menu>
          </Stack>
        </Box>
      </Card>

      <Card sx={dataTableCardSx}>
      {isEmpty ? (
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
      ) : (
        <Box sx={dataTableScrollSx}>
          <Box sx={{ minWidth: getResponsiveTableMinWidth(860), width: "100%" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={headCellSx}>When</TableCell>
                  <TableCell sx={headCellSx}>Status</TableCell>
                  <TableCell sx={headCellSx}>Driver</TableCell>
                  <TableCell sx={headCellSx}>Customer</TableCell>
                  <TableCell sx={headCellSx}>Route</TableCell>
                  <TableCell sx={headCellSx}>Driver earn</TableCell>
                  <TableCell sx={headCellSx}>Admin earn</TableCell>
                  <TableCell align="right" sx={headCellSx}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={bodyCellSx}>
                      <Typography color="text.secondary" textAlign="center" variant="body2">
                        No matching results found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((booking) => {
                    const statusMeta = getRideStatusMeta(booking?.status);
                    const destination = getBookingDestinationLabel(booking);
                    const shortDestination = truncateRideAddress(destination, 42);
                    const referenceLabel = getBookingReferenceLabel(booking);

                    return (
                      <TableRow
                        hover
                        key={`${booking.recordType || booking.type}-${booking.rideId}`}
                        sx={{ "&:hover": { bgcolor: "neutral.50" } }}
                      >
                        <TableCell sx={{ ...bodyCellSx, whiteSpace: "nowrap" }}>
                          <Typography variant="body2">
                            {formatDateTime(booking.createdAt)}
                          </Typography>
                          <Typography color="text.secondary" variant="caption">
                            {referenceLabel}
                          </Typography>
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Tooltip title={getRideDriverName(booking)}>
                            <Typography sx={nameCellSx} variant="body2">
                              {getRideDriverName(booking)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          <Tooltip title={getRideCustomerName(booking)}>
                            <Typography sx={nameCellSx} variant="body2">
                              {getRideCustomerName(booking)}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, maxWidth: 220, minWidth: 0 }}>
                          <Tooltip title={destination}>
                            <Typography color="text.secondary" sx={addressTextSx} variant="body2">
                              {shortDestination}
                            </Typography>
                          </Tooltip>
                          {booking?.distance ? (
                            <Typography color="text.secondary" sx={addressTextSx} variant="caption">
                              {booking.distance}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, whiteSpace: "nowrap" }}>
                          <Typography fontWeight={600} variant="body2">
                            {formatRideCurrency(getRideDriverEarning(booking))}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ ...bodyCellSx, whiteSpace: "nowrap" }}>
                          <Typography color="text.secondary" variant="body2">
                            {formatRideCurrency(getRideAdminEarning(booking))}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={bodyCellSx}>
                          <TableQuickActions
                            actions={[
                              {
                                icon: EyeIcon,
                                label: isFoodOrderBooking(booking)
                                  ? "View order details"
                                  : "View ride details",
                                onClick: () => handleViewBooking(booking),
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}

      <DataTablePagination {...paginationProps} variant="full" />
      </Card>
    </Stack>
  );
};

RideHistoryTable.propTypes = {
  filters: PropTypes.shape({
    status: PropTypes.string,
    havePaid: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    search: PropTypes.string,
  }),
  items: PropTypes.object,
  onFiltersChange: PropTypes.func,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
};
