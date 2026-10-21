import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import { BlockUserIcon, UnblockUserIcon } from "../../components/block-user-icons";
import { toast } from "react-toastify";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
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
  TableDetailCell,
  TableEmailCell,
  TablePersonCell,
} from "../../components/table-cells";
import Loader from "../../components/Loader";
import { deleteDriver, updateChapStatus, updateDriverPersonaStatus } from "../../Services/Auth.service";
import {
  getDriverAccountStatusMeta,
  getDriverDisplayName,
  getDriverList,
  getDriverPersonaStatus,
  getDriverProfileImage,
  getDriverUserId,
  getIsApprovedFromResponse,
  getPersonaStatusFromResponse,
  getPersonaStatusMeta,
  isDriverBlocked,
  isPersonaApproved,
  removeDriverFromList,
  setAdminPersonaDeclined,
  storeDriverDetail,
  updateDriverApprovalInList,
  updateDriverPersonaInList,
} from "../../utils/driverUtils";

const PERSONA_STATUS_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Approved", value: "approved" },
  { label: "Declined", value: "declined" },
  { label: "Pending Persona Review", value: "pending_persona_review" },
];

const ACCOUNT_STATUS_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Blocked", value: "blocked" },
];

const filterFieldSx = {
  minWidth: { xs: "100%", sm: 170 },
  "& .MuiInputBase-root": { bgcolor: "background.paper" },
};

const matchesPersonaFilter = (driver, filterValue) => {
  if (filterValue === "all") {
    return true;
  }

  const label = getPersonaStatusMeta(driver).label.toLowerCase();

  if (filterValue === "approved") {
    return label === "approved";
  }

  if (filterValue === "declined") {
    return label === "declined";
  }

  if (filterValue === "pending_persona_review") {
    return label === "pending persona review";
  }

  return true;
};

const matchesAccountFilter = (driver, filterValue) => {
  if (filterValue === "all") {
    return true;
  }

  return getDriverAccountStatusMeta(driver).label.toLowerCase() === filterValue;
};

export const ChapTable = (props) => {
  const {
    items: initialItems = {},
    onPageChange = () => {},
    onRefresh,
    page = 1,
  } = props;
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState(null);
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");
  const [personaStatus, setPersonaStatus] = useState("all");
  const [accountStatus, setAccountStatus] = useState("all");
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const refreshTable = async () => {
    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  const pageDrivers = useMemo(() => getDriverList(items), [items]);
  const isEmpty = !pageDrivers.length && !(items?.total_records ?? items?.totalRecords);

  const handleUpdatePersonaStatus = async (driver, personaStatus) => {
    const driverUserId = getDriverUserId(driver);

    if (!driverUserId) {
      console.error("Unable to update persona status: missing driver user id");
      return;
    }

    try {
      setSubmittingId(driver._id);
      const response = await updateDriverPersonaStatus(driverUserId, personaStatus);
      const updatedStatus = getPersonaStatusFromResponse(response, personaStatus);

      setItems((current) =>
        updateDriverPersonaInList(current, driver, updatedStatus, {
          adminDeclined: personaStatus === "declined",
          clearAdminDeclined: personaStatus === "approved",
        })
      );
      setAdminPersonaDeclined(driverUserId, personaStatus === "declined");
      toast.success(
        personaStatus === "approved"
          ? "Persona approved successfully"
          : "Persona declined successfully"
      );
      await refreshTable();
    } catch (error) {
      console.error("Error updating persona status:", error);
      toast.error("Unable to update persona status. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleOpenViewDetail = (driver) => {
    storeDriverDetail(driver);
    router.push(`/chaperone/detail?id=${driver._id}`);
  };

  const handleToggleDriverBlock = async (driver) => {
    const chaperoneId = driver._id;
    const shouldBlock = !isDriverBlocked(driver);

    if (!chaperoneId) {
      console.error("Unable to update driver status: missing chaperone id");
      return;
    }

    try {
      setSubmittingId(chaperoneId);
      const response = await updateChapStatus(chaperoneId, !shouldBlock);
      const isApproved = getIsApprovedFromResponse(response);

      setItems((current) => updateDriverApprovalInList(current, driver, isApproved));
      toast.success(shouldBlock ? "Driver blocked successfully" : "Driver unblocked successfully");
      await refreshTable();
    } catch (error) {
      console.error("Error updating driver status:", error);
      toast.error("Unable to update driver status. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!driverToDelete) {
      return;
    }

    const chaperoneId = driverToDelete._id;

    if (!chaperoneId) {
      toast.error("Unable to delete driver. Missing driver id.");
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteDriver(chaperoneId);

      if (response?.status === false) {
        toast.error(response?.message || "Unable to delete driver. Please try again.");
        return;
      }

      setItems((current) => removeDriverFromList(current, driverToDelete));
      toast.success("Driver deleted successfully");
      setDriverToDelete(null);
      await refreshTable();
    } catch (error) {
      console.error("Error deleting driver:", error);
      const apiMessage = error?.response?.data?.message || error?.message;
      toast.error(apiMessage || "Unable to delete driver. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const rows = useMemo(() => {
    if (!pageDrivers.length) {
      return [];
    }

    const byStatus = pageDrivers.filter(
      (driver) =>
        matchesPersonaFilter(driver, personaStatus) &&
        matchesAccountFilter(driver, accountStatus)
    );

    const filtered = filterBySearch(byStatus, search, (driver) => {
      const personaMeta = getPersonaStatusMeta(driver);
      const accountMeta = getDriverAccountStatusMeta(driver);

      return [
        getDriverDisplayName(driver),
        driver?.user?.email,
        driver?.vehicleName,
        driver?.vehicleNo,
        driver?.experience,
        driver?.licenceNumber,
        personaMeta.label,
        accountMeta.label,
      ]
        .filter(Boolean)
        .join(" ");
    });

    return sortItems(filtered, "newest", (a, b) => ({
      dateA: new Date(a?.createdAt || 0).getTime(),
      dateB: new Date(b?.createdAt || 0).getTime(),
      nameA: getDriverDisplayName(a),
      nameB: getDriverDisplayName(b),
    }));
  }, [accountStatus, pageDrivers, personaStatus, search]);

  const paginationMeta = useMemo(
    () => getServerPaginationMeta(items, page, pageDrivers.length),
    [items, page, pageDrivers.length]
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    onPageChange(1);
  };

  const handlePersonaStatusChange = (value) => {
    setPersonaStatus(value);
    onPageChange(1);
  };

  const handleAccountStatusChange = (value) => {
    setAccountStatus(value);
    onPageChange(1);
  };

  const filterActions = (
    <>
      <TextField
        InputLabelProps={{ shrink: true }}
        label="Persona"
        onChange={(event) => handlePersonaStatusChange(event.target.value)}
        select
        size="small"
        sx={filterFieldSx}
        value={personaStatus}
      >
        {PERSONA_STATUS_FILTER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        InputLabelProps={{ shrink: true }}
        label="Account"
        onChange={(event) => handleAccountStatusChange(event.target.value)}
        select
        size="small"
        sx={filterFieldSx}
        value={accountStatus}
      >
        {ACCOUNT_STATUS_FILTER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </>
  );

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
            actions={filterActions}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search drivers"
            searchValue={search}
          />
        }
      >
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>E-mail</TableCell>
            <TableCell>Vehicle</TableCell>
            <TableCell>Experience</TableCell>
            <TableCell>Persona Status</TableCell>
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
            rows.map((driver) => {
              const personaStatus = getDriverPersonaStatus(driver);
              const personaMeta = getPersonaStatusMeta(driver);
              const isPersonaApprovedStatus = isPersonaApproved(personaStatus);
              const accountMeta = getDriverAccountStatusMeta(driver);
              const isBlocked = isDriverBlocked(driver);
              const isSubmitting = submittingId === driver._id;

              const actions = [
                {
                  icon: EyeIcon,
                  label: "View Details",
                  onClick: () => handleOpenViewDetail(driver),
                },
              ];

              if (!isPersonaApprovedStatus) {
                actions.push({
                  icon: CheckCircleIcon,
                  color: "success.main",
                  disabled: isSubmitting,
                  label: isSubmitting ? "Approving..." : "Approve Persona",
                  onClick: () => handleUpdatePersonaStatus(driver, "approved"),
                });
              }

              actions.push({
                icon: XCircleIcon,
                color: "error.main",
                disabled: isSubmitting,
                label: isSubmitting ? "Declining..." : "Decline Persona",
                onClick: () => handleUpdatePersonaStatus(driver, "declined"),
              });

              if (isBlocked) {
                actions.push({
                  icon: UnblockUserIcon,
                  color: "success.main",
                  disabled: isSubmitting,
                  label: isSubmitting ? "Unblocking..." : "Unblock Driver",
                  onClick: () => handleToggleDriverBlock(driver),
                });
              } else {
                actions.push({
                  icon: BlockUserIcon,
                  color: "error.main",
                  disabled: isSubmitting,
                  label: isSubmitting ? "Blocking..." : "Block Driver",
                  onClick: () => handleToggleDriverBlock(driver),
                });
              }

              actions.push({
                icon: TrashIcon,
                color: "error.main",
                disabled: isSubmitting || isDeleting,
                label: "Delete Driver",
                onClick: () => setDriverToDelete(driver),
              });

              return (
                <TableRow hover key={driver._id}>
                  <TableCell>
                    <TablePersonCell
                      imageUrl={getDriverProfileImage(driver) || undefined}
                      name={getDriverDisplayName(driver)}
                      subtitle={driver?.user?.city || driver?.vehicleName || "No profile linked"}
                    />
                  </TableCell>
                  <TableCell>
                    <TableEmailCell email={driver?.user?.email} />
                  </TableCell>
                  <TableCell>
                    <TableDetailCell primary={driver?.vehicleName} secondary={driver?.vehicleNo} />
                  </TableCell>
                  <TableCell>{driver?.experience || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge color={personaMeta.color} label={personaMeta.label} />
                  </TableCell>
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

      <Dialog
        fullWidth
        maxWidth="sm"
        open={Boolean(driverToDelete)}
        onClose={() => !isDeleting && setDriverToDelete(null)}
      >
        <DialogTitle>Delete Driver</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{getDriverDisplayName(driverToDelete)}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 1,
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 2 },
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          <Button disabled={isDeleting} onClick={() => setDriverToDelete(null)}>
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

ChapTable.propTypes = {
  items: PropTypes.object,
  onPageChange: PropTypes.func,
  onRefresh: PropTypes.func,
  page: PropTypes.number,
};
