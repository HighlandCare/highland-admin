import { React, useState, useEffect } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Container, Stack } from "@mui/material";
import { getDriverEarnings } from "../Services/Auth.service";
import { useRouter } from "next/router";
import Loader from "../components/Loader";
import { DriverEarningsTable } from "../sections/driver-earnings/driver-earnings-table";
import { ROWS_PER_PAGE } from "../components/data-table";
import { pageContainerSx, pageMainSx } from "../utils/pageLayout";
import { getListFromResponse } from "../utils/listUtils";

const Page = () => {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState({});
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

  const hasData = Boolean(getListFromResponse(earnings).length);

  return (
    <>
      <Head>
        <title>Driver Earnings | Highland Care</title>
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
