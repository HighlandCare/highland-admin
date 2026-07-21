import { useEffect, useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import Loader from "../../components/Loader";
import { StatusBadge } from "../../components/table-cells";
import { formatApiErrorMessage, getRideById } from "../../Services/Auth.service";
import {
  approveDispute,
  getDisputeById,
  rejectDispute,
  reviewDispute,
} from "../../Services/Dispute.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../../utils/pageLayout";
import {
  applyDisputeActionLocally,
  canReviewDispute,
  formatRideCurrency,
  formatRidePaymentStatus,
  formatRideReason,
  getDisputeActionId,
  getDisputeAdminNotes,
  getDisputeFromResponse,
  getDisputeStatusMeta,
  getRideCustomerName,
  getRideDestinationAddress,
  getRideDriverName,
  getRidePickupAddress,
  getStoredDisputeDetail,
  storeDisputeDetail,
} from "../../utils/disputeUtils";
import {
  formatRideCommissionRate,
  formatRideCoordinates,
  formatRideField,
  getRideAdminEarning,
  getRideDriverEarning,
  getRideFromResponse,
} from "../../utils/rideUtils";
import { brand } from "../../theme/colors";

const hasDetailValue = (value) => {
  if (value == null) {
    return false;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed !== "" && trimmed !== "—" && trimmed !== "false" && trimmed.toLowerCase() !== "n/a";
  }

  return true;
};

const DetailItem = ({ label, value }) => {
  const isEmail = label === "Email" || (typeof value === "string" && value.includes("@"));
  const displayValue = isEmail && value ? String(value).toLowerCase() : value;

  if (!hasDetailValue(displayValue)) {
    return null;
  }

  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        data-email={isEmail ? "true" : undefined}
        fontWeight={600}
        sx={{ wordBreak: "break-word", ...(isEmail ? { textTransform: "lowercase" } : {}) }}
        variant="body2"
      >
        {displayValue}
      </Typography>
    </Box>
  );
};

const SectionCard = ({ children, title }) => (
  <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none", height: "100%" }}>
    <CardContent>
      <Typography sx={{ mb: 2 }} variant="h6">
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const formatTimestamp = (value) => {
  if (!value || value === "false") {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatRideField(value);
  }

  return formatDate(value);
};

const AdminNotesPanel = ({ notes }) => {
  if (!hasDetailValue(notes)) {
    return null;
  }

  return (
    <Box
      sx={{
        bgcolor: alpha(brand.primary, 0.06),
        border: "1px solid",
        borderColor: alpha(brand.primary, 0.18),
        borderRadius: 2,
        px: 2,
        py: 1.75,
      }}
    >
      <Typography color="text.secondary" sx={{ mb: 0.75 }} variant="caption">
        Admin Notes
      </Typography>
      <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} variant="body2">
        {notes}
      </Typography>
    </Box>
  );
};

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [row, setRow] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    const loadDetail = async () => {
      setIsLoading(true);
      const cached = getStoredDisputeDetail(id);

      if (cached && active) {
        setRow(cached);
        setAdminNotes(getDisputeAdminNotes(cached));
        setIsLoading(false);
      }

      try {
        let nextRow = cached;

        if (cached?.disputeId || (!cached?.rideId && id)) {
          try {
            const disputeResponse = await getDisputeById(cached?.disputeId || id);
            const disputeRow = getDisputeFromResponse(disputeResponse);
            if (disputeRow) {
              nextRow = {
                ...(cached || {}),
                ...disputeRow,
                disputeId: disputeRow.disputeId || cached?.disputeId || id,
                customer: disputeRow.customer || cached?.customer,
                driver: disputeRow.driver || cached?.driver,
                from: disputeRow.from || cached?.from,
                destination: disputeRow.destination || cached?.destination,
                payment: disputeRow.payment || cached?.payment,
                adminNotes:
                  getDisputeAdminNotes(disputeRow) ||
                  getDisputeAdminNotes(cached) ||
                  "",
              };
            }
          } catch (error) {
            // Fall through to ride lookup
          }
        }

        const rideId = nextRow?.rideId || cached?.rideId;
        if (rideId) {
          try {
            const rideResponse = await getRideById(rideId);
            const rideData = getRideFromResponse(rideResponse);
            if (rideData) {
              nextRow = {
                ...(nextRow || {}),
                ...rideData,
                rideId: rideData.rideId || rideId,
                disputeId: nextRow?.disputeId || cached?.disputeId || null,
                reasonOfDispute:
                  nextRow?.reasonOfDispute || rideData.reasonOfDispute || "",
                adminNotes:
                  getDisputeAdminNotes(nextRow) ||
                  getDisputeAdminNotes(cached) ||
                  getDisputeAdminNotes(rideData) ||
                  "",
                status: nextRow?.status || rideData.status,
                key: nextRow?.disputeId || rideData.rideId,
              };
            }
          } catch (error) {
            // Keep whatever we already have
          }
        }

        if (active) {
          if (nextRow) {
            storeDisputeDetail(nextRow);
            setRow(nextRow);
            setAdminNotes(getDisputeAdminNotes(nextRow));
          } else if (!cached) {
            setRow(null);
          }
        }
      } catch (error) {
        console.error("Error loading dispute details:", error);
        if (active && !cached) {
          setRow(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      active = false;
    };
  }, [id]);

  const handleAction = async (action) => {
    const actionId = getDisputeActionId(row);

    if (!actionId) {
      toast.error("Unable to update this dispute.");
      return;
    }

    if (action === "review" && !adminNotes.trim()) {
      toast.error("Please add admin notes before marking under review.");
      return;
    }

    setIsSubmitting(true);
    setSubmittingAction(action);

    try {
      let response;

      if (action === "review") {
        response = await reviewDispute(actionId, adminNotes.trim());
      } else if (action === "approve") {
        response = await approveDispute(actionId, {
          adminNotes: adminNotes.trim() || undefined,
        });
      } else {
        response = await rejectDispute(actionId, {
          adminNotes: adminNotes.trim() || undefined,
        });
      }

      const updated = getDisputeFromResponse(response);
      const nextRow = {
        ...applyDisputeActionLocally(row, action, adminNotes),
        ...(updated || {}),
        adminNotes:
          getDisputeAdminNotes(updated) ||
          adminNotes.trim() ||
          getDisputeAdminNotes(row),
        disputeId: row.disputeId || actionId,
        rideId: row.rideId,
      };

      storeDisputeDetail(nextRow);
      setRow(nextRow);
      setAdminNotes(getDisputeAdminNotes(nextRow));
      toast.success(
        action === "review"
          ? "Dispute marked under review"
          : action === "approve"
            ? "Dispute approved"
            : "Dispute rejected"
      );
    } catch (error) {
      toast.error(
        formatApiErrorMessage(error?.response?.data?.message || error?.message) ||
          "Unable to update dispute."
      );
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  const statusMeta = row ? getDisputeStatusMeta(row.status) : null;
  const showActions = canReviewDispute(row);
  const savedNotes = row ? getDisputeAdminNotes(row) : "";

  return (
    <>
      <Head>
        <title>Dispute Details | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3}>
            <Button
              component={NextLink}
              href="/disputes"
              startIcon={
                <SvgIcon fontSize="small">
                  <ArrowLeftIcon />
                </SvgIcon>
              }
              sx={{ alignSelf: "flex-start", textTransform: "capitalize" }}
            >
              Back to Disputes
            </Button>

            {isLoading ? (
              <Loader page />
            ) : !row ? (
              <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                <CardContent sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="h6">Dispute not found</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                    The selected dispute could not be loaded.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                  <CardContent>
                    <Stack
                      alignItems={{ xs: "flex-start", md: "center" }}
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box>
                        <Typography sx={pageTitleSx} variant="h4">
                          Dispute Details
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body1">
                          {getRideDriverName(row)} → {getRideCustomerName(row)}
                        </Typography>
                      </Box>
                      {statusMeta && <StatusBadge color={statusMeta.color} label={statusMeta.label} />}
                    </Stack>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    border: "1px solid",
                    borderColor: "neutral.200",
                    boxShadow: "none",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: alpha(brand.primary, 0.04),
                      borderBottom: "1px solid",
                      borderColor: "neutral.200",
                      px: 3,
                      py: 2,
                    }}
                  >
                    <Typography fontWeight={700} variant="h6">
                      Admin Review
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                      {showActions
                        ? "Add notes, then mark under review, approve, or reject this dispute."
                        : "This dispute is closed. Previous admin notes are shown below."}
                    </Typography>
                  </Box>

                  <CardContent sx={{ pt: 3 }}>
                    <Stack spacing={2.5}>
                      <AdminNotesPanel notes={savedNotes} />

                      {showActions ? (
                        <>
                          <TextField
                            fullWidth
                            label="Admin Notes"
                            minRows={3}
                            multiline
                            onChange={(event) => setAdminNotes(event.target.value)}
                            placeholder="Explain your decision for review, approval, or rejection"
                            value={adminNotes}
                          />
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1.5}
                            sx={{ width: "100%" }}
                          >
                            <Button
                              disabled={isSubmitting}
                              fullWidth
                              onClick={() => handleAction("review")}
                              startIcon={
                                submittingAction === "review" ? null : (
                                  <SvgIcon fontSize="small">
                                    <DocumentTextIcon />
                                  </SvgIcon>
                                )
                              }
                              sx={{
                                borderColor: "info.main",
                                color: "info.main",
                                minHeight: 48,
                                "&:hover": {
                                  borderColor: "info.dark",
                                  bgcolor: alpha("#0288d1", 0.06),
                                },
                              }}
                              variant="outlined"
                            >
                              {submittingAction === "review" ? (
                                <Loader color="#0288d1" inline size="xs" />
                              ) : (
                                "Mark Under Review"
                              )}
                            </Button>
                            <Button
                              color="success"
                              disabled={isSubmitting}
                              fullWidth
                              onClick={() => handleAction("approve")}
                              startIcon={
                                submittingAction === "approve" ? null : (
                                  <SvgIcon fontSize="small">
                                    <CheckCircleIcon />
                                  </SvgIcon>
                                )
                              }
                              sx={{ minHeight: 48 }}
                              variant="contained"
                            >
                              {submittingAction === "approve" ? (
                                <Loader color="#fff" inline size="xs" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                            <Button
                              color="error"
                              disabled={isSubmitting}
                              fullWidth
                              onClick={() => handleAction("reject")}
                              startIcon={
                                submittingAction === "reject" ? null : (
                                  <SvgIcon fontSize="small">
                                    <XCircleIcon />
                                  </SvgIcon>
                                )
                              }
                              sx={{ minHeight: 48 }}
                              variant="contained"
                            >
                              {submittingAction === "reject" ? (
                                <Loader color="#fff" inline size="xs" />
                              ) : (
                                "Reject"
                              )}
                            </Button>
                          </Stack>
                        </>
                      ) : (
                        !hasDetailValue(savedNotes) && (
                          <Typography color="text.secondary" variant="body2">
                            No admin notes were recorded for this dispute.
                          </Typography>
                        )
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <SectionCard title="Overview">
                      <Stack spacing={2}>
                        <DetailItem label="Status" value={statusMeta?.label} />
                        <DetailItem label="Payment Status" value={formatRidePaymentStatus(row.havePaid)} />
                        <DetailItem
                          label="Fare"
                          value={formatRideCurrency(row.payment?.totalAmount ?? row.estFare)}
                        />
                        <DetailItem label="Distance" value={formatRideField(row.distance)} />
                        <DetailItem label="Passengers" value={formatRideField(row.numberOfPassenger)} />
                        <DetailItem label="Dispute Reason" value={formatRideReason(row.reasonOfDispute)} />
                        <DetailItem label="Created" value={formatTimestamp(row.createdAt)} />
                        <DetailItem label="Last Updated" value={formatRelativeDate(row.updatedAt)} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Timing">
                      <Stack spacing={2}>
                        <DetailItem label="Ride Start" value={formatTimestamp(row.rideStartTime)} />
                        <DetailItem label="Ride End" value={formatTimestamp(row.rideEndTime)} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Customer">
                      <Stack spacing={2}>
                        <DetailItem label="Full Name" value={row.customer?.fullName} />
                        <DetailItem label="Email" value={row.customer?.email} />
                        <DetailItem label="Phone" value={row.customer?.phone} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Driver">
                      <Stack spacing={2}>
                        <DetailItem label="Full Name" value={row.driver?.fullName} />
                        <DetailItem label="Email" value={row.driver?.email} />
                        <DetailItem label="Phone" value={row.driver?.phone} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Pickup">
                      <Stack spacing={2}>
                        <DetailItem label="Address" value={getRidePickupAddress(row)} />
                        <DetailItem label="Coordinates" value={formatRideCoordinates(row.from)} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Destination">
                      <Stack spacing={2}>
                        <DetailItem label="Address" value={getRideDestinationAddress(row)} />
                        <DetailItem
                          label="Coordinates"
                          value={formatRideCoordinates(row.destination)}
                        />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item xs={12}>
                    <SectionCard title="Payment">
                      <Grid container spacing={2}>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Total Amount"
                            value={formatRideCurrency(row.payment?.totalAmount ?? row.estFare)}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Driver Amount"
                            value={formatRideCurrency(getRideDriverEarning(row))}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Admin Commission"
                            value={formatRideCurrency(getRideAdminEarning(row))}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Commission Rate"
                            value={formatRideCommissionRate(row.payment?.commissionRate)}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Payment Source"
                            value={formatRideField(row.payment?.source)}
                          />
                        </Grid>
                      </Grid>
                    </SectionCard>
                  </Grid>
                </Grid>
              </>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
