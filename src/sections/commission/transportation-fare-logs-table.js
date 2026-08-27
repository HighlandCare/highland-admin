import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import {
  DataTable,
  DataTableToolbar,
  filterBySearch,
  getServerPaginationProps,
  ROWS_PER_PAGE,
} from "../../components/data-table";
import { formatDateTime } from "../../utils/dateUtils";
import { formatFareDollars } from "../../utils/transportationFareUtils";

/** Capitalize each word for person names. */
const toPersonNameCase = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/** First letter capital, remaining letters lowercase. */
const toSentenceCase = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export function TransportationFareLogsTable({
  actions,
  items = [],
  loading = false,
  onPageChange = () => {},
  page = 1,
  title = "Transportation fare change logs",
  total = 0,
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return filterBySearch(items, search, (item) =>
      [
        item.updatedByName,
        String(item.previousPerMileRate ?? ""),
        String(item.currentPerMileRate ?? ""),
        String(item.previousMinimumFare ?? ""),
        String(item.currentMinimumFare ?? ""),
        String(item.version ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
    );
  }, [items, search]);

  const handleSearchChange = (value) => {
    setSearch(value);
    onPageChange(1);
  };

  const totalPages = Math.max(1, Math.ceil(Math.max(total, 0) / ROWS_PER_PAGE) || 1);

  return (
    <DataTable
      empty={!loading && filteredItems.length === 0}
      pagination={getServerPaginationProps({
        currentPage: page,
        onPageChange,
        totalPages,
        totalRecords: total,
      })}
      toolbar={
        <DataTableToolbar
          actions={actions}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search logs"
          searchValue={search}
          title={toSentenceCase(title)}
        />
      }
    >
      <TableHead>
        <TableRow>
          <TableCell>Previous $/mi</TableCell>
          <TableCell>Updated $/mi</TableCell>
          <TableCell>Previous minimum</TableCell>
          <TableCell>Updated minimum</TableCell>
          <TableCell>Admin</TableCell>
          <TableCell>Date / time</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading && filteredItems.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>
              <Typography color="text.secondary" variant="body2">
                Loading transportation fare logs…
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          filteredItems.map((item, index) => (
            <TableRow
              hover
              key={item._id || `${item.version}-${item.sequence}-${item.updatedAt}-${index}`}
            >
              <TableCell>{formatFareDollars(item.previousPerMileRate)}</TableCell>
              <TableCell>{formatFareDollars(item.currentPerMileRate)}</TableCell>
              <TableCell>{formatFareDollars(item.previousMinimumFare)}</TableCell>
              <TableCell>{formatFareDollars(item.currentMinimumFare)}</TableCell>
              <TableCell>
                <Typography variant="body2">
                  {item.updatedByName ? toPersonNameCase(item.updatedByName) : "—"}
                </Typography>
              </TableCell>
              <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  );
}

TransportationFareLogsTable.propTypes = {
  actions: PropTypes.node,
  items: PropTypes.array,
  loading: PropTypes.bool,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
  total: PropTypes.number,
};
