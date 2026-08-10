import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
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
  messageDisputeParties,
  rejectDispute,
  resolveDispute,
  reviewDispute,
} from "../../Services/Dispute.service";
import { formatDateTime, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import {
  applyDisputeActionLocally,
  canReviewDispute,
  clampDisputeAmount,
  formatRideCurrency,
  formatRidePaymentStatus,
  formatRideReason,
  getDisputeActionErrorMessage,
  getDisputeActionId,
  getDisputeAdminNotes,
  getDisputeFromResponse,
  getDisputeSettlementCaps,
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
  const [resolution, setResolution] = useState("pay_driver");
  const [refundToCustomer, setRefundToCustomer] = useState("");
  const [payToProvider, setPayToProvider] = useState("");
  const [partyMessage, setPartyMessage] = useState("");
  const [messageTo, setMessageTo] = useState("both");
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
                paymentBreakdown:
                  disputeRow.paymentBreakdown ||
                  disputeResponse?.data?.paymentBreakdown ||
                  cached?.paymentBreakdown,
                amount:
                  disputeRow.amount ??
                  disputeResponse?.data?.amount ??
                  cached?.amount,
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
      } else if (action === "resolve") {
        const caps = getDisputeSettlementCaps(row);
        const refund = Math.min(
          Number(refundToCustomer) || 0,
          caps.maxRefundToCustomer
        );
        const pay = Math.min(Number(payToProvider) || 0, caps.maxPayToProvider);
        response = await resolveDispute(actionId, {
          resolution,
          adminNotes: adminNotes.trim() || undefined,
          refundToCustomer: refund,
          payToProvider: pay,
        });
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
        ...applyDisputeActionLocally(row, action === "resolve" ? "approve" : action, adminNotes),
        ...(updated || {}),
        adminNotes:
          getDisputeAdminNotes(updated) || adminNotes.trim() || getDisputeAdminNotes(row),
        disputeId: row.disputeId || actionId,
        rideId: row.rideId,
        status: updated?.status || (action === "reject" ? "rejected" : "resolved"),
        resolution: updated?.resolution || resolution,
      };

      storeDisputeDetail(nextRow);
      setRow(nextRow);
      toast.success(
        action === "review"
          ? "Marked under review"
          : action === "reject"
            ? "Dispute rejected"
            : "Dispute resolved"
      );
    } catch (error) {
      toast.error(getDisputeActionErrorMessage(error));
    } finally {
      setIsSubmitting(false);
      setSubmittingAction(null);
    }
  };

  const handleSendMessage = async () => {
    const actionId = getDisputeActionId(row);
    if (!actionId || !partyMessage.trim()) {
      toast.error("Enter a message to send.");
      return;
    }
    setIsSubmitting(true);
    setSubmittingAction("message");
    try {
      const response = await messageDisputeParties(actionId, {
        to: messageTo,
        message: partyMessage.trim(),
      });
      const updated = getDisputeFromResponse(response);
      if (updated) {
        const nextRow = { ...row, ...updated, disputeId: row.disputeId || actionId };
        storeDisputeDetail(nextRow);
        setRow(nextRow);
      }
      setPartyMessage("");
      toast.success("Message sent to parties");
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
  const settlementCaps = useMemo(
    () => (row ? getDisputeSettlementCaps(row) : null),
    [row]
  );

  const reasonValue = row ? formatRideReason(row.reasonOfDispute) : null;

  const detailSections = useMemo(() => {
    if (!row) {
      return [];
    }

    return [
      {
        key: "case",
        title: "Dispute case",
        items: [
          {
            label: "Type",
            value: row.disputeType
              ? String(row.disputeType).replace(/_/g, " ")
              : null,
          },
          {
            label: "Opened by",
            value:
              row.openedByRole === "customer"
                ? "Customer"
                : row.openedByRole === "chaperone"
                  ? "Driver"
                  : null,
          },
          {
            label: "Priority",
            value: row.priority || null,
          },
          {
            label: "Evidence files",
            value: Array.isArray(row.evidence) ? String(row.evidence.length) : null,
          },
          {
            label: "Amount",
            value: formatRideCurrency(row.amount ?? row.estFare),
          },
        ].filter((item) => hasDetailValue(item.value)),
      },
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
                            placeholder="Explain your decision for review or ruling"
                            value={adminNotes}
                          />
                          <FormControl fullWidth>
                            <InputLabel id="resolution-label">SOW ruling</InputLabel>
                            <Select
                              label="SOW ruling"
                              labelId="resolution-label"
                              onChange={(e) => {
                                const next = e.target.value;
                                setResolution(next);
                                const caps = getDisputeSettlementCaps(row);
                                if (next === "pay_driver") {
                                  setPayToProvider(
                                    caps.maxPayToProvider
                                      ? String(caps.maxPayToProvider)
                                      : ""
                                  );
                                  setRefundToCustomer("");
                                } else if (next === "refund_customer") {
                                  setRefundToCustomer(
                                    caps.maxRefundToCustomer
                                      ? String(caps.maxRefundToCustomer)
                                      : ""
                                  );
                                  setPayToProvider("");
                                } else if (next === "split") {
                                  setRefundToCustomer("");
                                  setPayToProvider("");
                                } else {
                                  setRefundToCustomer("");
                                  setPayToProvider("");
                                }
                              }}
                              value={resolution}
                            >
                              <MenuItem value="pay_driver">Pay provider</MenuItem>
                              <MenuItem value="refund_customer">Refund user</MenuItem>
                              <MenuItem value="split">Split settlement</MenuItem>
                              <MenuItem value="no_action">No action / close</MenuItem>
                            </Select>
                          </FormControl>
                          {settlementCaps && resolution !== "no_action" ? (
                            <Box
                              sx={{
                                bgcolor: "neutral.100",
                                borderRadius: 2,
                                px: 2,
                                py: 1.5,
                              }}
                            >
                              <Typography color="text.secondary" variant="caption">
                                Settlement caps (platform commission deducted)
                              </Typography>
                              <Typography sx={{ mt: 0.5 }} variant="body2">
                                Total fare:{" "}
                                <strong>
                                  {formatRideCurrency(settlementCaps.totalAmount)}
                                </strong>
                                {" · "}
                                Admin/platform cut (
                                {Math.round(
                                  (settlementCaps.commissionRate || 0) * 100
                                )}
                                %):{" "}
                                <strong>
                                  {formatRideCurrency(
                                    settlementCaps.platformCommission
                                  )}
                                </strong>
                                {" · "}
                                Max to rider:{" "}
                                <strong>
                                  {formatRideCurrency(
                                    settlementCaps.maxPayToProvider
                                  )}
                                </strong>
                                {" · "}
                                Max refund to customer:{" "}
                                <strong>
                                  {formatRideCurrency(
                                    settlementCaps.maxRefundToCustomer
                                  )}
                                </strong>
                              </Typography>
                            </Box>
                          ) : null}
                          {(resolution === "refund_customer" || resolution === "split") && (
                            <TextField
                              fullWidth
                              helperText={
                                settlementCaps
                                  ? `Max ${formatRideCurrency(
                                      settlementCaps.maxRefundToCustomer
                                    )} (full disputed fare)`
                                  : undefined
                              }
                              inputProps={{
                                min: 0,
                                max: settlementCaps?.maxRefundToCustomer ?? undefined,
                                step: "0.01",
                              }}
                              label="Refund to customer ($)"
                              onChange={(e) =>
                                setRefundToCustomer(
                                  clampDisputeAmount(
                                    e.target.value,
                                    settlementCaps?.maxRefundToCustomer
                                  )
                                )
                              }
                              type="number"
                              value={refundToCustomer}
                            />
                          )}
                          {(resolution === "pay_driver" || resolution === "split") && (
                            <TextField
                              fullWidth
                              helperText={
                                settlementCaps
                                  ? `Max ${formatRideCurrency(
                                      settlementCaps.maxPayToProvider
                                    )} after ${Math.round(
                                      (settlementCaps.commissionRate || 0) * 100
                                    )}% platform/admin commission`
                                  : undefined
                              }
                              inputProps={{
                                min: 0,
                                max: settlementCaps?.maxPayToProvider ?? undefined,
                                step: "0.01",
                              }}
                              label="Pay to provider / rider ($)"
                              onChange={(e) =>
                                setPayToProvider(
                                  clampDisputeAmount(
                                    e.target.value,
                                    settlementCaps?.maxPayToProvider
                                  )
                                )
                              }
                              type="number"
                              value={payToProvider}
                            />
                          )}
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
                              onClick={() => handleAction("resolve")}
                              startIcon={
                                submittingAction === "resolve" ? null : (
                                  <SvgIcon fontSize="small">
                                    <CheckCircleIcon />
                                  </SvgIcon>
                                )
                              }
                              sx={{ minHeight: 44 }}
                              variant="contained"
                            >
                              {submittingAction === "resolve" ? (
                                <Loader color="#fff" inline size="xs" />
                              ) : (
                                "Apply ruling"
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
                          <Typography color="text.secondary" variant="subtitle2">
                            Message parties
                          </Typography>
                          <FormControl fullWidth>
                            <InputLabel id="message-to-label">Send to</InputLabel>
                            <Select
                              label="Send to"
                              labelId="message-to-label"
                              onChange={(e) => setMessageTo(e.target.value)}
                              value={messageTo}
                            >
                              <MenuItem value="both">Customer &amp; driver</MenuItem>
                              <MenuItem value="customer">Customer only</MenuItem>
                              <MenuItem value="driver">Driver only</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            fullWidth
                            label="Support message"
                            minRows={2}
                            multiline
                            onChange={(e) => setPartyMessage(e.target.value)}
                            value={partyMessage}
                          />
                          <Button
                            disabled={isSubmitting || !partyMessage.trim()}
                            onClick={handleSendMessage}
                            variant="outlined"
                          >
                            {submittingAction === "message" ? (
                              <Loader color="#0288d1" inline size="xs" />
                            ) : (
                              "Send message"
                            )}
                          </Button>
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
