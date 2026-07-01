import { useEffect, useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import Loader from "../../components/Loader";
import { StatusBadge } from "../../components/table-cells";
import { getRideById } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../../utils/pageLayout";
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

const DetailItem = ({ label, value }) => (
  <Box>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography fontWeight={600} sx={{ wordBreak: "break-word" }} variant="body2">
      {value || "—"}
    </Typography>
  </Box>
);

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

const formatRideTimestamp = (value) => {
  if (!value || value === "false") {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return formatRideField(value);
  }

  return formatDate(value);
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

  return (
    <>
      <Head>
        <title>{ride ? `Ride ${ride.rideId}` : "Ride Details"} | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3}>
            <Button
              component={NextLink}
              href="/ride-history"
              startIcon={
                <SvgIcon fontSize="small">
                  <ArrowLeftIcon />
                </SvgIcon>
              }
              sx={{ alignSelf: "flex-start", textTransform: "none" }}
            >
              Back to Ride History
            </Button>

            {isLoading ? (
              <Loader page />
            ) : !ride ? (
              <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                <CardContent sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="h6">Ride not found</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                    The selected ride could not be loaded.
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
                          Ride Details
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body1">
                          {getRideDriverName(ride)} → {getRideCustomerName(ride)}
                        </Typography>
                      </Box>
                      {statusMeta && <StatusBadge color={statusMeta.color} label={statusMeta.label} />}
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <SectionCard title="Ride Overview">
                      <Stack spacing={2}>
                        <DetailItem label="Ride ID" value={ride.rideId} />
                        <DetailItem label="Mode" value={formatRideField(ride.mode)} />
                        <DetailItem label="Type" value={formatRideField(ride.type)} />
                        <DetailItem label="Status" value={formatRideField(ride.status)} />
                        <DetailItem label="Distance" value={formatRideField(ride.distance)} />
                        <DetailItem label="Passengers" value={formatRideField(ride.numberOfPassenger)} />
                        <DetailItem label="Estimated Fare" value={formatRideCurrency(ride.estFare)} />
                        <DetailItem label="Admin Earned" value={formatRideCurrency(ride.adminEarned)} />
                        <DetailItem label="Payment Status" value={formatRidePaymentStatus(ride.havePaid)} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Schedule & Timing">
                      <Stack spacing={2}>
                        <DetailItem label="Scheduled At" value={formatRideTimestamp(ride.scheduledAt)} />
                        <DetailItem label="Pre Date" value={formatRideField(ride.pre_date)} />
                        <DetailItem label="Pre Time" value={formatRideField(ride.pre_time)} />
                        <DetailItem label="Ride Start Time" value={formatRideTimestamp(ride.rideStartTime)} />
                        <DetailItem label="Ride End Time" value={formatRideTimestamp(ride.rideEndTime)} />
                        <DetailItem label="Created At" value={formatRideTimestamp(ride.createdAt)} />
                        <DetailItem label="Updated At" value={formatRelativeDate(ride.updatedAt)} />
                        <DetailItem label="Cancel Reason" value={formatRideReason(ride.reasonOfCancel)} />
                        <DetailItem label="Dispute Reason" value={formatRideReason(ride.reasonOfDispute)} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Customer">
                      <Stack spacing={2}>
                        <DetailItem label="ID" value={ride.customer?._id} />
                        <DetailItem label="Full Name" value={ride.customer?.fullName} />
                        <DetailItem label="Email" value={ride.customer?.email} />
                        <DetailItem label="Phone" value={ride.customer?.phone} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Driver">
                      {ride.driver ? (
                        <Stack spacing={2}>
                          <DetailItem label="ID" value={ride.driver._id} />
                          <DetailItem label="Full Name" value={ride.driver.fullName} />
                          <DetailItem label="Email" value={ride.driver.email} />
                          <DetailItem label="Phone" value={ride.driver.phone} />
                        </Stack>
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          Unassigned
                        </Typography>
                      )}
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Pickup Location">
                      <Stack spacing={2}>
                        <DetailItem label="Address" value={getRidePickupAddress(ride)} />
                        <DetailItem label="Coordinates" value={formatRideCoordinates(ride.from)} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Destination">
                      <Stack spacing={2}>
                        <DetailItem label="Address" value={getRideDestinationAddress(ride)} />
                        <DetailItem label="Coordinates" value={formatRideCoordinates(ride.destination)} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item xs={12}>
                    <SectionCard title="Payment">
                      <Grid container spacing={2}>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem label="Total Amount" value={formatRideCurrency(ride.payment?.totalAmount)} />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem label="Driver Amount" value={formatRideCurrency(getRideDriverEarning(ride))} />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Admin Commission"
                            value={formatRideCurrency(getRideAdminEarning(ride))}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Commission Rate"
                            value={formatRideCommissionRate(ride.payment?.commissionRate)}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem label="Payment Source" value={formatRideField(ride.payment?.source)} />
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
