import { React, useState, useEffect } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Container, Stack } from "@mui/material";
import { getRideHistory } from "../Services/Auth.service";
import { useRouter } from "next/router";
import Loader from "../components/Loader";
import { RideHistoryTable } from "../sections/driver-earnings/ride-history-table";
import { pageContainerSx, pageMainSx } from "../utils/pageLayout";
import { defaultRideHistoryFilters, getRideList } from "../utils/rideUtils";

const RIDE_HISTORY_LIMIT = 20;

const Page = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(defaultRideHistoryFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [rideHistory, setRideHistory] = useState({});
  const router = useRouter();

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      return router.push("auth/login");
    }
  }, []);

  useEffect(() => {
    let active = true;

    const fetchRideHistory = async () => {
      try {
        setIsLoading(true);
        const response = await getRideHistory(page, RIDE_HISTORY_LIMIT, filters);
        if (active) {
          setRideHistory(response);
        }
      } catch (error) {
        console.error("Error fetching ride history:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchRideHistory();

    return () => {
      active = false;
    };
  }, [page, filters]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const hasData = Boolean(getRideList(rideHistory).length);

  return (
    <>
      <Head>
        <title>Ride History | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
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
                <RideHistoryTable
                  filters={filters}
                  items={rideHistory}
                  onFiltersChange={handleFiltersChange}
                  onPageChange={handlePageChange}
                  page={page}
                  title="Ride History"
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
