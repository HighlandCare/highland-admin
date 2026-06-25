import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
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
import { updateChapStatus } from "../../Services/Auth.service";
import {
  getDriverDisplayName,
  getDriverList,
  getDriverProfileImage,
  getDriverStatusLabel,
  storeDriverDetail,
} from "../../utils/driverUtils";

export const ChapTable = (props) => {
  const {
    items: initialItems = {},
    onPageChange = () => {},
    page = 1,
    title = "Drivers",
  } = props;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const pageDrivers = useMemo(() => getDriverList(items), [items]);
  const isEmpty = !pageDrivers.length && !(items?.total_records ?? items?.totalRecords);

  const handleStatusChange = async (chaperonId, newStatus) => {
    try {
      setSubmitting(true);
      await updateChapStatus(chaperonId, newStatus);

      const updatedDrivers = pageDrivers.map((chape) =>
        chape._id === chaperonId ? { ...chape, isApproved: newStatus } : chape
      );

      setItems({ ...items, data: updatedDrivers });
    } catch (error) {
      console.error("Error changing chaperone status:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenViewDetail = (driver) => {
    storeDriverDetail(driver);
    router.push(`/chaperone/detail?id=${driver._id}`);
  };

  const rows = useMemo(() => {
    if (!pageDrivers.length) {
      return [];
    }

    const filtered = filterBySearch(pageDrivers, search, (driver) =>
      [
        getDriverDisplayName(driver),
        driver?.user?.email,
        driver?.vehicleName,
        driver?.vehicleNo,
        driver?.experience,
        driver?.licenceNumber,
        driver?.status,
      ]
        .filter(Boolean)
        .join(" ")
    );

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
          <TableCell>Status</TableCell>
          <TableCell align="right">Quick Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>
              <Typography color="text.secondary" textAlign="center" variant="body2">
                No matching results found.
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((driver) => {
            const status = getDriverStatusLabel(driver);

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
                  <StatusBadge color={status.color} label={status.label} />
                </TableCell>
                <TableCell align="right">
                  <TableQuickActions
                    actions={[
                      {
                        icon: EyeIcon,
                        label: "View details",
                        onClick: () => handleOpenViewDetail(driver),
                      },
                      {
                        icon: driver.isApproved ? XCircleIcon : CheckCircleIcon,
                        label: driver.isApproved ? "Revoke approval" : "Approve driver",
                        onClick: () => !submitting && handleStatusChange(driver._id, !driver.isApproved),
                      },
                    ]}
                  />
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
