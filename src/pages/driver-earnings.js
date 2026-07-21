import { React, useState, useEffect, useMemo } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Container, Stack, Unstable_Grid2 as Grid, Typography } from "@mui/material";
import CurrencyDollarIcon from "@heroicons/react/24/solid/CurrencyDollarIcon";
import WalletIcon from "@heroicons/react/24/solid/BanknotesIcon";
import ClockIcon from "@heroicons/react/24/solid/ClockIcon";
import UsersIcon from "@heroicons/react/24/solid/UsersIcon";
import { getDriverEarnings } from "../Services/Auth.service";
import { useRouter } from "next/router";
import Loader from "../components/Loader";
import { DriverEarningsTable } from "../sections/driver-earnings/driver-earnings-table";
import { EarningsAnalytics } from "../sections/driver-earnings/earnings-analytics";
import { OverviewStatCard } from "../sections/overview/overview-stat-card";
import { ROWS_PER_PAGE } from "../components/data-table";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import { getListFromResponse } from "../utils/listUtils";
import {
  formatEarningsCurrency,
  summarizeEarningsAnalytics,
} from "../utils/earningsUtils";

const Page = () => {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState({});
  const router = useRouter();

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    const fetchEarnings = async () => {
      try {
        setIsLoading(true);
        const response = await getDriverEarnings(page, ROWS_PER_PAGE);
        if (active) {
          setEarnings(response);
        }
      } catch (error) {
        console.error("Error fetching driver earnings:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchEarnings();

    return () => {
      active = false;
    };
  }, [page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const analytics = useMemo(() => summarizeEarningsAnalytics(earnings), [earnings]);
  const hasData = Boolean(getListFromResponse(earnings).length);

  return (
    <>
      <Head>
        <title>Driver Earnings | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Typography sx={pageTitleSx} variant="h4">
                Driver Earnings
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Earnings management, analytics, and driver payout details
              </Typography>
            </Stack>

            {(isLoading || analytics.hasEarnings) && (
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid xs={12} sm={6} lg={3}>
                  <OverviewStatCard
                    icon={UsersIcon}
                    iconColor="info.main"
                    loading={isLoading}
                    title="Drivers"
                    value={analytics.driversCount}
                  />
                </Grid>
                <Grid xs={12} sm={6} lg={3}>
                  <OverviewStatCard
                    icon={CurrencyDollarIcon}
                    iconColor="primary.main"
                    loading={isLoading}
                    title="Total Earned"
                    value={formatEarningsCurrency(analytics.totalEarned)}
                  />
                </Grid>
                <Grid xs={12} sm={6} lg={3}>
                  <OverviewStatCard
                    icon={WalletIcon}
                    iconColor="success.main"
                    loading={isLoading}
                    title="Wallet Balance"
                    value={formatEarningsCurrency(analytics.totalWallet)}
                  />
                </Grid>
                <Grid xs={12} sm={6} lg={3}>
                  <OverviewStatCard
                    icon={ClockIcon}
                    iconColor="warning.main"
                    loading={isLoading}
                    title="Total Rides"
                    value={analytics.totalRides}
                  />
                </Grid>

                {(isLoading || analytics.topEarners.length > 0) && (
                  <Grid xs={12}>
                    <EarningsAnalytics analytics={analytics} loading={isLoading} />
                  </Grid>
                )}
              </Grid>
            )}

            {isLoading && !hasData ? (
              <Loader page />
            ) : (
              <Box sx={{ position: "relative" }}>
                {isLoading && (
                  <Box
                    sx={{
                      alignItems: "center",
                      bgcolor: "rgba(255, 255, 255, 0.72)",
                      display: "flex",
                      inset: 0,
                      justifyContent: "center",
                      position: "absolute",
                      zIndex: 2,
                    }}
                  >
                    <Loader size="md" />
                  </Box>
                )}
                <DriverEarningsTable
                  items={earnings}
                  onPageChange={handlePageChange}
                  page={page}
                  title="Driver Earnings"
                />
              </Box>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default Page;
