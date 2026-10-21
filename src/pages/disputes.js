import { useEffect, useState } from "react";
import Head from "next/head";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import { DataTableLoadingShell } from "../components/data-table";
import { DisputesTable } from "../sections/disputes/disputes-table";
import { getRideHistory } from "../Services/Auth.service";
import { getDisputes } from "../Services/Dispute.service";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import { fetchAllPages, getListFromResponse, getResponseTotalPages } from "../utils/listUtils";
import { mergeDisputeSources } from "../utils/disputeUtils";
import {
  LIST_FILTER_KEYS,
  createListFilterRouteGuard,
} from "../utils/listFilterState";

/** Larger chunks = fewer round-trips on big dispute lists. */
const DISPUTE_FETCH_SIZE = 100;

const Page = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

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
      setIsLoading(true);

      try {
        // Paint first chunk ASAP, then fill remaining pages in the background.
        const [ridesPage1, disputesPage1] = await Promise.all([
          getRideHistory(1, DISPUTE_FETCH_SIZE, {
            status: "disputed",
            havePaid: false,
          }),
          getDisputes(1, DISPUTE_FETCH_SIZE).catch((error) => {
            console.error("Error fetching disputes:", error);
            return null;
          }),
        ]);

        if (!active) {
          return;
        }

        const unpaidFirst = getListFromResponse(ridesPage1);
        const disputesFirst = disputesPage1 ? getListFromResponse(disputesPage1) : [];
        setRows(mergeDisputeSources(unpaidFirst, disputesFirst));
        setIsLoading(false);

        const ridePages = Math.max(Number(getResponseTotalPages(ridesPage1)) || 1, 1);
        const disputePages = disputesPage1
          ? Math.max(Number(getResponseTotalPages(disputesPage1)) || 1, 1)
          : 1;

        if (ridePages <= 1 && disputePages <= 1) {
          return;
        }

        const [unpaidRides, disputes] = await Promise.all([
          fetchAllPages(
            (pageNumber) =>
              getRideHistory(pageNumber, DISPUTE_FETCH_SIZE, {
                status: "disputed",
                havePaid: false,
              }),
            { pageSize: DISPUTE_FETCH_SIZE, seedResponse: ridesPage1 }
          ),
          disputesPage1
            ? fetchAllPages(
                (pageNumber) => getDisputes(pageNumber, DISPUTE_FETCH_SIZE),
                { pageSize: DISPUTE_FETCH_SIZE, seedResponse: disputesPage1 }
              ).catch((error) => {
                console.error("Error fetching disputes:", error);
                return disputesFirst;
              })
            : Promise.resolve([]),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refreshKey drives reloads; rows.length only gates first paint
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

            <DataTableLoadingShell hasData={rows.length > 0} loading={isLoading}>
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
