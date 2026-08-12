import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import {
  Box,
  Button,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { toast } from "react-toastify";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import { StatusBadge } from "../../components/table-cells";
import {
  DetailAvatar,
  DetailFieldGrid,
  DetailHero,
  DetailPageFrame,
  DetailPageState,
  DetailPanel,
  DetailSection,
  DetailStat,
  detailTableHeadSx,
  detailTableRowSx,
} from "../../components/detail-page/detail-page-ui";
import { getRestaurantById, updateRestaurantApproval } from "../../Services/Auth.service";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import {
  capitalizeRestaurantLabel,
  formatRestaurantCurrency,
  formatRestaurantDateTime,
  formatRestaurantPercent,
  formatRestaurantRelativeDate,
  getRestaurantBusinessName,
  getRestaurantCuisine,
  getRestaurantFromResponse,
  getRestaurantHoursFields,
  getRestaurantTicketStatus,
  getRestaurantTicketStatusColor,
  getRestaurantTicketSubject,
  pickRestaurantValue,
} from "../../utils/restaurantUtils";

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [restaurant, setRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRestaurant = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await getRestaurantById(id);
      setRestaurant(getRestaurantFromResponse(response));
    } catch (error) {
      console.error("Error loading restaurant details:", error);
      setRestaurant(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const isLogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!isLogin) {
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const response = await getRestaurantById(id);
        if (active) {
          setRestaurant(getRestaurantFromResponse(response));
        }
      } catch (error) {
        console.error("Error loading restaurant details:", error);
        if (active) setRestaurant(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handleApproval = async (approved) => {
    if (!restaurant?._id) return;

    try {
      setIsSubmitting(true);
      await updateRestaurantApproval(restaurant._id, approved);
      toast.success(approved ? "Restaurant approved" : "Restaurant declined");
      await loadRestaurant();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update restaurant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const businessName = getRestaurantBusinessName(restaurant);
  const cuisine = getRestaurantCuisine(restaurant);
  const isApproved = restaurant?.isApproved === true;
  const hasOnlineFlag = typeof restaurant?.isOnline === "boolean";
  const isOnline = restaurant?.isOnline === true;
  const hoursFields = restaurant ? getRestaurantHoursFields(restaurant) : [];
  const tickets = restaurant?.supportTickets || [];
  const orderCount = restaurant?.stats?.orderCount;
  const openTicketCount = restaurant?.stats?.openTicketCount;

  return (
    <>
      <Head>
        <title>
          {restaurant ? `${businessName} | Restaurant` : "Restaurant Details"} | Highland Care
        </title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <DetailPageFrame backHref="/restaurants" backLabel="Back to Restaurants">
            <DetailPageState
              loading={isLoading}
              notFoundMessage="The selected restaurant could not be loaded."
              notFoundTitle={!isLoading && !restaurant ? "Restaurant not found" : undefined}
            >
              {restaurant ? (
                <DetailPanel>
                  <DetailHero
                    avatar={
                      <DetailAvatar
                        alt={businessName}
                        fallback={businessName?.charAt(0)?.toUpperCase()}
                        src={pickRestaurantValue(
                          restaurant.logo,
                          restaurant.logoUrl,
                          restaurant.image,
                          restaurant.imageUrl
                        )}
                      />
                    }
                    badge={
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        <StatusBadge
                          color={isApproved ? "success" : "warning"}
                          label={isApproved ? "Approved" : "Pending"}
                        />
                        {hasOnlineFlag ? (
                          <StatusBadge
                            color={isOnline ? "success" : "neutral"}
                            label={isOnline ? "Online" : "Offline"}
                          />
                        ) : null}
                      </Stack>
                    }
                    footer={
                      <Stack
                        alignItems={{ xs: "stretch", sm: "center" }}
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        spacing={2}
                        sx={{ width: "100%" }}
                      >
                        <Stack direction="row" flexWrap="wrap" gap={1.5}>
                          <DetailStat
                            label="Orders"
                            value={
                              orderCount != null && orderCount !== ""
                                ? String(orderCount)
                                : "0"
                            }
                          />
                          <DetailStat
                            label="Open tickets"
                            value={
                              openTicketCount != null && openTicketCount !== ""
                                ? String(openTicketCount)
                                : "0"
                            }
                          />
                        </Stack>
                        {!isApproved ? (
                          <Stack
                            direction="row"
                            flexWrap="wrap"
                            gap={1.5}
                            justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                            sx={{ ml: { sm: "auto" } }}
                          >
                            <Button
                              color="success"
                              disabled={isSubmitting}
                              size="medium"
                              startIcon={<CheckCircleIcon width={18} />}
                              variant="contained"
                              onClick={() => handleApproval(true)}
                            >
                              Approve
                            </Button>
                            <Button
                              color="error"
                              disabled={isSubmitting}
                              size="medium"
                              startIcon={<XCircleIcon width={18} />}
                              variant="outlined"
                              onClick={() => handleApproval(false)}
                            >
                              Decline
                            </Button>
                          </Stack>
                        ) : null}
                      </Stack>
                    }
                    subtitle={cuisine || "Restaurant"}
                    title={businessName}
                  />

                  <DetailSection noBorder title="Business Information">
                    <DetailFieldGrid
                      fields={[
                        { label: "Business Name", value: businessName, hideEmpty: true },
                        { label: "Cuisine", value: cuisine, hideEmpty: true },
                        {
                          label: "Phone",
                          value: pickRestaurantValue(restaurant.phone, restaurant.phoneNumber),
                          hideEmpty: true,
                        },
                        {
                          label: "Email",
                          value: pickRestaurantValue(restaurant.email),
                          hideEmpty: true,
                        },
                        {
                          label: "Description",
                          value: pickRestaurantValue(restaurant.description, restaurant.about),
                          hideEmpty: true,
                        },
                        {
                          label: "Website",
                          value: pickRestaurantValue(restaurant.website, restaurant.websiteUrl),
                          hideEmpty: true,
                        },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Owner">
                    <DetailFieldGrid
                      fields={[
                        {
                          label: "Full Name",
                          value: restaurant.owner?.fullName,
                          hideEmpty: true,
                        },
                        {
                          label: "Email",
                          value: restaurant.owner?.email,
                          hideEmpty: true,
                        },
                        {
                          label: "Phone",
                          value: restaurant.owner?.phone,
                          hideEmpty: true,
                        },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Location">
                    <DetailFieldGrid
                      fields={[
                        {
                          label: "Address",
                          value: restaurant.location?.address,
                          hideEmpty: true,
                        },
                        {
                          label: "City",
                          value: restaurant.location?.city,
                          hideEmpty: true,
                        },
                        {
                          label: "State",
                          value: restaurant.location?.state,
                          hideEmpty: true,
                        },
                        {
                          label: "Zip Code",
                          value: restaurant.location?.zipCode,
                          hideEmpty: true,
                        },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Hours">
                    {hoursFields.length ? (
                      <DetailFieldGrid columns={{ xs: 1, sm: 2, lg: 2 }} fields={hoursFields} />
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        No hours available.
                      </Typography>
                    )}
                  </DetailSection>

                  <DetailSection title="Fees & Payments">
                    <DetailFieldGrid
                      fields={[
                        {
                          label: "Delivery Fee",
                          value: formatRestaurantCurrency(restaurant.fees?.deliveryFee),
                          hideEmpty: true,
                        },
                        {
                          label: "Service Fee",
                          value: formatRestaurantCurrency(restaurant.fees?.serviceFee),
                          hideEmpty: true,
                        },
                        {
                          label: "Platform Fee",
                          value: formatRestaurantPercent(restaurant.fees?.platformFee),
                          hideEmpty: true,
                        },
                        {
                          label: "Stripe Connect ID",
                          value: restaurant.stripeConnectId,
                          hideEmpty: true,
                        },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection title="Status">
                    <DetailFieldGrid
                      fields={[
                        {
                          label: "Approval",
                          value: isApproved ? "Approved" : "Pending",
                        },
                        {
                          label: "Online Status",
                          value: hasOnlineFlag ? (isOnline ? "Online" : "Offline") : null,
                          hideEmpty: true,
                        },
                        {
                          label: "Submitted",
                          value: formatRestaurantDateTime(restaurant.createdAt),
                          hideEmpty: true,
                        },
                        {
                          label: "Last Updated",
                          value: formatRestaurantRelativeDate(restaurant.updatedAt),
                          hideEmpty: true,
                        },
                      ]}
                    />
                  </DetailSection>

                  <DetailSection
                    description="Last 5 support tickets for this restaurant."
                    title="Recent Support Tickets"
                  >
                    {tickets.length ? (
                      <Box sx={{ overflowX: "auto" }}>
                        <Table size="small">
                          <TableHead sx={detailTableHeadSx}>
                            <TableRow>
                              <TableCell>Subject</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Created</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {tickets.map((ticket, index) => {
                              const ticketId = ticket._id || ticket.id || `ticket-${index}`;
                              const subject = getRestaurantTicketSubject(ticket);
                              const status = getRestaurantTicketStatus(ticket);
                              return (
                                <TableRow key={ticketId} sx={detailTableRowSx}>
                                  <TableCell>
                                    <Typography fontWeight={600} variant="body2">
                                      {subject}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {status ? (
                                      <StatusBadge
                                        color={getRestaurantTicketStatusColor(status)}
                                        label={capitalizeRestaurantLabel(status)}
                                      />
                                    ) : (
                                      "—"
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {formatRestaurantDateTime(ticket.createdAt) || "—"}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </Box>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        No support tickets yet.
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
