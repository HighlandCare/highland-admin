import { useCallback, useEffect, useRef, useState } from "react";
import Head from "next/head";
import { Box, Container, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import { DataTableLoadingShell, ROWS_PER_PAGE } from "../components/data-table";
import { SupportQueriesTable } from "../sections/help-feedback/support-queries-table";
import { listSupportQueries } from "../Services/support-queries.service";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../utils/pageLayout";
import {
  getSupportQueriesFromResponse,
  getSupportQueriesPagination,
} from "../utils/supportQueryUtils";
import {
  LIST_FILTER_KEYS,
  consumeListFilterState,
  createListFilterRouteGuard,
} from "../utils/listFilterState";

const Page = () => {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const loadedOnceRef = useRef(false);

  useEffect(() => {
    const islogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!islogin) {
      setIsLoading(true);
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    const stored = consumeListFilterState(LIST_FILTER_KEYS.helpFeedback);
    if (stored) {
      setPage(stored.page || 1);
      setStatus(stored.filters?.status ?? "all");
      setRole(stored.filters?.role ?? "all");
      setCategory(stored.filters?.category ?? "all");
      setSearch(stored.filters?.search ?? "");
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const handleRouteChangeStart = createListFilterRouteGuard(LIST_FILTER_KEYS.helpFeedback, {
      listPath: "/help-feedback",
      detailPaths: ["/help-feedback/detail"],
    });

    router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, [router.events]);

  const loadQueries = useCallback(
    async ({ silent = false } = {}) => {
      const block = !silent && !loadedOnceRef.current;
      try {
        if (block) {
          setIsLoading(true);
        }

        // Server-side filters (incl. submitter role) — one page request, no full dump.
        const response = await listSupportQueries({
          page,
          limit: ROWS_PER_PAGE,
          status,
          category,
          search,
          role,
        });

        const list = getSupportQueriesFromResponse(response);
        const pagination = getSupportQueriesPagination(response, page);

        setRows(list);
        setTotal(pagination.total);
        setTotalPages(pagination.totalPages);
        loadedOnceRef.current = true;
      } catch (error) {
        console.error("Error loading support queries:", error);
        setRows([]);
        setTotal(0);
        setTotalPages(1);
        toast.error(error.message || "Failed to load support queries");
      } finally {
        setIsLoading(false);
      }
    },
    [page, status, role, category, search]
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    loadQueries();
  }, [hydrated, loadQueries]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const resetToFirstPage = (updater) => {
    updater();
    setPage(1);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(1);
  };

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

            <DataTableLoadingShell loading={isLoading}>
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
                search={search}
                status={status}
                total={total}
                totalPages={totalPages}
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
