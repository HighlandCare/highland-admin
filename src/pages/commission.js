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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Loader from "../components/Loader";
import { ROWS_PER_PAGE } from "../components/data-table";
import { CommissionLogsTable } from "../sections/commission/commission-logs-table";
import { TransportationFareLogsTable } from "../sections/commission/transportation-fare-logs-table";
import {
  createCommissionLog,
  listCommissionLogs,
} from "../Services/commission.service";
import {
  getTransportationFare,
  publishTransportationFare,
} from "../Services/transportation-fare.service";
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
import {
  DEFAULT_TRANSPORTATION_FARE,
  FARE_FORMULA_LABEL,
  formatFareDollars,
  getActiveTransportationFare,
  getTransportationFareLogs,
  getTransportationFarePayload,
  validateFareDollars,
} from "../utils/transportationFareUtils";
import { pageContainerSx, pageMainSx, pageTitleSx, responsiveModalSx } from "../utils/pageLayout";

const DEFAULT_CATEGORY = SERVICE_CATEGORIES.TRANSPORTATION;
const TAB_COMMISSION = "commission";
const TAB_FARE = "fare";

const resolveCategory = (value) => {
  const match = SERVICE_CATEGORY_OPTIONS.find((option) => option.value === value);
  return match?.value || DEFAULT_CATEGORY;
};

const resolveTab = (value) => (value === TAB_FARE ? TAB_FARE : TAB_COMMISSION);

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

  const [fareBootLoading, setFareBootLoading] = useState(false);
  const [fareTableLoading, setFareTableLoading] = useState(false);
  const [fareSaving, setFareSaving] = useState(false);
  const [fareModalOpen, setFareModalOpen] = useState(false);
  const [fareActive, setFareActive] = useState(DEFAULT_TRANSPORTATION_FARE);
  const [fareLogs, setFareLogs] = useState([]);
  const [fareLogsTotal, setFareLogsTotal] = useState(0);
  const [farePage, setFarePage] = useState(1);
  const [perMileRate, setPerMileRate] = useState("");
  const [minimumFare, setMinimumFare] = useState("");
  const [fareLoaded, setFareLoaded] = useState(false);

  const activeCategory = useMemo(
    () => resolveCategory(router.query?.category),
    [router.query?.category]
  );

  const showFareTab = activeCategory === SERVICE_CATEGORIES.TRANSPORTATION;
  const activeTab = useMemo(() => {
    if (!showFareTab) {
      return TAB_COMMISSION;
    }
    return resolveTab(router.query?.tab);
  }, [router.query?.tab, showFareTab]);

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
          query: { category: DEFAULT_CATEGORY, tab: TAB_COMMISSION },
        },
        undefined,
        { shallow: true }
      );
      return;
    }

    if (rawCategory === SERVICE_CATEGORIES.TRANSPORTATION) {
      const rawTab = router.query?.tab;
      if (rawTab !== TAB_COMMISSION && rawTab !== TAB_FARE) {
        router.replace(
          {
            pathname: "/commission",
            query: { category: rawCategory, tab: TAB_COMMISSION },
          },
          undefined,
          { shallow: true }
        );
      }
    }
  }, [router, router.isReady, router.query?.category, router.query?.tab]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  useEffect(() => {
    setFarePage(1);
  }, [activeTab]);

  const handleTabChange = (_event, value) => {
    router.replace(
      {
        pathname: "/commission",
        query: { category: activeCategory, tab: value },
      },
      undefined,
      { shallow: true }
    );
  };

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

  const loadFare = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setFareTableLoading(true);
      }

      try {
        const response = await getTransportationFare({
          limit: Math.max(ROWS_PER_PAGE * 10, 100),
        });
        const payload = getTransportationFarePayload(response);
        const allLogs = getTransportationFareLogs(payload);
        const start = (farePage - 1) * ROWS_PER_PAGE;

        setFareActive(getActiveTransportationFare(payload));
        setFareLogs(allLogs.slice(start, start + ROWS_PER_PAGE));
        setFareLogsTotal(allLogs.length);
        setFareLoaded(true);
        return response;
      } catch (error) {
        setFareLogs([]);
        setFareLogsTotal(0);
        throw error;
      } finally {
        if (!silent) {
          setFareTableLoading(false);
        }
      }
    },
    [farePage]
  );

  useEffect(() => {
    if (!router.isReady || activeTab !== TAB_COMMISSION) {
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
  }, [activeTab, loadLogs, router.isReady]);

  useEffect(() => {
    if (!router.isReady || !showFareTab || activeTab !== TAB_FARE) {
      return undefined;
    }

    let active = true;

    const boot = async () => {
      try {
        if (!fareLoaded) {
          setFareBootLoading(true);
        }
        await loadFare({ silent: fareLoaded });
      } catch (error) {
        if (active) {
          toast.error(error.message || "Failed to load transportation fare");
        }
      } finally {
        if (active) {
          setFareBootLoading(false);
        }
      }
    };

    boot();
    return () => {
      active = false;
    };
  }, [activeTab, fareLoaded, loadFare, router.isReady, showFareTab]);

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

  const handleOpenFareCreate = () => {
    setPerMileRate(String(fareActive?.perMileRate ?? DEFAULT_TRANSPORTATION_FARE.perMileRate));
    setMinimumFare(String(fareActive?.minimumFare ?? DEFAULT_TRANSPORTATION_FARE.minimumFare));
    setFareModalOpen(true);
  };

  const handleCloseFareCreate = () => {
    if (fareSaving) return;
    setFareModalOpen(false);
  };

  const handleSaveFare = async () => {
    const validationError = validateFareDollars(perMileRate, minimumFare);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setFareSaving(true);
      const response = await publishTransportationFare({
        perMileRate: Number(perMileRate),
        minimumFare: Number(minimumFare),
      });
      toast.success(response?.message || "Transportation fare published");
      setFareModalOpen(false);

      if (farePage !== 1) {
        setFarePage(1);
      } else {
        await loadFare({ silent: true });
      }
    } catch (error) {
      toast.error(error.message || "Failed to publish transportation fare");
    } finally {
      setFareSaving(false);
    }
  };

  const validationError = percent === "" ? null : validateCommissionPercent(percent, limits);
  const saveDisabled = saving || Boolean(validationError) || percent === "";
  const fareValidationError = validateFareDollars(perMileRate, minimumFare);
  const fareSaveDisabled =
    fareSaving || Boolean(fareValidationError) || perMileRate === "" || minimumFare === "";
  const categoryLabel = formatServiceCategoryLabel(activeCategory);
  const currentActiveRate =
    activeRate?.commissionPercent ??
    logs[0]?.currentSetRate ??
    limits.defaultPercent ??
    DEFAULT_COMMISSION_LIMITS.defaultPercent;
  const fareFormula = fareActive?.formula || FARE_FORMULA_LABEL;

  return (
    <>
      <Head>
        <title>
          {activeTab === TAB_FARE
            ? `${categoryLabel} Transportation Fare | Highland Care`
            : `${categoryLabel} Platform Commission | Highland Care`}
        </title>
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
              </Stack>
              {activeTab === TAB_COMMISSION && !bootLoading ? (
                <Button color="primary" onClick={handleOpenCreate} variant="contained">
                  Set platform commission
                </Button>
              ) : null}
              {activeTab === TAB_FARE && !fareBootLoading ? (
                <Button color="primary" onClick={handleOpenFareCreate} variant="contained">
                  Set transportation fare
                </Button>
              ) : null}
            </Stack>

            {showFareTab ? (
              <Tabs
                onChange={handleTabChange}
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  minHeight: 42,
                  "& .MuiTab-root": {
                    minHeight: 42,
                    textTransform: "none",
                    fontWeight: 600,
                  },
                }}
                value={activeTab}
              >
                <Tab label="Commission" value={TAB_COMMISSION} />
                <Tab label="Fare" value={TAB_FARE} />
              </Tabs>
            ) : null}

            {activeTab === TAB_COMMISSION ? (
              bootLoading ? (
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
              )
            ) : null}

            {activeTab === TAB_FARE ? (
              fareBootLoading ? (
                <Loader page />
              ) : (
                <>
                  <Stack spacing={0.5}>
                    <Typography color="text.secondary" variant="body2">
                      {fareFormula}
                    </Typography>
                    <Typography
                      sx={{ color: "success.main", fontWeight: 600 }}
                      variant="body2"
                    >
                      Current {formatFareDollars(fareActive?.perMileRate)} / mi · Minimum{" "}
                      {formatFareDollars(fareActive?.minimumFare)}
                    </Typography>
                  </Stack>

                  <Box sx={{ position: "relative" }}>
                    {fareTableLoading ? (
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
                    <TransportationFareLogsTable
                      items={fareLogs}
                      loading={fareTableLoading}
                      onPageChange={setFarePage}
                      page={farePage}
                      title="Transportation fare change logs"
                      total={fareLogsTotal}
                    />
                  </Box>
                </>
              )
            ) : null}
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

      <Modal open={fareModalOpen} onClose={handleCloseFareCreate}>
        <Box sx={responsiveModalSx}>
          <Typography sx={{ mb: 0.5 }} variant="h6">
            Set transportation fare
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">
            Publishes a new fare version. {fareFormula}
          </Typography>

          <Stack spacing={2.25}>
            <TextField
              disabled
              label="Current per-mile rate"
              value={formatFareDollars(fareActive?.perMileRate)}
            />

            <TextField
              disabled
              label="Current minimum fare"
              value={formatFareDollars(fareActive?.minimumFare)}
            />

            <TextField
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              error={Boolean(fareValidationError && perMileRate !== "")}
              fullWidth
              inputProps={{ min: 0.01, step: 0.01 }}
              label="New per-mile rate"
              onChange={(event) => setPerMileRate(event.target.value)}
              type="number"
              value={perMileRate}
            />

            <TextField
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              error={Boolean(fareValidationError && minimumFare !== "")}
              fullWidth
              helperText={
                fareValidationError && (perMileRate !== "" || minimumFare !== "")
                  ? fareValidationError
                  : undefined
              }
              inputProps={{ min: 0.01, step: 0.01 }}
              label="New minimum fare"
              onChange={(event) => setMinimumFare(event.target.value)}
              type="number"
              value={minimumFare}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 0.5 }}>
              <Button
                color="inherit"
                disabled={fareSaving}
                fullWidth
                onClick={handleCloseFareCreate}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                disabled={fareSaveDisabled}
                fullWidth
                onClick={handleSaveFare}
                variant="contained"
              >
                {fareSaving ? <Loader color="#fff" inline size="xs" /> : "Set Fare"}
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
