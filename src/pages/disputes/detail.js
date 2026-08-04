import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import ClockIcon from "@heroicons/react/24/outline/ClockIcon";
import CreditCardIcon from "@heroicons/react/24/outline/CreditCardIcon";
import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import MapPinIcon from "@heroicons/react/24/outline/MapPinIcon";
import UserIcon from "@heroicons/react/24/outline/UserIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
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
import { getRideById } from "../../Services/Auth.service";
import {
  approveDispute,
  getDisputeById,
  rejectDispute,
  reviewDispute,
} from "../../Services/Dispute.service";
import { formatDateTime, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../../utils/pageLayout";
import {
  applyDisputeActionLocally,
  canReviewDispute,
  formatRideCurrency,
  formatRidePaymentStatus,
  formatRideReason,
  getDisputeActionErrorMessage,
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

const formatTimestamp = (value) => {
  if (!value || value === "false" || typeof value === "object") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatDateTime(value);
};

const hasUsableTimestamp = (value) => Boolean(formatTimestamp(value));

const MetaChip = ({ label, value }) => {
  if (!hasDetailValue(value)) {
    return null;
  }

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "neutral.200",
        borderRadius: 2,
        minWidth: 120,
        px: 1.75,
        py: 1.25,
      }}
    >
      <Typography color="text.secondary" sx={{ display: "block", mb: 0.25 }} variant="caption">
        {label}
      </Typography>
      <Typography fontWeight={700} sx={{ wordBreak: "break-word" }} variant="body2">
        {value}
      </Typography>
    </Box>
  );
};

const DetailRow = ({ label, value }) => {
  const isEmail = label === "Email" || (typeof value === "string" && value.includes("@"));
  if (!hasDetailValue(value)) {
    return null;
  }

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      spacing={2}
      sx={{
        borderBottom: "1px solid",
        borderColor: "neutral.100",
        py: 1.25,
        "&:last-child": { borderBottom: "none", pb: 0 },
        "&:first-of-type": { pt: 0 },
      }}
    >
      <Typography color="text.secondary" sx={{ flexShrink: 0 }} variant="body2">
        {label}
      </Typography>
      <Typography
        data-email={isEmail ? "true" : undefined}
        fontWeight={600}
        sx={{
          textAlign: "right",
          wordBreak: "break-word",
          ...(isEmail ? { textTransform: "lowercase" } : {}),
        }}
        variant="body2"
      >
        {isEmail ? String(value).toLowerCase() : value}
      </Typography>
    </Stack>
  );
};

const SectionCard = ({ children, icon: Icon, title }) => (
  <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none", height: "100%" }}>
    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
      <Stack alignItems="center" direction="row" spacing={1} sx={{ mb: 1.5 }}>
        {Icon ? (
          <Box
            sx={{
              alignItems: "center",
              bgcolor: alpha(brand.primary, 0.08),
              borderRadius: 1.5,
              color: "primary.main",
              display: "flex",
              height: 32,
              justifyContent: "center",
              width: 32,
            }}
          >
            <SvgIcon fontSize="small">
              <Icon />
            </SvgIcon>
          </Box>
        ) : null}
        <Typography fontWeight={700} variant="subtitle1">
          {title}
        </Typography>
      </Stack>
      {children}
    </CardContent>
  </Card>
);

const getTimingItems = (row) =>
  [
    { label: "Ride Start", value: formatTimestamp(row?.rideStartTime) },
    { label: "Ride End", value: formatTimestamp(row?.rideEndTime) },
  ].filter((item) => hasDetailValue(item.value));

const getPaymentItems = (row) =>
  [
    {
      label: "Total Amount",
      value: formatRideCurrency(row?.payment?.totalAmount ?? row?.estFare),
    },
    {
      label: "Driver Amount",
      value: formatRideCurrency(getRideDriverEarning(row)),
    },
    {
      label: "Admin Commission",
      value: formatRideCurrency(getRideAdminEarning(row)),
    },
    {
      label: "Commission Rate",
      value: formatRideCommissionRate(row?.payment?.commissionRate),
    },
    {
      label: "Payment Source",
      value: formatRideField(row?.payment?.source),
    },
  ].filter((item) => hasDetailValue(item.value));

const getPersonItems = (person) =>
  [
    { label: "Full Name", value: person?.fullName },
    { label: "Email", value: person?.email },
    { label: "Phone", value: person?.phone },
  ].filter((item) => hasDetailValue(item.value));

const getLocationItems = (address, coordinates) =>
  [
    { label: "Address", value: address },
    { label: "Coordinates", value: coordinates },
  ].filter((item) => hasDetailValue(item.value));

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
        let disputeLoaded = false;

        if (cached?.disputeId || id) {
          try {
            const disputeResponse = await getDisputeById(cached?.disputeId || id);
            const disputeRow = getDisputeFromResponse(disputeResponse);
            if (disputeRow) {
              disputeLoaded = true;
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
                  getDisputeAdminNotes(disputeRow) || getDisputeAdminNotes(cached) || "",
              };
            }
          } catch (error) {
            // Fall through to ride lookup
          }
        }

        const rideId = nextRow?.rideId || cached?.rideId || (!disputeLoaded ? id : null);
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
                reasonOfDispute: nextRow?.reasonOfDispute || rideData.reasonOfDispute || "",
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
          getDisputeAdminNotes(updated) || adminNotes.trim() || getDisputeAdminNotes(row),
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
      toast.error(getDisputeActionErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  const statusMeta = row ? getDisputeStatusMeta(row.status) : null;
  const showActions = canReviewDispute(row);
  const savedNotes = row ? getDisputeAdminNotes(row) : "";

  const sections = useMemo(() => {
    if (!row) {
      return [];
    }

    return [
      { key: "timing", title: "Timing", icon: ClockIcon, items: getTimingItems(row) },
      { key: "payment", title: "Payment", icon: CreditCardIcon, items: getPaymentItems(row) },
      {
        key: "customer",
        title: "Customer",
        icon: UserIcon,
        items: getPersonItems(row.customer),
      },
      {
        key: "driver",
        title: "Driver",
        icon: UserIcon,
        items: getPersonItems(row.driver),
      },
      {
        key: "pickup",
        title: "Pickup",
        icon: MapPinIcon,
        items: getLocationItems(getRidePickupAddress(row), formatRideCoordinates(row.from)),
      },
      {
        key: "destination",
        title: "Destination",
        icon: MapPinIcon,
        items: getLocationItems(
          getRideDestinationAddress(row),
          formatRideCoordinates(row.destination)
        ),
      },
    ].filter((section) => section.items.length > 0);
  }, [row]);

  const fareValue = row
    ? formatRideCurrency(row.payment?.totalAmount ?? row.estFare)
    : null;
  const reasonValue = row ? formatRideReason(row.reasonOfDispute) : null;
  const createdValue = row ? formatTimestamp(row.createdAt) : null;
  const updatedValue = row ? formatRelativeDate(row.updatedAt) : null;
  const distanceValue = row ? formatRideField(row.distance) : null;
  const passengersValue = row ? formatRideField(row.numberOfPassenger) : null;
  const paymentStatusValue = row ? formatRidePaymentStatus(row.havePaid) : null;

  return (
    <>
      <Head>
        <title>Dispute Details | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={2.5}>
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
                      background: `linear-gradient(135deg, ${alpha(brand.primary, 0.08)} 0%, ${alpha(
                        brand.secondary,
                        0.04
                      )} 100%)`,
                      borderBottom: "1px solid",
                      borderColor: "neutral.200",
                      px: { xs: 2.5, md: 3 },
                      py: { xs: 2.5, md: 3 },
                    }}
                  >
                    <Stack
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ ...pageTitleSx, mb: 0.75 }} variant="h4">
                          Dispute case
                        </Typography>
                        <Typography color="text.secondary" variant="body1">
                          {getRideDriverName(row)}
                          <Box component="span" sx={{ color: "text.disabled", mx: 1 }}>
                            →
                          </Box>
                          {getRideCustomerName(row)}
                        </Typography>
                      </Box>
                      {statusMeta ? (
                        <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                      ) : null}
                    </Stack>

                    {hasDetailValue(reasonValue) ? (
                      <Box
                        sx={{
                          bgcolor: "background.paper",
                          border: "1px solid",
                          borderColor: "neutral.200",
                          borderRadius: 2,
                          mt: 2.5,
                          px: 2,
                          py: 1.5,
                        }}
                      >
                        <Typography color="text.secondary" variant="caption">
                          Dispute reason
                        </Typography>
                        <Typography fontWeight={600} sx={{ mt: 0.5 }} variant="body1">
                          {reasonValue}
                        </Typography>
                      </Box>
                    ) : null}

                    <Stack direction="row" flexWrap="wrap" gap={1.25} sx={{ mt: 2 }}>
                      <MetaChip label="Fare" value={fareValue} />
                      <MetaChip label="Payment" value={paymentStatusValue} />
                      <MetaChip label="Distance" value={distanceValue} />
                      <MetaChip label="Passengers" value={passengersValue} />
                      <MetaChip label="Created" value={createdValue} />
                      <MetaChip label="Updated" value={updatedValue} />
                    </Stack>
                  </Box>
                </Card>

                <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                  <CardContent sx={{ p: { xs: 2.5, md: 3 }, "&:last-child": { pb: { xs: 2.5, md: 3 } } }}>
                    <Stack spacing={2}>
                      <Box>
                        <Typography fontWeight={700} variant="h6">
                          Admin review
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                          {showActions
                            ? "Add notes, then mark under review, approve, or reject."
                            : "This dispute is closed. Previous admin notes are shown below."}
                        </Typography>
                      </Box>

                      {hasDetailValue(savedNotes) ? (
                        <Box
                          sx={{
                            bgcolor: alpha(brand.primary, 0.06),
                            border: "1px solid",
                            borderColor: alpha(brand.primary, 0.16),
                            borderRadius: 2,
                            px: 2,
                            py: 1.5,
                          }}
                        >
                          <Typography color="text.secondary" sx={{ mb: 0.5 }} variant="caption">
                            Saved notes
                          </Typography>
                          <Typography
                            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                            variant="body2"
                          >
                            {savedNotes}
                          </Typography>
                        </Box>
                      ) : null}

                      {showActions ? (
                        <>
                          <TextField
                            fullWidth
                            label="Admin notes"
                            minRows={3}
                            multiline
                            onChange={(event) => setAdminNotes(event.target.value)}
                            placeholder="Explain your decision for review, approval, or rejection"
                            value={adminNotes}
                          />
                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
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
                                minHeight: 44,
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
                                "Mark under review"
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
                              sx={{ minHeight: 44 }}
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
                              sx={{ minHeight: 44 }}
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

                {sections.length ? (
                  <Grid container spacing={2}>
                    {sections.map((section) => (
                      <Grid item key={section.key} md={6} xs={12}>
                        <SectionCard icon={section.icon} title={section.title}>
                          <Stack>
                            {section.items.map((item, index) => (
                              <Box key={item.label}>
                                {index > 0 ? <Divider /> : null}
                                <DetailRow label={item.label} value={item.value} />
                              </Box>
                            ))}
                          </Stack>
                        </SectionCard>
                      </Grid>
                    ))}
                  </Grid>
                ) : null}
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
