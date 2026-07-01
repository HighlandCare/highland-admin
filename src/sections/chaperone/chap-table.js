import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import { BlockUserIcon, UnblockUserIcon } from "../../components/block-user-icons";
import { toast } from "react-toastify";
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
  TableDetailCell,
  TableEmailCell,
  TablePersonCell,
  TableQuickActions,
} from "../../components/table-cells";
import { updateChapStatus, updateDriverPersonaStatus } from "../../Services/Auth.service";
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
  mergeDriverApprovalUpdate,
  setAdminPersonaDeclined,
  setDriverListInResponse,
  storeDriverDetail,
  updateDriverApprovalInList,
  updateDriverPersonaInList,
} from "../../utils/driverUtils";

export const ChapTable = (props) => {
  const {
    items: initialItems = {},
    onPageChange = () => {},
    page = 1,
    title = "Drivers",
  } = props;
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState(null);
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setItems((current) => {
      const currentDrivers = getDriverList(current);
      const nextDrivers = getDriverList(initialItems);

      if (!currentDrivers.length) {
        return initialItems;
      }

      const approvalById = new Map(
        currentDrivers
          .map((driver) => [driver._id, driver.isApproved])
          .filter(([id, isApproved]) => id && typeof isApproved === "boolean")
      );

      if (!approvalById.size) {
        return initialItems;
      }

      const mergedDrivers = nextDrivers.map((driver) =>
        approvalById.has(driver._id)
          ? mergeDriverApprovalUpdate(driver, approvalById.get(driver._id))
          : driver
      );

      return setDriverListInResponse(initialItems, mergedDrivers);
    });
  }, [initialItems]);

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
    } catch (error) {
      console.error("Error updating driver status:", error);
      toast.error("Unable to update driver status. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const rows = useMemo(() => {
    if (!pageDrivers.length) {
      return [];
    }

    const filtered = filterBySearch(pageDrivers, search, (driver) => {
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
  }, [pageDrivers, search]);

  const paginationMeta = useMemo(
    () => getServerPaginationMeta(items, page, pageDrivers.length),
    [items, page, pageDrivers.length]
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
          <TableCell>Vehicle</TableCell>
          <TableCell>Experience</TableCell>
          <TableCell>Persona Status</TableCell>
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
                label: "View details",
                onClick: () => handleOpenViewDetail(driver),
              },
            ];

            if (!isPersonaApprovedStatus) {
              actions.push({
                icon: CheckCircleIcon,
                color: "success.main",
                label: isSubmitting ? "Approving..." : "Approve Persona",
                onClick: () => !isSubmitting && handleUpdatePersonaStatus(driver, "approved"),
              });
            }

            actions.push({
              icon: XCircleIcon,
              color: "error.main",
              label: isSubmitting ? "Declining..." : "Decline Persona",
              onClick: () => !isSubmitting && handleUpdatePersonaStatus(driver, "declined"),
            });

            if (isBlocked) {
              actions.push({
                icon: UnblockUserIcon,
                color: "success.main",
                label: isSubmitting ? "Unblocking..." : "Unblock Driver",
                onClick: () => !isSubmitting && handleToggleDriverBlock(driver),
              });
            } else {
              actions.push({
                icon: BlockUserIcon,
                color: "error.main",
                label: isSubmitting ? "Blocking..." : "Block Driver",
                onClick: () => !isSubmitting && handleToggleDriverBlock(driver),
              });
            }

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

ChapTable.propTypes = {
  items: PropTypes.object,
  onPageChange: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
};
