import PropTypes from "prop-types";
import ArrowRightIcon from "@heroicons/react/24/solid/ArrowRightIcon";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  Divider,
  SvgIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Scrollbar } from "../../components/scrollbar";
import { StatusBadge } from "../../components/table-cells";
import Loader from "../../components/Loader";
import {
  formatRideCurrency,
  getRideAdminEarning,
  getRideCustomerName,
  getRideDriverName,
  getRideStatusMeta,
} from "../../utils/rideUtils";
import { formatRelativeDate } from "../../utils/dateUtils";

export const OverviewLatestRides = (props) => {
  const { rides = [], loading = false, sx } = props;
  const latestRides = rides.slice(0, 6);

  return (
    <Card sx={sx}>
      <CardHeader title="Latest Rides" subheader="Recent rides from ride history" />
      {loading ? (
        <Box sx={{ py: 6 }}>
          <Loader minHeight={180} size="md" />
        </Box>
      ) : latestRides.length === 0 ? (
        <Box sx={{ px: 3, py: 6, textAlign: "center" }}>
          <Typography color="text.secondary" variant="body2">
            No recent rides to display.
          </Typography>
        </Box>
      ) : (
        <Scrollbar sx={{ flexGrow: 1 }}>
          <Box sx={{ minWidth: 720 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Driver</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Admin Earned</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {latestRides.map((ride, index) => {
                  const statusMeta = getRideStatusMeta(ride?.status);

                  return (
                    <TableRow hover key={ride?.rideId || ride?._id || index}>
                      <TableCell>
                        <Typography fontWeight={600} variant="body2">
                          {getRideDriverName(ride)}
                        </Typography>
                      </TableCell>
                      <TableCell>{getRideCustomerName(ride)}</TableCell>
                      <TableCell>
                        <StatusBadge color={statusMeta.color} label={statusMeta.label} />
                      </TableCell>
                      <TableCell>{formatRideCurrency(getRideAdminEarning(ride))}</TableCell>
                      <TableCell>
                        {formatRelativeDate(ride?.createdAt || ride?.rideStartTime)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Scrollbar>
      )}
      <Divider />
      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Link href="/ride-history" style={{ color: "inherit", textDecoration: "none" }}>
          <Button
            color="inherit"
            endIcon={
              <SvgIcon fontSize="small">
                <ArrowRightIcon />
              </SvgIcon>
            }
            size="small"
          >
            View All Rides
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
};

OverviewLatestRides.propTypes = {
  loading: PropTypes.bool,
  rides: PropTypes.array,
  sx: PropTypes.object,
};
