import PropTypes from "prop-types";
import ArrowRightIcon from "@heroicons/react/24/solid/ArrowRightIcon";
import Link from "next/link";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  SvgIcon,
  useTheme,
  Box,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Chart } from "../../components/chart";
import Loader from "../../components/Loader";

const useChartOptions = (categories) => {
  const theme = useTheme();

  return {
    chart: {
      background: "transparent",
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    colors: [theme.palette.primary.main, alpha(theme.palette.primary.main, 0.35)],
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 1,
      type: "solid",
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
    },
    plotOptions: {
      bar: {
        columnWidth: "40px",
      },
    },
    stroke: {
      colors: ["transparent"],
      show: true,
      width: 2,
    },
    theme: {
      mode: theme.palette.mode,
    },
    xaxis: {
      axisBorder: {
        color: theme.palette.divider,
        show: true,
      },
      axisTicks: {
        color: theme.palette.divider,
        show: true,
      },
      categories,
      labels: {
        offsetY: 5,
        style: {
          colors: theme.palette.text.secondary,
        },
      },
    },
    yaxis: [
      {
        labels: {
          formatter: (value) => `${Math.round(value)}`,
          offsetX: -10,
          style: {
            colors: theme.palette.text.secondary,
          },
        },
        title: {
          text: "Rides",
        },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
    },
  };
};

export const OverviewRideAnalytics = (props) => {
  const { chartSeries = [], categories = [], loading = false, sx } = props;
  const chartOptions = useChartOptions(categories);
  const hasData = chartSeries.some((series) => series?.data?.some((value) => value > 0));

  return (
    <Card sx={sx}>
      <CardHeader title="Ride Analytics" subheader="Monthly rides from existing ride history" />
      <CardContent>
        {loading ? (
          <Loader minHeight={350} size="md" />
        ) : !hasData ? (
          <Box sx={{ alignItems: "center", display: "flex", height: 350, justifyContent: "center" }}>
            <Typography color="text.secondary" variant="body2">
              No ride analytics available yet.
            </Typography>
          </Box>
        ) : (
          <Chart height={350} options={chartOptions} series={chartSeries} type="bar" width="100%" />
        )}
      </CardContent>
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
            View Ride History
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
};

OverviewRideAnalytics.propTypes = {
  categories: PropTypes.array,
  chartSeries: PropTypes.array,
  loading: PropTypes.bool,
  sx: PropTypes.object,
};
