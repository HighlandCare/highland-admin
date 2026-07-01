import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import {
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
  DataTable,
  DataTableToolbar,
  getServerPaginationMeta,
  getServerPaginationProps,
  sortItems,
} from "../../components/data-table";
import {
  TableQuickActions,
} from "../../components/table-cells";
import {
  formatRideCurrency,
  getRideAdminEarning,
  getRideCustomerName,
  getRideDestinationAddress,
  getRideDriverEarning,
  getRideDriverName,
  getRideList,
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

  const handleViewRide = (ride) => {
    storeRideDetail(ride);
    router.push(`/ride-history/detail?id=${ride.rideId}`);
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
      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 150 } }}>
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
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: { xs: "18%", md: "14%" } }}>Driver</TableCell>
            <TableCell sx={{ width: { xs: "18%", md: "14%" } }}>Client</TableCell>
            <TableCell sx={{ width: { xs: "28%", md: "32%" } }}>End Location</TableCell>
            <TableCell sx={{ width: { xs: "14%", md: "12%" } }}>Driver Earning</TableCell>
            <TableCell sx={{ width: { xs: "14%", md: "12%" } }}>Admin Earning</TableCell>
            <TableCell align="right" sx={{ width: { xs: "8%", md: "8%" } }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography color="text.secondary" textAlign="center" variant="body2">
                  No matching results found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((ride) => {
              const destination = getRideDestinationAddress(ride);
              const shortDestination = truncateRideAddress(destination);

              return (
                <TableRow hover key={ride.rideId}>
                  <TableCell>
                    <Tooltip title={getRideDriverName(ride)}>
                      <Typography sx={nameCellSx} variant="body2">
                        {getRideDriverName(ride)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={getRideCustomerName(ride)}>
                      <Typography sx={nameCellSx} variant="body2">
                        {getRideCustomerName(ride)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={addressCellSx}>
                    <Tooltip title={destination}>
                      <Typography color="text.secondary" sx={addressTextSx} variant="body2">
                        {shortDestination}
                      </Typography>
                    </Tooltip>
                    {ride?.distance && (
                      <Typography color="text.secondary" sx={addressTextSx} variant="caption">
                        {ride.distance}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={earningCellSx}>
                    <Typography fontWeight={600} variant="body2">
                      {formatRideCurrency(getRideDriverEarning(ride))}
                    </Typography>
                  </TableCell>
                  <TableCell sx={earningCellSx}>
                    <Typography color="text.secondary" variant="body2">
                      {formatRideCurrency(getRideAdminEarning(ride))}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <TableQuickActions
                      actions={[
                        {
                          icon: EyeIcon,
                          label: "View ride details",
                          onClick: () => handleViewRide(ride),
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
