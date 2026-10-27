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
import { FoodDeliveryFareLogsTable } from "../sections/commission/food-delivery-fare-logs-table";
import { StopWaitingRateLogsTable } from "../sections/commission/stop-waiting-rate-logs-table";
import { TransportationFareLogsTable } from "../sections/commission/transportation-fare-logs-table";
import {
  createCommissionLog,
  listCommissionLogs,
} from "../Services/commission.service";
import {
  getFoodDeliveryFare,
  publishFoodDeliveryFare,
} from "../Services/food-delivery-fare.service";
import {
  getStopWaitingRate,
  publishStopWaitingRate,
} from "../Services/stop-waiting-rate.service";
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
  DEFAULT_FOOD_DELIVERY_FARE,
  formatFoodFareDollars,
  getActiveFoodDeliveryFare,
  getFoodDeliveryFareLogs,
  getFoodDeliveryFarePayload,
  validateFoodDeliveryFareDollars,
} from "../utils/foodDeliveryFareUtils";
import {
  DEFAULT_STOP_WAITING_RATE,
  formatWaitingRateDollars,
  getActiveStopWaitingRate,
  getStopWaitingRateLogs,
  getStopWaitingRatePayload,
  validateWaitingRateDollars,
} from "../utils/stopWaitingRateUtils";
import {
  DEFAULT_TRANSPORTATION_FARE,
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
const TAB_WAITING = "waiting";

const resolveCategory = (value) => {
  const match = SERVICE_CATEGORY_OPTIONS.find((option) => option.value === value);
  return match?.value || DEFAULT_CATEGORY;
};

const resolveTab = (value, category) => {
  if (value === TAB_FARE) return TAB_FARE;
  if (value === TAB_WAITING && category === SERVICE_CATEGORIES.TRANSPORTATION) {
    return TAB_WAITING;
  }
  return TAB_COMMISSION;
};

const pageHeadingForTab = (tab, category) => {
  if (category === SERVICE_CATEGORIES.FOOD_BEVERAGE) {
    if (tab === TAB_FARE) return "Food Delivery Fare";
    return "Food & Beverage Commission";
  }

  if (tab === TAB_FARE) return "Transportation Fare";
  if (tab === TAB_WAITING) return "Stop Waiting Rate";
  return "Platform Commission";
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

  const [waitingBootLoading, setWaitingBootLoading] = useState(false);
  const [waitingTableLoading, setWaitingTableLoading] = useState(false);
  const [waitingSaving, setWaitingSaving] = useState(false);
  const [waitingModalOpen, setWaitingModalOpen] = useState(false);
  const [waitingActive, setWaitingActive] = useState(DEFAULT_STOP_WAITING_RATE);
  const [waitingLogs, setWaitingLogs] = useState([]);
  const [waitingLogsTotal, setWaitingLogsTotal] = useState(0);
  const [waitingPage, setWaitingPage] = useState(1);
  const [waitingRatePerMinute, setWaitingRatePerMinute] = useState("");
  const [waitingLoaded, setWaitingLoaded] = useState(false);

  const [foodFareBootLoading, setFoodFareBootLoading] = useState(false);
  const [foodFareTableLoading, setFoodFareTableLoading] = useState(false);
  const [foodFareSaving, setFoodFareSaving] = useState(false);
  const [foodFareModalOpen, setFoodFareModalOpen] = useState(false);
  const [foodFareActive, setFoodFareActive] = useState(DEFAULT_FOOD_DELIVERY_FARE);
  const [foodFareLogs, setFoodFareLogs] = useState([]);
  const [foodFareLogsTotal, setFoodFareLogsTotal] = useState(0);
  const [foodFarePage, setFoodFarePage] = useState(1);
  const [foodPerMileRate, setFoodPerMileRate] = useState("");
  const [foodMinimumFare, setFoodMinimumFare] = useState("");
  const [foodFareLoaded, setFoodFareLoaded] = useState(false);

  const activeCategory = useMemo(
    () => resolveCategory(router.query?.category),
    [router.query?.category]
  );

  const isTransportation = activeCategory === SERVICE_CATEGORIES.TRANSPORTATION;
  const isFoodBeverage = activeCategory === SERVICE_CATEGORIES.FOOD_BEVERAGE;
  const showRateTabs = isTransportation || isFoodBeverage;
  const activeTab = useMemo(() => {
    if (!showRateTabs) {
      return TAB_COMMISSION;
    }
    return resolveTab(router.query?.tab, activeCategory);
  }, [activeCategory, router.query?.tab, showRateTabs]);

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

    const rawTab = router.query?.tab;

    if (rawCategory === SERVICE_CATEGORIES.TRANSPORTATION) {
      if (rawTab !== TAB_COMMISSION && rawTab !== TAB_FARE && rawTab !== TAB_WAITING) {
        router.replace(
          {
            pathname: "/commission",
            query: { category: rawCategory, tab: TAB_COMMISSION },
          },
          undefined,
          { shallow: true }
        );
      }
      return;
    }

    if (rawCategory === SERVICE_CATEGORIES.FOOD_BEVERAGE) {
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
      return;
    }

    if (rawTab !== TAB_COMMISSION) {
      router.replace(
        {
          pathname: "/commission",
          query: { category: rawCategory, tab: TAB_COMMISSION },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [router, router.isReady, router.query?.category, router.query?.tab]);

  useEffect(() => {
    setPage(1);
    setFoodFareLoaded(false);
    setFareLoaded(false);
    setWaitingLoaded(false);
  }, [activeCategory]);

  useEffect(() => {
    if (activeTab === TAB_FARE && isTransportation) {
      setFarePage(1);
    }
    if (activeTab === TAB_FARE && isFoodBeverage) {
      setFoodFarePage(1);
    }
    if (activeTab === TAB_WAITING) {
      setWaitingPage(1);
    }
  }, [activeTab, isFoodBeverage, isTransportation]);

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

  const loadWaiting = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setWaitingTableLoading(true);
      }

      try {
        const response = await getStopWaitingRate({
          limit: Math.max(ROWS_PER_PAGE * 10, 100),
        });
        const payload = getStopWaitingRatePayload(response);
        const allLogs = getStopWaitingRateLogs(payload);
        const start = (waitingPage - 1) * ROWS_PER_PAGE;

        setWaitingActive(getActiveStopWaitingRate(payload));
        setWaitingLogs(allLogs.slice(start, start + ROWS_PER_PAGE));
        setWaitingLogsTotal(allLogs.length);
        setWaitingLoaded(true);
        return response;
      } catch (error) {
        setWaitingLogs([]);
        setWaitingLogsTotal(0);
        throw error;
      } finally {
        if (!silent) {
          setWaitingTableLoading(false);
        }
      }
    },
    [waitingPage]
  );

  const loadFoodFare = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setFoodFareTableLoading(true);
      }

      try {
        const response = await getFoodDeliveryFare({
          limit: Math.max(ROWS_PER_PAGE * 10, 100),
        });
        const payload = getFoodDeliveryFarePayload(response);
        const allLogs = getFoodDeliveryFareLogs(payload);
        const start = (foodFarePage - 1) * ROWS_PER_PAGE;

        setFoodFareActive(getActiveFoodDeliveryFare(payload));
        setFoodFareLogs(allLogs.slice(start, start + ROWS_PER_PAGE));
        setFoodFareLogsTotal(payload.total || allLogs.length);
        setFoodFareLoaded(true);
        return response;
      } catch (error) {
        setFoodFareLogs([]);
        setFoodFareLogsTotal(0);
        throw error;
      } finally {
        if (!silent) {
          setFoodFareTableLoading(false);
        }
      }
    },
    [foodFarePage]
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
    if (!router.isReady || !isTransportation || activeTab !== TAB_FARE) {
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
  }, [activeTab, fareLoaded, isTransportation, loadFare, router.isReady]);

  useEffect(() => {
    if (!router.isReady || !isFoodBeverage || activeTab !== TAB_FARE) {
      return undefined;
    }

    let active = true;

    const boot = async () => {
      try {
        if (!foodFareLoaded) {
          setFoodFareBootLoading(true);
        }
        await loadFoodFare({ silent: foodFareLoaded });
      } catch (error) {
        if (active) {
          toast.error(error.message || "Failed to load food delivery fare");
        }
      } finally {
        if (active) {
          setFoodFareBootLoading(false);
        }
      }
    };

    boot();
    return () => {
      active = false;
    };
  }, [activeTab, foodFareLoaded, isFoodBeverage, loadFoodFare, router.isReady]);

  useEffect(() => {
    if (!router.isReady || !isTransportation || activeTab !== TAB_WAITING) {
      return undefined;
    }

    let active = true;

    const boot = async () => {
      try {
        if (!waitingLoaded) {
          setWaitingBootLoading(true);
        }
        await loadWaiting({ silent: waitingLoaded });
      } catch (error) {
        if (active) {
          toast.error(error.message || "Failed to load stop waiting rate");
        }
      } finally {
        if (active) {
          setWaitingBootLoading(false);
        }
      }
    };

    boot();
    return () => {
      active = false;
    };
  }, [activeTab, isTransportation, loadWaiting, router.isReady, waitingLoaded]);

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
      await createCommissionLog({
        serviceCategory: activeCategory,
        commissionPercent: Number(percent),
      });
      toast.success(
        activeCategory === SERVICE_CATEGORIES.FOOD_BEVERAGE
          ? "Food & beverage commission updated successfully"
          : "Platform commission updated successfully"
      );
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
      await publishTransportationFare({
        perMileRate: Number(perMileRate),
        minimumFare: Number(minimumFare),
      });
      toast.success("Transportation fare published successfully");
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

  const handleOpenFoodFareCreate = () => {
    setFoodPerMileRate(
      String(foodFareActive?.perMileRate ?? DEFAULT_FOOD_DELIVERY_FARE.perMileRate)
    );
    setFoodMinimumFare(
      String(foodFareActive?.minimumFare ?? DEFAULT_FOOD_DELIVERY_FARE.minimumFare)
    );
    setFoodFareModalOpen(true);
  };

  const handleCloseFoodFareCreate = () => {
    if (foodFareSaving) return;
    setFoodFareModalOpen(false);
  };

  const handleSaveFoodFare = async () => {
    const validationError = validateFoodDeliveryFareDollars(foodPerMileRate, foodMinimumFare);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setFoodFareSaving(true);
      await publishFoodDeliveryFare({
        perMileRate: Number(foodPerMileRate),
        minimumFare: Number(foodMinimumFare),
      });
      toast.success("Food delivery fare published successfully");
      setFoodFareModalOpen(false);

      if (foodFarePage !== 1) {
        setFoodFarePage(1);
      } else {
        await loadFoodFare({ silent: true });
      }
    } catch (error) {
      toast.error(error.message || "Failed to publish food delivery fare");
    } finally {
      setFoodFareSaving(false);
    }
  };

  const handleOpenWaitingCreate = () => {
    setWaitingRatePerMinute(
      String(waitingActive?.waitingRatePerMinute ?? DEFAULT_STOP_WAITING_RATE.waitingRatePerMinute)
    );
    setWaitingModalOpen(true);
  };

  const handleCloseWaitingCreate = () => {
    if (waitingSaving) return;
    setWaitingModalOpen(false);
  };

  const handleSaveWaiting = async () => {
    const validationError = validateWaitingRateDollars(waitingRatePerMinute);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setWaitingSaving(true);
      await publishStopWaitingRate({
        waitingRatePerMinute: Number(waitingRatePerMinute),
      });
      toast.success("Stop waiting rate published successfully");
      setWaitingModalOpen(false);

      if (waitingPage !== 1) {
        setWaitingPage(1);
      } else {
        await loadWaiting({ silent: true });
      }
    } catch (error) {
      toast.error(error.message || "Failed to publish stop waiting rate");
    } finally {
      setWaitingSaving(false);
    }
  };

  const validationError = percent === "" ? null : validateCommissionPercent(percent, limits);
  const saveDisabled = saving || Boolean(validationError) || percent === "";
  const fareValidationError = validateFareDollars(perMileRate, minimumFare);
  const fareSaveDisabled =
    fareSaving || Boolean(fareValidationError) || perMileRate === "" || minimumFare === "";
  const foodFareValidationError = validateFoodDeliveryFareDollars(foodPerMileRate, foodMinimumFare);
  const foodFareSaveDisabled =
    foodFareSaving ||
    Boolean(foodFareValidationError) ||
    foodPerMileRate === "" ||
    foodMinimumFare === "";
  const waitingValidationError = validateWaitingRateDollars(waitingRatePerMinute);
  const waitingSaveDisabled =
    waitingSaving || Boolean(waitingValidationError) || waitingRatePerMinute === "";
  const categoryLabel = formatServiceCategoryLabel(activeCategory);
  const currentActiveRate =
    activeRate?.commissionPercent ??
    logs[0]?.currentSetRate ??
    limits.defaultPercent ??
    DEFAULT_COMMISSION_LIMITS.defaultPercent;
  const pageHeading = pageHeadingForTab(activeTab, activeCategory);

  return (
    <>
      <Head>
        <title>{pageHeading} | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3} sx={{ flex: 1 }}>
            <Stack
              alignItems={{ xs: "stretch", sm: "flex-start" }}
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={2}
              sx={{ width: "100%" }}
            >
              <Stack spacing={1} sx={{ minWidth: 0 }}>
                <Typography sx={pageTitleSx} variant="h4">
                  {pageHeading}
                </Typography>
              </Stack>
              {activeTab === TAB_COMMISSION && !bootLoading ? (
                <Button
                  color="primary"
                  onClick={handleOpenCreate}
                  sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}
                  variant="contained"
                >
                  {activeCategory === SERVICE_CATEGORIES.FOOD_BEVERAGE
                    ? "Set food commission"
                    : "Set platform commission"}
                </Button>
              ) : null}
              {activeTab === TAB_FARE && isTransportation && !fareBootLoading ? (
                <Button
                  color="primary"
                  onClick={handleOpenFareCreate}
                  sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}
                  variant="contained"
                >
                  Set transportation fare
                </Button>
              ) : null}
              {activeTab === TAB_FARE && isFoodBeverage && !foodFareBootLoading ? (
                <Button
                  color="primary"
                  onClick={handleOpenFoodFareCreate}
                  sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}
                  variant="contained"
                >
                  Set food delivery fare
                </Button>
              ) : null}
              {activeTab === TAB_WAITING && isTransportation && !waitingBootLoading ? (
                <Button
                  color="primary"
                  onClick={handleOpenWaitingCreate}
                  sx={{ width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}
                  variant="contained"
                >
                  Set stop waiting rate
                </Button>
              ) : null}
            </Stack>

            {showRateTabs ? (
              <Tabs
                allowScrollButtonsMobile
                onChange={handleTabChange}
                scrollButtons="auto"
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  minHeight: 42,
                  width: "100%",
                  maxWidth: "100%",
                  "& .MuiTab-root": {
                    minHeight: 42,
                    minWidth: "auto",
                    px: { xs: 1.5, sm: 2 },
                    textTransform: "none",
                    fontWeight: 600,
                  },
                }}
                value={activeTab}
                variant="scrollable"
              >
                <Tab label="Commission" value={TAB_COMMISSION} />
                <Tab label="Fare" value={TAB_FARE} />
                {isTransportation ? <Tab label="Stop Waiting" value={TAB_WAITING} /> : null}
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

            {activeTab === TAB_FARE && isTransportation ? (
              fareBootLoading ? (
                <Loader page />
              ) : (
                <>
                  <Stack spacing={0.5}>
                    <Typography
                      sx={{ color: "success.main", fontWeight: 600 }}
                      variant="body2"
                    >
                      Current {formatFareDollars(fareActive?.perMileRate)} / mi · Minimum Fare{" "}
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

            {activeTab === TAB_FARE && isFoodBeverage ? (
              foodFareBootLoading ? (
                <Loader page />
              ) : (
                <>
                  <Stack spacing={0.5}>
                    <Typography
                      sx={{ color: "success.main", fontWeight: 600 }}
                      variant="body2"
                    >
                      Current {formatFoodFareDollars(foodFareActive?.perMileRate)} / mi · Minimum
                      Fare {formatFoodFareDollars(foodFareActive?.minimumFare)}
                    </Typography>
                  </Stack>

                  <Box sx={{ position: "relative" }}>
                    {foodFareTableLoading ? (
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
                    <FoodDeliveryFareLogsTable
                      items={foodFareLogs}
                      loading={foodFareTableLoading}
                      onPageChange={setFoodFarePage}
                      page={foodFarePage}
                      title="Food delivery fare change logs"
                      total={foodFareLogsTotal}
                    />
                  </Box>
                </>
              )
            ) : null}

            {activeTab === TAB_WAITING && isTransportation ? (
              waitingBootLoading ? (
                <Loader page />
              ) : (
                <>
                  <Stack spacing={0.5}>
                    <Typography
                      sx={{ color: "success.main", fontWeight: 600 }}
                      variant="body2"
                    >
                      Current {formatWaitingRateDollars(waitingActive?.waitingRatePerMinute)} / min
                    </Typography>
                  </Stack>

                  <Box sx={{ position: "relative" }}>
                    {waitingTableLoading ? (
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
                    <StopWaitingRateLogsTable
                      items={waitingLogs}
                      loading={waitingTableLoading}
                      onPageChange={setWaitingPage}
                      page={waitingPage}
                      title="Stop waiting rate change logs"
                      total={waitingLogsTotal}
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
            {activeCategory === SERVICE_CATEGORIES.FOOD_BEVERAGE
              ? "Set food commission"
              : "Set platform commission"}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">
            Creates a new {categoryLabel.toLowerCase()} commission rate ({limits.minPercent}% –{" "}
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
            Publishes a new fare version.
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

      <Modal open={waitingModalOpen} onClose={handleCloseWaitingCreate}>
        <Box sx={responsiveModalSx}>
          <Typography sx={{ mb: 0.5 }} variant="h6">
            Set stop waiting rate
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">
            Publishes a new stop waiting rate for intermediate stops.
          </Typography>

          <Stack spacing={2.25}>
            <TextField
              disabled
              label="Current rate"
              value={`${formatWaitingRateDollars(waitingActive?.waitingRatePerMinute)} / min`}
            />

            <TextField
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                endAdornment: <InputAdornment position="end">/ min</InputAdornment>,
              }}
              error={Boolean(waitingValidationError && waitingRatePerMinute !== "")}
              fullWidth
              helperText={
                waitingValidationError && waitingRatePerMinute !== ""
                  ? waitingValidationError
                  : undefined
              }
              inputProps={{ min: 0.01, step: 0.01 }}
              label="New rate"
              onChange={(event) => setWaitingRatePerMinute(event.target.value)}
              type="number"
              value={waitingRatePerMinute}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 0.5 }}>
              <Button
                color="inherit"
                disabled={waitingSaving}
                fullWidth
                onClick={handleCloseWaitingCreate}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                disabled={waitingSaveDisabled}
                fullWidth
                onClick={handleSaveWaiting}
                variant="contained"
              >
                {waitingSaving ? <Loader color="#fff" inline size="xs" /> : "Set Rate"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      <Modal open={foodFareModalOpen} onClose={handleCloseFoodFareCreate}>
        <Box sx={responsiveModalSx}>
          <Typography sx={{ mb: 0.5 }} variant="h6">
            Set food delivery fare
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2.5 }} variant="body2">
            Publishes a new food delivery fare version.
          </Typography>

          <Stack spacing={2.25}>
            <TextField
              disabled
              label="Current per-mile rate"
              value={formatFoodFareDollars(foodFareActive?.perMileRate)}
            />

            <TextField
              disabled
              label="Current minimum fare"
              value={formatFoodFareDollars(foodFareActive?.minimumFare)}
            />

            <TextField
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              error={Boolean(foodFareValidationError && foodPerMileRate !== "")}
              fullWidth
              inputProps={{ min: 0.01, step: 0.01 }}
              label="New per-mile rate"
              onChange={(event) => setFoodPerMileRate(event.target.value)}
              type="number"
              value={foodPerMileRate}
            />

            <TextField
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              error={Boolean(foodFareValidationError && foodMinimumFare !== "")}
              fullWidth
              helperText={
                foodFareValidationError && (foodPerMileRate !== "" || foodMinimumFare !== "")
                  ? foodFareValidationError
                  : undefined
              }
              inputProps={{ min: 0.01, step: 0.01 }}
              label="New minimum fare"
              onChange={(event) => setFoodMinimumFare(event.target.value)}
              type="number"
              value={foodMinimumFare}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ pt: 0.5 }}>
              <Button
                color="inherit"
                disabled={foodFareSaving}
                fullWidth
                onClick={handleCloseFoodFareCreate}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                disabled={foodFareSaveDisabled}
                fullWidth
                onClick={handleSaveFoodFare}
                variant="contained"
              >
                {foodFareSaving ? <Loader color="#fff" inline size="xs" /> : "Set Fare"}
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
