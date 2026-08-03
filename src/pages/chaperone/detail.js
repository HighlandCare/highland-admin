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
import { getChap, getChaperoneById } from "../../Services/Auth.service";
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
import { formatEarningsCurrency, normalizeDriverTransactions } from "../../utils/earningsUtils";
import { pageContainerSx, pageMainSx, pageTitleSx } from "../../utils/pageLayout";

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

const DetailItem = ({ label, value }) => {
  const safeValue = formatDetailValue(value);
  const isEmail = label === "Email" || (typeof safeValue === "string" && safeValue.includes("@"));
  const displayValue = isEmail && safeValue ? String(safeValue).toLowerCase() : safeValue;

  if (displayValue == null || displayValue === "") {
    return (
      <Box>
        <Typography color="text.secondary" variant="caption">
          {label}
        </Typography>
        <Typography fontWeight={600} variant="body2">
          —
        </Typography>
      </Box>
    );
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

const DocumentCard = ({ label, src }) => (
  <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
    <CardContent>
      <Typography sx={{ mb: 2 }} variant="subtitle2">
        {label}
      </Typography>
      {src ? (
        <Box
          component="img"
          src={src}
          alt={label}
          sx={{
            border: "1px solid",
            borderColor: "neutral.200",
            borderRadius: 2,
            maxHeight: 260,
            objectFit: "cover",
            width: "100%",
          }}
        />
      ) : (
        <Typography color="text.secondary" variant="body2">
          Not available
        </Typography>
      )}
    </CardContent>
  </Card>
);

const formatHourlyFare = (value) => {
  if (value == null || value === "") {
    return "—";
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
  const [isLoading, setIsLoading] = useState(true);

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

  const summary = detail?.summary || {};
  const personal = detail?.personalInformation || {};
  const vehicle = detail?.vehicleAndLicense || {};
  const wallet = detail?.walletAndPayments || {};
  const media = detail?.mediaAndDocuments || {};
  const transactions = normalizeDriverTransactions(detail?.transactionHistory || []);

  const displayName = getChaperoneDetailDisplayName(detail);
  const email = getChaperoneDetailEmail(detail);
  const profileImage =
    getChaperoneMediaUrl(summary.profileImage) ||
    getChaperoneMediaUrl(media.profilePhoto);

  return (
    <>
      <Head>
        <title>
          {detail ? `${displayName} | Driver` : "Driver Details"} | Highland Care
        </title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3}>
            <Button
              component={NextLink}
              href="/chaperone"
              startIcon={
                <SvgIcon fontSize="small">
                  <ArrowLeftIcon />
                </SvgIcon>
              }
              sx={{ alignSelf: "flex-start", textTransform: "capitalize" }}
            >
              Back to Drivers
            </Button>

            {isLoading ? (
              <Loader page />
            ) : !detail ? (
              <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                <CardContent sx={{ py: 8, textAlign: "center" }}>
                  <Typography variant="h6">Driver not found</Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                    The selected driver could not be loaded.
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
                      <Box
                        component="img"
                        src={profileImage || undefined}
                        alt={displayName}
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
                      <Box flex={1}>
                        <Typography sx={pageTitleSx} variant="h4">
                          {displayName}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          data-email={email ? "true" : undefined}
                          sx={{
                            mt: 0.5,
                            ...(email ? { textTransform: "lowercase" } : {}),
                          }}
                          variant="body1"
                        >
                          {email ? email.toLowerCase() : "No email linked"}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={3} mt={2}>
                          <DetailItem label="Approval" value={getChaperoneApprovalLabel(detail)} />
                          <DetailItem label="Online" value={getChaperoneOnlineLabel(detail)} />
                          <DetailItem
                            label="Account Status"
                            value={getChaperoneBlockedLabel(detail)}
                          />
                          <DetailItem
                            label="Ride Status"
                            value={getChaperoneRideStatusLabel(detail)}
                          />
                          <DetailItem label="Rating" value={summary.rating ?? "—"} />
                          <DetailItem
                            label="Wallet Balance"
                            value={formatEarningsCurrency(
                              summary.walletBalance ?? wallet.walletBalance
                            )}
                          />
                          <DetailItem
                            label="Stripe"
                            value={summary.stripeStatus || wallet.stripeStatus || "—"}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>

                <Grid container spacing={3}>
                  <Grid item md={6} xs={12}>
                    <Card
                      sx={{
                        border: "1px solid",
                        borderColor: "neutral.200",
                        boxShadow: "none",
                        height: "100%",
                      }}
                    >
                      <CardContent>
                        <Typography sx={{ mb: 2 }} variant="h6">
                          Personal Information
                        </Typography>
                        <Stack spacing={2}>
                          <DetailItem label="Full Name" value={personal.fullName} />
                          <DetailItem label="Email" value={personal.email} />
                          <DetailItem label="Phone" value={personal.phone} />
                          <DetailItem label="Date of Birth" value={formatDate(personal.dob)} />
                          <DetailItem label="Address" value={personal.address} />
                          <DetailItem label="Location" value={personal.location} />
                          <DetailItem label="City" value={personal.city} />
                          <DetailItem label="State" value={personal.state} />
                          <DetailItem label="Zip Code" value={personal.zipCode} />
                          <DetailItem
                            label="Persona Status"
                            value={
                              personal.personaStatus
                                ? String(personal.personaStatus).replace(/^\w/, (c) =>
                                    c.toUpperCase()
                                  )
                                : "—"
                            }
                          />
                          <DetailItem
                            label="Verified"
                            value={getChaperoneVerifiedLabel(detail)}
                          />
                          <DetailItem
                            label="Account Status"
                            value={getChaperoneBlockedLabel(detail)}
                          />
                          <DetailItem label="Joined" value={formatDate(personal.joinedAt)} />
                          <DetailItem
                            label="Last Active"
                            value={formatRelativeDate(personal.lastActiveAt)}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item md={6} xs={12}>
                    <Card
                      sx={{
                        border: "1px solid",
                        borderColor: "neutral.200",
                        boxShadow: "none",
                        height: "100%",
                      }}
                    >
                      <CardContent>
                        <Typography sx={{ mb: 2 }} variant="h6">
                          Vehicle & License
                        </Typography>
                        <Stack spacing={2}>
                          <DetailItem label="Vehicle Name" value={vehicle.vehicleName} />
                          <DetailItem label="Vehicle Number" value={vehicle.vehicleNumber} />
                          <DetailItem label="Experience" value={vehicle.experience} />
                          <DetailItem label="License Number" value={vehicle.licenseNumber} />
                          <DetailItem label="License Expiry" value={vehicle.licenseExpiry} />
                          <DetailItem
                            label="Hourly Fare"
                            value={formatHourlyFare(vehicle.hourlyFare)}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card sx={{ border: "1px solid", borderColor: "neutral.200", boxShadow: "none" }}>
                      <CardContent>
                        <Typography sx={{ mb: 2 }} variant="h6">
                          Wallet & Payments
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={4}>
                          <DetailItem
                            label="Wallet Balance"
                            value={formatEarningsCurrency(wallet.walletBalance)}
                          />
                          <DetailItem
                            label="Total Earned"
                            value={formatEarningsCurrency(wallet.totalEarned)}
                          />
                          <DetailItem
                            label="Total Withdrawn"
                            value={formatEarningsCurrency(wallet.totalWithdrawn)}
                          />
                          <DetailItem
                            label="Completed Rides"
                            value={wallet.completedRides ?? "—"}
                          />
                          <DetailItem
                            label="Stripe Connection"
                            value={wallet.stripeStatus || "—"}
                          />
                          <DetailItem
                            label="Stripe Business Name"
                            value={wallet.stripeBusinessName || "—"}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item md={4} xs={12}>
                    <DocumentCard
                      label="Profile Photo"
                      src={getChaperoneMediaUrl(media.profilePhoto) || profileImage}
                    />
                  </Grid>
                  <Grid item md={4} xs={12}>
                    <DocumentCard
                      label="ID Card"
                      src={getChaperoneMediaUrl(media.idCard)}
                    />
                  </Grid>
                  <Grid item md={4} xs={12}>
                    <DocumentCard
                      label="Driving License"
                      src={getChaperoneMediaUrl(media.drivingLicense)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <DriverTransactionHistory transactions={transactions} />
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
