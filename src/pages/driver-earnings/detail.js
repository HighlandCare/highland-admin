import { useEffect, useState } from "react";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import ArrowLeftIcon from "@heroicons/react/24/outline/ArrowLeftIcon";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import Loader from "../../components/Loader";
import { DriverTransactionHistory } from "../../components/driver-transaction-history";
import { getChap, getChaperoneById, getDriverEarnings, getDriverTransactions } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { getDriverList, normalizeChaperoneDetailResponse } from "../../utils/driverUtils";
import { fetchAllPages } from "../../utils/listUtils";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../../utils/pageLayout";
import {
  formatEarningsCurrency,
  getEarningsChaperoneIdCandidates,
  getEarningsDriverId,
  getEarningsDriverImage,
  getEarningsDriverName,
  getStoredEarningsDetail,
  getTransactionsFromDriverRecord,
  normalizeDriverTransactions,
} from "../../utils/earningsUtils";
import { ROWS_PER_PAGE } from "../../components/data-table";

const hasDetailValue = (value) => {
  if (value == null) {
    return false;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed !== "" && trimmed !== "—";
  }

  return true;
};

const DetailItem = ({ label, value }) => {
  const isEmail = label === "Email" || (typeof value === "string" && value.includes("@"));
  const displayValue = isEmail && value ? String(value).toLowerCase() : value;

  if (!hasDetailValue(displayValue)) {
    return null;
  }

  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        data-email={isEmail ? "true" : undefined}
        fontWeight={600}
        sx={{ wordBreak: "break-word", ...(isEmail ? { textTransform: "lowercase" } : {}) }}
        variant="body2"
      >
        {displayValue}
      </Typography>
    </Box>
  );
};

const SectionCard = ({ children, title }) => (
  <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none", height: "100%" }}>
    <CardContent>
      <Typography sx={{ mb: 2 }} variant="h6">
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const loadTransactionsForEarningsDriver = async (driver) => {
  const nestedTransactions = getTransactionsFromDriverRecord(driver);
  if (nestedTransactions.length) {
    return nestedTransactions;
  }

  const candidateIds = getEarningsChaperoneIdCandidates(driver);

  for (const candidateId of candidateIds) {
    try {
      const response = await getChaperoneById(candidateId);
      const detail = normalizeChaperoneDetailResponse(response);
      const transactions = normalizeDriverTransactions(detail?.transactionHistory || []);
      if (transactions.length) {
        return transactions;
      }
    } catch (error) {
      // Try next candidate
    }
  }

  try {
    const chaperones = await fetchAllPages(
      (page) => getChap(page, ROWS_PER_PAGE),
      { getItems: getDriverList, pageSize: ROWS_PER_PAGE }
    );

    const driverEmail = driver?.email ? String(driver.email).toLowerCase() : null;
    const matchedChaperone = chaperones.find((item) => {
      const email = item?.user?.email ? String(item.user.email).toLowerCase() : null;
      const ids = [item?._id, item?.user?._id, item?.userId].filter(Boolean).map(String);

      return (
        (driverEmail && email === driverEmail) ||
        candidateIds.some((id) => ids.includes(String(id)))
      );
    });

    if (matchedChaperone?._id) {
      const response = await getChaperoneById(matchedChaperone._id);
      const detail = normalizeChaperoneDetailResponse(response);
      const transactions = normalizeDriverTransactions(detail?.transactionHistory || []);
      if (transactions.length) {
        return transactions;
      }
    }
  } catch (error) {
    // Fall through to transactions endpoint
  }

  for (const candidateId of candidateIds) {
    try {
      const response = await getDriverTransactions(candidateId);
      const normalized = normalizeDriverTransactions(response);
      if (normalized.length) {
        return normalized;
      }
    } catch (error) {
      // Try next candidate
    }
  }

  return [];
};

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [driver, setDriver] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    const loadDriver = async () => {
      setIsLoading(true);

      const cached = getStoredEarningsDetail(id);
      if (cached && active) {
        setDriver(cached);
        setIsLoading(false);
      }

      try {
        const earningsDrivers = await fetchAllPages(
          (page) => getDriverEarnings(page, ROWS_PER_PAGE),
          { pageSize: ROWS_PER_PAGE }
        );
        const found = earningsDrivers.find((item) => getEarningsDriverId(item) === id);
        if (active) {
          setDriver(found || cached || null);
        }
      } catch (error) {
        console.error("Error loading earnings details:", error);
        if (active && !cached) {
          setDriver(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadDriver();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!driver) {
      setTransactions([]);
      return;
    }

    let active = true;

    const loadTransactions = async () => {
      setIsTransactionsLoading(true);

      try {
        const nextTransactions = await loadTransactionsForEarningsDriver(driver);
        if (active) {
          setTransactions(nextTransactions);
        }
      } catch (error) {
        console.error("Error loading earnings transactions:", error);
        if (active) {
          setTransactions([]);
        }
      } finally {
        if (active) {
          setIsTransactionsLoading(false);
        }
      }
    };

    loadTransactions();

    return () => {
      active = false;
    };
  }, [driver]);

  const profileImage = driver ? getEarningsDriverImage(driver) : null;

  return (
    <>
      <Head>
        <title>
          {driver ? `${getEarningsDriverName(driver)} | Earnings` : "Earnings Details"} | Highland Care
        </title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3}>
            <Button
              component={NextLink}
              href="/driver-earnings"
              startIcon={
                <SvgIcon fontSize="small">
                  <ArrowLeftIcon />
                </SvgIcon>
              }
              sx={{ alignSelf: "flex-start", textTransform: "capitalize" }}
            >
              Back to Driver Earnings
            </Button>

            {isLoading ? (
              <Loader page />
            ) : !driver ? (
              <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                <CardContent sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="h6">Driver earnings not found</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                    The selected driver earnings could not be loaded.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                  <CardContent>
                    <Stack
                      alignItems={{ xs: "flex-start", md: "center" }}
                      direction={{ xs: "column", md: "row" }}
                      spacing={3}
                    >
                      {profileImage ? (
                        <Box
                          alt={getEarningsDriverName(driver)}
                          component="img"
                          src={profileImage}
                          sx={{
                            bgcolor: "neutral.100",
                            border: "1px solid",
                            borderColor: "neutral.200",
                            borderRadius: 3,
                            height: 120,
                            objectFit: "cover",
                            width: 120,
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            alignItems: "center",
                            bgcolor: "neutral.100",
                            border: "1px solid",
                            borderColor: "neutral.200",
                            borderRadius: 3,
                            color: "neutral.700",
                            display: "flex",
                            fontSize: 36,
                            fontWeight: 700,
                            height: 120,
                            justifyContent: "center",
                            width: 120,
                          }}
                        >
                          {getEarningsDriverName(driver)?.charAt(0)?.toUpperCase() || "?"}
                        </Box>
                      )}
                      <Box flex={1}>
                        <Typography sx={pageTitleSx} variant="h4">
                          {getEarningsDriverName(driver)}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          data-email={driver?.email ? "true" : undefined}
                          sx={{
                            mt: 0.5,
                            ...(driver?.email ? { textTransform: "lowercase" } : {}),
                          }}
                          variant="body1"
                        >
                          {driver?.email ? driver.email.toLowerCase() : "No email linked"}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={3} mt={2}>
                          <DetailItem
                            label="Total Earned"
                            value={formatEarningsCurrency(driver.totalEarned)}
                          />
                          <DetailItem
                            label="Wallet Balance"
                            value={formatEarningsCurrency(driver.walletBalance)}
                          />
                          <DetailItem label="Rides" value={driver.rideCount ?? 0} />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <SectionCard title="Contact Information">
                      <Stack spacing={2}>
                        <DetailItem label="Full Name" value={driver.fullName} />
                        <DetailItem label="Email" value={driver.email} />
                        <DetailItem label="Phone" value={driver.phone} />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Earnings Summary">
                      <Stack spacing={2}>
                        <DetailItem
                          label="Total Earned"
                          value={formatEarningsCurrency(driver.totalEarned)}
                        />
                        <DetailItem
                          label="Wallet Balance"
                          value={formatEarningsCurrency(driver.walletBalance)}
                        />
                        <DetailItem label="Completed Rides" value={driver.rideCount ?? 0} />
                        <DetailItem
                          label="Joined"
                          value={driver.createdAt ? formatDate(driver.createdAt) : null}
                        />
                        <DetailItem
                          label="Last Updated"
                          value={
                            driver.updatedAt ? formatRelativeDate(driver.updatedAt) : null
                          }
                        />
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item xs={12}>
                    <DriverTransactionHistory
                      loading={isTransactionsLoading}
                      transactions={transactions}
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
