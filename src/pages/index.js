import Head from "next/head";
import { React, useState, useEffect } from "react";
import {
  Box,
  Container,
  Unstable_Grid2 as Grid,
  Stack,
  Typography,
} from "@mui/material";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";

import { useRouter } from "next/navigation";
import BaseLayout from "../layouts/BaseLayout";
import Image from "next/image";
import Logo from "../../public/assets/logo.png";
import Loader from "../components/Loader";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import { OverviewBudget } from "../sections/overview/overview-budget";
import { OverviewTotalFeedbacks } from "../sections/overview/overview-total-feedbacks";

const Page = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(null);

  useEffect(() => {
    const loginStatus =
      typeof window !== "undefined" ? JSON.parse(localStorage.getItem("isLogin")) : null;

    setIsLogin(loginStatus);

    if (loginStatus === null) {
      router.push("/auth/login");
    } else {
      router.push("/");
    }
  }, []);

  const Layout = isLogin ? DashboardLayout : BaseLayout;

  return (
    <>
      <Head>
        <title>Home | Highland Care</title>
      </Head>
      <Layout>
        {isLogin ? (
          <Box component="main" sx={pageMainSx}>
            <Container maxWidth="xl" sx={pageContainerSx}>
              <Stack spacing={1} mb={4}>
                <Typography sx={pageTitleSx} variant="h4">
                  Dashboard
                </Typography>
              </Stack>
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                <Grid xs={12} md={6}>
                  <OverviewBudget sx={{ height: { xs: "auto", md: "90%" }, padding: 0 }} />
                </Grid>
                <Grid xs={12} md={6}>
                  <OverviewTotalFeedbacks sx={{ height: { xs: "auto", md: "90%" }, padding: 0 }} />
                </Grid>
              </Grid>
            </Container>
          </Box>
        ) : (
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              height: "100vh",
              justifyContent: "center",
              px: 2,
              width: "100%",
            }}
          >
            <Stack alignItems="center" spacing={3} sx={{ maxWidth: 320, width: "100%" }}>
              <Image src={Logo} height={100} style={{ height: "auto", maxWidth: "100%", width: "auto" }} />
              <Loader minHeight={120} size="md" sx={{ width: "100%" }} />
            </Stack>
          </Box>
        )}
      </Layout>
    </>
  );
};

export default Page;
