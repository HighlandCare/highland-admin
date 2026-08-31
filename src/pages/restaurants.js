import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import EyeIcon from "@heroicons/react/24/outline/EyeIcon";
import {
  Box,
  Container,
  FormControl,
  MenuItem,
  Select,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Loader from "../components/Loader";
import {
  DataTable,
  DataTableToolbar,
  getServerPaginationMeta,
  getServerPaginationProps,
} from "../components/data-table";
import {
  StatusBadge,
  TableEmailCell,
  TablePersonCell,
  TablePhoneCell,
  TableQuickActions,
} from "../components/table-cells";
import { getRestaurants } from "../Services/Auth.service";
import { pageContainerSx, pageMainSx } from "../utils/pageLayout";

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending approval", value: "pending" },
  { label: "Approved", value: "approved" },
];

const getRestaurantList = (response) => {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response)) return response;
  return [];
};

const Page = () => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState({});

  useEffect(() => {
    const isLogin = JSON.parse(typeof window !== "undefined" && localStorage.getItem("isLogin"));
    if (!isLogin) router.push("/auth/login");
  }, [router]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await getRestaurants(page, 20, { status, search });
        if (active) setItems(response);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [page, status, search]);

  const rows = getRestaurantList(items);
  const paginationMeta = getServerPaginationMeta(items, page, rows.length);

  const handleOpenDetail = (restaurant) => {
    if (!restaurant?._id) return;
    router.push(`/restaurants/detail?id=${restaurant._id}`);
  };

  return (
    <>
      <Head>
        <title>Restaurant Management | Highland Care</title>
      </Head>

      <Box component="main" sx={pageMainSx}>
        <Container maxWidth="xl" sx={pageContainerSx}>
          <Stack spacing={3}>
            {isLoading && !rows.length ? (
              <Loader page />
            ) : (
              <DataTable
                empty={!rows.length}
                minWidth={800}
                pagination={getServerPaginationProps({
                  currentPage: page,
                  onPageChange: setPage,
                  totalPages: paginationMeta.totalPages,
                  totalRecords: paginationMeta.totalRecords,
                })}
                toolbar={
                  <DataTableToolbar
                    actions={
                      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 }, width: { xs: "100%", sm: "auto" } }}>
                        <Select
                          displayEmpty
                          value={status}
                          onChange={(e) => {
                            setStatus(e.target.value);
                            setPage(1);
                          }}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <MenuItem key={option.label} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    }
                    onSearchChange={(value) => {
                      setSearch(value);
                      setPage(1);
                    }}
                    searchPlaceholder="Search by business name"
                    searchValue={search}
                    title="Restaurant Management"
                  />
                }
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Business</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography color="text.secondary" textAlign="center" variant="body2">
                          No matching results found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((restaurant) => (
                      <TableRow hover key={restaurant._id}>
                        <TableCell>
                          <TablePersonCell
                            imageUrl={
                              restaurant.logo ||
                              restaurant.logoUrl ||
                              restaurant.image ||
                              restaurant.imageUrl ||
                              undefined
                            }
                            name={restaurant.businessName || "—"}
                            subtitle={restaurant.cuisine || "Restaurant"}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography fontWeight={600} variant="body2">
                            {restaurant.ownerName || restaurant.owner?.fullName || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <TableEmailCell
                            email={restaurant.email || restaurant.owner?.email}
                          />
                        </TableCell>
                        <TableCell>
                          <TablePhoneCell
                            phone={restaurant.phone || restaurant.owner?.phone}
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            color={restaurant.isApproved ? "success" : "warning"}
                            label={restaurant.isApproved ? "Approved" : "Pending"}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TableQuickActions
                            actions={[
                              {
                                icon: EyeIcon,
                                label: "View Details",
                                onClick: () => handleOpenDetail(restaurant),
                              },
                            ]}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </DataTable>
            )}
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
export default Page;
