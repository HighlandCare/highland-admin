import { React, useState, useEffect, useRef } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Container, Stack, Typography } from "@mui/material";
import { getRideHistory } from "../Services/Auth.service";
import { useRouter } from "next/router";
import Loader from "../components/Loader";
import { DataTableLoadingShell } from "../components/data-table";
import { RideHistoryTable } from "../sections/driver-earnings/ride-history-table";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import {
  clearRideHistoryListState,
  consumeRideHistoryListState,
  defaultRideHistoryFilters,
} from "../utils/rideUtils";

const DEFAULT_RIDE_HISTORY_LIMIT = 20;

const isRideHistoryDetailPath = (url = "") => {
  const path = String(url).split("?")[0];
  return (
    path.startsWith("/ride-history/detail") || path.startsWith("/orders/detail")
  );
};

const Page = () => {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_RIDE_HISTORY_LIMIT);
  const [filters, setFilters] = useState(defaultRideHistoryFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [rideHistory, setRideHistory] = useState({});
  const loadedOnceRef = useRef(false);

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    // Only restore filters when returning from detail (flag or ?restoreFilters=1).
    // Visiting from any other page starts with defaults.
    const forceRestore =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("restoreFilters") === "1";

    const stored = consumeRideHistoryListState({ forceRestore });
    if (stored) {
      setPage(stored.page);
      setFilters(stored.filters);
      if (stored.limit) {
        setLimit(stored.limit);
      }
    }

    setHydrated(true);

    // Strip the restore query without re-running this effect / remounting.
    if (forceRestore && typeof window !== "undefined") {
      window.history.replaceState(null, "", "/ride-history");
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return undefined;
    }

    // Leaving the list for any page other than ride/order detail clears saved filters.
    const handleRouteChangeStart = (url) => {
      if (isRideHistoryDetailPath(url) || String(url).split("?")[0] === "/ride-history") {
        return;
      }
      clearRideHistoryListState();
    };

    router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [hydrated, router.events]);

  useEffect(() => {
    if (!hydrated) {
      return undefined;
    }

    let active = true;

    const fetchRideHistory = async () => {
      const block = !loadedOnceRef.current;
      try {
        if (block) {
          setIsLoading(true);
        }
        const response = await getRideHistory(page, limit, {
          ...filters,
          recordType: "ride",
          type: "ride",
        });
        if (active) {
          setRideHistory(response);
          loadedOnceRef.current = true;
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
  }, [hydrated, page, limit, filters]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  if (!hydrated) {
    return <Loader minHeight={160} size="sm" />;
  }

  return (
    <>
      <Head>
        <title>Booking History | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Typography sx={pageTitleSx} variant="h4">
              Booking History
            </Typography>

            <DataTableLoadingShell loading={isLoading}>
              <RideHistoryTable
                filters={filters}
                items={rideHistory}
                onFiltersChange={handleFiltersChange}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                page={page}
                rowsPerPage={limit}
              />
            </DataTableLoadingShell>
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default Page;
