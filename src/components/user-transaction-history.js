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
  if (!status) return "—";
  const value = String(status).trim();
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "—";
};

/** Lifetime / overview spend cards (no date filters). */
export const UserSpendOverview = ({ lifetime = null, loading = false }) => {
  if (loading && !lifetime) {
    return (
      <DetailPanel>
        <DetailSection noBorder title="Overview spend">
          <Box sx={{ py: 4 }}>
            <Loader minHeight={100} size="md" />
          </Box>
        </DetailSection>
      </DetailPanel>
    );
  }

  const spent = lifetime || {};

  return (
    <DetailPanel>
      <DetailSection noBorder title="Overview spend">
        <Stack direction="row" flexWrap="wrap" gap={1.5}>
          <DetailStat
            label="Lifetime spent"
            value={formatEarningsCurrency(spent.totalSpent ?? 0)}
          />
          <DetailStat
            label="Rides"
            value={formatEarningsCurrency(spent.ridesSpent ?? 0)}
          />
          <DetailStat
            label="Food"
            value={formatEarningsCurrency(spent.foodSpent ?? 0)}
          />
          <DetailStat
            label="Credits / refunds"
            value={formatEarningsCurrency(spent.totalCredits ?? 0)}
          />
          <DetailStat
            label="All transactions"
            value={String(spent.transactionCount ?? 0)}
          />
        </Stack>

        {Array.isArray(spent.byService) && spent.byService.length > 0 ? (
          <Box sx={{ mt: 2.5 }}>
            <Typography color="text.secondary" sx={{ mb: 1 }} variant="caption">
              Lifetime by service
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
              {spent.byService.map((row) => (
                <DetailStat
                  key={row.category}
                  label={formatServiceLabel(row.category)}
                  value={`${formatEarningsCurrency(row.spent)} · ${row.count} txns`}
                />
              ))}
            </Stack>
          </Box>
        ) : null}

        {Array.isArray(spent.byStatus) || spent.byStatus ? (
          <Box sx={{ mt: 2.5 }}>
            <Typography color="text.secondary" sx={{ mb: 1 }} variant="caption">
              By type
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.5}>
              <DetailStat
                label="Debits (spent)"
                value={`${formatEarningsCurrency(spent.byStatus?.debit?.total ?? 0)} · ${
                  spent.byStatus?.debit?.count ?? 0
                }`}
              />
              <DetailStat
                label="Credits"
                value={`${formatEarningsCurrency(spent.byStatus?.credit?.total ?? 0)} · ${
                  spent.byStatus?.credit?.count ?? 0
                }`}
              />
            </Stack>
          </Box>
        ) : null}
      </DetailSection>
    </DetailPanel>
  );
};

UserSpendOverview.propTypes = {
  lifetime: PropTypes.object,
  loading: PropTypes.bool,
};

export const UserTransactionHistory = ({
  transactions = [],
  loading = false,
  analytics = null,
  pagination = { page: 1, limit: 20, total: 0, totalPages: 0 },
  filters = {},
  onFilterChange,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const spent = analytics || {};

  return (
    <Stack spacing={2.5}>
      <DetailPanel>
        <DetailSection noBorder title="Filtered spend">
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <DetailStat
              label="Total spent"
              value={formatEarningsCurrency(spent.totalSpent ?? 0)}
            />
            <DetailStat
              label="Rides spent"
              value={formatEarningsCurrency(spent.ridesSpent ?? 0)}
            />
            <DetailStat
              label="Food spent"
              value={formatEarningsCurrency(spent.foodSpent ?? 0)}
            />
            <DetailStat
              label="Transactions"
              value={String(spent.transactionCount ?? 0)}
            />
            <DetailStat
              label="Credits"
              value={formatEarningsCurrency(spent.totalCredits ?? 0)}
            />
          </Stack>

          {Array.isArray(spent.byService) && spent.byService.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography color="text.secondary" sx={{ mb: 1 }} variant="caption">
                By service (current filters)
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.5}>
                {spent.byService.map((row) => (
                  <DetailStat
                    key={row.category}
                    label={formatServiceLabel(row.category)}
                    value={`${formatEarningsCurrency(row.spent)} · ${row.count}`}
                  />
                ))}
              </Stack>
            </Box>
          ) : null}
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
              <InputLabel id="user-tx-status">Type</InputLabel>
              <Select
                label="Type"
                labelId="user-tx-status"
                value={filters.status || ""}
                onChange={(e) => onFilterChange?.({ status: e.target.value || "" })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="debit">Debit (spent)</MenuItem>
                <MenuItem value="credit">Credit</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="user-tx-service">Service</InputLabel>
              <Select
                label="Service"
                labelId="user-tx-service"
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
                        <TableCell>Type</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Counterparty</TableCell>
                        <TableCell>Reference</TableCell>
                        <TableCell>Date & Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow hover key={tx.id || tx._id} sx={detailTableRowSx}>
                          <TableCell>
                            <Typography fontWeight={600} variant="body2">
                              {formatEarningsCurrency(tx.amount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ textTransform: "capitalize" }} variant="body2">
                              {formatStatusLabel(tx.status)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatServiceLabel(tx.serviceCategory)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {tx.status === "debit"
                                ? tx.toName || "—"
                                : tx.fromName || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography color="text.secondary" variant="body2">
                              {tx.referenceType
                                ? `${tx.referenceType}${
                                    tx.referenceId
                                      ? ` · ${String(tx.referenceId).slice(-6)}`
                                      : ""
                                  }`
                                : "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {tx.date || tx.createdAt
                                ? formatDateTime(tx.date || tx.createdAt)
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

UserTransactionHistory.propTypes = {
  analytics: PropTypes.object,
  filters: PropTypes.object,
  loading: PropTypes.bool,
  onFilterChange: PropTypes.func,
  onPageChange: PropTypes.func,
  onRowsPerPageChange: PropTypes.func,
  pagination: PropTypes.object,
  transactions: PropTypes.array,
};
