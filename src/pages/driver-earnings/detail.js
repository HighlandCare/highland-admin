import { useEffect, useMemo, useState } from "react";
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
import { getDriverEarningsById, getDriverTransactions } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../../utils/pageLayout";
import {
  formatEarningsCurrency,
  getDriverRideCount,
  getDriverTotalEarned,
  getDriverTotalWithdrawn,
  getDriverWalletBalance,
  getEarningsDriverEmail,
  getEarningsDriverImage,
  getEarningsDriverName,
  getEarningsDriverPhone,
  getEarningsDriverProfileFields,
  getStoredEarningsDetail,
  getTransactionsFromDriverRecord,
  mergeEarningsDriverRecords,
  normalizeDriverEarningsByIdResponse,
  normalizeDriverTransactions,
} from "../../utils/earningsUtils";

const DATE_FIELD_KEYS = new Set([
  "createdAt",
  "updatedAt",
  "lastActiveAt",
  "lastActive",
  "dob",
  "dateOfBirth",
]);

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

const formatProfileDisplayValue = (field) => {
  if (!field || !hasDetailValue(field.value)) {
    return null;
  }

  if (DATE_FIELD_KEYS.has(field.key)) {
    if (field.key === "updatedAt" || field.key === "lastActiveAt" || field.key === "lastActive") {
      const relative = formatRelativeDate(field.value);
      return relative === "—" ? null : relative;
    }
    const dated = formatDate(field.value);
    return dated === "—" ? null : dated;
  }

  return field.value;
};

const DetailItem = ({ label, value }) => {
  const isEmail = label === "Email" || (typeof value === "string" && value.includes("@"));
  if (!hasDetailValue(value)) {
    return null;
  }

  const displayValue = isEmail ? String(value).toLowerCase() : value;

  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        data-email={isEmail ? "true" : undefined}
        fontWeight={600}
        sx={{
          wordBreak: "break-word",
          ...(isEmail ? { textTransform: "lowercase" } : {}),
        }}
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

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [driver, setDriver] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
        setTransactions(getTransactionsFromDriverRecord(cached));
        setIsLoading(false);
      }

      try {
        const response = await getDriverEarningsById(id);
        const detail = normalizeDriverEarningsByIdResponse(response);

        if (!active) {
          return;
        }

        let merged = null;
        if (detail) {
          merged = mergeEarningsDriverRecords(cached, detail);
          setDriver(merged);
        } else if (!cached) {
          setDriver(null);
        }

        let nextTransactions = merged
          ? getTransactionsFromDriverRecord(merged)
          : normalizeDriverTransactions(response);

        try {
          const transactionsResponse = await getDriverTransactions(id);
          const apiTransactions = normalizeDriverTransactions(transactionsResponse);
          if (apiTransactions.length) {
            const byId = new Map();
            [...nextTransactions, ...apiTransactions].forEach((txn) => {
              if (txn?.id) {
                byId.set(String(txn.id), {
                  ...(byId.get(String(txn.id)) || {}),
                  ...txn,
                  paidAmount:
                    txn.paidAmount ?? byId.get(String(txn.id))?.paidAmount ?? null,
                  fromName: txn.fromName || byId.get(String(txn.id))?.fromName || null,
                  remainingBalance:
                    txn.remainingBalance ??
                    byId.get(String(txn.id))?.remainingBalance ??
                    null,
                });
              }
            });
            nextTransactions = [...byId.values()].sort(
              (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
            );
          }
        } catch (transactionsError) {
          // Keep nested earnings transactions when the dedicated endpoint fails.
        }

        if (active) {
          setTransactions(nextTransactions);
          if (!detail && !cached) {
            setTransactions([]);
          }
        }
      } catch (error) {
        console.error("Error loading earnings details:", error);
        if (active && !cached) {
          setDriver(null);
          setTransactions([]);
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

  const profileImage = driver ? getEarningsDriverImage(driver) : null;
  const totalEarned = driver ? getDriverTotalEarned(driver) : null;
  const totalWithdrawn = driver ? getDriverTotalWithdrawn(driver) : null;
  const walletBalance = driver ? getDriverWalletBalance(driver) : null;
  const rideCount = driver ? getDriverRideCount(driver) : null;
  const driverEmail = driver ? getEarningsDriverEmail(driver) : null;
  const driverPhone = driver ? getEarningsDriverPhone(driver) : null;
  const driverName = driver ? getEarningsDriverName(driver) : null;

  const profileFields = useMemo(() => {
    if (!driver) {
      return [];
    }

    const fields = getEarningsDriverProfileFields(driver)
      .map((field) => ({
        ...field,
        value: formatProfileDisplayValue(field),
      }))
      .filter((field) => hasDetailValue(field.value));

    const required = [
      { key: "fullName", label: "Full Name", value: driver.fullName || driver.name || null },
      { key: "email", label: "Email", value: driverEmail },
      { key: "phone", label: "Phone", value: driverPhone },
    ].filter((field) => hasDetailValue(field.value));

    const byLabel = new Map();
    required.forEach((field) => byLabel.set(field.label, field));
    fields.forEach((field) => {
      if (!byLabel.has(field.label)) {
        byLabel.set(field.label, field);
      } else if (!hasDetailValue(byLabel.get(field.label).value) && hasDetailValue(field.value)) {
        byLabel.set(field.label, field);
      }
    });

    return Array.from(byLabel.values());
  }, [driver, driverEmail, driverPhone]);

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
                          alt={driverName}
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
                          {driverName?.charAt(0)?.toUpperCase() || "?"}
                        </Box>
                      )}
                      <Box flex={1}>
                        <Typography sx={pageTitleSx} variant="h4">
                          {driverName}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          data-email={driverEmail ? "true" : undefined}
                          sx={{
                            mt: 0.5,
                            ...(driverEmail ? { textTransform: "lowercase" } : {}),
                          }}
                          variant="body1"
                        >
                          {driverEmail ? driverEmail.toLowerCase() : "No email linked"}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={3} mt={2}>
                          <DetailItem
                            label="Total Earned"
                            value={formatEarningsCurrency(totalEarned)}
                          />
                          <DetailItem
                            label="Wallet Balance"
                            value={formatEarningsCurrency(walletBalance)}
                          />
                          <DetailItem
                            label="Total Withdrawn"
                            value={formatEarningsCurrency(totalWithdrawn)}
                          />
                          {rideCount != null ? (
                            <DetailItem label="Rides" value={rideCount} />
                          ) : null}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <SectionCard title="Personal Information">
                      <Stack spacing={2}>
                        {profileFields.map((field) => (
                          <DetailItem
                            key={field.label}
                            label={field.label}
                            value={field.value}
                          />
                        ))}
                      </Stack>
                    </SectionCard>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <SectionCard title="Earnings Summary">
                      <Stack spacing={2}>
                        <DetailItem
                          label="Total Earned"
                          value={formatEarningsCurrency(totalEarned)}
                        />
                        <DetailItem
                          label="Wallet Balance"
                          value={formatEarningsCurrency(walletBalance)}
                        />
                        <DetailItem
                          label="Total Withdrawn"
                          value={formatEarningsCurrency(totalWithdrawn)}
                        />
                        {rideCount != null ? (
                          <DetailItem label="Completed Rides" value={rideCount} />
                        ) : null}
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
                    <DriverTransactionHistory loading={false} transactions={transactions} />
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
