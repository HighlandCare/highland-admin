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
import { getUsers } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { getListFromResponse } from "../../utils/listUtils";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../../utils/pageLayout";
import {
  getCustomerAuthId,
  getStoredUserDetail,
  getUserAccountStatusMeta,
  getUserDisplayName,
  getUserProfileImage,
} from "../../utils/userUtils";
import { ROWS_PER_PAGE } from "../../components/data-table";

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

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadUser = async () => {
      setIsLoading(true);

      const cached = getStoredUserDetail(id);
      if (cached) {
        setUser(cached);
        setIsLoading(false);
        return;
      }

      try {
        const response = await getUsers(1, ROWS_PER_PAGE);
        const found = getListFromResponse(response).find(
          (item) => item._id === id || getCustomerAuthId(item) === id
        );
        setUser(found || null);
      } catch (error) {
        console.error("Error loading user details:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const accountMeta = user ? getUserAccountStatusMeta(user) : null;
  const profile = user?.user || {};
  const profileImage = user ? getUserProfileImage(user) : null;

  return (
    <>
      <Head>
        <title>
          {user ? `${getUserDisplayName(user)} | User` : "User Details"} | Highland Care
        </title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3}>
            <Button
              component={NextLink}
              href="/users"
              startIcon={
                <SvgIcon fontSize="small">
                  <ArrowLeftIcon />
                </SvgIcon>
              }
              sx={{ alignSelf: "flex-start", textTransform: "capitalize" }}
            >
              Back to Users
            </Button>

            {isLoading ? (
              <Loader page />
            ) : !user ? (
              <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                <CardContent sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="h6">User not found</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                    The selected user could not be loaded.
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
                      spacing={3}
                    >
                      {profileImage ? (
                        <Box
                          alt={getUserDisplayName(user)}
                          component="img"
                          src={profileImage}
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
                      ) : (
                        <Box
                          sx={{
                            alignItems: "center",
                            bgcolor: "neutral.100",
                            border: "1px solid",
                            borderColor: "neutral.200",
                            borderRadius: 3,
                            color: "neutral.700",
                            display: "flex",
                            fontSize: 36,
                            fontWeight: 700,
                            height: 120,
                            justifyContent: "center",
                            width: 120,
                          }}
                        >
                          {getUserDisplayName(user)?.charAt(0)?.toUpperCase() || "?"}
                        </Box>
                      )}
                      <Box flex={1}>
                        <Typography sx={pageTitleSx} variant="h4">
                          {getUserDisplayName(user)}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          data-email="true"
                          sx={{ mt: 0.5, textTransform: "lowercase" }}
                          variant="body1"
                        >
                          {profile.email ? profile.email.toLowerCase() : "No email linked"}
                        </Typography>
                        <Stack alignItems="center" direction="row" flexWrap="wrap" gap={2} mt={2}>
                          {accountMeta && (
                            <StatusBadge color={accountMeta.color} label={accountMeta.label} />
                          )}
                          <DetailItem label="Phone" value={profile.phone} />
                          <DetailItem
                            label="Joined"
                            value={formatRelativeDate(profile.createdAt || user.createdAt)}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <SectionCard title="Personal Information">
                      <Stack spacing={2}>
                        <DetailItem label="Full Name" value={profile.fullName} />
                        <DetailItem label="Email" value={profile.email} />
                        <DetailItem label="Phone" value={profile.phone} />
                        <DetailItem label="Gender" value={profile.gender} />
                        <DetailItem label="Date of Birth" value={profile.dob || profile.dateOfBirth} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Location & Address">
                      <Stack spacing={2}>
                        <DetailItem label="Address" value={profile.address} />
                        <DetailItem label="City" value={profile.city} />
                        <DetailItem label="State" value={profile.state} />
                        <DetailItem label="Zip Code" value={profile.zipCode || profile.zip} />
                        <DetailItem
                          label="Location"
                          value={[profile.city, profile.state, profile.zipCode || profile.zip]
                            .filter(Boolean)
                            .join(", ")}
                        />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Account Details">
                      <Stack spacing={2}>
                        <DetailItem
                          label="Account Status"
                          value={accountMeta?.label}
                        />
                        <DetailItem
                          label="Created At"
                          value={formatDate(profile.createdAt || user.createdAt)}
                        />
                        <DetailItem
                          label="Last Updated"
                          value={formatRelativeDate(profile.updatedAt || user.updatedAt)}
                        />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Preferences">
                      <Stack spacing={2}>
                        <DetailItem
                          label="Notifications"
                          value={
                            typeof profile.notificationOn === "boolean"
                              ? profile.notificationOn
                                ? "Enabled"
                                : "Disabled"
                              : null
                          }
                        />
                        <DetailItem label="User Type" value={profile.userType || user.userType} />
                        <DetailItem label="Device Type" value={profile.deviceType || user.deviceType} />
                      </Stack>
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
