import { React, useCallback, useEffect, useState } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Container, Stack } from "@mui/material";
import { getChap } from "../Services/Auth.service";
import { useRouter } from "next/router";
import Loader from "../components/Loader";
import { ChapTable } from "../sections/chaperone/chap-table";
import { ROWS_PER_PAGE } from "../components/data-table";
import { pageContainerSx, pageMainSx } from "../utils/pageLayout";

const Page = () => {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [chape, setChape] = useState({});
  const router = useRouter();

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  const fetchData = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const response = await getChap(page, ROWS_PER_PAGE);
        setChape(response);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [page]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => fetchData({ silent: true });

  const hasData = Boolean(chape?.data?.length);

  return (
    <>
      <Head>
        <title>Drivers | Highland Care</title>
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
                <ChapTable
                  items={chape}
                  onPageChange={handlePageChange}
                  onRefresh={handleRefresh}
                  page={page}
                  title="Drivers"
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
