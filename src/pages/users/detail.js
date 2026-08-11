import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Container, Stack, Tab, Tabs } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Layout as DashboardLayout } from "../../layouts/dashboard/layout";
import { StatusBadge } from "../../components/table-cells";
import {
  DetailAvatar,
  DetailFieldGrid,
  DetailHero,
  DetailPageFrame,
  DetailPageState,
  DetailPanel,
  DetailSection,
} from "../../components/detail-page/detail-page-ui";
import {
  UserSpendOverview,
  UserTransactionHistory,
} from "../../components/user-transaction-history";
import { getUserById, getUserTransactions } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { formatEarningsCurrency } from "../../utils/earningsUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import { brand } from "../../theme/colors";
import {
  getStoredUserDetail,
  getUserAccountStatusMeta,
  getUserDisplayName,
  getUserFromResponse,
  getUserProfileImage,
  storeUserDetail,
} from "../../utils/userUtils";

const TAB_OVERVIEW = "overview";
const TAB_SPEND = "spend";
const TAB_TRANSACTIONS = "transactions";

const hasDetailValue = (value) => {
  if (value == null) {
    return false;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed !== "" && trimmed !== "—" && trimmed.toLowerCase() !== "n/a" && trimmed !== "false";
  }

  return true;
};

const pickFirstValue = (...values) => {
  for (const value of values) {
    if (hasDetailValue(value)) {
      return value;
    }
  }
  return null;
};

const formatOptionalDate = (value) => {
  if (!hasDetailValue(value)) {
    return null;
  }

  const formatted = formatDate(value);
  return formatted === "—" ? null : formatted;
};

const formatOptionalRelativeDate = (value) => {
  if (!hasDetailValue(value)) {
    return null;
  }

  const formatted = formatRelativeDate(value);
  return formatted === "—" ? null : formatted;
};

const emptyTxPayload = {
  transactions: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  analytics: null,
  lifetime: null,
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

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);

  const [txLoading, setTxLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(emptyTxPayload.pagination);
  const [analytics, setAnalytics] = useState(null);
  const [lifetime, setLifetime] = useState(null);
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

    const loadUser = async () => {
      setIsLoading(true);

      const cached = getStoredUserDetail(id);
      if (cached && active) {
        setUser(cached);
      }

      try {
        const response = await getUserById(id);
        const profile = getUserFromResponse(response);

        if (!active) {
          return;
        }

        if (profile) {
          setUser(profile);
          storeUserDetail(profile);
        } else if (!cached) {
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading user details:", error);
        if (active && !cached) {
          setUser(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [id]);

  const loadTransactions = useCallback(async () => {
    if (!id) {
      return;
    }

    setTxLoading(true);
    try {
      const response = await getUserTransactions(id, {
        page: txPage,
        limit: txLimit,
        status: txFilters.status || undefined,
        serviceCategory: txFilters.serviceCategory || undefined,
        from: txFilters.from || undefined,
        to: txFilters.to || undefined,
      });

      const payload = response?.data || response || emptyTxPayload;
      setTransactions(Array.isArray(payload.transactions) ? payload.transactions : []);
      setPagination(
        payload.pagination || {
          page: txPage,
          limit: txLimit,
          total: 0,
          totalPages: 0,
        }
      );
      setAnalytics(payload.analytics || null);
      setLifetime(payload.lifetime || null);
    } catch (error) {
      console.error("Error loading user transactions:", error);
      setTransactions([]);
      setPagination({ page: txPage, limit: txLimit, total: 0, totalPages: 0 });
      setAnalytics(null);
      setLifetime(null);
    } finally {
      setTxLoading(false);
    }
  }, [id, txPage, txLimit, txFilters]);

  useEffect(() => {
    if (!id || !user) {
      return;
    }
    loadTransactions();
  }, [id, user, loadTransactions]);

  const handleFilterChange = (patch) => {
    setTxFilters((prev) => ({ ...prev, ...patch }));
    setTxPage(1);
  };

  const accountMeta = user ? getUserAccountStatusMeta(user) : null;
  const profile = user?.user && typeof user.user === "object" ? user.user : {};
  const profileImage = user ? getUserProfileImage(user) : null;

  const fullName = pickFirstValue(profile.fullName, profile.name, user?.fullName, user?.name);
  const email = pickFirstValue(profile.email, user?.email);
  const phone = pickFirstValue(profile.phone, profile.phoneNumber, user?.phone, user?.phoneNumber);
  const gender = pickFirstValue(profile.gender, user?.gender);
  const dateOfBirth = formatOptionalDate(
    pickFirstValue(profile.dob, profile.dateOfBirth, user?.dob, user?.dateOfBirth)
  );
  const userType = pickFirstValue(profile.userType, user?.userType, profile.role, user?.role);
  const deviceType = pickFirstValue(
    profile.deviceType,
    user?.deviceType,
    profile.platform,
    user?.platform,
    user?.user?.deviceType,
    profile.user?.deviceType,
    Array.isArray(user?.user?.devices)
      ? user.user.devices.find((d) => d?.deviceType)?.deviceType
      : null,
    Array.isArray(profile.user?.devices)
      ? profile.user.devices.find((d) => d?.deviceType)?.deviceType
      : null
  );
  const createdAt = formatOptionalDate(pickFirstValue(profile.createdAt, user?.createdAt));
  const lastUpdated = formatOptionalRelativeDate(pickFirstValue(profile.updatedAt, user?.updatedAt));
  const joinedRelative = formatOptionalRelativeDate(pickFirstValue(profile.createdAt, user?.createdAt));

  const notificationValue =
    typeof profile.notificationOn === "boolean"
      ? profile.notificationOn
        ? "Enabled"
        : "Disabled"
      : typeof user?.notificationOn === "boolean"
        ? user.notificationOn
          ? "Enabled"
          : "Disabled"
        : null;

  return (
    <>
      <Head>
        <title>
          {user ? `${getUserDisplayName(user)} | User` : "User Details"} | Highland Care
        </title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <DetailPageFrame backHref="/users" backLabel="Back to Users">
            <DetailPageState
              loading={isLoading}
              notFoundMessage="The selected user could not be loaded."
              notFoundTitle={!isLoading && !user ? "User not found" : undefined}
            >
              {user ? (
                <Stack spacing={2.5}>
                  <DetailPanel>
                    <DetailHero
                      avatar={
                        <DetailAvatar
                          alt={getUserDisplayName(user)}
                          fallback={getUserDisplayName(user)?.charAt(0)?.toUpperCase()}
                          src={profileImage}
                        />
                      }
                      badge={
                        accountMeta ? (
                          <StatusBadge color={accountMeta.color} label={accountMeta.label} />
                        ) : null
                      }
                      stats={[
                        { label: "Phone", value: phone },
                        { label: "Joined", value: joinedRelative },
                        {
                          label: "Lifetime spent",
                          value: lifetime
                            ? formatEarningsCurrency(lifetime.totalSpent ?? 0)
                            : null,
                        },
                      ]}
                      subtitle={email ? email.toLowerCase() : "No email linked"}
                      title={getUserDisplayName(user)}
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
                        <Tab label="User overview" value={TAB_OVERVIEW} />
                        <Tab label="Overview spend" value={TAB_SPEND} />
                        <Tab label="Transactions" value={TAB_TRANSACTIONS} />
                      </Tabs>
                    </Box>

                    {activeTab === TAB_OVERVIEW ? (
                      <>
                        <DetailSection noBorder title="Personal Information">
                          <DetailFieldGrid
                            fields={[
                              { label: "Full Name", value: fullName, hideEmpty: true },
                              { label: "Email", value: email, hideEmpty: true },
                              { label: "Phone", value: phone, hideEmpty: true },
                              { label: "Gender", value: gender, hideEmpty: true },
                              { label: "Date of Birth", value: dateOfBirth, hideEmpty: true },
                            ]}
                          />
                        </DetailSection>

                        <DetailSection title="Location & Address">
                          <DetailFieldGrid
                            fields={[
                              {
                                label: "Address",
                                value: pickFirstValue(profile.address, user?.address),
                                hideEmpty: true,
                              },
                              {
                                label: "City",
                                value: pickFirstValue(profile.city, user?.city),
                                hideEmpty: true,
                              },
                              {
                                label: "State",
                                value: pickFirstValue(profile.state, user?.state),
                                hideEmpty: true,
                              },
                              {
                                label: "Zip Code",
                                value: pickFirstValue(
                                  profile.zipCode,
                                  profile.zip,
                                  user?.zipCode,
                                  user?.zip
                                ),
                                hideEmpty: true,
                              },
                              {
                                label: "Location",
                                value:
                                  [
                                    pickFirstValue(profile.city, user?.city),
                                    pickFirstValue(profile.state, user?.state),
                                    pickFirstValue(
                                      profile.zipCode,
                                      profile.zip,
                                      user?.zipCode,
                                      user?.zip
                                    ),
                                  ]
                                    .filter(Boolean)
                                    .join(", ") || null,
                                hideEmpty: true,
                              },
                            ]}
                          />
                        </DetailSection>

                        <DetailSection title="Account Details">
                          <DetailFieldGrid
                            fields={[
                              {
                                label: "Account Status",
                                value: accountMeta?.label,
                                hideEmpty: true,
                              },
                              {
                                label: "Account Type",
                                value:
                                  profile?.isGuest || user?.user?.isGuest
                                    ? "Guest session"
                                    : null,
                                hideEmpty: true,
                              },
                              { label: "Created At", value: createdAt, hideEmpty: true },
                              { label: "Last Updated", value: lastUpdated, hideEmpty: true },
                            ]}
                          />
                        </DetailSection>

                        <DetailSection title="Preferences">
                          <DetailFieldGrid
                            fields={[
                              {
                                label: "Notifications",
                                value: notificationValue,
                                hideEmpty: true,
                              },
                              { label: "User Type", value: userType, hideEmpty: true },
                              { label: "Device Type", value: deviceType, hideEmpty: true },
                            ]}
                          />
                        </DetailSection>
                      </>
                    ) : null}
                  </DetailPanel>

                  {activeTab === TAB_SPEND ? (
                    <UserSpendOverview lifetime={lifetime} loading={txLoading} />
                  ) : null}

                  {activeTab === TAB_TRANSACTIONS ? (
                    <UserTransactionHistory
                      analytics={analytics}
                      filters={txFilters}
                      loading={txLoading}
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
