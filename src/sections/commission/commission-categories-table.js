import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import { TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import {
  DataTable,
  DataTableToolbar,
  filterBySearch,
  getClientPaginationProps,
  paginateItems,
} from "../../components/data-table";
import { TableQuickActions } from "../../components/table-cells";
import {
  formatServiceCategoryLabel,
  toCommissionPercent,
} from "../../utils/commissionUtils";
import { formatDateTime } from "../../utils/dateUtils";

export function CommissionCategoriesTable({
  actions,
  items = [],
  loading = false,
  onEdit,
  onPageChange = () => {},
  onView,
  page = 1,
  title = "Platform commission rates",
}) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return filterBySearch(items, search, (item) =>
      [
        formatServiceCategoryLabel(item.serviceCategory),
        item.updatedByName,
        String(toCommissionPercent(item.commissionPercent) ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
    );
  }, [items, search]);

  const rows = useMemo(() => paginateItems(filteredItems, page), [filteredItems, page]);

  const handleSearchChange = (value) => {
    setSearch(value);
    onPageChange(1);
  };

  return (
    <DataTable
      empty={!loading && filteredItems.length === 0}
      pagination={getClientPaginationProps({
        currentPage: page,
        onPageChange,
        totalItems: filteredItems.length,
      })}
      toolbar={
        <DataTableToolbar
          actions={actions}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search rates"
          searchValue={search}
          title={title}
        />
      }
    >
      <TableHead>
        <TableRow>
          <TableCell>Category</TableCell>
          <TableCell>Rate</TableCell>
          <TableCell>Set by</TableCell>
          <TableCell>Date / time</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading && filteredItems.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>
              <Typography color="text.secondary" variant="body2">
                Loading platform commission rates…
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((item) => (
            <TableRow hover key={item.serviceCategory}>
              <TableCell>{formatServiceCategoryLabel(item.serviceCategory)}</TableCell>
              <TableCell>
                {toCommissionPercent(item.commissionPercent) != null
                  ? `${toCommissionPercent(item.commissionPercent)}%`
                  : "—"}
              </TableCell>
              <TableCell>{item.updatedByName || "—"}</TableCell>
              <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
              <TableCell align="right">
                <TableQuickActions
                  actions={[
                    {
                      icon: EyeIcon,
                      label: "View platform commission",
                      onClick: () => onView?.(item),
                    },
                    {
                      icon: PencilIcon,
                      label: "Edit platform commission",
                      onClick: () => onEdit?.(item),
                    },
                  ]}
                />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  );
}

CommissionCategoriesTable.propTypes = {
  actions: PropTypes.node,
  items: PropTypes.array,
  loading: PropTypes.bool,
  onEdit: PropTypes.func,
  onPageChange: PropTypes.func,
  onView: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
};
