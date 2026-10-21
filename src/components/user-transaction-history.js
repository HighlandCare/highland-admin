import PropTypes from "prop-types";
import {
  Box,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
import { DateRangeFilter } from "./date-range-filter";
import { Scrollbar } from "./scrollbar";
import Loader from "./Loader";
import { formatDateTime } from "../utils/dateUtils";
import { formatEarningsCurrency } from "../utils/earningsUtils";

const filterSelectSx = {
  bgcolor: "neutral.100",
  borderRadius: 2.5,
  flexShrink: 0,
  fontSize: 13,
  height: 44,
  minWidth: 140,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
  "&:hover": { bgcolor: "neutral.50" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "neutral.200" },
  "&.Mui-focused": { bgcolor: "background.paper" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "primary.main",
    borderWidth: 1,
  },
  "& .MuiSelect-select": {
    alignItems: "center",
    display: "flex",
    py: 1.25,
    pl: 1.75,
    pr: 3.5,
  },
};

const dateRangeSx = {
  bgcolor: "neutral.100",
  borderColor: "transparent",
  borderRadius: 2.5,
  height: 44,
  minWidth: 160,
  "&:hover": { bgcolor: "neutral.50", borderColor: "neutral.200" },
};

const filterLabelSx = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  mb: 0.75,
};

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
        </DetailSection>
      </DetailPanel>

      <DetailPanel>
        <DetailSection noBorder title="Transaction history">
          <Stack
            alignItems={{ xs: "stretch", md: "flex-end" }}
            direction={{ xs: "column", md: "row" }}
            flexWrap="wrap"
            gap={1.5}
            sx={{ mb: 2 }}
          >
            <FormControl size="small" sx={{ flexShrink: 0 }}>
              <Typography sx={filterLabelSx} variant="caption">
                Type
              </Typography>
              <Select
                displayEmpty
                onChange={(e) => onFilterChange?.({ status: e.target.value || "" })}
                sx={filterSelectSx}
                value={filters.status || ""}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="debit">Debit (spent)</MenuItem>
                <MenuItem value="credit">Credit</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flexShrink: 0 }}>
              <Typography sx={filterLabelSx} variant="caption">
                Service
              </Typography>
              <Select
                displayEmpty
                onChange={(e) =>
                  onFilterChange?.({ serviceCategory: e.target.value || "" })
                }
                sx={filterSelectSx}
                value={filters.serviceCategory || ""}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="transportation">Rides</MenuItem>
                <MenuItem value="food_beverage">Food</MenuItem>
                <MenuItem value="senior_care">Senior care</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ flexShrink: 0 }}>
              <Typography sx={filterLabelSx} variant="caption">
                Date
              </Typography>
              <DateRangeFilter
                endDate={filters.to || ""}
                onChange={({ startDate, endDate }) =>
                  onFilterChange?.({
                    from: startDate || "",
                    to: endDate || "",
                  })
                }
                startDate={filters.from || ""}
                sx={dateRangeSx}
                variant="pill"
              />
            </Box>
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
