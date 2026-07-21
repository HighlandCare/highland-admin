import { React, useCallback, useEffect, useState } from "react";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Head from "next/head";
import { Box, Container, Stack } from "@mui/material";
import { getUsers } from "../Services/Auth.service";
import { useRouter } from "next/router";
import Loader from "../components/Loader";
import { UsersTable } from "../sections/users/users-table";
import { ROWS_PER_PAGE } from "../components/data-table";
import { pageContainerSx, pageMainSx } from "../utils/pageLayout";
import { excludeAdminUsersFromResponse } from "../utils/userUtils";

const Page = () => {
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState({});
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
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const response = await getUsers(page, ROWS_PER_PAGE);
        setUsers(excludeAdminUsersFromResponse(response));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [page]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRefresh = () => fetchUsers({ silent: true });

  const hasData = Boolean(users?.data?.length);

  return (
    <>
      <Head>
        <title>Users | Highland Care</title>
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
                <UsersTable
                  items={users}
                  onPageChange={handlePageChange}
                  onRefresh={handleRefresh}
                  page={page}
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
