import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { BlockUserIcon, UnblockUserIcon } from "../../components/block-user-icons";
import { toast } from "react-toastify";
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
  StatusBadge,
  TableEmailCell,
  TableLocationCell,
  TablePersonCell,
  TablePhoneCell,
  TableQuickActions,
} from "../../components/table-cells";
import { updateUserStatus } from "../../Services/Auth.service";
import { getListFromResponse } from "../../utils/listUtils";
import {
  getCustomerAuthId,
  getIsBlockedFromResponse,
  getUserAccountStatusMeta,
  isUserBlocked,
  mergeUserBlockUpdate,
  setUserListInResponse,
  updateUserBlockInList,
} from "../../utils/userUtils";

export const UsersTable = (props) => {
  const { items: initialItems = {}, onPageChange = () => {}, page = 1, title = "Users" } = props;
  const [search, setSearch] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems((current) => {
      const currentUsers = getListFromResponse(current);
      const nextUsers = getListFromResponse(initialItems);

      if (!currentUsers.length) {
        return initialItems;
      }

      const blockedByAuthId = new Map(
        currentUsers
          .map((user) => [getCustomerAuthId(user), isUserBlocked(user)])
          .filter(([authId]) => authId)
      );

      if (!blockedByAuthId.size) {
        return initialItems;
      }

      const mergedUsers = nextUsers.map((user) => {
        const authId = getCustomerAuthId(user);

        if (!authId || !blockedByAuthId.has(authId)) {
          return user;
        }

        return mergeUserBlockUpdate(user, blockedByAuthId.get(authId));
      });

      return setUserListInResponse(initialItems, mergedUsers);
    });
  }, [initialItems]);

  const pageUsers = useMemo(() => getListFromResponse(items), [items]);
  const isEmpty = !pageUsers.length && !(items?.total_records ?? items?.totalRecords);

  const handleToggleUserBlock = async (user) => {
    const customerAuthId = getCustomerAuthId(user);
    const shouldBlock = !isUserBlocked(user);

    if (!customerAuthId) {
      console.error("Unable to update user status: missing customer auth id");
      return;
    }

    try {
      setSubmittingId(customerAuthId);
      const response = await updateUserStatus(customerAuthId, !shouldBlock);
      const isBlocked = getIsBlockedFromResponse(response, shouldBlock);

      setItems((current) => updateUserBlockInList(current, user, isBlocked));
      toast.success(shouldBlock ? "User blocked successfully" : "User unblocked successfully");
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Unable to update user status. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const rows = useMemo(() => {
    if (!pageUsers.length) {
      return [];
    }

    const filtered = filterBySearch(pageUsers, search, (user) => {
      const accountMeta = getUserAccountStatusMeta(user);

      return [
        user?.user?.fullName,
        user?.user?.email,
        user?.user?.city,
        user?.user?.state,
        user?.user?.phone,
        user?.user?.address,
        accountMeta.label,
      ]
        .filter(Boolean)
        .join(" ");
    });

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
          <TableCell>Account Status</TableCell>
          <TableCell align="right">Quick Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7}>
              <Typography color="text.secondary" textAlign="center" variant="body2">
                No matching results found.
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((user) => {
            const accountMeta = getUserAccountStatusMeta(user);
            const isBlocked = isUserBlocked(user);
            const customerAuthId = getCustomerAuthId(user);
            const isSubmitting = submittingId === customerAuthId;

            const actions = [];

            if (isBlocked) {
              actions.push({
                icon: UnblockUserIcon,
                color: "success.main",
                label: isSubmitting ? "Unblocking..." : "Unblock User",
                onClick: () => !isSubmitting && handleToggleUserBlock(user),
              });
            } else {
              actions.push({
                icon: BlockUserIcon,
                color: "error.main",
                label: isSubmitting ? "Blocking..." : "Block User",
                onClick: () => !isSubmitting && handleToggleUserBlock(user),
              });
            }

            return (
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
                <TableCell>
                  <StatusBadge color={accountMeta.color} label={accountMeta.label} />
                </TableCell>
                <TableCell align="right">
                  <TableQuickActions actions={actions} />
                </TableCell>
              </TableRow>
            );
          })
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
