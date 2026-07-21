import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Container,
  Unstable_Grid2 as Grid,
  Stack,
  Typography,
} from "@mui/material";
import UsersIcon from "@heroicons/react/24/solid/UsersIcon";
import UserGroupIcon from "@heroicons/react/24/solid/UserGroupIcon";
import Cog6ToothIcon from "@heroicons/react/24/solid/Cog6ToothIcon";
import ClockIcon from "@heroicons/react/24/solid/ClockIcon";
import CurrencyDollarIcon from "@heroicons/react/24/solid/CurrencyDollarIcon";
import CheckCircleIcon from "@heroicons/react/24/solid/CheckCircleIcon";
import WalletIcon from "@heroicons/react/24/solid/BanknotesIcon";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import BaseLayout from "../layouts/BaseLayout";
import Image from "next/image";
import Logo from "../../public/assets/logo.png";
import Loader from "../components/Loader";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import { OverviewStatCard } from "../sections/overview/overview-stat-card";
import { OverviewRideAnalytics } from "../sections/overview/overview-ride-analytics";
import { OverviewRideStatus } from "../sections/overview/overview-ride-status";
import { OverviewLatestRides } from "../sections/overview/overview-latest-rides";
import { formatCompactCurrency, loadDashboardAnalytics } from "../utils/dashboardUtils";

const emptyAnalytics = {
  totalUsers: 0,
  activeUsers: 0,
  totalDrivers: 0,
  activeDrivers: 0,
  totalRides: 0,
  completedRides: 0,
  adminEarnings: 0,
  driverEarningsTotal: 0,
  hasAdminEarnings: false,
  hasDriverEarnings: false,
  rides: [],
  monthly: { hasData: false, categories: [], series: [] },
  statusDistribution: { hasData: false, labels: [], values: [] },
};

const Page = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(emptyAnalytics);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await loadDashboardAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Error loading dashboard analytics:", error);
      setAnalytics(emptyAnalytics);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loginStatus =
      typeof window !== "undefined" ? JSON.parse(localStorage.getItem("isLogin")) : null;

    setIsLogin(loginStatus);

    if (!loginStatus) {
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (isLogin) {
      loadAnalytics();
    }
  }, [isLogin, loadAnalytics]);

  const Layout = isLogin ? DashboardLayout : BaseLayout;
  const showUsers = isLoading || analytics.totalUsers > 0;
  const showDrivers = isLoading || analytics.totalDrivers > 0;
  const showRides = isLoading || analytics.totalRides > 0;
  const showAdminEarnings = isLoading || analytics.hasAdminEarnings;
  const showDriverEarnings = isLoading || analytics.hasDriverEarnings;
  const showCompletedRides = isLoading || analytics.completedRides > 0;
  const showMonthlyChart = isLoading || analytics.monthly.hasData;
  const showStatusChart = isLoading || analytics.statusDistribution.hasData;
  const showLatestRides = isLoading || analytics.rides.length > 0;

  return (
    <>
      <Head>
        <title>Dashboard | Highland Care</title>
      </Head>
      <Layout>
        {isLogin ? (
          <Box component="main" sx={pageMainSx}>
            <Container maxWidth="xl" sx={pageContainerSx}>
              <Stack spacing={1} mb={4}>
                <Typography sx={pageTitleSx} variant="h4">
                  Dashboard
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  Live analytics from users, drivers, rides, and earnings
                </Typography>
              </Stack>

              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {showUsers && (
                  <Grid xs={12} sm={6} lg={3}>
                    <OverviewStatCard
                      actionLabel="See All Users"
                      href="/users"
                      icon={UsersIcon}
                      iconColor="error.main"
                      loading={isLoading}
                      title="Total Users"
                      value={analytics.totalUsers}
                    />
                  </Grid>
                )}

                {showUsers && (
                  <Grid xs={12} sm={6} lg={3}>
                    <OverviewStatCard
                      actionLabel="See All Users"
                      href="/users"
                      icon={UserGroupIcon}
                      iconColor="success.main"
                      loading={isLoading}
                      title="Active Users"
                      value={analytics.activeUsers}
                    />
                  </Grid>
                )}

                {showDrivers && (
                  <Grid xs={12} sm={6} lg={3}>
                    <OverviewStatCard
                      actionLabel="See All Drivers"
                      href="/chaperone"
                      icon={Cog6ToothIcon}
                      iconColor="info.main"
                      loading={isLoading}
                      title="Total Drivers"
                      value={analytics.totalDrivers}
                    />
                  </Grid>
                )}

                {showDrivers && (
                  <Grid xs={12} sm={6} lg={3}>
                    <OverviewStatCard
                      actionLabel="See All Drivers"
                      href="/chaperone"
                      icon={Cog6ToothIcon}
                      iconColor="warning.main"
                      loading={isLoading}
                      title="Active Drivers"
                      value={analytics.activeDrivers}
                    />
                  </Grid>
                )}

                {showRides && (
                  <Grid xs={12} sm={6} lg={3}>
                    <OverviewStatCard
                      actionLabel="View Ride History"
                      href="/ride-history"
                      icon={ClockIcon}
                      iconColor="primary.main"
                      loading={isLoading}
                      title="Total Rides"
                      value={analytics.totalRides}
                    />
                  </Grid>
                )}

                {showCompletedRides && (
                  <Grid xs={12} sm={6} lg={3}>
                    <OverviewStatCard
                      actionLabel="View Ride History"
                      href="/ride-history"
                      icon={CheckCircleIcon}
                      iconColor="success.main"
                      loading={isLoading}
                      title="Completed Rides"
                      value={analytics.completedRides}
                    />
                  </Grid>
                )}

                {showAdminEarnings && (
                  <Grid xs={12} sm={6} lg={3}>
                    <OverviewStatCard
                      actionLabel="View Ride History"
                      href="/ride-history"
                      icon={CurrencyDollarIcon}
                      iconColor="primary.dark"
                      loading={isLoading}
                      title="Admin Earnings"
                      value={formatCompactCurrency(analytics.adminEarnings)}
                    />
                  </Grid>
                )}

                {showDriverEarnings && (
                  <Grid xs={12} sm={6} lg={3}>
                    <OverviewStatCard
                      actionLabel="View Earnings"
                      href="/driver-earnings"
                      icon={WalletIcon}
                      iconColor="success.dark"
                      loading={isLoading}
                      title="Driver Earnings"
                      value={formatCompactCurrency(analytics.driverEarningsTotal)}
                    />
                  </Grid>
                )}

                {showMonthlyChart && (
                  <Grid xs={12} lg={showStatusChart ? 8 : 12}>
                    <OverviewRideAnalytics
                      categories={analytics.monthly.categories}
                      chartSeries={analytics.monthly.series}
                      loading={isLoading}
                      sx={{ height: "100%" }}
                    />
                  </Grid>
                )}

                {showStatusChart && (
                  <Grid xs={12} lg={showMonthlyChart ? 4 : 12}>
                    <OverviewRideStatus
                      labels={analytics.statusDistribution.labels}
                      loading={isLoading}
                      series={analytics.statusDistribution.values}
                      sx={{ height: "100%" }}
                    />
                  </Grid>
                )}

                {showLatestRides && (
                  <Grid xs={12}>
                    <OverviewLatestRides loading={isLoading} rides={analytics.rides} />
                  </Grid>
                )}

                {!isLoading &&
                  !showUsers &&
                  !showDrivers &&
                  !showRides &&
                  !showAdminEarnings &&
                  !showDriverEarnings && (
                    <Grid xs={12}>
                      <Box
                        sx={{
                          border: "1px dashed",
                          borderColor: "neutral.300",
                          borderRadius: 3,
                          px: 3,
                          py: 8,
                          textAlign: "center",
                        }}
                      >
                        <Typography variant="h6">No analytics data available</Typography>
                        <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                          Once users, drivers, or rides exist, their stats will appear here.
                        </Typography>
                      </Box>
                    </Grid>
                  )}
              </Grid>
            </Container>
          </Box>
        ) : (
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              height: "100vh",
              justifyContent: "center",
              px: 2,
              width: "100%",
            }}
          >
            <Stack alignItems="center" spacing={3} sx={{ maxWidth: 320, width: "100%" }}>
              <Image
                alt="Highland Care"
                src={Logo}
                height={100}
                style={{ height: "auto", maxWidth: "100%", width: "auto" }}
              />
              <Loader minHeight={120} size="md" sx={{ width: "100%" }} />
            </Stack>
          </Box>
        )}
      </Layout>
    </>
  );
};

export default Page;
