import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Box, Container, Stack } from "@mui/material";
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
import { getUserById } from "../../Services/Auth.service";
import { formatDate, formatRelativeDate } from "../../utils/dateUtils";
import { pageContainerSx, pageMainSx } from "../../utils/pageLayout";
import {
  getStoredUserDetail,
  getUserAccountStatusMeta,
  getUserDisplayName,
  getUserFromResponse,
  getUserProfileImage,
  storeUserDetail,
} from "../../utils/userUtils";

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

const Page = () => {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
                    ]}
                    subtitle={email ? email.toLowerCase() : "No email linked"}
                    title={getUserDisplayName(user)}
                  />

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
                        { label: "Address", value: pickFirstValue(profile.address, user?.address), hideEmpty: true },
                        { label: "City", value: pickFirstValue(profile.city, user?.city), hideEmpty: true },
                        { label: "State", value: pickFirstValue(profile.state, user?.state), hideEmpty: true },
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
                              pickFirstValue(profile.zipCode, profile.zip, user?.zipCode, user?.zip),
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
                        { label: "Account Status", value: accountMeta?.label, hideEmpty: true },
                        {
                          label: "Account Type",
                          value: profile?.isGuest || user?.user?.isGuest ? "Guest session" : null,
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
                        { label: "Notifications", value: notificationValue, hideEmpty: true },
                        { label: "User Type", value: userType, hideEmpty: true },
                        { label: "Device Type", value: deviceType, hideEmpty: true },
                      ]}
                    />
                  </DetailSection>
                </DetailPanel>
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
