import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import TrashIcon from "@heroicons/react/24/solid/TrashIcon";
import { TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import {
  DataTable,
  DataTableToolbar,
  filterBySearch,
  getClientPaginationProps,
  getServerPaginationProps,
  paginateItems,
  sortItems,
} from "../../components/data-table";
import { TableQuickActions } from "../../components/table-cells";

export const FAQTable = (props) => {
  const {
    actions,
    items = [],
    onDelete,
    onEdit,
    page = 1,
    onPageChange = () => {},
    title = "FAQ",
  } = props;
  const [search, setSearch] = useState("");

  const isEmpty = !items || items.length === 0;

  const indexedItems = useMemo(
    () => items.map((item, originalIndex) => ({ ...item, originalIndex })),
    [items]
  );

  const filteredItems = useMemo(() => {
    if (isEmpty) {
      return [];
    }

    return filterBySearch(indexedItems, search, (faqItem) =>
      [faqItem.question, faqItem.answer].filter(Boolean).join(" ")
    );
  }, [indexedItems, isEmpty, search]);

  const sortedItems = useMemo(
    () =>
      sortItems(filteredItems, "name-asc", (a, b) => ({
        dateA: 0,
        dateB: 0,
        nameA: a.question || "",
        nameB: b.question || "",
      })),
    [filteredItems]
  );

  const rows = useMemo(() => paginateItems(sortedItems, page), [page, sortedItems]);

  const handleSearchChange = (value) => {
    setSearch(value);
    onPageChange(1);
  };

  const showEmptyState = isEmpty;

  return (
    <DataTable
      empty={showEmptyState}
      pagination={
        isEmpty
          ? getServerPaginationProps({ currentPage: 1, onPageChange, totalPages: 1, totalRecords: 0 })
          : getClientPaginationProps({
              currentPage: page,
              onPageChange,
              totalItems: sortedItems.length,
            })
      }
      toolbar={
        <DataTableToolbar
          actions={actions}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search questions"
          searchValue={search}
          title={title}
        />
      }
    >
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: "38%" }}>Question</TableCell>
          <TableCell>Answer</TableCell>
          <TableCell align="right" sx={{ width: 120 }}>
            Actions
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3}>
              <Typography color="text.secondary" textAlign="center" variant="body2">
                No matching results found.
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((faqItem) => (
              <TableRow hover key={faqItem.originalIndex}>
                <TableCell>
                  <Typography fontWeight={600} variant="body2">
                    {faqItem.question}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      overflow: "hidden",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                    }}
                    variant="body2"
                  >
                    {faqItem.answer}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <TableQuickActions
                    actions={[
                      {
                        icon: PencilIcon,
                        label: "Edit FAQ",
                        onClick: () => onEdit?.(faqItem, faqItem.originalIndex),
                      },
                      {
                        color: "error.main",
                        icon: TrashIcon,
                        label: "Delete FAQ",
                        onClick: () => onDelete?.(faqItem, faqItem.originalIndex),
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
};

FAQTable.propTypes = {
  actions: PropTypes.node,
  items: PropTypes.array,
  onDelete: PropTypes.func,
  onEdit: PropTypes.func,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
};
