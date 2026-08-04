import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import { toast } from "react-toastify";
import { Box, Button, Container, Stack, SvgIcon, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import Loader from "../../components/Loader";
import { StatusBadge } from "../../components/table-cells";
import {
  DetailHero,
  DetailPageFrame,
  DetailPageState,
  DetailPanel,
  DetailRowList,
  DetailSection,
} from "../../components/detail-page/detail-page-ui";
import { getRideById } from "../../Services/Auth.service";
import {
  approveDispute,
  getDisputeById,
  rejectDispute,
  reviewDispute,
} from "../../Services/Dispute.service";
import { formatDateTime, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
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

const getTimingItems = (row) =>
  [
    { label: "Created", value: formatTimestamp(row?.createdAt) },
    { label: "Updated", value: formatRelativeDate(row?.updatedAt) },
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

  const reasonValue = row ? formatRideReason(row.reasonOfDispute) : null;

  const detailSections = useMemo(() => {
    if (!row) {
      return [];
    }

    return [
      { key: "timing", title: "Timing", items: getTimingItems(row) },
      { key: "payment", title: "Payment", items: getPaymentItems(row) },
      { key: "customer", title: "Customer", items: getPersonItems(row.customer) },
      { key: "driver", title: "Driver", items: getPersonItems(row.driver) },
      {
        key: "pickup",
        title: "Pickup",
        items: getLocationItems(getRidePickupAddress(row), formatRideCoordinates(row.from)),
      },
      {
        key: "destination",
        title: "Destination",
        items: getLocationItems(
          getRideDestinationAddress(row),
          formatRideCoordinates(row.destination)
        ),
      },
    ].filter((section) => section.items.length > 0);
  }, [row]);

  const reasonFooter = hasDetailValue(reasonValue) ? (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "neutral.200",
        borderRadius: 2,
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
  ) : null;

  return (
    <>
      <Head>
        <title>Dispute Details | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <DetailPageFrame backHref="/disputes" backLabel="Back to Disputes">
            <DetailPageState
              loading={isLoading}
              notFoundMessage="The selected dispute could not be loaded."
              notFoundTitle={!isLoading && !row ? "Dispute not found" : undefined}
            >
              {row ? (
                <Stack spacing={2.5}>
                  <DetailPanel>
                    <DetailHero
                      badge={
                        statusMeta ? (
                          <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                        ) : null
                      }
                      footer={reasonFooter}
                      stats={[
                        {
                          label: "Fare",
                          value: formatRideCurrency(row.payment?.totalAmount ?? row.estFare),
                        },
                        { label: "Payment", value: formatRidePaymentStatus(row.havePaid) },
                        { label: "Distance", value: formatRideField(row.distance) },
                        { label: "Passengers", value: formatRideField(row.numberOfPassenger) },
                      ]}
                      subtitle={`${getRideDriverName(row)} → ${getRideCustomerName(row)}`}
                      title="Dispute case"
                    />

                    <DetailSection
                      description={
                        showActions
                          ? "Add notes, then mark under review, approve, or reject."
                          : "This dispute is closed. Previous admin notes are shown below."
                      }
                      noBorder
                      title="Admin review"
                    >
                      {hasDetailValue(savedNotes) ? (
                        <Box
                          sx={{
                            bgcolor: alpha(brand.primary, 0.06),
                            border: "1px solid",
                            borderColor: alpha(brand.primary, 0.16),
                            borderRadius: 2,
                            mb: 2,
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
                        <Stack spacing={2}>
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
                        </Stack>
                      ) : (
                        !hasDetailValue(savedNotes) && (
                          <Typography color="text.secondary" variant="body2">
                            No admin notes were recorded for this dispute.
                          </Typography>
                        )
                      )}
                    </DetailSection>

                    {detailSections.map((section) => (
                      <DetailSection key={section.key} title={section.title}>
                        <DetailRowList items={section.items} />
                      </DetailSection>
                    ))}
                  </DetailPanel>
                </Stack>
              ) : null}
            </DetailPageState>
          </DetailPageFrame>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
