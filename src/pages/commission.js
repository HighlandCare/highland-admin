import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Container,
  InputAdornment,
  Modal,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Loader from "../components/Loader";
import { ROWS_PER_PAGE } from "../components/data-table";
import { CommissionLogsTable } from "../sections/commission/commission-logs-table";
import {
  createCommissionLog,
  listCommissionLogs,
} from "../Services/commission.service";
import {
  DEFAULT_COMMISSION_LIMITS,
  formatServiceCategoryLabel,
  getActiveCommissionRate,
  getCommissionLimits,
  getCommissionLogs,
  getCommissionLogsTotal,
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_OPTIONS,
  toCommissionPercent,
  validateCommissionPercent,
} from "../utils/commissionUtils";
import { pageContainerSx, pageMainSx, pageTitleSx, responsiveModalSx } from "../utils/pageLayout";

const DEFAULT_CATEGORY = SERVICE_CATEGORIES.TRANSPORTATION;

const resolveCategory = (value) => {
  const match = SERVICE_CATEGORY_OPTIONS.find((option) => option.value === value);
  return match?.value || DEFAULT_CATEGORY;
};

const formatRate = (value) => {
  const percent = toCommissionPercent(value);
  return percent != null ? `${percent}%` : "—";
};

const Page = () => {
  const router = useRouter();
  const [bootLoading, setBootLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [limits, setLimits] = useState(getCommissionLimits({}));
  const [activeRate, setActiveRate] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [percent, setPercent] = useState("");

  const activeCategory = useMemo(
    () => resolveCategory(router.query?.category),
    [router.query?.category]
  );

  useEffect(() => {
    const isLogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!isLogin) {
      router.push("/auth/login");
    }
  }, [router]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const rawCategory = router.query?.category;
    if (!rawCategory || !SERVICE_CATEGORY_OPTIONS.some((option) => option.value === rawCategory)) {
      router.replace(
        {
          pathname: "/commission",
          query: { category: DEFAULT_CATEGORY },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [router, router.isReady, router.query?.category]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  const loadLogs = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setTableLoading(true);
      }

      try {
        let response;
        let usedClientFilter = false;

        try {
          response = await listCommissionLogs({
            limit: ROWS_PER_PAGE,
            skip: (page - 1) * ROWS_PER_PAGE,
            serviceCategory: activeCategory,
          });
        } catch (filteredError) {
          // Some API builds 500 on ?serviceCategory= — fall back to full list.
          usedClientFilter = true;
          response = await listCommissionLogs({
            limit: Math.max(ROWS_PER_PAGE * 10, 100),
            skip: 0,
          });
        }

        setLimits(getCommissionLimits(response));
        setActiveRate(getActiveCommissionRate(response, activeCategory));

        const allLogs = getCommissionLogs(response).filter(
          (log) => !log.serviceCategory || log.serviceCategory === activeCategory
        );

        if (usedClientFilter) {
          const start = (page - 1) * ROWS_PER_PAGE;
          setLogs(allLogs.slice(start, start + ROWS_PER_PAGE));
          setLogsTotal(allLogs.length);
        } else {
          setLogs(allLogs);
          setLogsTotal(getCommissionLogsTotal(response));
        }

        return response;
      } catch (error) {
        setLogs([]);
        setLogsTotal(0);
        throw error;
      } finally {
        if (!silent) {
          setTableLoading(false);
        }
      }
    },
    [activeCategory, page]
  );

  useEffect(() => {
    if (!router.isReady) {
      return undefined;
    }

    let active = true;

    const boot = async () => {
      try {
        setBootLoading(true);
        await loadLogs({ silent: true });
      } catch (error) {
        if (active) {
          toast.error(error.message || "Failed to load platform commission logs");
        }
      } finally {
        if (active) {
          setBootLoading(false);
        }
      }
    };

    boot();
    return () => {
      active = false;
    };
  }, [loadLogs, router.isReady]);

  const handleOpenCreate = () => {
    const current =
      activeRate?.commissionPercent ??
      logs[0]?.currentSetRate ??
      limits.defaultPercent ??
      DEFAULT_COMMISSION_LIMITS.defaultPercent;
    setPercent(String(current ?? ""));
    setCreateModalOpen(true);
  };

  const handleCloseCreate = () => {
    if (saving) return;
    setCreateModalOpen(false);
  };

  const handleSave = async () => {
    const validationError = validateCommissionPercent(percent, limits);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);
      const response = await createCommissionLog({
        serviceCategory: activeCategory,
        commissionPercent: Number(percent),
      });
      toast.success(response?.message || "Platform commission log created");
      setCreateModalOpen(false);

      if (page !== 1) {
        setPage(1);
      } else {
        await loadLogs({ silent: true });
      }
    } catch (error) {
      toast.error(error.message || "Failed to create platform commission log");
    } finally {
      setSaving(false);
    }
  };

  const validationError = percent === "" ? null : validateCommissionPercent(percent, limits);
  const saveDisabled = saving || Boolean(validationError) || percent === "";
  const categoryLabel = formatServiceCategoryLabel(activeCategory);
  const currentActiveRate =
    activeRate?.commissionPercent ??
    logs[0]?.currentSetRate ??
    limits.defaultPercent ??
    DEFAULT_COMMISSION_LIMITS.defaultPercent;

  return (
    <>
      <Head>
        <title>{categoryLabel} Platform Commission | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack
              alignItems={{ xs: "stretch", sm: "flex-start" }}
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack spacing={1}>
                <Typography sx={pageTitleSx} variant="h4">
                  {categoryLabel}
                </Typography>
                {/* <Typography color="text.secondary" variant="body2">
                  Append-only platform commission logs
                </Typography> */}
              </Stack>
              {!bootLoading ? (
                <Button color="primary" onClick={handleOpenCreate} variant="contained">
                  Set platform commission
                </Button>
              ) : null}
            </Stack>

            {bootLoading ? (
              <Loader page />
            ) : (
              <>
                <Stack spacing={0.5}>
                  <Typography color="text.secondary" variant="body2">
                    Allowed range {limits.minPercent}% – {limits.maxPercent}%
                  </Typography>
                  <Typography
                    sx={{ color: "success.main", fontWeight: 600 }}
                    variant="body2"
                  >
                    Current rate {formatRate(currentActiveRate)}
                  </Typography>
                </Stack>

                <Box sx={{ position: "relative" }}>
                  {tableLoading ? (
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
                  ) : null}
                  <CommissionLogsTable
                    items={logs}
                    loading={tableLoading}
                    onPageChange={setPage}
                    page={page}
                    title="Platform commission audit logs"
                    total={logsTotal}
                  />
                </Box>
              </>
            )}
          </Stack>
        </Container>
      </Box>

      <Modal open={createModalOpen} onClose={handleCloseCreate}>
        <Box sx={responsiveModalSx}>
          <Typography sx={{ mb: 0.5 }} variant="h6">
            Set platform commission
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">
            Creates a new platform commission rate ({limits.minPercent}% –{" "}
            {limits.maxPercent}%).
          </Typography>

          <Stack spacing={2.25}>
            <TextField disabled label="Service category" value={categoryLabel} />

            <TextField
              disabled
              label="Current rate"
              value={formatRate(currentActiveRate)}
            />

            <TextField
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              error={Boolean(validationError)}
              fullWidth
              helperText={validationError || undefined}
              inputProps={{ min: limits.minPercent, max: limits.maxPercent, step: 0.01 }}
              label="New rate"
              onChange={(event) => setPercent(event.target.value)}
              type="number"
              value={percent}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 0.5 }}>
              <Button
                color="inherit"
                disabled={saving}
                fullWidth
                onClick={handleCloseCreate}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button disabled={saveDisabled} fullWidth onClick={handleSave} variant="contained">
                {saving ? <Loader color="#fff" inline size="xs" /> : "Set Rate"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
