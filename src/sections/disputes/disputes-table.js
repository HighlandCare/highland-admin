import { useEffect, useMemo, useRef, useState } from "react";
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
  MenuItem,
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
  getClientPaginationProps,
  paginateItems,
} from "../../components/data-table";
import { StatusBadge, TableActionsMenu } from "../../components/table-cells";
import Loader from "../../components/Loader";
import {
  approveDispute,
  rejectDispute,
  reviewDispute,
} from "../../Services/Dispute.service";
import {
  applyDisputeActionLocally,
  canReviewDispute,
  formatRideCurrency,
  formatRidePaymentStatus,
  getDisputeActionErrorMessage,
  getDisputeActionId,
  getDisputeDetailId,
  getDisputeStatusMeta,
  getRideCustomerName,
  getRideDriverName,
  normalizeDisputeWorkflowStatus,
  storeDisputeDetail,
} from "../../utils/disputeUtils";
import {
  LIST_FILTER_KEYS,
  consumeListFilterState,
  markListFilterRestore,
  storeListFilterState,
} from "../../utils/listFilterState";

const PAYMENT_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Unpaid", value: "unpaid" },
];

const STATUS_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Under Review", value: "under-review" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

const filterFieldSx = {
  minWidth: { xs: "100%", sm: 140 },
  "& .MuiInputBase-root": { bgcolor: "background.paper" },
};

const formatDisputeTypeLabel = (value) =>
  value ? String(value).replace(/_/g, " ") : "";

const hideOnSmSx = {
  display: { xs: "none", md: "table-cell" },
};

const hideOnXsSx = {
  display: { xs: "none", sm: "table-cell" },
};

const nameCellSx = {
  fontWeight: 600,
  maxWidth: { xs: 96, sm: 140, md: 160 },
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
  } = props;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionState, setActionState] = useState(null);
  const [actionNotes, setActionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageRef = useRef(page);
  pageRef.current = page;

  const resetToFirstPage = () => {
    if (pageRef.current !== 1) {
      onPageChange(1);
    }
  };

  useEffect(() => {
    const stored = consumeListFilterState(LIST_FILTER_KEYS.disputes);
    if (!stored) {
      return;
    }

    setSearch(stored.filters?.search ?? "");
    setPaymentFilter(stored.filters?.paymentFilter ?? "all");
    setStatusFilter(stored.filters?.statusFilter ?? "all");
    setTypeFilter(stored.filters?.typeFilter ?? "all");
    if (stored.page) {
      onPageChange(stored.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restore once on mount
  }, []);

  const indexedItems = useMemo(
    () =>
      items.map((row) => {
        const typeValue = String(row?.disputeType || "")
          .trim()
          .toLowerCase();
        const statusValue = normalizeDisputeWorkflowStatus(row?.status);
        const isPaid = Boolean(row?.havePaid);
        const searchText = [
          getRideCustomerName(row),
          getRideDriverName(row),
          row?.reasonOfDispute,
          row?.disputeType,
          statusValue,
          formatRidePaymentStatus(row?.havePaid),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return {
          row,
          typeValue,
          statusValue,
          isPaid,
          searchText,
          sortTime: new Date(row?.createdAt || 0).getTime(),
        };
      }),
    [items]
  );

  const typeFilterOptions = useMemo(() => {
    const values = new Set();

    indexedItems.forEach((entry) => {
      if (entry.typeValue) {
        values.add(entry.typeValue);
      }
    });

    return [
      { label: "All", value: "all" },
      ...Array.from(values)
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({
          label: formatDisputeTypeLabel(value),
          value,
        })),
    ];
  }, [indexedItems]);

  const rows = useMemo(() => {
    if (!indexedItems.length) {
      return [];
    }

    const query = search.trim().toLowerCase();

    const filtered = indexedItems.filter((entry) => {
      if (paymentFilter === "paid" && !entry.isPaid) {
        return false;
      }
      if (paymentFilter === "unpaid" && entry.isPaid) {
        return false;
      }
      if (statusFilter !== "all" && entry.statusValue !== statusFilter) {
        return false;
      }
      if (typeFilter !== "all" && entry.typeValue !== typeFilter) {
        return false;
      }
      if (query && !entry.searchText.includes(query)) {
        return false;
      }
      return true;
    });

    filtered.sort((a, b) => b.sortTime - a.sortTime);
    return filtered.map((entry) => entry.row);
  }, [indexedItems, paymentFilter, search, statusFilter, typeFilter]);

  const pageRows = useMemo(() => paginateItems(rows, page), [rows, page]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(rows.length / 10) || 1);
    if (page > totalPages) {
      onPageChange(totalPages);
    }
  }, [rows.length, page, onPageChange]);

  const handleSearchChange = (value) => {
    setSearch(value.trim());
    resetToFirstPage();
  };

  const handlePaymentFilterChange = (value) => {
    setPaymentFilter(value);
    resetToFirstPage();
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    resetToFirstPage();
  };

  const handleTypeFilterChange = (value) => {
    setTypeFilter(value);
    resetToFirstPage();
  };

  const filterActions = (
    <>
      <TextField
        InputLabelProps={{ shrink: true }}
        label="Payment"
        onChange={(event) => handlePaymentFilterChange(event.target.value)}
        select
        size="small"
        sx={filterFieldSx}
        value={paymentFilter}
      >
        {PAYMENT_FILTER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        InputLabelProps={{ shrink: true }}
        label="Status"
        onChange={(event) => handleStatusFilterChange(event.target.value)}
        select
        size="small"
        sx={filterFieldSx}
        value={statusFilter}
      >
        {STATUS_FILTER_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        InputLabelProps={{ shrink: true }}
        label="Type"
        onChange={(event) => handleTypeFilterChange(event.target.value)}
        select
        size="small"
        sx={filterFieldSx}
        value={typeFilter}
      >
        {typeFilterOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    </>
  );

  const handleView = (row) => {
    storeListFilterState(LIST_FILTER_KEYS.disputes, {
      page,
      filters: { search, paymentFilter, statusFilter, typeFilter },
    });
    markListFilterRestore(LIST_FILTER_KEYS.disputes);
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
        minWidth={640}
        pagination={getClientPaginationProps({
          currentPage: page,
          onPageChange,
          totalItems: rows.length,
        })}
        toolbar={
          <DataTableToolbar
            actions={filterActions}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by customer, driver, or status"
            searchValue={search}
          />
        }
      >
        <TableHead>
          <TableRow>
            <TableCell>Customer</TableCell>
            <TableCell>Driver</TableCell>
            <TableCell sx={hideOnSmSx}>Type</TableCell>
            <TableCell sx={hideOnSmSx}>Opened by</TableCell>
            <TableCell sx={hideOnXsSx}>Fare</TableCell>
            <TableCell sx={hideOnXsSx}>Payment</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pageRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8}>
                <Typography color="text.secondary" textAlign="center" variant="body2">
                  No matching results found.
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((row) => {
              const statusMeta = getDisputeStatusMeta(row.status);
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
                  <TableCell sx={hideOnSmSx}>
                    <Typography variant="body2">
                      {(row.disputeType || "—").toString().replace(/_/g, " ")}
                    </Typography>
                  </TableCell>
                  <TableCell sx={hideOnSmSx}>
                    <Typography variant="body2">
                      {row.openedByRole === "customer"
                        ? "Customer"
                        : row.openedByRole === "chaperone"
                          ? "Driver"
                          : "—"}
                    </Typography>
                  </TableCell>
                  <TableCell sx={hideOnXsSx}>
                    <Typography fontWeight={600} variant="body2">
                      {formatRideCurrency(row.payment?.totalAmount ?? row.estFare)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={hideOnXsSx}>
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
        <DialogActions
          sx={{
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 1,
            px: { xs: 2, sm: 3 },
            pb: { xs: 2, sm: 2 },
            "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
          }}
        >
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
};
