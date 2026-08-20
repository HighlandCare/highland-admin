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
  formatCommissionActor,
  formatServiceCategoryLabel,
  getHistoryChangedAt,
  toCommissionPercent,
} from "../../utils/commissionUtils";
import { formatDateTime } from "../../utils/dateUtils";

export function CommissionHistoryTable({
  actions,
  items = [],
  loading = false,
  onPageChange = () => {},
  page = 1,
  title = "Commission history",
  total = 0,
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return filterBySearch(items, search, (item) =>
      [
        formatServiceCategoryLabel(item.serviceCategory || item.category),
        formatCommissionActor(item.changedBy, item.changedByName),
        String(toCommissionPercent(item.previousPercent) ?? ""),
        String(toCommissionPercent(item.newPercent) ?? ""),
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
          searchPlaceholder="Search history"
          searchValue={search}
          title={title}
        />
      }
    >
      <TableHead>
        <TableRow>
          <TableCell>Date / time</TableCell>
          <TableCell>Category</TableCell>
          <TableCell>Previous</TableCell>
          <TableCell>New</TableCell>
          <TableCell>Changed by</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading && filteredItems.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>
              <Typography color="text.secondary" variant="body2">
                Loading history…
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          filteredItems.map((item, index) => (
            <TableRow hover key={item._id || `${getHistoryChangedAt(item)}-${index}`}>
              <TableCell>{formatDateTime(getHistoryChangedAt(item))}</TableCell>
              <TableCell>
                {formatServiceCategoryLabel(item.serviceCategory || item.category || "—")}
              </TableCell>
              <TableCell>{toCommissionPercent(item.previousPercent) ?? "—"}%</TableCell>
              <TableCell>{toCommissionPercent(item.newPercent) ?? "—"}%</TableCell>
              <TableCell>
                {formatCommissionActor(item.changedBy, item.changedByName)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  );
}

CommissionHistoryTable.propTypes = {
  actions: PropTypes.node,
  items: PropTypes.array,
  loading: PropTypes.bool,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
  total: PropTypes.number,
};
