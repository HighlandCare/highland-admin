import { React, useState, useEffect, useRef } from "react";
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
import { fetchAllPages, getListFromResponse } from "../utils/listUtils";
import {
  formatEarningsCurrency,
  hasEarningsApiTotals,
  summarizeEarningsAnalytics,
} from "../utils/earningsUtils";

const emptyAnalytics = {
  drivers: [],
  driversCount: 0,
  totalEarned: 0,
  totalWallet: 0,
  totalRides: 0,
  averageEarned: 0,
  topEarners: [],
  hasApiTotals: false,
  hasEarnings: false,
};

const Page = () => {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);
  const [earnings, setEarnings] = useState({});
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const analyticsLoadedRef = useRef(false);
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

    const loadAnalytics = async (pageResponse) => {
      if (analyticsLoadedRef.current) {
        return;
      }

      setIsAnalyticsLoading(true);

      try {
        let nextAnalytics = summarizeEarningsAnalytics(pageResponse);

        // Older API builds only return total_drivers — sum every page of driver rows.
        if (!hasEarningsApiTotals(pageResponse)) {
          const allDrivers = await fetchAllPages(
            (nextPage) => getDriverEarnings(nextPage, ROWS_PER_PAGE)
          );
          nextAnalytics = summarizeEarningsAnalytics({
            ...pageResponse,
            data: allDrivers,
          });
        }

        if (active) {
          setAnalytics(nextAnalytics);
          analyticsLoadedRef.current = true;
        }
      } catch (error) {
        console.error("Error loading driver earnings analytics:", error);
        if (active) {
          setAnalytics(summarizeEarningsAnalytics(pageResponse));
          analyticsLoadedRef.current = true;
        }
      } finally {
        if (active) {
          setIsAnalyticsLoading(false);
        }
      }
    };

    const fetchEarnings = async () => {
      try {
        setIsLoading(true);
        const response = await getDriverEarnings(page, ROWS_PER_PAGE);
        if (!active) {
          return;
        }

        setEarnings(response);
        await loadAnalytics(response);
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

  const hasData = Boolean(getListFromResponse(earnings).length);
  const showStats = isLoading || isAnalyticsLoading || analytics.hasEarnings;
  const statsLoading = isLoading || isAnalyticsLoading;

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

            {showStats && (
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid xs={12} sm={6} lg={3}>
                  <OverviewStatCard
                    icon={UsersIcon}
                    iconColor="info.main"
                    loading={statsLoading}
                    title="Drivers"
                    value={analytics.driversCount}
                  />
                </Grid>
                <Grid xs={12} sm={6} lg={3}>
                  <OverviewStatCard
                    icon={CurrencyDollarIcon}
                    iconColor="primary.main"
                    loading={statsLoading}
                    title="Total Earned"
                    value={formatEarningsCurrency(analytics.totalEarned)}
                  />
                </Grid>
                <Grid xs={12} sm={6} lg={3}>
                  <OverviewStatCard
                    icon={WalletIcon}
                    iconColor="success.main"
                    loading={statsLoading}
                    title="Wallet Balance"
                    value={formatEarningsCurrency(analytics.totalWallet)}
                  />
                </Grid>
                <Grid xs={12} sm={6} lg={3}>
                  <OverviewStatCard
                    icon={ClockIcon}
                    iconColor="warning.main"
                    loading={statsLoading}
                    title="Total Rides"
                    value={analytics.totalRides}
                  />
                </Grid>

                {(statsLoading || analytics.topEarners.length > 0) && (
                  <Grid xs={12}>
                    <EarningsAnalytics analytics={analytics} loading={statsLoading} />
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
