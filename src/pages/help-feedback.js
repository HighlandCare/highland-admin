import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Loader from "../components/Loader";
import { ROWS_PER_PAGE } from "../components/data-table";
import { SupportQueriesTable } from "../sections/help-feedback/support-queries-table";
import { listSupportQueries } from "../Services/support-queries.service";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import {
  getSupportQueriesFromResponse,
  getSupportQueriesPagination,
} from "../utils/supportQueryUtils";

const Page = () => {
  const router = useRouter();
  const searchTimerRef = useRef(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [category, setCategory] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  const loadQueries = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }

        const response = await listSupportQueries({
          page,
          limit: ROWS_PER_PAGE,
          status,
          role,
          category,
          search,
        });

        const list = getSupportQueriesFromResponse(response);
        const pagination = getSupportQueriesPagination(response, page);

        setRows(list);
        setTotal(pagination.total);
        setTotalPages(pagination.totalPages);
      } catch (error) {
        console.error("Error loading support queries:", error);
        setRows([]);
        setTotal(0);
        setTotalPages(1);
        toast.error(error.message || "Failed to load support queries");
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [page, status, role, category, search]
  );

  useEffect(() => {
    loadQueries();
  }, [loadQueries]);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const resetToFirstPage = (updater) => {
    updater();
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 350);
  };

  const hasData = rows.length > 0;

  return (
    <>
      <Head>
        <title>Help & Feedback | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack spacing={1}>
              <Typography sx={pageTitleSx} variant="h4">
                Help & Feedback
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Support queries from users, drivers, and restaurants
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
                <SupportQueriesTable
                  category={category}
                  items={rows}
                  loading={isLoading}
                  onCategoryChange={(value) =>
                    resetToFirstPage(() => setCategory(value))
                  }
                  onPageChange={handlePageChange}
                  onRoleChange={(value) => resetToFirstPage(() => setRole(value))}
                  onSearchChange={handleSearchChange}
                  onStatusChange={(value) => resetToFirstPage(() => setStatus(value))}
                  page={page}
                  role={role}
                  search={searchInput}
                  status={status}
                  total={total}
                  totalPages={totalPages}
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
