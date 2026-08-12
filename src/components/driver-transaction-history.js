import PropTypes from "prop-types";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  DetailPanel,
  DetailSection,
  DetailStat,
  detailTableHeadSx,
  detailTableRowSx,
} from "./detail-page/detail-page-ui";
import { DataTablePagination } from "./data-table";
import { Scrollbar } from "./scrollbar";
import Loader from "./Loader";
import { formatDateTime } from "../utils/dateUtils";
import { formatEarningsCurrency } from "../utils/earningsUtils";

const SERVICE_LABELS = {
  transportation: "Rides",
  food_beverage: "Food",
  senior_care: "Senior care",
};

const formatServiceLabel = (category) =>
  SERVICE_LABELS[category] ||
  String(category || "—")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatStatusLabel = (status) => {
  if (!status) {
    return "—";
  }

  const value = String(status).trim();
  if (!value) {
    return "—";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

const hasValue = (value) => value != null && value !== "";

export const DriverTransactionHistory = ({
  transactions = [],
  loading = false,
  analytics = null,
  pagination = { page: 1, limit: 20, total: 0, totalPages: 0 },
  filters = {},
  onFilterChange,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const stats = analytics || {};
  const showPaidAmount = transactions.some((transaction) => hasValue(transaction.paidAmount));
  const showFrom = transactions.some((transaction) => hasValue(transaction.fromName));
  const showRemaining = transactions.some((transaction) =>
    hasValue(transaction.remainingBalance)
  );
  const showService = transactions.some((transaction) => hasValue(transaction.serviceCategory));

  return (
    <Stack spacing={2.5}>
      <DetailPanel>
        <DetailSection noBorder title="Filtered earnings">
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <DetailStat
              label="Total earned"
              value={formatEarningsCurrency(stats.totalEarned ?? 0)}
            />
            <DetailStat
              label="Total withdrawn"
              value={formatEarningsCurrency(stats.totalWithdrawn ?? 0)}
            />
            <DetailStat
              label="Rides earned"
              value={formatEarningsCurrency(stats.ridesEarned ?? 0)}
            />
            <DetailStat
              label="Food earned"
              value={formatEarningsCurrency(stats.foodEarned ?? 0)}
            />
            <DetailStat
              label="Transactions"
              value={String(stats.transactionCount ?? 0)}
            />
          </Stack>
        </DetailSection>
      </DetailPanel>

      <DetailPanel>
        <DetailSection noBorder title="Transaction history">
          <Stack
            direction={{ xs: "column", md: "row" }}
            flexWrap="wrap"
            gap={1.5}
            sx={{ mb: 2 }}
          >
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="driver-tx-status">Type</InputLabel>
              <Select
                label="Type"
                labelId="driver-tx-status"
                value={filters.status || ""}
                onChange={(e) => onFilterChange?.({ status: e.target.value || "" })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="credit">Credit (earned)</MenuItem>
                <MenuItem value="debit">Debit (withdrawn)</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="driver-tx-service">Service</InputLabel>
              <Select
                label="Service"
                labelId="driver-tx-service"
                value={filters.serviceCategory || ""}
                onChange={(e) =>
                  onFilterChange?.({ serviceCategory: e.target.value || "" })
                }
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="transportation">Rides</MenuItem>
                <MenuItem value="food_beverage">Food</MenuItem>
                <MenuItem value="senior_care">Senior care</MenuItem>
              </Select>
            </FormControl>

            <TextField
              InputLabelProps={{ shrink: true }}
              label="From"
              size="small"
              type="date"
              value={filters.from || ""}
              onChange={(e) => onFilterChange?.({ from: e.target.value || "" })}
            />
            <TextField
              InputLabelProps={{ shrink: true }}
              label="To"
              size="small"
              type="date"
              value={filters.to || ""}
              onChange={(e) => onFilterChange?.({ to: e.target.value || "" })}
            />
          </Stack>

          {loading ? (
            <Box sx={{ py: 4 }}>
              <Loader minHeight={120} size="md" />
            </Box>
          ) : transactions.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography color="text.secondary" variant="body2">
                No transactions for the selected filters.
              </Typography>
            </Box>
          ) : (
            <>
              <Scrollbar>
                <Box sx={{ minWidth: 720 }}>
                  <Table>
                    <TableHead sx={detailTableHeadSx}>
                      <TableRow>
                        <TableCell>Amount</TableCell>
                        {showPaidAmount ? <TableCell>Paid Amount</TableCell> : null}
                        {showRemaining ? (
                          <TableCell>Remaining Wallet Balance</TableCell>
                        ) : null}
                        <TableCell>Type</TableCell>
                        {showService ? <TableCell>Service</TableCell> : null}
                        {showFrom ? <TableCell>From</TableCell> : null}
                        <TableCell>Date & Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow hover key={transaction.id} sx={detailTableRowSx}>
                          <TableCell>
                            <Typography fontWeight={600} variant="body2">
                              {formatEarningsCurrency(transaction.amount)}
                            </Typography>
                          </TableCell>
                          {showPaidAmount ? (
                            <TableCell>
                              <Typography color="text.secondary" variant="body2">
                                {hasValue(transaction.paidAmount)
                                  ? formatEarningsCurrency(transaction.paidAmount)
                                  : "—"}
                              </Typography>
                            </TableCell>
                          ) : null}
                          {showRemaining ? (
                            <TableCell>
                              <Typography color="text.secondary" variant="body2">
                                {hasValue(transaction.remainingBalance)
                                  ? formatEarningsCurrency(transaction.remainingBalance)
                                  : "—"}
                              </Typography>
                            </TableCell>
                          ) : null}
                          <TableCell>
                            <Typography sx={{ textTransform: "capitalize" }} variant="body2">
                              {formatStatusLabel(transaction.status || transaction.type)}
                            </Typography>
                          </TableCell>
                          {showService ? (
                            <TableCell>
                              <Typography variant="body2">
                                {formatServiceLabel(transaction.serviceCategory)}
                              </Typography>
                            </TableCell>
                          ) : null}
                          {showFrom ? (
                            <TableCell>
                              <Typography variant="body2">
                                {hasValue(transaction.fromName) ? transaction.fromName : "—"}
                              </Typography>
                            </TableCell>
                          ) : null}
                          <TableCell>
                            <Typography variant="body2">
                              {transaction.date || transaction.createdAt
                                ? formatDateTime(transaction.date || transaction.createdAt)
                                : "—"}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Scrollbar>

              <DataTablePagination
                count={pagination.total || 0}
                page={Math.max((pagination.page || 1) - 1, 0)}
                rowsPerPage={pagination.limit || 20}
                rowsPerPageOptions={[10, 20, 50]}
                onPageChange={(_, newPage) => onPageChange?.(newPage + 1)}
                onRowsPerPageChange={(e) =>
                  onRowsPerPageChange?.(parseInt(e.target.value, 10))
                }
              />
            </>
          )}
        </DetailSection>
      </DetailPanel>
    </Stack>
  );
};

DriverTransactionHistory.propTypes = {
  analytics: PropTypes.object,
  filters: PropTypes.object,
  loading: PropTypes.bool,
  onFilterChange: PropTypes.func,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  pagination: PropTypes.object,
  transactions: PropTypes.array,
};
