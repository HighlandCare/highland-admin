import { React, useCallback, useEffect, useRef, useState } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Container, Stack, Typography } from "@mui/material";
import { getUsers } from "../Services/Auth.service";
import { useRouter } from "next/router";
import { DataTableLoadingShell, ROWS_PER_PAGE } from "../components/data-table";
import { UsersTable } from "../sections/users/users-table";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import { excludeAdminUsersFromResponse } from "../utils/userUtils";
import {
  LIST_FILTER_KEYS,
  createListFilterRouteGuard,
} from "../utils/listFilterState";

const Page = () => {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState({});
  const loadedOnceRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  const fetchUsers = useCallback(
    async ({ silent = false } = {}) => {
      const block = !silent && !loadedOnceRef.current;
      try {
        if (block) {
          setIsLoading(true);
        }
        const response = await getUsers(page, ROWS_PER_PAGE);
        setUsers(excludeAdminUsersFromResponse(response));
        loadedOnceRef.current = true;
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [page]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handleRouteChangeStart = createListFilterRouteGuard(LIST_FILTER_KEYS.users, {
      listPath: "/users",
      detailPaths: ["/users/detail"],
    });

    router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [router.events]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => fetchUsers({ silent: true });

  return (
    <>
      <Head>
        <title>Users | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Typography sx={pageTitleSx} variant="h4">
              Users List
            </Typography>

            <DataTableLoadingShell loading={isLoading}>
              <UsersTable
                items={users}
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
