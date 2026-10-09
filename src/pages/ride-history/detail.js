import { useEffect, useState } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import { StatusBadge } from "../../components/table-cells";
import { Scrollbar } from "../../components/scrollbar";
import {
  DetailFieldGrid,
  DetailHero,
  DetailPageFrame,
  DetailPageState,
  DetailPanel,
  DetailSection,
} from "../../components/detail-page/detail-page-ui";
import { getRideById, getRideEvents } from "../../Services/Auth.service";

const RideRouteMap = dynamic(
  () => import("../../components/detail-page/ride-route-map").then((mod) => mod.RideRouteMap),
  { ssr: false }
);
import { formatDateTime, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import {
  formatRideCommissionRate,
  formatRideCurrency,
  formatRideDurationSeconds,
  formatRideEnumLabel,
  formatPausePointLabel,
  formatRideEventLabel,
  formatRideField,
  formatRidePaymentStatus,
  formatRideReason,
  getRideAdminEarning,
  getRideCustomer,
  getRideDestinationAddress,
  getRideDriver,
  getRideDriverEarning,
  getRideFromResponse,
  getRideLifecycleEvents,
  getRidePickupAddress,
  getRideScheduledLabel,
  getRideStatusMeta,
  getRideStops,
  getStoredRideDetail,
  mergeRideDetailRecords,
  normalizeWaitingTotals,
  sortRideLifecycleEvents,
  storeRideDetail,
} from "../../utils/rideUtils";

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

const formatStopState = (state) =>
  String(state || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const formatRideTimestamp = (value) => {
  if (!value || value === "false") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const formatted = formatRideField(value);
    return formatted === "—" ? null : formatted;
  }

  const formatted = formatDateTime(value);
  return formatted === "—" ? null : formatted;
};

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [ride, setRide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [isEventsLoading, setIsEventsLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadRide = async () => {
      setIsLoading(true);

      const cached = getStoredRideDetail(id);
      if (cached) {
        setRide(cached);
      }

      try {
        const response = await getRideById(id);
        const rideData = getRideFromResponse(response);

        if (rideData) {
          const merged = mergeRideDetailRecords(cached, rideData);
          setRide(merged);
          storeRideDetail(merged);
        } else if (!cached) {
          setRide(null);
        }
      } catch (error) {
        console.error("Error loading ride details:", error);

        if (!cached) {
          setRide(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadRide();
  }, [id]);

  useEffect(() => {
    if (!id || isLoading || !ride) {
      return;
    }

    const isFood =
      ride.recordType === "food_order" || ride.type === "food_order" || ride.category === "food";

    if (isFood) {
      setEvents([]);
      setIsEventsLoading(false);
      return;
    }

    // Prefer events embedded on the booking detail payload; fall back to the
    // legacy events endpoint when the key is absent (older API / cached rows).
    if (Array.isArray(ride.events)) {
      setEvents(sortRideLifecycleEvents(ride.events));
      setIsEventsLoading(false);
      return;
    }

    let cancelled = false;

    const loadEvents = async () => {
      setIsEventsLoading(true);
      try {
        const response = await getRideEvents(id, 1, 500);
        if (!cancelled) {
          setEvents(sortRideLifecycleEvents(getRideLifecycleEvents(response)));
        }
      } catch (error) {
        console.error("Error loading ride events:", error);
        if (!cancelled) {
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setIsEventsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [id, isLoading, ride]);

  const statusMeta = ride ? getRideStatusMeta(ride.status) : null;
  const stops = ride ? getRideStops(ride) : [];
  const isMultiDestination = stops.length > 0;
  const customer = ride ? getRideCustomer(ride) : null;
  const driver = ride ? getRideDriver(ride) : null;
  const scheduledLabel = ride ? getRideScheduledLabel(ride) : null;
  const payout = ride?.driverPayout;
  const waitingTotals = normalizeWaitingTotals(ride?.waitingTotals);
  const adjustments = Array.isArray(ride?.adjustments) ? ride.adjustments : [];
  const pricingTimeline = ride?.pricingTimeline;

  const scheduleFields = ride
    ? [
        {
          label: "Scheduled At",
          value: formatRideTimestamp(scheduledLabel) || (hasDetailValue(scheduledLabel) ? scheduledLabel : null),
          hideEmpty: true,
        },
        { label: "Pre Date", value: formatRideField(ride.pre_date), hideEmpty: true },
        { label: "Pre Time", value: formatRideField(ride.pre_time), hideEmpty: true },
        { label: "Ride Start Time", value: formatRideTimestamp(ride.rideStartTime), hideEmpty: true },
        { label: "Ride End Time", value: formatRideTimestamp(ride.rideEndTime), hideEmpty: true },
        { label: "Created At", value: formatRideTimestamp(ride.createdAt) },
        { label: "Updated At", value: formatRelativeDate(ride.updatedAt), hideEmpty: true },
        { label: "Cancel Reason", value: formatRideReason(ride.reasonOfCancel), hideEmpty: true },
        { label: "Dispute Reason", value: formatRideReason(ride.reasonOfDispute), hideEmpty: true },
      ].filter((field) => !field.hideEmpty || hasDetailValue(field.value))
    : [];

  const waitingFields = waitingTotals
    ? [
        {
          label: "Planned Waiting",
          value: formatRideDurationSeconds(waitingTotals.plannedSeconds),
          hideEmpty: true,
        },
        {
          label: "Actual Waiting",
          value: formatRideDurationSeconds(waitingTotals.actualSeconds),
          hideEmpty: true,
        },
        {
          label: "Extra Waiting",
          value: formatRideDurationSeconds(waitingTotals.extraSeconds),
          hideEmpty: true,
        },
        {
          label: "Unused Waiting",
          value: formatRideDurationSeconds(waitingTotals.unusedSeconds),
          hideEmpty: true,
        },
      ].filter((field) => !field.hideEmpty || hasDetailValue(field.value))
    : [];

  return (
    <>
      <Head>
        <title>Ride Details | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <DetailPageFrame backHref="/ride-history" backLabel="Back to Ride History">
            <DetailPageState
              loading={isLoading}
              notFoundMessage="The selected ride could not be loaded."
              notFoundTitle={!isLoading && !ride ? "Ride not found" : undefined}
            >
              {ride ? (
                <DetailPanel>
                  <DetailHero
                    badge={
                      statusMeta ? (
                        <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                      ) : null
                    }
                    stats={[
                      { label: "Estimated Fare", value: formatRideCurrency(ride.estFare) },
                      { label: "Admin Earned", value: formatRideCurrency(ride.adminEarned) },
                      {
                        label: "Payment",
                        value: formatRidePaymentStatus(ride.havePaid, ride.paymentStatus),
                      },
                      { label: "Distance", value: formatRideField(ride.distance) },
                      // { label: "Mode", value: formatRideEnumLabel(ride.mode) },
                    ]}
                    subtitle={`${driver?.fullName || driver?.name || "Unassigned"} → ${customer?.fullName || customer?.name || "—"}`}
                    title="Ride Details"
                  />

                  <DetailSection noBorder title="Overview">
                    <DetailFieldGrid
                      fields={[
                        {
                          label: "Booking",
                          value: formatRideField(ride.bookingLabel),
                          hideEmpty: true,
                        },
                        { label: "Type", value: formatRideEnumLabel(ride.type) },
                        { label: "Category", value: formatRideEnumLabel(ride.category), hideEmpty: true },
                        { label: "Mode", value: formatRideEnumLabel(ride.mode), hideEmpty: true },
                        {
                          label: "Pricing Mode",
                          value: formatRideEnumLabel(ride.pricingMode),
                          hideEmpty: true,
                        },
                        { label: "Status", value: formatRideEnumLabel(ride.status) },
                        {
                          label: "Test Ride",
                          value:
                            ride.isTestRide === true
                              ? "Yes"
                              : ride.isTestRide === false
                                ? "No"
                                : null,
                          hideEmpty: true,
                        },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Schedule & Timing">
                    <DetailFieldGrid
                      fields={
                        scheduleFields.length
                          ? scheduleFields
                          : [{ label: "Created At", value: formatRideTimestamp(ride.createdAt) }]
                      }
                    />
                  </DetailSection>

                  <DetailSection title="People">
                    <DetailFieldGrid
                      columns={{ sm: 2, lg: 2 }}
                      fields={[
                        {
                          label: "Customer Name",
                          value: customer?.fullName || customer?.name || null,
                          hideEmpty: true,
                        },
                        { label: "Customer Email", value: customer?.email || null, hideEmpty: true },
                        { label: "Customer Phone", value: customer?.phone || null, hideEmpty: true },
                        {
                          label: "Driver Name",
                          value: driver?.fullName || driver?.name || "Unassigned",
                        },
                        { label: "Driver Email", value: driver?.email || null, hideEmpty: true },
                        { label: "Driver Phone", value: driver?.phone || null, hideEmpty: true },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Route">
                    <DetailFieldGrid
                      columns={{ sm: 2, lg: 2 }}
                      fields={[
                        { label: "Pickup Address", value: getRidePickupAddress(ride) },
                        { label: "Destination Address", value: getRideDestinationAddress(ride) },
                      ]}
                    />
                    {waitingFields.length ? (
                      <Box sx={{ mt: 3 }}>
                        <DetailFieldGrid columns={{ sm: 2, lg: 3 }} fields={waitingFields} />
                      </Box>
                    ) : null}
                    <Box sx={{ mt: 3 }}>
                      <RideRouteMap ride={ride} />
                    </Box>
                  </DetailSection>

                  {stops.length ? (
                    <DetailSection
                      title={`Pause Points (${stops.length})`}
                    >
                      {stops.map((stop, index) => (
                        <Box key={stop.stopId || `${stop.sequence ?? index}`} sx={{ mb: 2.5 }}>
                          <Typography sx={{ fontWeight: 600, mb: 0.75 }} variant="subtitle2">
                            {formatPausePointLabel(index)}
                            {stop.state ? ` — ${formatStopState(stop.state)}` : ""}
                          </Typography>
                          <DetailFieldGrid
                            columns={{ sm: 2, lg: 3 }}
                            fields={[
                              { label: "Address", value: formatRideField(stop.address) },
                              {
                                label: "Planned Waiting",
                                value: formatRideDurationSeconds(stop.plannedWaitingSeconds),
                                hideEmpty: true,
                              },
                              {
                                label: "Actual Waiting",
                                value: formatRideDurationSeconds(stop.actualWaitingSeconds),
                                hideEmpty: true,
                              },
                              {
                                label: "Extra Waiting",
                                value: formatRideDurationSeconds(stop.extraWaitingSeconds),
                                hideEmpty: true,
                              },
                              {
                                label: "Approaching At",
                                value: formatRideTimestamp(stop.approachingAt),
                                hideEmpty: true,
                              },
                              {
                                label: "Arrived At",
                                value: formatRideTimestamp(stop.arrivedAt),
                                hideEmpty: true,
                              },
                              {
                                label: "Waiting Started",
                                value: formatRideTimestamp(stop.waitingStartedAt),
                                hideEmpty: true,
                              },
                              {
                                label: "Waiting Ended",
                                value: formatRideTimestamp(stop.waitingEndedAt),
                                hideEmpty: true,
                              },
                              {
                                label: "Departed At",
                                value: formatRideTimestamp(stop.departedAt),
                                hideEmpty: true,
                              },
                              {
                                label: "Completed At",
                                value: formatRideTimestamp(stop.completedAt),
                                hideEmpty: true,
                              },
                              {
                                label: "Skip Reason",
                                value: formatRideField(stop.skipReason),
                                hideEmpty: true,
                              },
                            ].filter((field) => !field.hideEmpty || hasDetailValue(field.value))}
                          />
                        </Box>
                      ))}
                      {isMultiDestination ? (
                        <Typography color="text.secondary" variant="caption">
                          Extra waiting time is recorded for review only. The customer paid the amount
                          authorized before the ride.
                        </Typography>
                      ) : null}
                    </DetailSection>
                  ) : null}

                  {adjustments.length ? (
                    <DetailSection title={`Waiting Adjustments (${adjustments.length})`}>
                      {adjustments.map((adjustment, index) => (
                        <Box
                          key={adjustment.adjustmentId || `${adjustment.sequence ?? index}`}
                          sx={{ mb: 2.5 }}
                        >
                          <Typography sx={{ fontWeight: 600, mb: 0.75 }} variant="subtitle2">
                            {formatRideEnumLabel(adjustment.type) || `Adjustment ${index + 1}`}
                            {adjustment.status ? ` — ${formatRideEnumLabel(adjustment.status)}` : ""}
                          </Typography>
                          <DetailFieldGrid
                            columns={{ sm: 2, lg: 3 }}
                            fields={[
                              {
                                label: "Planned",
                                value: formatRideDurationSeconds(adjustment.plannedSeconds),
                                hideEmpty: true,
                              },
                              {
                                label: "Actual",
                                value: formatRideDurationSeconds(adjustment.actualSeconds),
                                hideEmpty: true,
                              },
                              {
                                label: "Delta",
                                value: formatRideDurationSeconds(adjustment.deltaSeconds),
                                hideEmpty: true,
                              },
                              {
                                label: "Indicative Amount",
                                value:
                                  adjustment.indicativeAmountCents != null
                                    ? formatRideCurrency(Number(adjustment.indicativeAmountCents) / 100)
                                    : null,
                                hideEmpty: true,
                              },
                              {
                                label: "Charged",
                                value:
                                  adjustment.charged === true
                                    ? "Yes"
                                    : adjustment.charged === false
                                      ? "No"
                                      : null,
                                hideEmpty: true,
                              },
                              {
                                label: "Created At",
                                value: formatRideTimestamp(adjustment.createdAt),
                                hideEmpty: true,
                              },
                            ].filter((field) => !field.hideEmpty || hasDetailValue(field.value))}
                          />
                        </Box>
                      ))}
                      <Typography color="text.secondary" variant="caption">
                        Adjustments are recorded for review only and are not charged to the customer.
                      </Typography>
                    </DetailSection>
                  ) : null}

                  <DetailSection title="Payment">
                    <DetailFieldGrid
                      fields={[
                        {
                          label: "Total Amount",
                          value: formatRideCurrency(ride.payment?.totalAmount),
                        },
                        {
                          label: "Locked Fare",
                          value: formatRideCurrency(ride.lockedFare),
                          hideEmpty: true,
                        },
                        {
                          label: "Driver Amount",
                          value: formatRideCurrency(getRideDriverEarning(ride)),
                        },
                        {
                          label: "Admin Commission",
                          value: formatRideCurrency(getRideAdminEarning(ride)),
                        },
                        {
                          label: "Commission Rate",
                          value: formatRideCommissionRate(
                            ride.payment?.commissionPercent ??
                              ride.payment?.commissionRate ??
                              ride.commissionPercent ??
                              ride.commissionRate
                          ),
                        },
                        {
                          label: "Tip",
                          value: formatRideCurrency(ride.tip),
                          hideEmpty: true,
                        },
                        {
                          label: "Payment Status",
                          value: formatRidePaymentStatus(ride.havePaid, ride.paymentStatus),
                        },
                        {
                          label: "Payment Source",
                          value: formatRideEnumLabel(ride.payment?.source),
                          hideEmpty: true,
                        },
                        {
                          label: "Currency",
                          value: formatRideField(ride.pricing?.currency)?.toUpperCase(),
                          hideEmpty: true,
                        },
                        {
                          label: "Quoted At",
                          value: formatRideTimestamp(
                            pricingTimeline?.quotedAt || ride.pricing?.quotedAt
                          ),
                          hideEmpty: true,
                        },
                        {
                          label: "Locked At",
                          value: formatRideTimestamp(
                            pricingTimeline?.lockedAt || ride.pricing?.lockedAt
                          ),
                          hideEmpty: true,
                        },
                        {
                          label: "Authorized At",
                          value: formatRideTimestamp(ride.authorizedAt),
                          hideEmpty: true,
                        },
                        {
                          label: "Captured At",
                          value: formatRideTimestamp(ride.paidAt),
                          hideEmpty: true,
                        },
                        {
                          label: "Refunded At",
                          value: formatRideTimestamp(ride.refundedAt),
                          hideEmpty: true,
                        },
                      ].filter((field) => !field.hideEmpty || hasDetailValue(field.value))}
                    />
                  </DetailSection>

                  {payout ? (
                    <DetailSection title="Driver Payout">
                      <DetailFieldGrid
                        fields={[
                          { label: "Amount", value: formatRideCurrency(payout.amount) },
                          {
                            label: "Status",
                            value: formatRideEnumLabel(payout.status),
                            hideEmpty: true,
                          },
                          {
                            label: "Attempted At",
                            value: formatRideTimestamp(payout.attemptedAt),
                            hideEmpty: true,
                          },
                          {
                            label: "Paid At",
                            value: formatRideTimestamp(payout.paidAt),
                            hideEmpty: true,
                          },
                          {
                            label: "Error",
                            value: formatRideField(payout.error),
                            hideEmpty: true,
                          },
                        ]}
                      />
                    </DetailSection>
                  ) : null}

                  <DetailSection title="Timeline">
                    {isEventsLoading ? (
                      <Typography color="text.secondary" variant="body2">
                        Loading timeline…
                      </Typography>
                    ) : events.length ? (
                      <>
                        {ride.eventsTruncated ||
                        (ride.eventCount != null && Number(ride.eventCount) > events.length) ? (
                          <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="caption">
                            Showing {events.length} of {ride.eventCount ?? events.length} events
                            {ride.eventsTruncated ? " (truncated)" : ""}.
                          </Typography>
                        ) : null}
                        <Box
                          sx={{
                            border: "1px solid",
                            borderColor: "neutral.200",
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <Scrollbar sx={{ maxHeight: 320 }}>
                            <Box sx={{ minWidth: { xs: 360, md: "100%" } }}>
                              <Table size="small" stickyHeader>
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Event</TableCell>
                                    <TableCell>Time</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {events.map((event, index) => (
                                    <TableRow
                                      hover
                                      key={
                                        event.eventId ||
                                        event._id ||
                                        `${event.type}-${event.serverTimestamp}-${index}`
                                      }
                                    >
                                      <TableCell>
                                        <Typography fontWeight={600} variant="body2">
                                          {formatRideEventLabel(event, ride)}
                                        </Typography>
                                      </TableCell>
                                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                                        {formatRideTimestamp(event.serverTimestamp) || "—"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Scrollbar>
                        </Box>
                      </>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        No recorded events. Legacy rides often have an empty event log.
                      </Typography>
                    )}
                  </DetailSection>
                </DetailPanel>
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
