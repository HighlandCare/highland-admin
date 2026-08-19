import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  Card,
  CardHeader,
  Container,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Loader from "../components/Loader";
import { Scrollbar } from "../components/scrollbar";
import { getRideAdjustments, reviewRideAdjustment } from "../Services/Auth.service";
import { formatDate } from "../utils/dateUtils";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";

const PAGE_SIZE = 20;

const TYPE_LABELS = {
  extra_waiting: "Extra waiting",
  unused_waiting: "Unused waiting",
  skipped_stop: "Skipped stop",
};

const formatSeconds = (seconds) => {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total === 0) {
    return "0 min";
  }
  const sign = total < 0 ? "-" : "";
  const abs = Math.abs(total);
  const minutes = Math.floor(abs / 60);
  const rest = abs % 60;
  if (!minutes) {
    return `${sign}${rest} sec`;
  }
  return rest ? `${sign}${minutes} min ${rest} sec` : `${sign}${minutes} min`;
};

const formatMoney = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return "—";
  }
  return `$${value.toFixed(2)}`;
};

/**
 * Review queue for waiting-time deviations.
 *
 * Reviewing here is a bookkeeping action only. The customer authorized a single
 * amount before the ride and was charged exactly that, so none of these buttons
 * charge or refund anything — they record what an operator decided.
 */
const Page = () => {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [notesById, setNotesById] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const islogin = JSON.parse(
      typeof window !== "undefined" && localStorage.getItem("isLogin")
    );
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getRideAdjustments(page + 1, PAGE_SIZE, {
          status: "pending_review",
        });

        if (active) {
          setRows(Array.isArray(response?.data) ? response.data : []);
          setTotal(Number(response?.pagination?.total) || 0);
        }
      } catch (err) {
        console.error("Error loading ride adjustments:", err);
        if (active) {
          setRows([]);
          setTotal(0);
          setError("Could not load waiting adjustments.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [page, refreshKey]);

  const handleReview = useCallback(
    async (adjustmentId, status) => {
      try {
        setSavingId(adjustmentId);
        setError(null);
        await reviewRideAdjustment(adjustmentId, status, notesById[adjustmentId] || "");
        setRefreshKey((value) => value + 1);
      } catch (err) {
        console.error("Error reviewing adjustment:", err);
        setError("Could not save the review. Please try again.");
      } finally {
        setSavingId(null);
      }
    },
    [notesById]
  );

  return (
    <>
      <Head>
        <title>Waiting Adjustments | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Typography sx={pageTitleSx} variant="h4">
                Waiting Adjustments
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Stops where actual waiting time differed from what the customer
                selected and paid for.
              </Typography>
            </Stack>

            <Alert severity="info">
              These are records, not charges. Each customer paid the single amount
              authorized before their ride; reviewing an item here never charges or
              refunds anyone.
            </Alert>

            {error ? <Alert severity="error">{error}</Alert> : null}

            {isLoading && !rows.length ? (
              <Loader page />
            ) : (
              <Card>
                <CardHeader title={`Pending review (${total})`} />
                <Divider />
                <Scrollbar>
                  <Box sx={{ minWidth: 1100 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ride</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Stop</TableCell>
                          <TableCell>Planned</TableCell>
                          <TableCell>Actual</TableCell>
                          <TableCell>Difference</TableCell>
                          <TableCell>Indicative value</TableCell>
                          <TableCell>Recorded</TableCell>
                          <TableCell>Notes</TableCell>
                          <TableCell align="right">Decision</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.length ? (
                          rows.map((row) => (
                            <TableRow hover key={row.adjustmentId}>
                              <TableCell>
                                <Button
                                  onClick={() =>
                                    router.push(`/ride-history/detail?id=${row.rideId}`)
                                  }
                                  size="small"
                                  sx={{ textTransform: "none" }}
                                >
                                  {String(row.rideId).slice(-8)}
                                </Button>
                                <Typography color="text.secondary" variant="caption">
                                  {row.customer?.fullName || "Unknown customer"}
                                </Typography>
                              </TableCell>
                              <TableCell>{TYPE_LABELS[row.type] || row.type}</TableCell>
                              <TableCell>
                                {row.sequence != null ? `#${row.sequence}` : "—"}
                              </TableCell>
                              <TableCell>{formatSeconds(row.plannedSeconds)}</TableCell>
                              <TableCell>{formatSeconds(row.actualSeconds)}</TableCell>
                              <TableCell>{formatSeconds(row.deltaSeconds)}</TableCell>
                              <TableCell>{formatMoney(row.indicativeAmount)}</TableCell>
                              <TableCell>{formatDate(row.createdAt)}</TableCell>
                              <TableCell sx={{ minWidth: 200 }}>
                                <TextField
                                  fullWidth
                                  onChange={(event) =>
                                    setNotesById((prev) => ({
                                      ...prev,
                                      [row.adjustmentId]: event.target.value,
                                    }))
                                  }
                                  placeholder="Optional note"
                                  size="small"
                                  value={notesById[row.adjustmentId] || ""}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button
                                    disabled={savingId === row.adjustmentId}
                                    onClick={() => handleReview(row.adjustmentId, "waived")}
                                    size="small"
                                    variant="outlined"
                                  >
                                    Waive
                                  </Button>
                                  <Button
                                    disabled={savingId === row.adjustmentId}
                                    onClick={() =>
                                      handleReview(row.adjustmentId, "acknowledged")
                                    }
                                    size="small"
                                    variant="contained"
                                  >
                                    Acknowledge
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell align="center" colSpan={10}>
                              <Typography color="text.secondary" variant="body2">
                                Nothing pending review.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </Scrollbar>
                <TablePagination
                  component="div"
                  count={total}
                  onPageChange={(_event, newPage) => setPage(newPage)}
                  onRowsPerPageChange={() => {}}
                  page={page}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                />
              </Card>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
