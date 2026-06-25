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
  Divider,
  Grid,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import Loader from "../../components/Loader";
import { getChap } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import {
  getDriverDisplayName,
  getDriverList,
  getDriverProfileImage,
  getMediaUrl,
  getStoredDriverDetail,
} from "../../utils/driverUtils";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../../utils/pageLayout";

const DetailItem = ({ label, value }) => (
  <Box>
    <Typography color="text.secondary" variant="caption">
      {label}
    </Typography>
    <Typography fontWeight={600} variant="body2">
      {value || "—"}
    </Typography>
  </Box>
);

const DocumentCard = ({ label, src }) => (
  <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
    <CardContent>
      <Typography sx={{ mb: 2 }} variant="subtitle2">
        {label}
      </Typography>
      {src ? (
        <Box
          component="img"
          src={src}
          alt={label}
          sx={{
            border: "1px solid",
            borderColor: "neutral.200",
            borderRadius: 2,
            maxHeight: 260,
            objectFit: "cover",
            width: "100%",
          }}
        />
      ) : (
        <Typography color="text.secondary" variant="body2">
          Not available
        </Typography>
      )}
    </CardContent>
  </Card>
);

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [driver, setDriver] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadDriver = async () => {
      setIsLoading(true);

      const cached = getStoredDriverDetail(id);
      if (cached) {
        setDriver(cached);
        setIsLoading(false);
        return;
      }

      try {
        const response = await getChap(1);
        const found = getDriverList(response).find((item) => item._id === id);
        setDriver(found || null);
      } catch (error) {
        console.error("Error loading driver details:", error);
        setDriver(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadDriver();
  }, [id]);

  const profileImage = driver ? getDriverProfileImage(driver) : null;

  return (
    <>
      <Head>
        <title>{driver ? `${getDriverDisplayName(driver)} | Driver` : "Driver Details"} | Cura</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3}>
            <Button
              component={NextLink}
              href="/chaperone"
              startIcon={
                <SvgIcon fontSize="small">
                  <ArrowLeftIcon />
                </SvgIcon>
              }
              sx={{ alignSelf: "flex-start", textTransform: "none" }}
            >
              Back to Drivers
            </Button>

            {isLoading ? (
              <Loader page />
            ) : !driver ? (
              <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                <CardContent sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="h6">Driver not found</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                    The selected driver could not be loaded.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                  <CardContent>
                    <Stack alignItems={{ xs: "flex-start", md: "center" }} direction={{ xs: "column", md: "row" }} spacing={3}>
                      <Box
                        component="img"
                        src={profileImage || undefined}
                        alt={getDriverDisplayName(driver)}
                        sx={{
                          bgcolor: "neutral.100",
                          border: "1px solid",
                          borderColor: "neutral.200",
                          borderRadius: 3,
                          height: 120,
                          objectFit: "cover",
                          width: 120,
                        }}
                      />
                      <Box flex={1}>
                        <Typography sx={pageTitleSx} variant="h4">
                          {getDriverDisplayName(driver)}
                        </Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body1">
                          {driver?.user?.email || "No email linked"}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={3} mt={2}>
                          <DetailItem label="Approval" value={driver.isApproved ? "Approved" : "Pending"} />
                          <DetailItem label="Online" value={driver.isOnline ? "Online" : "Offline"} />
                          <DetailItem label="Ride Status" value={driver.status || "—"} />
                          <DetailItem label="Rating" value={driver.rating ?? "—"} />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none", height: "100%" }}>
                      <CardContent>
                        <Typography sx={{ mb: 2 }} variant="h6">
                          Personal Information
                        </Typography>
                        <Stack spacing={2}>
                          <DetailItem label="Full Name" value={driver?.user?.fullName} />
                          <DetailItem label="Email" value={driver?.user?.email} />
                          <DetailItem label="Phone" value={driver?.user?.phone} />
                          <DetailItem label="Address" value={driver?.user?.address} />
                          <DetailItem
                            label="Location"
                            value={[driver?.user?.city, driver?.user?.state, driver?.user?.zipCode]
                              .filter(Boolean)
                              .join(", ")}
                          />
                          <DetailItem label="Joined" value={formatDate(driver?.createdAt)} />
                          <DetailItem label="Last Active" value={formatRelativeDate(driver?.updatedAt)} />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none", height: "100%" }}>
                      <CardContent>
                        <Typography sx={{ mb: 2 }} variant="h6">
                          Vehicle & License
                        </Typography>
                        <Stack spacing={2}>
                          <DetailItem label="Vehicle Name" value={driver?.vehicleName} />
                          <DetailItem label="Vehicle Number" value={driver?.vehicleNo} />
                          <DetailItem label="Experience" value={driver?.experience} />
                          <DetailItem label="License Number" value={driver?.licenceNumber} />
                          <DetailItem label="License Expiry" value={driver?.licenceExpiry} />
                          <DetailItem label="Hourly Fare" value={driver?.hourlyFare ? `$${driver.hourlyFare}` : null} />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item md={4} xs={12}>
                    <DocumentCard label="Profile Photo" src={profileImage} />
                  </Grid>
                  <Grid item md={4} xs={12}>
                    <DocumentCard label="ID Card" src={getMediaUrl(driver?.idCard?.file)} />
                  </Grid>
                  <Grid item md={4} xs={12}>
                    <DocumentCard label="Driving License" src={getMediaUrl(driver?.drivingLicense?.file)} />
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
