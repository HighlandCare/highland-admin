import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Container } from "@mui/material";
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
import { RideRouteStops } from "../../components/detail-page/ride-route-stops";
import { getRideById } from "../../Services/Auth.service";
import { formatDateTime, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import {
  formatRideCommissionRate,
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
  getRideStops,
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

  const statusMeta = ride ? getRideStatusMeta(ride.status) : null;
  const customer = ride ? getRideCustomer(ride) : null;
  const driver = ride ? getRideDriver(ride) : null;
  const scheduledLabel = ride ? getRideScheduledLabel(ride) : null;
  const stops = ride ? getRideStops(ride) : [];
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
                    {waitingFields.length && !stops.length ? (
                      <Box sx={{ mt: 3 }}>
                        <DetailFieldGrid columns={{ sm: 2, lg: 3 }} fields={waitingFields} />
                      </Box>
                    ) : null}
                  </DetailSection>

                  {stops.length ? (
                    <DetailSection title="Stops">
                      <RideRouteStops stops={stops} />
                      {waitingFields.length ? (
                        <Box sx={{ mt: 3 }}>
                          <DetailFieldGrid columns={{ sm: 2, lg: 3 }} fields={waitingFields} />
                        </Box>
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
                          label: "Paid At",
                          value: formatRideTimestamp(ride.paidAt),
                          hideEmpty: true,
                        },
                        {
                          label: "Refunded At",
                          value: formatRideTimestamp(ride.refundedAt),
                          hideEmpty: true,
                        },
                      ]}
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
