import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import CheckCircleIcon from "@heroicons/react/24/outline/CheckCircleIcon";
import XCircleIcon from "@heroicons/react/24/outline/XCircleIcon";
import {
  Box,
  Button,
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
import { toast } from "react-toastify";
import { Layout as DashboardLayout } from "../layouts/dashboard/layout";
import Loader from "../components/Loader";
import {
  DataTable,
  DataTableToolbar,
  getServerPaginationMeta,
  getServerPaginationProps,
} from "../components/data-table";
import { StatusBadge } from "../components/table-cells";
import { getRestaurants, updateRestaurantApproval } from "../Services/Auth.service";
import { formatDateTime } from "../utils/dateUtils";
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
  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

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

  const handleApproval = async (restaurant, approved) => {
    try {
      setSubmittingId(restaurant._id);
      await updateRestaurantApproval(restaurant._id, approved);
      toast.success(approved ? "Restaurant approved" : "Restaurant rejected");
      const response = await getRestaurants(page, 20, { status, search });
      setItems(response);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to update restaurant");
    } finally {
      setSubmittingId(null);
    }
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
                minWidth={900}
                pagination={getServerPaginationProps({
                  currentPage: page,
                  onPageChange: setPage,
                  totalPages: paginationMeta.totalPages,
                  totalRecords: paginationMeta.totalRecords,
                })}
                toolbar={
                  <DataTableToolbar
                    actions={
                      <FormControl size="small" sx={{ minWidth: 180 }}>
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
                    <TableCell>Contact</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((restaurant) => (
                    <TableRow hover key={restaurant._id}>
                      <TableCell>
                        <Typography fontWeight={600}>{restaurant.businessName || "—"}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {restaurant.cuisine || "Restaurant"}
                        </Typography>
                      </TableCell>
                      <TableCell>{restaurant.ownerName || "—"}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{restaurant.phone || "—"}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {restaurant.email || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          color={restaurant.isApproved ? "success" : "warning"}
                          label={restaurant.isApproved ? "Approved" : "Pending"}
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(restaurant.createdAt)}</TableCell>
                      <TableCell align="right">
                        {!restaurant.isApproved ? (
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Button
                              color="success"
                              disabled={submittingId === restaurant._id}
                              size="small"
                              startIcon={<CheckCircleIcon width={18} />}
                              variant="contained"
                              onClick={() => handleApproval(restaurant, true)}
                            >
                              Accept
                            </Button>
                            <Button
                              color="error"
                              disabled={submittingId === restaurant._id}
                              size="small"
                              startIcon={<XCircleIcon width={18} />}
                              variant="outlined"
                              onClick={() => handleApproval(restaurant, false)}
                            >
                              Reject
                            </Button>
                          </Stack>
                        ) : (
                          <Typography color="text.secondary" variant="body2">
                            Approved
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
