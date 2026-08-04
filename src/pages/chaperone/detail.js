import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Container } from "@mui/material";
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
};

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
};

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [detail, setDetail] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

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
    getChaperoneMediaUrl(summary.profileImage) ||
    getChaperoneMediaUrl(media.profilePhoto);

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
                <>
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
                          value: formatEarningsCurrency(summary.walletBalance ?? wallet.walletBalance),
                        },
                        { label: "Stripe", value: summary.stripeStatus || wallet.stripeStatus || null },
                      ]}
                      subtitle={email ? email.toLowerCase() : "No email linked"}
                      title={displayName}
                    />

                    <DetailSection noBorder title="Personal Information">
                      <DetailFieldGrid
                        fields={[
                          { label: "Full Name", value: personal.fullName },
                          { label: "Email", value: personal.email },
                          { label: "Phone", value: personal.phone },
                          { label: "Date of Birth", value: formatDate(personal.dob) },
                          { label: "Address", value: personal.address },
                          { label: "Location", value: formatDetailValue(personal.location) },
                          { label: "City", value: personal.city },
                          { label: "State", value: personal.state },
                          { label: "Zip Code", value: personal.zipCode },
                          {
                            label: "Persona Status",
                            value: personal.personaStatus
                              ? String(personal.personaStatus).replace(/^\w/, (c) => c.toUpperCase())
                              : null,
                          },
                          { label: "Verified", value: getChaperoneVerifiedLabel(detail) },
                          { label: "Joined", value: formatDate(personal.joinedAt) },
                          { label: "Last Active", value: formatRelativeDate(personal.lastActiveAt) },
                        ]}
                      />
                    </DetailSection>

                    <DetailSection title="Vehicle & License">
                      <DetailFieldGrid
                        fields={[
                          { label: "Vehicle Name", value: vehicle.vehicleName },
                          { label: "Vehicle Number", value: vehicle.vehicleNumber },
                          { label: "Experience", value: vehicle.experience },
                          { label: "License Number", value: vehicle.licenseNumber },
                          { label: "License Expiry", value: vehicle.licenseExpiry },
                          { label: "Hourly Fare", value: formatHourlyFare(vehicle.hourlyFare) },
                        ]}
                      />
                    </DetailSection>

                    <DetailSection title="Wallet & Payments">
                      <DetailFieldGrid
                        fields={[
                          { label: "Wallet Balance", value: formatEarningsCurrency(wallet.walletBalance) },
                          { label: "Total Earned", value: formatEarningsCurrency(wallet.totalEarned) },
                          { label: "Total Withdrawn", value: formatEarningsCurrency(wallet.totalWithdrawn) },
                          { label: "Completed Rides", value: wallet.completedRides ?? null },
                          { label: "Stripe Connection", value: wallet.stripeStatus || null },
                          { label: "Stripe Business Name", value: wallet.stripeBusinessName || null },
                        ]}
                      />
                    </DetailSection>

                    <DetailSection description="Swipe to view uploaded documents." title="Documents">
                      <DetailDocumentGallery documents={documents} />
                    </DetailSection>
                  </DetailPanel>

                  <DriverTransactionHistory loading={isLoadingTransactions} transactions={transactions} />
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
