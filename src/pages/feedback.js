/* eslint-disable react/jsx-max-props-per-line */
import { React, useState, useEffect } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Container, Stack } from "@mui/material";
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import { getFeedbacks } from "../Services/Auth.service";
import { FeedbackTable } from "../sections/feedback/feedback-table";
import { ROWS_PER_PAGE } from "../components/data-table";
import { pageContainerSx, pageMainSx } from "../utils/pageLayout";

const Page = () => {
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState({});
  const [isLoading, setIsLoading] = useState(true);
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

    const fetchFeedback = async () => {
      try {
        setIsLoading(true);
        const response = await getFeedbacks(page, ROWS_PER_PAGE);
        if (active) {
          setFeedback(response?.data ?? response);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchFeedback();

    return () => {
      active = false;
    };
  }, [page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const hasData = Boolean(feedback?.feedbacks?.length);

  return (
    <>
      <Head>
        <title>Feedbacks | Aldeberan</title>
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
                <FeedbackTable items={feedback} page={page} onPageChange={handlePageChange} />
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
