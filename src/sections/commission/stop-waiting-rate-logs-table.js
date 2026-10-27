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
import { formatWaitingRateDollars } from "../../utils/stopWaitingRateUtils";

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

const toSentenceCase = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export function StopWaitingRateLogsTable({
  actions,
  items = [],
  loading = false,
  onPageChange = () => {},
  page = 1,
  title = "Stop waiting rate change logs",
  total = 0,
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return filterBySearch(items, search, (item) =>
      [
        item.updatedByName,
        item.updatedByEmail,
        String(item.previousWaitingRatePerMinute ?? ""),
        String(item.currentWaitingRatePerMinute ?? ""),
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
          <TableCell>Previous $/min</TableCell>
          <TableCell>Updated $/min</TableCell>
          <TableCell>User</TableCell>
          <TableCell>Date / time</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading && filteredItems.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4}>
              <Typography color="text.secondary" variant="body2">
                Loading stop waiting rate logs…
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          filteredItems.map((item, index) => (
            <TableRow
              hover
              key={item._id || `${item.version}-${item.sequence}-${item.updatedAt}-${index}`}
            >
              <TableCell>{formatWaitingRateDollars(item.previousWaitingRatePerMinute)}</TableCell>
              <TableCell>{formatWaitingRateDollars(item.currentWaitingRatePerMinute)}</TableCell>
              <TableCell>
                <Typography variant="body2">
                  {item.updatedByName ? toPersonNameCase(item.updatedByName) : "—"}
                </Typography>
                {item.updatedByEmail ? (
                  <Typography
                    color="text.secondary"
                    sx={{ textTransform: "lowercase" }}
                    variant="caption"
                  >
                    {String(item.updatedByEmail).toLowerCase()}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  );
}

StopWaitingRateLogsTable.propTypes = {
  actions: PropTypes.node,
  items: PropTypes.array,
  loading: PropTypes.bool,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
  total: PropTypes.number,
};
