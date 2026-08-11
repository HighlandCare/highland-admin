import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Container, Stack, Tab, Tabs, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import { DriverTransactionHistory } from "../../components/driver-transaction-history";
import {
  DetailAvatar,
  DetailDocumentGallery,
  DetailFieldGrid,
  DetailHero,
  DetailPageFrame,
  DetailPageState,
  DetailPanel,
  DetailSection,
  DetailStat,
} from "../../components/detail-page/detail-page-ui";
import Loader from "../../components/Loader";
import { getChap, getChaperoneById, getDriverEarningsById } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import {
  collectDriverIdCandidates,
  driverMatchesId,
  formatDriverLocationValue,
  getChaperoneApprovalLabel,
  getChaperoneBlockedLabel,
  getChaperoneDetailDisplayName,
  getChaperoneDetailEmail,
  getChaperoneMediaUrl,
  getChaperoneOnlineLabel,
  getChaperoneRideStatusLabel,
  getChaperoneVerifiedLabel,
  getDriverList,
  getStoredDriverDetail,
  normalizeChaperoneDetailResponse,
  storeDriverDetail,
} from "../../utils/driverUtils";
import {
  formatEarningsCurrency,
  getTransactionsFromDriverRecord,
  normalizeDriverEarningsByIdResponse,
  normalizeDriverTransactions,
} from "../../utils/earningsUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import { brand } from "../../theme/colors";

const TAB_OVERVIEW = "overview";
const TAB_EARNINGS = "earnings";
const TAB_TRANSACTIONS = "transactions";

const tabListSx = {
  borderBottom: "1px solid",
  borderColor: "neutral.200",
  minHeight: 44,
  px: { xs: 1, sm: 2 },
  "& .MuiTabs-indicator": {
    height: 3,
    borderRadius: "3px 3px 0 0",
    bgcolor: brand.primary,
  },
  "& .MuiTab-root": {
    minHeight: 44,
    textTransform: "none",
    fontWeight: 600,
    fontSize: 14,
    color: "text.secondary",
    "&.Mui-selected": {
      color: brand.primary,
    },
  },
};

const SERVICE_LABELS = {
  transportation: "Rides",
  food_beverage: "Food",
  senior_care: "Senior care",
};

const formatServiceLabel = (category) =>
  SERVICE_LABELS[category] ||
  String(category || "Other")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatDetailValue = (value) => {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  const locationText = formatDriverLocationValue(value);
  if (locationText) {
    return locationText;
  }

  return null;
};

const formatOptionalDate = (value) => {
  if (value == null || value === "" || value === "—") {
    return null;
  }
  const formatted = formatDate(value);
  return formatted === "—" ? null : formatted;
};

const formatOptionalRelativeDate = (value) => {
  if (value == null || value === "" || value === "—") {
    return null;
  }
  const formatted = formatRelativeDate(value);
  return formatted === "—" ? null : formatted;
};

const field = (label, value) => ({ label, value, hideEmpty: true });

const formatHourlyFare = (value) => {
  if (value == null || value === "") {
    return null;
  }

  const number = Number(value);
  if (Number.isFinite(number)) {
    return formatEarningsCurrency(number);
  }

  return String(value);
};

const buildEarningsOverview = (wallet = {}, transactions = []) => {
  const byService = {};
  let creditTotal = 0;
  let creditCount = 0;
  let debitTotal = 0;
  let debitCount = 0;

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    const status = String(tx.status || tx.type || "").toLowerCase();
    const category = tx.serviceCategory || "transportation";

    if (!byService[category]) {
      byService[category] = { category, earned: 0, withdrawn: 0, count: 0 };
    }
    byService[category].count += 1;

    if (status === "debit") {
      debitTotal += amount;
      debitCount += 1;
      byService[category].withdrawn += amount;
    } else {
      creditTotal += amount;
      creditCount += 1;
      byService[category].earned += amount;
    }
  }

  return {
    walletBalance: wallet.walletBalance,
    totalEarned: wallet.totalEarned ?? creditTotal,
    totalWithdrawn: wallet.totalWithdrawn ?? debitTotal,
    completedRides: wallet.completedRides,
    stripeStatus: wallet.stripeStatus,
    creditTotal,
    creditCount,
    debitTotal,
    debitCount,
    transactionCount: transactions.length,
    byService: Object.values(byService),
  };
};

async function fetchDriverByCandidates(candidateIds = []) {
  const uniqueIds = [...new Set(candidateIds.filter(Boolean).map(String))];

  for (const candidate of uniqueIds) {
    try {
      const response = await getChaperoneById(candidate);
      const normalized = normalizeChaperoneDetailResponse(response);
      if (normalized) {
        return normalized;
      }
    } catch (error) {
      // Try the next candidate id.
    }
  }

  try {
    const listResponse = await getChap(1, 100);
    const match = getDriverList(listResponse).find((driver) =>
      uniqueIds.some((candidate) => driverMatchesId(driver, candidate))
    );
    if (match) {
      return normalizeChaperoneDetailResponse(match);
    }
  } catch (error) {
    // Fall through.
  }

  return null;
}

async function loadDriverTransactions(detail, fallbackIds = []) {
  const fromDetail = normalizeDriverTransactions(detail?.transactionHistory || []);
  if (fromDetail.length > 0) {
    return fromDetail;
  }

  const candidateIds = collectDriverIdCandidates(
    detail?.authId,
    detail?.summary?.authId,
    detail?._id,
    detail?.summary?.chaperoneId,
    ...fallbackIds
  );

  for (const candidate of candidateIds) {
    try {
      const response = await getDriverEarningsById(candidate);
      const earnings = normalizeDriverEarningsByIdResponse(response);
      const txns = getTransactionsFromDriverRecord(earnings || response);
      if (txns.length > 0) {
        return txns;
      }
    } catch (error) {
      // Try the next candidate id.
    }
  }

  return fromDetail;
}

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [detail, setDetail] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);

  useEffect(() => {
    if (!id) {
      return;
    }

    let active = true;

    const loadDriver = async () => {
      setIsLoading(true);

      const cachedRaw = getStoredDriverDetail(id);
      const cached = normalizeChaperoneDetailResponse(cachedRaw);

      if (cached && active) {
        setDetail(cached);
        setTransactions(normalizeDriverTransactions(cached.transactionHistory || []));
      }

      const candidateIds = collectDriverIdCandidates(id, cachedRaw, cached);

      try {
        const normalized = await fetchDriverByCandidates(candidateIds);

        if (!active) {
          return;
        }

        if (normalized) {
          setDetail(normalized);
          storeDriverDetail(normalized);
          setIsLoadingTransactions(true);
          const txns = await loadDriverTransactions(normalized, candidateIds);
          if (active) {
            setTransactions(txns);
          }
        } else if (!cached) {
          setDetail(null);
          setTransactions([]);
        }
      } catch (error) {
        console.error("Error loading driver details:", error);
        if (active && !cached) {
          setDetail(null);
          setTransactions([]);
        }
      } finally {
        if (active) {
          setIsLoading(false);
          setIsLoadingTransactions(false);
        }
      }
    };

    loadDriver();

    return () => {
      active = false;
    };
  }, [id]);

  const summary = detail?.summary || {};
  const personal = detail?.personalInformation || {};
  const vehicle = detail?.vehicleAndLicense || {};
  const wallet = detail?.walletAndPayments || {};
  const media = detail?.mediaAndDocuments || {};

  const displayName = getChaperoneDetailDisplayName(detail);
  const email = getChaperoneDetailEmail(detail);
  const profileImage =
    getChaperoneMediaUrl(summary.profileImage) || getChaperoneMediaUrl(media.profilePhoto);

  const documents = [
    {
      label: "Profile Photo",
      src: getChaperoneMediaUrl(media.profilePhoto) || profileImage,
    },
    { label: "ID Card", src: getChaperoneMediaUrl(media.idCard) },
    { label: "Driving License", src: getChaperoneMediaUrl(media.drivingLicense) },
  ];

  const earningsOverview = useMemo(
    () => buildEarningsOverview(wallet, transactions),
    [wallet, transactions]
  );

  return (
    <>
      <Head>
        <title>
          {detail ? `${displayName} | Driver` : "Driver Details"} | Highland Care
        </title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <DetailPageFrame backHref="/chaperone" backLabel="Back to Drivers">
            <DetailPageState
              loading={isLoading}
              notFoundMessage="The selected driver could not be loaded."
              notFoundTitle={!isLoading && !detail ? "Driver not found" : undefined}
            >
              {detail ? (
                <Stack spacing={2.5}>
                  <DetailPanel>
                    <DetailHero
                      avatar={
                        <DetailAvatar
                          alt={displayName}
                          fallback={displayName?.charAt(0)?.toUpperCase()}
                          src={profileImage}
                        />
                      }
                      stats={[
                        { label: "Approval", value: getChaperoneApprovalLabel(detail) },
                        { label: "Online", value: getChaperoneOnlineLabel(detail) },
                        { label: "Account", value: getChaperoneBlockedLabel(detail) },
                        { label: "Ride Status", value: getChaperoneRideStatusLabel(detail) },
                        { label: "Rating", value: summary.rating ?? null },
                        {
                          label: "Wallet",
                          value: formatEarningsCurrency(
                            summary.walletBalance ?? wallet.walletBalance
                          ),
                        },
                        {
                          label: "Total earned",
                          value: formatEarningsCurrency(wallet.totalEarned),
                        },
                        {
                          label: "Stripe",
                          value: summary.stripeStatus || wallet.stripeStatus || null,
                        },
                      ]}
                      subtitle={email ? email.toLowerCase() : "No email linked"}
                      title={displayName}
                    />

                    <Box
                      sx={{
                        bgcolor: alpha(brand.primary, 0.03),
                        borderBottom: "1px solid",
                        borderColor: "neutral.200",
                      }}
                    >
                      <Tabs
                        allowScrollButtonsMobile
                        scrollButtons="auto"
                        sx={tabListSx}
                        value={activeTab}
                        variant="scrollable"
                        onChange={(_, value) => setActiveTab(value)}
                      >
                        <Tab label="Driver overview" value={TAB_OVERVIEW} />
                        <Tab label="Overview earnings" value={TAB_EARNINGS} />
                        <Tab label="Transactions" value={TAB_TRANSACTIONS} />
                      </Tabs>
                    </Box>

                    {activeTab === TAB_OVERVIEW ? (
                      <>
                        <DetailSection noBorder title="Personal Information">
                          <DetailFieldGrid
                            fields={[
                              field("Full Name", personal.fullName),
                              field("Email", personal.email),
                              field("Phone", personal.phone),
                              field("Date of Birth", formatOptionalDate(personal.dob)),
                              field("Address", personal.address),
                              field("Location", formatDetailValue(personal.location)),
                              field("City", personal.city),
                              field("State", personal.state),
                              field("Zip Code", personal.zipCode),
                              field(
                                "Persona Status",
                                personal.personaStatus
                                  ? String(personal.personaStatus).replace(/^\w/, (c) =>
                                      c.toUpperCase()
                                    )
                                  : null
                              ),
                              field("Verified", getChaperoneVerifiedLabel(detail)),
                              field("Joined", formatOptionalDate(personal.joinedAt)),
                              field(
                                "Last Active",
                                formatOptionalRelativeDate(personal.lastActiveAt)
                              ),
                            ]}
                          />
                        </DetailSection>

                        <DetailSection title="Vehicle & License">
                          <DetailFieldGrid
                            fields={[
                              field("Vehicle Name", vehicle.vehicleName),
                              field("Vehicle Number", vehicle.vehicleNumber),
                              field("Experience", vehicle.experience),
                              field("License Number", vehicle.licenseNumber),
                              field("License Expiry", vehicle.licenseExpiry),
                              field("Hourly Fare", formatHourlyFare(vehicle.hourlyFare)),
                            ]}
                          />
                        </DetailSection>

                        <DetailSection
                          description="Swipe to view uploaded documents."
                          title="Documents"
                        >
                          <DetailDocumentGallery documents={documents} />
                        </DetailSection>
                      </>
                    ) : null}
                  </DetailPanel>

                  {activeTab === TAB_EARNINGS ? (
                    <DetailPanel>
                      <DetailSection noBorder title="Overview earnings">
                        {isLoadingTransactions && !transactions.length ? (
                          <Box sx={{ py: 4 }}>
                            <Loader minHeight={100} size="md" />
                          </Box>
                        ) : (
                          <>
                            <Stack direction="row" flexWrap="wrap" gap={1.5}>
                              <DetailStat
                                label="Wallet balance"
                                value={formatEarningsCurrency(earningsOverview.walletBalance)}
                              />
                              <DetailStat
                                label="Total earned"
                                value={formatEarningsCurrency(earningsOverview.totalEarned)}
                              />
                              <DetailStat
                                label="Total withdrawn"
                                value={formatEarningsCurrency(earningsOverview.totalWithdrawn)}
                              />
                              <DetailStat
                                label="Completed rides"
                                value={
                                  earningsOverview.completedRides != null
                                    ? String(earningsOverview.completedRides)
                                    : "0"
                                }
                              />
                              <DetailStat
                                label="Transactions"
                                value={String(earningsOverview.transactionCount ?? 0)}
                              />
                              <DetailStat
                                label="Stripe"
                                value={earningsOverview.stripeStatus || "—"}
                              />
                            </Stack>

                            <Box sx={{ mt: 2.5 }}>
                              <Typography
                                color="text.secondary"
                                sx={{ mb: 1 }}
                                variant="caption"
                              >
                                By type
                              </Typography>
                              <Stack direction="row" flexWrap="wrap" gap={1.5}>
                                <DetailStat
                                  label="Credits (earned)"
                                  value={`${formatEarningsCurrency(
                                    earningsOverview.creditTotal
                                  )} · ${earningsOverview.creditCount}`}
                                />
                                <DetailStat
                                  label="Debits (withdrawn)"
                                  value={`${formatEarningsCurrency(
                                    earningsOverview.debitTotal
                                  )} · ${earningsOverview.debitCount}`}
                                />
                              </Stack>
                            </Box>

                            {earningsOverview.byService.length > 0 ? (
                              <Box sx={{ mt: 2.5 }}>
                                <Typography
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                  variant="caption"
                                >
                                  By service
                                </Typography>
                                <Stack direction="row" flexWrap="wrap" gap={1.5}>
                                  {earningsOverview.byService.map((row) => (
                                    <DetailStat
                                      key={row.category}
                                      label={formatServiceLabel(row.category)}
                                      value={`${formatEarningsCurrency(row.earned)} earned · ${
                                        row.count
                                      } txns`}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            ) : null}

                            <Box sx={{ mt: 3 }}>
                              <DetailFieldGrid
                                fields={[
                                  field(
                                    "Wallet Balance",
                                    formatEarningsCurrency(wallet.walletBalance)
                                  ),
                                  field(
                                    "Total Earned",
                                    formatEarningsCurrency(wallet.totalEarned)
                                  ),
                                  field(
                                    "Total Withdrawn",
                                    formatEarningsCurrency(wallet.totalWithdrawn)
                                  ),
                                  field("Completed Rides", wallet.completedRides ?? null),
                                  field("Stripe Connection", wallet.stripeStatus || null),
                                  field(
                                    "Stripe Business Name",
                                    wallet.stripeBusinessName || null
                                  ),
                                ]}
                              />
                            </Box>
                          </>
                        )}
                      </DetailSection>
                    </DetailPanel>
                  ) : null}

                  {activeTab === TAB_TRANSACTIONS ? (
                    <DriverTransactionHistory
                      loading={isLoadingTransactions}
                      transactions={transactions}
                    />
                  ) : null}
                </Stack>
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
