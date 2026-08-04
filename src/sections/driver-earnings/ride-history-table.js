import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import {
  Chip,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TextField,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  detailTableHeadSx,
  detailTableRowSx,
} from "../../components/detail-page/detail-page-ui";
import {
  DataTable,
  DataTableToolbar,
  getServerPaginationMeta,
  getServerPaginationProps,
  sortItems,
} from "../../components/data-table";
import {
  StatusBadge,
  TableQuickActions,
} from "../../components/table-cells";
import { formatDateTime } from "../../utils/dateUtils";
import {
  formatRideCurrency,
  getBookingDestinationLabel,
  getBookingReferenceLabel,
  getBookingTypeMeta,
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
  truncateRideAddress,
} from "../../utils/rideUtils";

const rideSortValue = "newest";
const SEARCH_DEBOUNCE_MS = 400;

const nameCellSx = {
  fontWeight: 600,
  maxWidth: { xs: 100, sm: 140, md: 160 },
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const addressCellSx = {
  maxWidth: { xs: 120, sm: 180, md: 220 },
  minWidth: 0,
};

const addressTextSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const earningCellSx = {
  whiteSpace: "nowrap",
};

const filterSelectSx = {
  bgcolor: "background.paper",
  borderRadius: 2,
  fontSize: 14,
  minWidth: { xs: "100%", sm: 150 },
};

export const RideHistoryTable = (props) => {
  const {
    filters = { status: "", havePaid: "", startDate: "", endDate: "", search: "" },
    items: initialItems = {},
    onFiltersChange = () => {},
    onPageChange = () => {},
    page = 1,
    title = "Ride History",
  } = props;
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
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
    () => getServerPaginationMeta(items, page, pageRides.length),
    [items, page, pageRides.length]
  );

  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  const handleViewBooking = (booking) => {
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

  const handleStartDateChange = (event) => {
    onFiltersChange({
      ...filters,
      startDate: event.target.value,
    });
  };

  const handleEndDateChange = (event) => {
    onFiltersChange({
      ...filters,
      endDate: event.target.value,
    });
  };

  const filterActions = (
    <Stack
      direction={{ xs: "column", lg: "row" }}
      flexWrap="wrap"
      spacing={1.5}
      sx={{ width: { xs: "100%", md: "auto" } }}
    >
      <TextField
        InputLabelProps={{ shrink: true }}
        label="From"
        onChange={handleStartDateChange}
        size="small"
        type="date"
        value={filters.startDate ?? ""}
        sx={filterSelectSx}
      />
      <TextField
        InputLabelProps={{ shrink: true }}
        label="To"
        onChange={handleEndDateChange}
        size="small"
        type="date"
        value={filters.endDate ?? ""}
        sx={filterSelectSx}
      />
      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
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
      {/* <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
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
      </FormControl> */}
    </Stack>
  );

  return (
    <>
      <DataTable
        empty={isEmpty}
        minWidth={720}
        pagination={getServerPaginationProps({
          currentPage: page,
          onPageChange,
          totalPages: paginationMeta.totalPages,
          totalRecords: paginationMeta.totalRecords,
        })}
        toolbar={
          <DataTableToolbar
            actions={filterActions}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by driver or client name"
            searchValue={searchInput}
            title={title}
          />
        }
      >
        <TableHead sx={detailTableHeadSx}>
          <TableRow>
            <TableCell sx={{ width: { xs: "10%", md: "9%" } }}>Type</TableCell>
            <TableCell sx={{ width: { xs: "10%", md: "9%" } }}>Status</TableCell>
            <TableCell sx={{ width: { xs: "12%", md: "11%" } }}>Date</TableCell>
            <TableCell sx={{ width: { xs: "14%", md: "11%" } }}>Driver</TableCell>
            <TableCell sx={{ width: { xs: "14%", md: "11%" } }}>User</TableCell>
            <TableCell sx={{ width: { xs: "20%", md: "22%" } }}>Route / Destination</TableCell>
            <TableCell sx={{ width: { xs: "10%", md: "9%" } }}>Driver Earning</TableCell>
            <TableCell sx={{ width: { xs: "10%", md: "9%" } }}>Admin Earning</TableCell>
            <TableCell align="right" sx={{ width: { xs: "8%", md: "7%" } }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>
                <Typography color="text.secondary" textAlign="center" variant="body2">
                  No matching results found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((booking) => {
              const typeMeta = getBookingTypeMeta(booking);
              const statusMeta = getRideStatusMeta(booking?.status);
              const destination = getBookingDestinationLabel(booking);
              const shortDestination = truncateRideAddress(destination, 42);
              const referenceLabel = getBookingReferenceLabel(booking);
              const rowBg = isFoodOrderBooking(booking)
                ? "rgba(168, 85, 247, 0.04)"
                : booking?.type === "chaperoneride"
                  ? "rgba(14, 165, 233, 0.04)"
                  : "inherit";

              return (
                <TableRow
                  hover
                  key={`${booking.recordType || booking.type}-${booking.rideId}`}
                  sx={{ ...detailTableRowSx, bgcolor: rowBg }}
                >
                  <TableCell>
                    <Stack spacing={0.5}>
                      {/* <Chip
                        label={typeMeta.label}
                        size="small"
                        sx={{
                          bgcolor: typeMeta.bgcolor,
                          color: typeMeta.color,
                          fontWeight: 700,
                          width: "fit-content",
                        }}
                      /> */}
                      <Typography color="text.secondary" variant="caption">
                        {referenceLabel}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="body2">{formatDateTime(booking.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={getRideDriverName(booking)}>
                      <Typography sx={nameCellSx} variant="body2">
                        {getRideDriverName(booking)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={getRideCustomerName(booking)}>
                      <Typography sx={nameCellSx} variant="body2">
                        {getRideCustomerName(booking)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={addressCellSx}>
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
                  <TableCell sx={earningCellSx}>
                    <Typography fontWeight={600} variant="body2">
                      {formatRideCurrency(getRideDriverEarning(booking))}
                    </Typography>
                  </TableCell>
                  <TableCell sx={earningCellSx}>
                    <Typography color="text.secondary" variant="body2">
                      {formatRideCurrency(getRideAdminEarning(booking))}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
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
      </DataTable>
    </>
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
  page: PropTypes.number,
  title: PropTypes.string,
};
