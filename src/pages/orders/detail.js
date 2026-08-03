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
import { getRideById, getRideHistory } from "../../Services/Auth.service";
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
  getRideList,
  getRidePickupAddress,
  getRideStatusMeta,
  getStoredOrderDetailContext,
  getStoredRideDetail,
  orderMatchesId,
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

const DetailItem = ({ label, value }) => {
  const isEmail = label === "Email" || (typeof value === "string" && value.includes("@"));
  const displayValue = isEmail && value ? String(value).toLowerCase() : value;

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
        {displayValue || "—"}
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

const formatOrderTimestamp = (value) => {
  if (!value || value === "false") {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return formatRideField(value);
  }

  return formatDate(value);
};

async function fetchOrderByCandidates(candidateIds = []) {
  const uniqueIds = [...new Set(candidateIds.filter(Boolean).map(String))];

  for (const candidate of uniqueIds) {
    try {
      const response = await getRideById(candidate);
      const order = getRideFromResponse(response);
      if (order) {
        return order;
      }
    } catch (error) {
      // Try the next candidate id.
    }
  }

  for (const candidate of uniqueIds) {
    try {
      const response = await getRideHistory(1, 50, { search: candidate });
      const matches = getRideList(response).filter((row) => orderMatchesId(row, candidate));
      if (matches[0]) {
        return matches[0];
      }
    } catch (error) {
      // Try the next candidate id.
    }
  }

  return null;
}

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    const loadOrder = async () => {
      setIsLoading(true);

      const context = getStoredOrderDetailContext(id);
      const cached = getStoredRideDetail(id);
      if (cached && active) {
        setOrder(cached);
      }

      const candidateIds = [
        id,
        ...(Array.isArray(context?.candidateIds) ? context.candidateIds : []),
        context?.rideId,
        context?.bookingId,
        context?.orderId,
        context?._id,
        context?.entityId,
      ];

      try {
        const orderData = await fetchOrderByCandidates(candidateIds);

        if (!active) {
          return;
        }

        if (orderData) {
          setOrder(orderData);
          storeRideDetail(orderData);
        } else if (!cached) {
          setOrder(null);
        }
      } catch (error) {
        console.error("Error loading order details:", error);
        if (active && !cached) {
          setOrder(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      active = false;
    };
  }, [id]);

  const statusMeta = order ? getRideStatusMeta(order.status) : null;
  const orderType = formatRideField(order?.type || order?.category || "Order");

  const scheduleItems = order
    ? [
        { label: "Scheduled At", value: formatOrderTimestamp(order.scheduledAt) },
        { label: "Pre Date", value: formatRideField(order.pre_date) },
        { label: "Pre Time", value: formatRideField(order.pre_time) },
        { label: "Start Time", value: formatOrderTimestamp(order.rideStartTime) },
        { label: "End Time", value: formatOrderTimestamp(order.rideEndTime) },
        { label: "Created At", value: formatOrderTimestamp(order.createdAt) },
        { label: "Updated At", value: formatRelativeDate(order.updatedAt) },
        { label: "Cancel Reason", value: formatRideReason(order.reasonOfCancel) },
        { label: "Dispute Reason", value: formatRideReason(order.reasonOfDispute) },
      ].filter((item) => hasDetailValue(item.value))
    : [];

  return (
    <>
      <Head>
        <title>Order Details | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3}>
            <Button
              component={NextLink}
              href="/live-operations"
              startIcon={
                <SvgIcon fontSize="small">
                  <ArrowLeftIcon />
                </SvgIcon>
              }
              sx={{ alignSelf: "flex-start", textTransform: "capitalize" }}
            >
              Back to Live Operations
            </Button>

            {isLoading ? (
              <Loader page />
            ) : !order ? (
              <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                <CardContent sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="h6">Order not found</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                    The selected order could not be loaded.
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
                          Order Details
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body1">
                          {getRideDriverName(order)} → {getRideCustomerName(order)}
                        </Typography>
                      </Box>
                      {statusMeta && <StatusBadge color={statusMeta.color} label={statusMeta.label} />}
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <SectionCard title="Order Overview">
                      <Stack spacing={2}>
                        <DetailItem label="Order ID" value={formatRideField(order.rideId || order._id)} />
                        <DetailItem label="Type" value={orderType} />
                        <DetailItem label="Status" value={formatRideField(order.status)} />
                        <DetailItem label="Distance" value={formatRideField(order.distance)} />
                        <DetailItem label="Passengers" value={formatRideField(order.numberOfPassenger)} />
                        <DetailItem label="Estimated Fare" value={formatRideCurrency(order.estFare)} />
                        <DetailItem label="Admin Earned" value={formatRideCurrency(order.adminEarned)} />
                        <DetailItem label="Payment Status" value={formatRidePaymentStatus(order.havePaid)} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  {scheduleItems.length > 0 && (
                    <Grid item md={6} xs={12}>
                      <SectionCard title="Schedule & Timing">
                        <Stack spacing={2}>
                          {scheduleItems.map((item) => (
                            <DetailItem key={item.label} label={item.label} value={item.value} />
                          ))}
                        </Stack>
                      </SectionCard>
                    </Grid>
                  )}

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Customer">
                      <Stack spacing={2}>
                        <DetailItem label="Full Name" value={order.customer?.fullName} />
                        <DetailItem label="Email" value={order.customer?.email} />
                        <DetailItem label="Phone" value={order.customer?.phone} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Driver">
                      {order.driver ? (
                        <Stack spacing={2}>
                          <DetailItem label="Full Name" value={order.driver.fullName} />
                          <DetailItem label="Email" value={order.driver.email} />
                          <DetailItem label="Phone" value={order.driver.phone} />
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
                        <DetailItem label="Address" value={getRidePickupAddress(order)} />
                        <DetailItem label="Coordinates" value={formatRideCoordinates(order.from)} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Destination">
                      <Stack spacing={2}>
                        <DetailItem label="Address" value={getRideDestinationAddress(order)} />
                        <DetailItem
                          label="Coordinates"
                          value={formatRideCoordinates(order.destination)}
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
                            value={formatRideCurrency(order.payment?.totalAmount)}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Driver Amount"
                            value={formatRideCurrency(getRideDriverEarning(order))}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Admin Commission"
                            value={formatRideCurrency(getRideAdminEarning(order))}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem
                            label="Commission Rate"
                            value={formatRideCommissionRate(order.payment?.commissionRate)}
                          />
                        </Grid>
                        <Grid item md={4} sm={6} xs={12}>
                          <DetailItem label="Payment Source" value={formatRideField(order.payment?.source)} />
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
