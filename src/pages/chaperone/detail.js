import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Container, Stack, Tab, Tabs } from "@mui/material";
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
} from "../../components/detail-page/detail-page-ui";
import { getChap, getChaperoneById, getDriverTransactions } from "../../Services/Auth.service";
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
  formatRating,
} from "../../utils/driverUtils";
import {
  buildDriverTransactionPayload,
  formatEarningsCurrency,
  normalizeDriverTransactions,
} from "../../utils/earningsUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import { brand } from "../../theme/colors";

const TAB_OVERVIEW = "overview";
const TAB_TRANSACTIONS = "transactions";

const emptyTxPayload = {
  transactions: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  analytics: null,
};

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

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [detail, setDetail] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(emptyTxPayload.pagination);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);
  const [txFilters, setTxFilters] = useState({
    status: "",
    serviceCategory: "",
    from: "",
    to: "",
  });
  const [txPage, setTxPage] = useState(1);
  const [txLimit, setTxLimit] = useState(20);

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
        } else if (!cached) {
          setDetail(null);
        }
      } catch (error) {
        console.error("Error loading driver details:", error);
        if (active && !cached) {
          setDetail(null);
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
    if (!detail) {
      return;
    }

    let active = true;

    const loadAllTransactions = async () => {
      setIsLoadingTransactions(true);

      const candidateIds = collectDriverIdCandidates(
        detail?.authId,
        detail?.summary?.authId,
        detail?._id,
        detail?.summary?.chaperoneId,
        id
      );

      try {
        let all = [];

        for (const candidate of candidateIds) {
          try {
            const response = await getDriverTransactions(candidate);
            all = normalizeDriverTransactions(response);
            if (all.length) {
              break;
            }
          } catch (error) {
            // Try next candidate.
          }
        }

        if (!all.length) {
          all = normalizeDriverTransactions(
            detail?.transactionHistory || detail?.transactions || []
          );
        }

        if (active) {
          setAllTransactions(all);
        }
      } catch (error) {
        console.error("Error loading driver transactions:", error);
        if (active) {
          setAllTransactions(
            normalizeDriverTransactions(
              detail?.transactionHistory || detail?.transactions || []
            )
          );
        }
      } finally {
        if (active) {
          setIsLoadingTransactions(false);
        }
      }
    };

    loadAllTransactions();

    return () => {
      active = false;
    };
  }, [detail, id]);

  useEffect(() => {
    const view = buildDriverTransactionPayload(allTransactions, {
      page: txPage,
      limit: txLimit,
      status: txFilters.status,
      serviceCategory: txFilters.serviceCategory,
      from: txFilters.from,
      to: txFilters.to,
    });
    setTransactions(view.transactions);
    setPagination(view.pagination);
    setAnalytics(view.analytics);
  }, [allTransactions, txPage, txLimit, txFilters]);

  const handleFilterChange = (patch) => {
    setTxFilters((prev) => ({ ...prev, ...patch }));
    setTxPage(1);
  };

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
                        { label: "Rating", value: formatRating(summary.rating) },
                        {
                          label: "Wallet",
                          value: formatEarningsCurrency(
                            summary.walletBalance ?? wallet.walletBalance
                          ),
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

                  {activeTab === TAB_TRANSACTIONS ? (
                    <DriverTransactionHistory
                      analytics={analytics}
                      filters={txFilters}
                      loading={isLoadingTransactions}
                      pagination={pagination}
                      transactions={transactions}
                      onFilterChange={handleFilterChange}
                      onPageChange={setTxPage}
                      onRowsPerPageChange={(limit) => {
                        setTxLimit(limit);
                        setTxPage(1);
                      }}
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
