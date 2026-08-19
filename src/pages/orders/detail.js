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
import { getRideById, getRideHistory } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import {
  formatRideCommissionRate,
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

const formatOrderTimestamp = (value) => {
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

  const scheduleFields = order
    ? [
        { label: "Scheduled At", value: formatOrderTimestamp(order.scheduledAt) },
        { label: "Pre Date", value: formatRideField(order.pre_date), hideEmpty: true },
        { label: "Pre Time", value: formatRideField(order.pre_time), hideEmpty: true },
        { label: "Start Time", value: formatOrderTimestamp(order.rideStartTime) },
        { label: "End Time", value: formatOrderTimestamp(order.rideEndTime) },
        { label: "Created At", value: formatOrderTimestamp(order.createdAt) },
        { label: "Updated At", value: formatRelativeDate(order.updatedAt) },
        { label: "Cancel Reason", value: formatRideReason(order.reasonOfCancel), hideEmpty: true },
        { label: "Dispute Reason", value: formatRideReason(order.reasonOfDispute), hideEmpty: true },
      ].filter((field) => !field.hideEmpty || hasDetailValue(field.value))
    : [];

  return (
    <>
      <Head>
        <title>Order Details | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <DetailPageFrame backHref="/live-operations" backLabel="Back to Live Operations">
            <DetailPageState
              loading={isLoading}
              notFoundMessage="The selected order could not be loaded."
              notFoundTitle={!isLoading && !order ? "Order not found" : undefined}
            >
              {order ? (
                <DetailPanel>
                  <DetailHero
                    badge={
                      statusMeta ? (
                        <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                      ) : null
                    }
                    stats={[
                      { label: "Order #", value: formatRideField(order.orderNumber) },
                      { label: "Total", value: formatRideCurrency(order.estFare) },
                      { label: "Admin Earned", value: formatRideCurrency(order.adminEarned) },
                      { label: "Payment", value: formatRidePaymentStatus(order.havePaid) },
                    ]}
                    subtitle={`${getRideDriverName(order)} → ${getRideCustomerName(order)}`}
                    title="Order Details"
                  />

                  <DetailSection noBorder title="Overview">
                    <DetailFieldGrid
                      fields={[
                        { label: "Order ID", value: formatRideField(order.orderId || order.rideId || order._id) },
                        { label: "Restaurant", value: formatRideField(order.restaurant?.businessName) },
                        { label: "Type", value: orderType },
                        { label: "Status", value: formatRideField(order.status) },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Schedule & Timing">
                    <DetailFieldGrid
                      fields={
                        scheduleFields.length
                          ? scheduleFields
                          : [
                              { label: "Created At", value: formatOrderTimestamp(order.createdAt) },
                              { label: "Updated At", value: formatRelativeDate(order.updatedAt) },
                            ]
                      }
                    />
                  </DetailSection>

                  <DetailSection title="People">
                    <DetailFieldGrid
                      columns={{ sm: 2, lg: 2 }}
                      fields={[
                        { label: "Customer Name", value: order.customer?.fullName },
                        { label: "Customer Email", value: order.customer?.email },
                        { label: "Customer Phone", value: order.customer?.phone },
                        { label: "Driver Name", value: order.driver?.fullName || "Unassigned" },
                        { label: "Driver Email", value: order.driver?.email },
                        { label: "Driver Phone", value: order.driver?.phone },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Delivery Route">
                    <DetailFieldGrid
                      columns={{ sm: 2, lg: 2 }}
                      fields={[
                        { label: "Restaurant", value: formatRideField(order.restaurant?.businessName) },
                        { label: "Pickup Address", value: getRidePickupAddress(order) },
                        { label: "Delivery Address", value: getRideDestinationAddress(order) },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Payment">
                    <DetailFieldGrid
                      fields={[
                        { label: "Total Amount", value: formatRideCurrency(order.payment?.totalAmount) },
                        { label: "Driver Amount", value: formatRideCurrency(getRideDriverEarning(order)) },
                        { label: "Admin Commission", value: formatRideCurrency(getRideAdminEarning(order)) },
                        { label: "Commission Rate", value: formatRideCommissionRate(order.payment?.commissionRate) },
                        { label: "Payment Source", value: formatRideField(order.payment?.source) },
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
