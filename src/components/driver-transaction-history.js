import PropTypes from "prop-types";
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Scrollbar } from "./scrollbar";
import Loader from "./Loader";
import { formatDateTime } from "../utils/dateUtils";
import { formatEarningsCurrency } from "../utils/earningsUtils";

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

export const DriverTransactionHistory = ({ transactions = [], loading = false }) => {
  const showPaidAmount = transactions.some((transaction) => transaction.paidAmount != null);
  const showFrom = transactions.some((transaction) => transaction.fromName);
  const showRemaining = transactions.some((transaction) => transaction.remainingBalance != null);

  return (
    <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
      <CardContent>
        <Typography sx={{ mb: 2 }} variant="h6">
          Transaction History
        </Typography>

        {loading ? (
          <Box sx={{ py: 4 }}>
            <Loader minHeight={120} size="md" />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body2">
              No transaction history available.
            </Typography>
          </Box>
        ) : (
          <Scrollbar>
            <Box sx={{ minWidth: 640 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Amount</TableCell>
                    {showPaidAmount && <TableCell>Paid Amount</TableCell>}
                    {showRemaining && <TableCell>Remaining Wallet Balance</TableCell>}
                    <TableCell>Type</TableCell>
                    {showFrom && <TableCell>From</TableCell>}
                    <TableCell>Date & Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow hover key={transaction.id}>
                      <TableCell>
                        <Typography fontWeight={600} variant="body2">
                          {formatEarningsCurrency(transaction.amount)}
                        </Typography>
                      </TableCell>
                      {showPaidAmount && (
                        <TableCell>
                          <Typography color="text.secondary" variant="body2">
                            {formatEarningsCurrency(transaction.paidAmount)}
                          </Typography>
                        </TableCell>
                      )}
                      {showRemaining && (
                        <TableCell>
                          <Typography color="text.secondary" variant="body2">
                            {formatEarningsCurrency(transaction.remainingBalance)}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography sx={{ textTransform: "capitalize" }} variant="body2">
                          {formatStatusLabel(transaction.status || transaction.type)}
                        </Typography>
                      </TableCell>
                      {showFrom && (
                        <TableCell>
                          <Typography variant="body2">{transaction.fromName || "—"}</Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(transaction.date)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Scrollbar>
        )}
      </CardContent>
    </Card>
  );
};

DriverTransactionHistory.propTypes = {
  loading: PropTypes.bool,
  transactions: PropTypes.array,
};
