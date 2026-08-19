import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Container, Typography } from "@mui/material";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import { StatusBadge } from "../../components/table-cells";
import {
  DetailFieldGrid,
  DetailHero,
  DetailPageFrame,
  DetailPageState,
  DetailPanel,
  DetailSection,
} from "../../components/detail-page/detail-page-ui";
import { getRideById, getRideEvents } from "../../Services/Auth.service";
import { formatDateTime, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import {
  formatRideCommissionRate,
  formatRideCoordinates,
  formatRideCurrency,
  formatRideDurationSeconds,
  formatRideEnumLabel,
  formatRideField,
  formatRidePaymentStatus,
  formatRideReason,
  getRideAdminEarning,
  getRideCustomer,
  getRideCustomerName,
  getRideDestinationAddress,
  getRideDriver,
  getRideDriverEarning,
  getRideDriverName,
  getRideFromResponse,
  getRidePickupAddress,
  getRideScheduledLabel,
  getRideStatusMeta,
  getStoredRideDetail,
  mergeRideDetailRecords,
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

const STOP_KIND_LABELS = {
  pickup: "Pickup",
  intermediate: "Stop",
  dropoff: "Destination",
  destination: "Destination",
  final: "Destination",
};

const stopKindLabel = (kind) => STOP_KIND_LABELS[String(kind || "").toLowerCase()] || "Stop";

const formatStopState = (state) =>
  String(state || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const formatEventType = (type) =>
  String(type || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const getRideEventsList = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.events)) {
    return response.events;
  }

  return [];
};

const getRideStopsFromApi = (ride) => {
  if (!Array.isArray(ride?.stops) || !ride.stops.length) {
    return [];
  }

  return [...ride.stops].sort((a, b) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0));
};

const formatStopCoordinates = (stop) =>
  formatRideCoordinates(stop?.location || stop);

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
    if (!id) {
      return;
    }

    // Loaded separately from the ride so a missing event log (every ride booked
    // before multi-destination support) still renders the rest of the page.
    const loadEvents = async () => {
      setIsEventsLoading(true);
      try {
        const response = await getRideEvents(id, 1, 200);
        setEvents(getRideEventsList(response));
      } catch (error) {
        console.error("Error loading ride events:", error);
        setEvents([]);
      } finally {
        setIsEventsLoading(false);
      }
    };

    loadEvents();
  }, [id]);

  const statusMeta = ride ? getRideStatusMeta(ride.status) : null;
  const stops = ride ? getRideStopsFromApi(ride) : [];
  const isMultiDestination = stops.length > 2;
  const customer = ride ? getRideCustomer(ride) : null;
  const driver = ride ? getRideDriver(ride) : null;
  const scheduledLabel = ride ? getRideScheduledLabel(ride) : null;
  const payout = ride?.driverPayout;
  const waitingTotals = ride?.waitingTotals;

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
          value: formatRideDurationSeconds(waitingTotals.plannedWaitingSeconds),
          hideEmpty: true,
        },
        {
          label: "Actual Waiting",
          value: formatRideDurationSeconds(waitingTotals.actualWaitingSeconds),
          hideEmpty: true,
        },
        {
          label: "Extra Waiting",
          value: formatRideDurationSeconds(waitingTotals.extraWaitingSeconds),
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
                      { label: "Mode", value: formatRideEnumLabel(ride.mode) },
                    ]}
                    subtitle={`${getRideDriverName(ride)} → ${getRideCustomerName(ride)}`}
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
                        { label: "Status", value: formatRideEnumLabel(ride.status) },
                        {
                          label: "Passengers",
                          value: formatRideField(ride.numberOfPassenger),
                          hideEmpty: true,
                        },
                        { label: "Ride ID", value: formatRideField(ride.rideId || ride._id) },
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
                  </DetailSection>

                  {stops.length ? (
                    <DetailSection
                      title={`Stops (${stops.length})${isMultiDestination ? "" : " — single destination"}`}
                    >
                      {stops.map((stop, index) => (
                        <Box key={stop.stopId || `${stop.sequence ?? index}`} sx={{ mb: 2.5 }}>
                          <Typography sx={{ fontWeight: 600, mb: 0.75 }} variant="subtitle2">
                            {`${Number(stop.sequence ?? index) + 1}. ${stopKindLabel(stop.kind)}`}
                            {stop.state ? ` — ${formatStopState(stop.state)}` : ""}
                          </Typography>
                          <DetailFieldGrid
                            columns={{ sm: 2, lg: 3 }}
                            fields={[
                              { label: "Address", value: formatRideField(stop.address) },
                              {
                                label: "Coordinates",
                                value: formatStopCoordinates(stop),
                                hideEmpty: true,
                              },
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
                                label: "Arrived At",
                                value: formatRideTimestamp(stop.arrivedAt),
                                hideEmpty: true,
                              },
                              {
                                label: "Departed At",
                                value: formatRideTimestamp(stop.departedAt),
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
                          value: formatRideCommissionRate(ride.payment?.commissionRate),
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
                        {
                          label: "Stripe PaymentIntent",
                          value: formatRideField(ride.stripePaymentIntentId),
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
                      <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0 }}>
                        {events.map((event, index) => (
                          <Box
                            component="li"
                            key={event._id || `${event.type}-${event.serverTimestamp}-${index}`}
                            sx={{
                              borderLeft: "2px solid",
                              borderColor: "divider",
                              pb: 1.5,
                              pl: 2,
                            }}
                          >
                            <Typography sx={{ fontWeight: 600 }} variant="body2">
                              {formatEventType(event.type)}
                            </Typography>
                            <Typography color="text.secondary" variant="caption">
                              {formatRideTimestamp(event.serverTimestamp)}
                              {event.sequence != null ? ` · stop ${event.sequence}` : ""}
                              {event.actorType ? ` · ${event.actorType}` : ""}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        No recorded events. Rides booked before multi-destination support have no event
                        log.
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
