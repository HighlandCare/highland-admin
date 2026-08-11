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
  MenuItem,
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
  formatRideCoordinates,
  formatRideField,
  getRideFromResponse,
} from "../../utils/rideUtils";
import { brand } from "../../theme/colors";

const SOW_OPTIONS = [
  { value: "pay_driver", label: "Pay provider" },
  { value: "refund_customer", label: "Refund user" },
];

const selectLabelSx = {
  bgcolor: "background.paper",
  px: 0.5,
};

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

const normalizeSowResolution = (value) =>
  value === "refund_customer" ? "refund_customer" : "pay_driver";

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

  const sowResolution = normalizeSowResolution(resolution);

  const applySettlementDefaults = (disputeRow, nextResolution = "pay_driver") => {
    const caps = getDisputeSettlementCaps(disputeRow);
    const next = normalizeSowResolution(nextResolution);

    setResolution(next);

    if (next === "pay_driver") {
      setPayToProvider(caps.maxPayToProvider ? String(caps.maxPayToProvider) : "");
      setRefundToCustomer("");
      return;
    }

    setRefundToCustomer(caps.maxRefundToCustomer ? String(caps.maxRefundToCustomer) : "");
    setPayToProvider("");
  };

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
        applySettlementDefaults(cached, cached.resolution);
        setIsLoading(false);
      }

      try {
        let nextRow = cached;
        let disputeLoaded = false;

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
                disputeRow.amount ?? disputeResponse?.data?.amount ?? cached?.amount,
              settlement: disputeRow.settlement || disputeResponse?.data?.settlement || cached?.settlement,
              adminMessages:
                disputeRow.adminMessages ||
                disputeResponse?.data?.adminMessages ||
                cached?.adminMessages ||
                [],
              adminNotes:
                getDisputeAdminNotes(disputeRow) || getDisputeAdminNotes(cached) || "",
            };
          }
        } catch (error) {
          // Fall through to optional ride enrichment
        }

        const rideId = nextRow?.rideId || cached?.rideId || (!disputeLoaded ? id : null);
        if (rideId && (!nextRow?.customer || !nextRow?.driver || !nextRow?.from)) {
          try {
            const rideResponse = await getRideById(rideId);
            const rideData = getRideFromResponse(rideResponse);
            if (rideData) {
              nextRow = {
                ...(nextRow || {}),
                rideId: rideData.rideId || rideId,
                disputeId: nextRow?.disputeId || cached?.disputeId || null,
                customer: nextRow?.customer || rideData.customer,
                driver: nextRow?.driver || rideData.driver,
                from: nextRow?.from || rideData.from,
                destination: nextRow?.destination || rideData.destination,
                payment: nextRow?.payment || rideData.payment,
                estFare: nextRow?.estFare ?? rideData.estFare,
                distance: nextRow?.distance || rideData.distance,
                havePaid: nextRow?.havePaid ?? rideData.havePaid,
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
            // Keep dispute payload as-is
          }
        }

        if (active) {
          if (nextRow) {
            storeDisputeDetail(nextRow);
            setRow(nextRow);
            setAdminNotes(getDisputeAdminNotes(nextRow));
            applySettlementDefaults(nextRow, nextRow.resolution);
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
        const refund =
          sowResolution === "refund_customer"
            ? Math.min(Number(refundToCustomer) || 0, caps.maxRefundToCustomer)
            : 0;
        const pay =
          sowResolution === "pay_driver"
            ? Math.min(Number(payToProvider) || 0, caps.maxPayToProvider)
            : 0;

        response = await resolveDispute(actionId, {
          resolution: sowResolution,
          adminNotes: adminNotes.trim() || undefined,
          refundToCustomer: refund,
          payToProvider: pay,
        });
      } else if (action === "reject") {
        response = await rejectDispute(actionId, {
          adminNotes: adminNotes.trim() || undefined,
        });
      } else {
        throw new Error("Unsupported dispute action.");
      }

      const updated = getDisputeFromResponse(response);
      const nextRow = {
        ...applyDisputeActionLocally(
          row,
          action === "resolve" ? "approve" : action,
          adminNotes
        ),
        ...(updated || {}),
        adminNotes:
          getDisputeAdminNotes(updated) || adminNotes.trim() || getDisputeAdminNotes(row),
        disputeId: row.disputeId || actionId,
        rideId: row.rideId,
        status:
          updated?.status ||
          (action === "reject" ? "rejected" : action === "review" ? "under-review" : "resolved"),
        resolution: updated?.resolution || (action === "resolve" ? sowResolution : row.resolution),
        settlement: updated?.settlement || row.settlement,
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
        const nextRow = {
          ...row,
          ...updated,
          disputeId: row.disputeId || actionId,
          adminMessages: updated.adminMessages || row.adminMessages || [],
        };
        storeDisputeDetail(nextRow);
        setRow(nextRow);
      }
      setPartyMessage("");
      toast.success("Message sent");
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
  const adminMessages = Array.isArray(row?.adminMessages) ? row.adminMessages : [];

  const heroStats = useMemo(() => {
    if (!row) {
      return [];
    }

    return [
      {
        label: "Amount",
        value: formatRideCurrency(row.amount ?? row.payment?.totalAmount ?? row.estFare),
      },
      {
        label: "Payment",
        value: row.havePaid != null ? formatRidePaymentStatus(row.havePaid) : null,
      },
      { label: "Distance", value: formatRideField(row.distance) },
    ].filter((stat) => hasDetailValue(stat.value));
  }, [row]);

  const detailSections = useMemo(() => {
    if (!row) {
      return [];
    }

    const sections = [
      {
        key: "case",
        title: "Dispute case",
        items: [
          {
            label: "Type",
            value: row.disputeType ? String(row.disputeType).replace(/_/g, " ") : null,
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
          { label: "Priority", value: row.priority || null },
          {
            label: "Evidence files",
            value: Array.isArray(row.evidence) && row.evidence.length ? String(row.evidence.length) : null,
          },
          {
            label: "Amount",
            value: formatRideCurrency(row.amount ?? row.payment?.totalAmount ?? row.estFare),
          },
          {
            label: "Resolution",
            value: row.resolution
              ? String(row.resolution).replace(/_/g, " ")
              : null,
          },
        ].filter((item) => hasDetailValue(item.value)),
      },
      {
        key: "timing",
        title: "Timing",
        items: [
          { label: "Created", value: formatTimestamp(row.createdAt) },
          { label: "Updated", value: formatRelativeDate(row.updatedAt) },
        ].filter((item) => hasDetailValue(item.value)),
      },
      {
        key: "settlement",
        title: "Settlement",
        items: [
          {
            label: "Refund to customer",
            value: formatRideCurrency(row.settlement?.refundToCustomer),
          },
          {
            label: "Pay to provider",
            value: formatRideCurrency(row.settlement?.payToProvider),
          },
          {
            label: "Platform commission",
            value: formatRideCurrency(
              row.settlement?.platformCommission ?? row.paymentBreakdown?.platformCommission
            ),
          },
        ].filter((item) => hasDetailValue(item.value)),
      },
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
    ];

    return sections.filter((section) => section.items.length > 0);
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
                      stats={heroStats}
                      subtitle={`${getRideDriverName(row)} → ${getRideCustomerName(row)}`}
                      title="Dispute case"
                    />

                    <DetailSection
                      description={
                        showActions
                          ? "Review notes, apply a SOW ruling, or reject this dispute."
                          : "This dispute is closed. Saved notes and settlement details are shown below."
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

                          <TextField
                            fullWidth
                            InputLabelProps={{ sx: selectLabelSx }}
                            label="SOW ruling"
                            onChange={(event) =>
                              applySettlementDefaults(row, event.target.value)
                            }
                            select
                            value={sowResolution}
                          >
                            {SOW_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </TextField>

                          {settlementCaps?.totalAmount ? (
                            <Box
                              sx={{
                                bgcolor: "neutral.100",
                                borderRadius: 2,
                                px: 2,
                                py: 1.5,
                              }}
                            >
                              <Typography color="text.secondary" variant="caption">
                                Settlement caps
                              </Typography>
                              <Typography sx={{ mt: 0.5 }} variant="body2">
                                Total:{" "}
                                <strong>{formatRideCurrency(settlementCaps.totalAmount)}</strong>
                                {" · "}
                                Max to provider:{" "}
                                <strong>
                                  {formatRideCurrency(settlementCaps.maxPayToProvider)}
                                </strong>
                                {" · "}
                                Max refund:{" "}
                                <strong>
                                  {formatRideCurrency(settlementCaps.maxRefundToCustomer)}
                                </strong>
                              </Typography>
                            </Box>
                          ) : null}

                          {sowResolution === "refund_customer" ? (
                            <TextField
                              fullWidth
                              helperText={
                                settlementCaps
                                  ? `Max ${formatRideCurrency(settlementCaps.maxRefundToCustomer)}`
                                  : undefined
                              }
                              inputProps={{
                                min: 0,
                                max: settlementCaps?.maxRefundToCustomer ?? undefined,
                                step: "0.01",
                              }}
                              label="Refund to customer ($)"
                              onChange={(event) =>
                                setRefundToCustomer(
                                  clampDisputeAmount(
                                    event.target.value,
                                    settlementCaps?.maxRefundToCustomer
                                  )
                                )
                              }
                              type="number"
                              value={refundToCustomer}
                            />
                          ) : (
                            <TextField
                              fullWidth
                              helperText={
                                settlementCaps
                                  ? `Max ${formatRideCurrency(settlementCaps.maxPayToProvider)}`
                                  : undefined
                              }
                              inputProps={{
                                min: 0,
                                max: settlementCaps?.maxPayToProvider ?? undefined,
                                step: "0.01",
                              }}
                              label="Pay to provider ($)"
                              onChange={(event) =>
                                setPayToProvider(
                                  clampDisputeAmount(
                                    event.target.value,
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
                          <TextField
                            fullWidth
                            InputLabelProps={{ sx: selectLabelSx }}
                            label="Send to"
                            onChange={(event) => setMessageTo(event.target.value)}
                            select
                            value={messageTo}
                          >
                            <MenuItem value="both">Customer &amp; driver</MenuItem>
                            <MenuItem value="customer">Customer only</MenuItem>
                            <MenuItem value="driver">Driver only</MenuItem>
                          </TextField>
                          <TextField
                            fullWidth
                            label="Support message"
                            minRows={2}
                            multiline
                            onChange={(event) => setPartyMessage(event.target.value)}
                            placeholder="Message for customer and/or driver"
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

                    {adminMessages.length ? (
                      <DetailSection title="Admin messages">
                        <Stack spacing={1.5}>
                          {adminMessages.map((message, index) => (
                            <Box
                              key={message._id || message.id || `message-${index}`}
                              sx={{
                                border: "1px solid",
                                borderColor: "neutral.200",
                                borderRadius: 2,
                                px: 2,
                                py: 1.5,
                              }}
                            >
                              <Typography color="text.secondary" variant="caption">
                                {[
                                  message.to ? `To: ${message.to}` : null,
                                  formatTimestamp(message.createdAt),
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || "Message"}
                              </Typography>
                              <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap" }} variant="body2">
                                {message.message || message.body || "—"}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </DetailSection>
                    ) : null}

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
