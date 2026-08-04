import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Container } from "@mui/material";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import { DriverTransactionHistory } from "../../components/driver-transaction-history";
import {
  DetailAvatar,
  DetailFieldGrid,
  DetailHero,
  DetailPageFrame,
  DetailPageState,
  DetailPanel,
  DetailSection,
} from "../../components/detail-page/detail-page-ui";
import { getDriverEarningsById, getDriverTransactions } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
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
        label: field.label,
        value: formatProfileDisplayValue(field),
      }))
      .filter((field) => hasDetailValue(field.value));

    const required = [
      { label: "Full Name", value: driver.fullName || driver.name || null },
      { label: "Email", value: driverEmail },
      { label: "Phone", value: driverPhone },
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
          <DetailPageFrame backHref="/driver-earnings" backLabel="Back to Driver Earnings">
            <DetailPageState
              loading={isLoading}
              notFoundMessage="The selected driver earnings could not be loaded."
              notFoundTitle={!isLoading && !driver ? "Driver earnings not found" : undefined}
            >
              {driver ? (
                <>
                  <DetailPanel>
                    <DetailHero
                      avatar={
                        <DetailAvatar
                          alt={driverName}
                          fallback={driverName?.charAt(0)?.toUpperCase()}
                          src={profileImage}
                        />
                      }
                      stats={[
                        { label: "Total Earned", value: formatEarningsCurrency(totalEarned) },
                        { label: "Wallet Balance", value: formatEarningsCurrency(walletBalance) },
                        { label: "Total Withdrawn", value: formatEarningsCurrency(totalWithdrawn) },
                        ...(rideCount != null ? [{ label: "Completed Rides", value: rideCount }] : []),
                      ]}
                      subtitle={driverEmail ? driverEmail.toLowerCase() : "No email linked"}
                      title={driverName}
                    />

                    <DetailSection noBorder title="Profile">
                      <DetailFieldGrid fields={profileFields} />
                    </DetailSection>

                    <DetailSection title="Earnings Summary">
                      <DetailFieldGrid
                        fields={[
                          { label: "Total Earned", value: formatEarningsCurrency(totalEarned) },
                          { label: "Wallet Balance", value: formatEarningsCurrency(walletBalance) },
                          { label: "Total Withdrawn", value: formatEarningsCurrency(totalWithdrawn) },
                          ...(rideCount != null
                            ? [{ label: "Completed Rides", value: rideCount }]
                            : []),
                          {
                            label: "Joined",
                            value: driver.createdAt ? formatDate(driver.createdAt) : null,
                          },
                          {
                            label: "Last Updated",
                            value: driver.updatedAt ? formatRelativeDate(driver.updatedAt) : null,
                          },
                        ]}
                      />
                    </DetailSection>
                  </DetailPanel>

                  <DriverTransactionHistory loading={false} transactions={transactions} />
                </>
              ) : null}
            </DetailPageState>
          </DetailPageFrame>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;

export default Page;
