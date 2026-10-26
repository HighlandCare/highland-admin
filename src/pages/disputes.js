import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import { DataTableLoadingShell } from "../components/data-table";
import { DisputesTable } from "../sections/disputes/disputes-table";
import { getRideHistory } from "../Services/Auth.service";
import { getDisputes } from "../Services/Dispute.service";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import { fetchAllPages, getListFromResponse } from "../utils/listUtils";
import { getDisputeList, mergeDisputeSources } from "../utils/disputeUtils";
import {
  LIST_FILTER_KEYS,
  createListFilterRouteGuard,
} from "../utils/listFilterState";

const DISPUTE_PAGE_SIZE = 20;

const Page = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const loadedOnceRef = useRef(false);

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    const loadDisputes = async () => {
      const block = !loadedOnceRef.current;
      try {
        if (block) {
          setIsLoading(true);
        }

        // Show first page ASAP, then fill the rest in the background.
        const [ridesPage1, disputesPage1] = await Promise.all([
          getRideHistory(1, DISPUTE_PAGE_SIZE, {
            status: "disputed",
            havePaid: false,
          }),
          getDisputes(1, DISPUTE_PAGE_SIZE).catch((error) => {
            console.error("Error fetching disputes:", error);
            return null;
          }),
        ]);

        if (!active) {
          return;
        }

        const firstMerge = mergeDisputeSources(
          getListFromResponse(ridesPage1),
          disputesPage1 ? getDisputeList(disputesPage1) : []
        );
        setRows(firstMerge);
        loadedOnceRef.current = true;
        setIsLoading(false);

        const [unpaidRides, disputes] = await Promise.all([
          fetchAllPages(
            (pageNumber) =>
              getRideHistory(pageNumber, DISPUTE_PAGE_SIZE, {
                status: "disputed",
                havePaid: false,
              }),
            { pageSize: DISPUTE_PAGE_SIZE, seedResponse: ridesPage1 }
          ),
          fetchAllPages(
            (pageNumber) => getDisputes(pageNumber, DISPUTE_PAGE_SIZE),
            {
              pageSize: DISPUTE_PAGE_SIZE,
              seedResponse: disputesPage1 || undefined,
            }
          ).catch((error) => {
            console.error("Error fetching disputes:", error);
            return [];
          }),
        ]);

        if (active) {
          setRows(mergeDisputeSources(unpaidRides, disputes));
        }
      } catch (error) {
        console.error("Error loading disputes:", error);
        if (active) {
          setRows([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadDisputes();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    const handleRouteChangeStart = createListFilterRouteGuard(LIST_FILTER_KEYS.disputes, {
      listPath: "/disputes",
      detailPaths: ["/disputes/detail"],
    });

    router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [router.events]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  return (
    <>
      <Head>
        <title>Disputes | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Typography sx={pageTitleSx} variant="h4">
                Disputes
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Unpaid disputed rides and open dispute cases
              </Typography>
            </Stack>

            <DataTableLoadingShell loading={isLoading}>
              <DisputesTable
                items={rows}
                onPageChange={handlePageChange}
                onRefresh={handleRefresh}
                page={page}
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
