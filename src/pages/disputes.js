import { useEffect, useState } from "react";
import Head from "next/head";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Loader from "../components/Loader";
import { DisputesTable } from "../sections/disputes/disputes-table";
import { getRideHistory } from "../Services/Auth.service";
import { getDisputes } from "../Services/Dispute.service";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import { fetchAllPages } from "../utils/listUtils";
import { mergeDisputeSources } from "../utils/disputeUtils";

const DISPUTE_PAGE_SIZE = 20;

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
      try {
        setIsLoading(true);

        const [unpaidRides, disputes] = await Promise.all([
          fetchAllPages(
            (pageNumber) =>
              getRideHistory(pageNumber, DISPUTE_PAGE_SIZE, {
                status: "disputed",
                havePaid: false,
              }),
            { pageSize: DISPUTE_PAGE_SIZE }
          ),
          fetchAllPages(
            (pageNumber) => getDisputes(pageNumber, DISPUTE_PAGE_SIZE),
            { pageSize: DISPUTE_PAGE_SIZE }
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

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    setRefreshKey((value) => value + 1);
  };

  const hasData = rows.length > 0;

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
                <DisputesTable
                  items={rows}
                  onPageChange={handlePageChange}
                  onRefresh={handleRefresh}
                  page={page}
                  title="Disputes"
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
