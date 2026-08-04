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
import { getRideById } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import {
  formatRideCommissionRate,
  formatRideCoordinates,
  formatRideCurrency,
  formatRideField,
  formatRidePaymentStatus,
  formatRideReason,
  getRideAdminEarning,
  getRideCustomerName,
  getRideDestinationAddress,
  getRideDriverEarning,
  getRideDriverName,
  getRideFromResponse,
  getRidePickupAddress,
  getRideStatusMeta,
  getStoredRideDetail,
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

  const formatted = formatDate(value);
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
          setRide(rideData);
          storeRideDetail(rideData);
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

  const scheduleFields = ride
    ? [
        { label: "Scheduled At", value: formatRideTimestamp(ride.scheduledAt) },
        { label: "Pre Date", value: formatRideField(ride.pre_date), hideEmpty: true },
        { label: "Pre Time", value: formatRideField(ride.pre_time), hideEmpty: true },
        { label: "Ride Start Time", value: formatRideTimestamp(ride.rideStartTime) },
        { label: "Ride End Time", value: formatRideTimestamp(ride.rideEndTime) },
        { label: "Created At", value: formatRideTimestamp(ride.createdAt) },
        { label: "Updated At", value: formatRelativeDate(ride.updatedAt) },
        { label: "Cancel Reason", value: formatRideReason(ride.reasonOfCancel), hideEmpty: true },
        { label: "Dispute Reason", value: formatRideReason(ride.reasonOfDispute), hideEmpty: true },
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
                      { label: "Payment", value: formatRidePaymentStatus(ride.havePaid) },
                      { label: "Distance", value: formatRideField(ride.distance) },
                    ]}
                    subtitle={`${getRideDriverName(ride)} → ${getRideCustomerName(ride)}`}
                    title="Ride Details"
                  />

                  <DetailSection noBorder title="Overview">
                    <DetailFieldGrid
                      fields={[
                        { label: "Type", value: formatRideField(ride.type) },
                        { label: "Status", value: formatRideField(ride.status) },
                        { label: "Passengers", value: formatRideField(ride.numberOfPassenger) },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Schedule & Timing">
                    <DetailFieldGrid fields={scheduleFields.length ? scheduleFields : [{ label: "Created At", value: formatRideTimestamp(ride.createdAt) }]} />
                  </DetailSection>

                  <DetailSection title="People">
                    <DetailFieldGrid
                      columns={{ sm: 2, lg: 2 }}
                      fields={[
                        { label: "Customer Name", value: ride.customer?.fullName },
                        { label: "Customer Email", value: ride.customer?.email },
                        { label: "Customer Phone", value: ride.customer?.phone },
                        { label: "Driver Name", value: ride.driver?.fullName || "Unassigned" },
                        { label: "Driver Email", value: ride.driver?.email },
                        { label: "Driver Phone", value: ride.driver?.phone },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Route">
                    <DetailFieldGrid
                      columns={{ sm: 2, lg: 2 }}
                      fields={[
                        { label: "Pickup Address", value: getRidePickupAddress(ride) },
                        { label: "Pickup Coordinates", value: formatRideCoordinates(ride.from) },
                        { label: "Destination Address", value: getRideDestinationAddress(ride) },
                        { label: "Destination Coordinates", value: formatRideCoordinates(ride.destination) },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Payment">
                    <DetailFieldGrid
                      fields={[
                        { label: "Total Amount", value: formatRideCurrency(ride.payment?.totalAmount) },
                        { label: "Driver Amount", value: formatRideCurrency(getRideDriverEarning(ride)) },
                        { label: "Admin Commission", value: formatRideCurrency(getRideAdminEarning(ride)) },
                        { label: "Commission Rate", value: formatRideCommissionRate(ride.payment?.commissionRate) },
                        { label: "Payment Source", value: formatRideField(ride.payment?.source) },
                      ]}
                    />
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
