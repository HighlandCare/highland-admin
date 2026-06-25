import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import {
  DataTable,
  DataTableToolbar,
  filterBySearch,
  getServerPaginationMeta,
  getServerPaginationProps,
  sortItems,
} from "../../components/data-table";
import {
  TableEmailCell,
  TablePersonCell,
  TablePhoneCell,
} from "../../components/table-cells";
import { formatRelativeDate } from "../../utils/dateUtils";
import { getListFromResponse } from "../../utils/listUtils";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency",
});

const formatCurrency = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return "—";
  }

  return currencyFormatter.format(Number(value));
};

const earningsSortValue = "newest";

export const DriverEarningsTable = (props) => {
  const {
    items: initialItems = {},
    onPageChange = () => {},
    page = 1,
    title = "Driver Earnings",
  } = props;
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const pageDrivers = useMemo(() => getListFromResponse(items), [items]);
  const isEmpty =
    !pageDrivers.length &&
    !(items?.total_records ?? items?.totalRecords ?? items?.total_drivers);

  const rows = useMemo(() => {
    if (!pageDrivers.length) {
      return [];
    }

    const filtered = filterBySearch(pageDrivers, search, (driver) =>
      [
        driver?.fullName,
        driver?.email,
        driver?.phone,
        driver?.rideCount,
        driver?.totalEarned,
        driver?.walletBalance,
      ]
        .filter((value) => value != null && value !== "")
        .join(" ")
    );

    return sortItems(filtered, earningsSortValue, (a, b) => ({
      dateA: new Date(a?.createdAt || 0).getTime(),
      dateB: new Date(b?.createdAt || 0).getTime(),
      nameA: a?.fullName || a?.email || "",
      nameB: b?.fullName || b?.email || "",
    }));
  }, [pageDrivers, search]);

  const paginationMeta = useMemo(
    () => getServerPaginationMeta(items, page, pageDrivers.length),
    [items, page, pageDrivers.length]
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    onPageChange(1);
  };

  return (
    <DataTable
      empty={isEmpty}
      pagination={getServerPaginationProps({
        currentPage: page,
        onPageChange,
        totalPages: paginationMeta.totalPages,
        totalRecords: paginationMeta.totalRecords,
      })}
      toolbar={
        <DataTableToolbar
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search drivers"
          searchValue={search}
          title={title}
        />
      }
    >
      <TableHead>
        <TableRow>
          <TableCell>Driver</TableCell>
          <TableCell>E-mail</TableCell>
          <TableCell>Phone</TableCell>
          <TableCell>Rides</TableCell>
          <TableCell>Total Earned</TableCell>
          <TableCell>Wallet Balance</TableCell>
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
          rows.map((driver) => (
            <TableRow hover key={driver._id}>
              <TableCell>
                <TablePersonCell
                  name={driver?.fullName || driver?.email || "—"}
                  subtitle={formatRelativeDate(driver?.createdAt)}
                />
              </TableCell>
              <TableCell>
                <TableEmailCell email={driver?.email} />
              </TableCell>
              <TableCell>
                <TablePhoneCell phone={driver?.phone} />
              </TableCell>
              <TableCell>{driver?.rideCount ?? 0}</TableCell>
              <TableCell>
                <Typography fontWeight={600} variant="body2">
                  {formatCurrency(driver?.totalEarned)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography color="text.secondary" variant="body2">
                  {formatCurrency(driver?.walletBalance)}
                </Typography>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  );
};

DriverEarningsTable.propTypes = {
  items: PropTypes.object,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
};
