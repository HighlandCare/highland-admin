import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import { useRouter } from "next/router";
import { BlockUserIcon, UnblockUserIcon } from "../../components/block-user-icons";
import { toast } from "react-toastify";
import { formatRelativeDate } from "../../utils/dateUtils";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
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
  TableActionsMenu,
  TableEmailCell,
  TableLocationCell,
  TablePersonCell,
  TablePhoneCell,
} from "../../components/table-cells";
import { deleteUsers, updateUserStatus } from "../../Services/Auth.service";
import { getListFromResponse } from "../../utils/listUtils";
import {
  excludeAdminUsersFromResponse,
  filterOutAdminUsers,
  getCustomerAuthId,
  getIsBlockedFromResponse,
  getUserAccountStatusMeta,
  getUserDeleteId,
  getUserDisplayName,
  getUserProfileImage,
  isAdminUser,
  isUserBlocked,
  removeUserFromList,
  storeUserDetail,
  updateUserBlockInList,
} from "../../utils/userUtils";
import Loader from "../../components/Loader";

export const UsersTable = (props) => {
  const {
    items: initialItems = {},
    onPageChange = () => {},
    onRefresh,
    page = 1,
    title = "Users",
  } = props;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [items, setItems] = useState(initialItems);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setItems(excludeAdminUsersFromResponse(initialItems));
  }, [initialItems]);

  const refreshTable = async () => {
    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  const pageUsers = useMemo(
    () => filterOutAdminUsers(getListFromResponse(items)),
    [items]
  );
  const isEmpty = !pageUsers.length && !(items?.total_records ?? items?.totalRecords);

  const handleOpenViewDetail = (user) => {
    storeUserDetail(user);
    const detailId = user._id || getCustomerAuthId(user);
    router.push(`/users/detail?id=${detailId}`);
  };

  const handleToggleUserBlock = async (user) => {
    if (isAdminUser(user)) {
      toast.error("Admin accounts cannot be blocked.");
      return;
    }

    const customerAuthId = getCustomerAuthId(user);
    const shouldBlock = !isUserBlocked(user);

    if (!customerAuthId) {
      console.error("Unable to update user status: missing customer auth id");
      return;
    }

    try {
      setSubmittingId(customerAuthId);
      const response = await updateUserStatus(customerAuthId, !shouldBlock);

      if (response?.status === false) {
        toast.error(response?.message || "Unable to update user status. Please try again.");
        return;
      }

      const isBlocked = getIsBlockedFromResponse(response, shouldBlock);

      setItems((current) => updateUserBlockInList(current, user, isBlocked));
      toast.success(shouldBlock ? "User blocked successfully" : "User unblocked successfully");
      await refreshTable();
    } catch (error) {
      console.error("Error updating user status:", error);
      const apiMessage = error?.response?.data?.message || error?.message;
      toast.error(apiMessage || "Unable to update user status. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) {
      return;
    }

    if (isAdminUser(userToDelete)) {
      toast.error("Admin accounts cannot be deleted.");
      setUserToDelete(null);
      return;
    }

    const deleteId = getUserDeleteId(userToDelete);

    if (!deleteId) {
      toast.error("Unable to delete user. Missing user id.");
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteUsers(deleteId);

      if (response?.status === false) {
        toast.error(response?.message || "Unable to delete user. Please try again.");
        return;
      }

      setItems((current) => removeUserFromList(current, userToDelete));
      toast.success("User deleted successfully");
      setUserToDelete(null);
      await refreshTable();
    } catch (error) {
      console.error("Error deleting user:", error);
      const apiMessage = error?.response?.data?.message || error?.message;
      toast.error(apiMessage || "Unable to delete user. Please try again.");
    } finally {
      setIsDeleting(false);
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
      dateA: new Date(a?.user?.createdAt || a?.createdAt || 0).getTime(),
      dateB: new Date(b?.user?.createdAt || b?.createdAt || 0).getTime(),
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
    <>
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
          <TableCell align="right">Actions</TableCell>
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

            const actions = [
              {
                icon: EyeIcon,
                label: "View Details",
                onClick: () => handleOpenViewDetail(user),
              },
            ];

            if (isBlocked) {
              actions.push({
                icon: UnblockUserIcon,
                color: "success.main",
                disabled: isSubmitting,
                label: isSubmitting ? "Unblocking..." : "Unblock User",
                onClick: () => handleToggleUserBlock(user),
              });
            } else {
              actions.push({
                icon: BlockUserIcon,
                color: "error.main",
                disabled: isSubmitting,
                label: isSubmitting ? "Blocking..." : "Block User",
                onClick: () => handleToggleUserBlock(user),
              });
            }

            actions.push({
              icon: TrashIcon,
              color: "error.main",
              disabled: isSubmitting || isDeleting,
              label: "Delete User",
              onClick: () => setUserToDelete(user),
            });

            return (
              <TableRow hover key={user._id || customerAuthId}>
                <TableCell>
                  <TablePersonCell
                    imageUrl={getUserProfileImage(user) || undefined}
                    name={user?.user?.fullName}
                    subtitle={formatRelativeDate(user?.user?.createdAt || user?.createdAt)}
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
                  <TableActionsMenu actions={actions} disabled={isSubmitting} />
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
      </DataTable>

      <Dialog open={Boolean(userToDelete)} onClose={() => !isDeleting && setUserToDelete(null)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{getUserDisplayName(userToDelete)}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button disabled={isDeleting} onClick={() => setUserToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={isDeleting}
            onClick={handleConfirmDelete}
            variant="contained"
          >
            {isDeleting ? <Loader color="#fff" inline size="xs" /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

UsersTable.propTypes = {
  items: PropTypes.object,
  onPageChange: PropTypes.func,
  onRefresh: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
};
