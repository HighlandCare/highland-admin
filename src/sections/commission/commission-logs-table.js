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
import {
  formatServiceCategoryLabel,
  toCommissionPercent,
} from "../../utils/commissionUtils";
import { formatDateTime } from "../../utils/dateUtils";

const formatRate = (value) => {
  const percent = toCommissionPercent(value);
  return percent != null ? `${percent}%` : "—";
};

/** First letter capital, remaining letters lowercase. */
const toSentenceCase = (value) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

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

export function CommissionLogsTable({
  actions,
  items = [],
  loading = false,
  onPageChange = () => {},
  page = 1,
  title = "Platform commission audit logs",
  total = 0,
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return filterBySearch(items, search, (item) =>
      [
        formatServiceCategoryLabel(item.serviceCategory),
        item.updatedByName,
        item.updatedByEmail,
        String(toCommissionPercent(item.previousCommissionRate) ?? ""),
        String(toCommissionPercent(item.currentSetRate) ?? ""),
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
          <TableCell>Category</TableCell>
          <TableCell>Previous rate</TableCell>
          <TableCell>Updated rate</TableCell>
          <TableCell>Admin</TableCell>
          <TableCell>Date / time</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading && filteredItems.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>
              <Typography color="text.secondary" variant="body2">
                Loading platform commission logs…
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          filteredItems.map((item, index) => (
            <TableRow hover key={item._id || `${item.updatedAt}-${item.sequence}-${index}`}>
              <TableCell>{formatServiceCategoryLabel(item.serviceCategory)}</TableCell>
              <TableCell>{formatRate(item.previousCommissionRate)}</TableCell>
              <TableCell>{formatRate(item.currentSetRate)}</TableCell>
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

CommissionLogsTable.propTypes = {
  actions: PropTypes.node,
  items: PropTypes.array,
  loading: PropTypes.bool,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
  total: PropTypes.number,
};
