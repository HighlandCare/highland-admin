import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import { toast } from "react-toastify";
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
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  DataTable,
  DataTableToolbar,
  filterBySearch,
  getClientPaginationProps,
  paginateItems,
  sortItems,
} from "../../components/data-table";
import { StatusBadge, TableActionsMenu } from "../../components/table-cells";
import Loader from "../../components/Loader";
import {
  approveDispute,
  rejectDispute,
  reviewDispute,
} from "../../Services/Dispute.service";
import { formatRelativeDate } from "../../utils/dateUtils";
import {
  applyDisputeActionLocally,
  canReviewDispute,
  formatRideCurrency,
  formatRidePaymentStatus,
  formatRideReason,
  getDisputeActionErrorMessage,
  getDisputeActionId,
  getDisputeDetailId,
  getDisputeStatusMeta,
  getRideCustomerName,
  getRideDestinationAddress,
  getRideDriverName,
  storeDisputeDetail,
} from "../../utils/disputeUtils";
import { truncateRideAddress } from "../../utils/rideUtils";

const disputeSortValue = "newest";

const nameCellSx = {
  fontWeight: 600,
  maxWidth: { xs: 100, sm: 140, md: 160 },
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const addressCellSx = {
  maxWidth: { xs: 140, sm: 200, md: 240 },
  minWidth: 0,
};

const addressTextSx = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const ACTION_COPY = {
  review: {
    title: "Mark Under Review",
    confirm: "Mark Under Review",
    notesRequired: true,
    success: "Dispute marked under review",
  },
  approve: {
    title: "Approve Dispute",
    confirm: "Approve",
    notesRequired: false,
    success: "Dispute approved",
  },
  reject: {
    title: "Reject Dispute",
    confirm: "Reject",
    notesRequired: false,
    success: "Dispute rejected",
  },
};

export const DisputesTable = (props) => {
  const {
    items = [],
    onPageChange = () => {},
    onRefresh = () => {},
    page = 1,
    title = "Disputes",
  } = props;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [actionState, setActionState] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rows = useMemo(() => {
    if (!items.length) {
      return [];
    }

    const filtered = filterBySearch(items, search, (row) =>
      [
        getRideCustomerName(row),
        getRideDriverName(row),
        getRideDestinationAddress(row),
        row?.reasonOfDispute,
        row?.status,
        formatRidePaymentStatus(row?.havePaid),
      ]
        .filter(Boolean)
        .join(" ")
    );

    return sortItems(filtered, disputeSortValue, (a, b) => ({
      dateA: new Date(a?.createdAt || 0).getTime(),
      dateB: new Date(b?.createdAt || 0).getTime(),
      nameA: getRideCustomerName(a),
      nameB: getRideCustomerName(b),
    }));
  }, [items, search]);

  const pageRows = useMemo(() => paginateItems(rows, page), [rows, page]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / 10) || 1);
    if (page > totalPages) {
      onPageChange(totalPages);
    }
  }, [rows.length, page, onPageChange]);

  const handleSearchChange = (value) => {
    setSearch(value);
    onPageChange(1);
  };

  const handleView = (row) => {
    storeDisputeDetail(row);
    const detailId = getDisputeDetailId(row);
    if (!detailId) {
      return;
    }
    router.push(`/disputes/detail?id=${detailId}`);
  };

  const openActionDialog = (row, action) => {
    setActionState({ row, action });
    setActionNotes(row?.adminNotes || "");
  };

  const closeActionDialog = () => {
    if (isSubmitting) {
      return;
    }
    setActionState(null);
    setActionNotes("");
  };

  const handleConfirmAction = async () => {
    if (!actionState) {
      return;
    }

    const { row, action } = actionState;
    const actionId = getDisputeActionId(row);
    const copy = ACTION_COPY[action];

    if (!actionId) {
      toast.error("Unable to update this dispute.");
      return;
    }

    if (copy.notesRequired && !actionNotes.trim()) {
      toast.error("Please add admin notes before continuing.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (action === "review") {
        await reviewDispute(actionId, actionNotes.trim());
      } else if (action === "approve") {
        await approveDispute(actionId, {
          adminNotes: actionNotes.trim() || undefined,
        });
      } else {
        await rejectDispute(actionId, {
          adminNotes: actionNotes.trim() || undefined,
        });
      }

      toast.success(copy.success);

      const nextRow = applyDisputeActionLocally(row, action, actionNotes);
      storeDisputeDetail(nextRow);

      setActionState(null);
      setActionNotes("");
      onRefresh();
    } catch (error) {
      toast.error(getDisputeActionErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmpty = !items.length;
  const activeCopy = actionState ? ACTION_COPY[actionState.action] : null;

  return (
    <>
      <DataTable
        empty={isEmpty}
        minWidth={960}
        pagination={getClientPaginationProps({
          currentPage: page,
          onPageChange,
          totalItems: rows.length,
        })}
        toolbar={
          <DataTableToolbar
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by customer, driver, or reason"
            searchValue={search}
            title={title}
          />
        }
      >
        <TableHead>
          <TableRow>
            <TableCell>Customer</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Opened by</TableCell>
            <TableCell>Destination</TableCell>
            <TableCell>Fare</TableCell>
            <TableCell>Payment</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Reason</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pageRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11}>
                <Typography color="text.secondary" textAlign="center" variant="body2">
                  No matching results found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((row) => {
              const destination = getRideDestinationAddress(row);
              const shortDestination = truncateRideAddress(destination);
              const statusMeta = getDisputeStatusMeta(row.status);
              const reason = formatRideReason(row.reasonOfDispute);
              const shortReason = truncateRideAddress(reason === "—" ? "" : reason, 42) || "—";
              const canAct = canReviewDispute(row);

              const actions = [
                {
                  icon: EyeIcon,
                  label: "View Details",
                  onClick: () => handleView(row),
                },
              ];

              if (canAct) {
                actions.push(
                  {
                    icon: DocumentTextIcon,
                    color: "info.main",
                    label: "Mark Under Review",
                    onClick: () => openActionDialog(row, "review"),
                  },
                  {
                    icon: CheckCircleIcon,
                    color: "success.main",
                    label: "Approve",
                    onClick: () => openActionDialog(row, "approve"),
                  },
                  {
                    icon: XCircleIcon,
                    color: "error.main",
                    label: "Reject",
                    onClick: () => openActionDialog(row, "reject"),
                  }
                );
              }

              return (
                <TableRow hover key={row.key || row.rideId || row.disputeId}>
                  <TableCell>
                    <Tooltip title={getRideCustomerName(row)}>
                      <Typography sx={nameCellSx} variant="body2">
                        {getRideCustomerName(row)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={getRideDriverName(row)}>
                      <Typography sx={nameCellSx} variant="body2">
                        {getRideDriverName(row)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {(row.disputeType || "—").toString().replace(/_/g, " ")}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {row.openedByRole === "customer"
                        ? "Customer"
                        : row.openedByRole === "chaperone"
                          ? "Driver"
                          : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={addressCellSx}>
                    <Tooltip title={destination}>
                      <Typography color="text.secondary" sx={addressTextSx} variant="body2">
                        {shortDestination}
                      </Typography>
                    </Tooltip>
                    {row.distance && (
                      <Typography color="text.secondary" variant="caption">
                        {row.distance}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600} variant="body2">
                      {formatRideCurrency(row.payment?.totalAmount ?? row.estFare)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      color={row.havePaid ? "success.main" : "warning.main"}
                      fontWeight={600}
                      variant="body2"
                    >
                      {formatRidePaymentStatus(row.havePaid)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                  </TableCell>
                  <TableCell sx={addressCellSx}>
                    <Tooltip title={reason}>
                      <Typography color="text.secondary" sx={addressTextSx} variant="body2">
                        {shortReason}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary" variant="body2">
                      {formatRelativeDate(row.createdAt)}
                    </Typography>
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

      <Dialog fullWidth maxWidth="sm" onClose={closeActionDialog} open={Boolean(actionState)}>
        <DialogTitle>{activeCopy?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {actionState
              ? `${getRideCustomerName(actionState.row)} · ${getRideDriverName(actionState.row)}`
              : ""}
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Admin Notes"
            minRows={3}
            multiline
            onChange={(event) => setActionNotes(event.target.value)}
            placeholder={
              activeCopy?.notesRequired
                ? "Required notes for review"
                : "Optional notes"
            }
            value={actionNotes}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={isSubmitting} onClick={closeActionDialog}>
            Cancel
          </Button>
          <Button
            color={
              actionState?.action === "reject"
                ? "error"
                : actionState?.action === "approve"
                  ? "success"
                  : "primary"
            }
            disabled={isSubmitting}
            onClick={handleConfirmAction}
            sx={{ minHeight: 40 }}
            variant="contained"
          >
            {isSubmitting ? <Loader color="#fff" inline size="xs" /> : activeCopy?.confirm}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

DisputesTable.propTypes = {
  items: PropTypes.array,
  onPageChange: PropTypes.func,
  onRefresh: PropTypes.func,
  page: PropTypes.number,
  title: PropTypes.string,
};
