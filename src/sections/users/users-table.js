import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { formatRelativeDate } from "../../utils/dateUtils";
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
  TableLocationCell,
  TablePersonCell,
  TablePhoneCell,
} from "../../components/table-cells";
import { getListFromResponse } from "../../utils/listUtils";

export const UsersTable = (props) => {
  const { items = {}, onPageChange = () => {}, page = 1, title = "Users" } = props;
  const [search, setSearch] = useState("");

  const pageUsers = useMemo(() => getListFromResponse(items), [items]);
  const isEmpty = !pageUsers.length && !(items?.total_records ?? items?.totalRecords);

  const rows = useMemo(() => {
    if (!pageUsers.length) {
      return [];
    }

    const filtered = filterBySearch(pageUsers, search, (user) =>
      [
        user?.user?.fullName,
        user?.user?.email,
        user?.user?.city,
        user?.user?.state,
        user?.user?.phone,
        user?.user?.address,
      ]
        .filter(Boolean)
        .join(" ")
    );

    return sortItems(filtered, "newest", (a, b) => ({
      dateA: new Date(a?.user?.createdAt || 0).getTime(),
      dateB: new Date(b?.user?.createdAt || 0).getTime(),
      nameA: a?.user?.fullName || "",
      nameB: b?.user?.fullName || "",
    }));
  }, [pageUsers, search]);

  const paginationMeta = useMemo(
    () => getServerPaginationMeta(items, page, pageUsers.length),
    [items, page, pageUsers.length]
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
          searchValue={search}
          title={title}
        />
      }
    >
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>E-mail</TableCell>
          <TableCell>Location</TableCell>
          <TableCell>Phone</TableCell>
          <TableCell>Address</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5}>
              <Typography color="text.secondary" textAlign="center" variant="body2">
                No matching results found.
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((user) => (
            <TableRow hover key={user._id}>
              <TableCell>
                <TablePersonCell
                  name={user?.user?.fullName}
                  subtitle={formatRelativeDate(user?.user?.createdAt)}
                />
              </TableCell>
              <TableCell>
                <TableEmailCell email={user?.user?.email} />
              </TableCell>
              <TableCell>
                <TableLocationCell city={user?.user?.city} state={user?.user?.state} />
              </TableCell>
              <TableCell>
                <TablePhoneCell phone={user?.user?.phone} />
              </TableCell>
              <TableCell>{user?.user?.address || "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </DataTable>
  );
};

UsersTable.propTypes = {
  items: PropTypes.object,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
};
