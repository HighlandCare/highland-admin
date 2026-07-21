import PropTypes from "prop-types";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Chart } from "../../components/chart";
import Loader from "../../components/Loader";

const useChartOptions = (labels, colors) => {
  const theme = useTheme();

  return {
    chart: {
      background: "transparent",
    },
    colors: colors.length
      ? colors
      : [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main],
    dataLabels: {
      enabled: false,
    },
    labels,
    legend: {
      show: false,
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
      },
    },
    states: {
      active: {
        filter: {
          type: "none",
        },
      },
      hover: {
        filter: {
          type: "none",
        },
      },
    },
    stroke: {
      width: 0,
    },
    theme: {
      mode: theme.palette.mode,
    },
    tooltip: {
      fillSeriesColor: false,
    },
  };
};

export const OverviewRideStatus = (props) => {
  const { labels = [], series = [], loading = false, sx } = props;
  const theme = useTheme();
  const colors = [
    theme.palette.success.main,
    theme.palette.primary.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.neutral[500],
  ];
  const chartOptions = useChartOptions(labels, colors);
  const hasData = labels.length > 0 && series.some((value) => value > 0);

  return (
    <Card sx={sx}>
      <CardHeader title="Ride Status Breakdown" />
      <CardContent>
        {loading ? (
          <Loader minHeight={300} size="md" />
        ) : !hasData ? (
          <Box sx={{ alignItems: "center", display: "flex", height: 300, justifyContent: "center" }}>
            <Typography color="text.secondary" variant="body2">
              No ride data available yet.
            </Typography>
          </Box>
        ) : (
          <>
            <Chart height={280} options={chartOptions} series={series} type="donut" width="100%" />
            <Stack
              alignItems="center"
              direction="row"
              flexWrap="wrap"
              justifyContent="center"
              spacing={2}
              sx={{ mt: 2 }}
            >
              {labels.map((label, index) => (
                <Box
                  key={label}
                  sx={{
                    alignItems: "center",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 72,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: colors[index % colors.length],
                      borderRadius: "50%",
                      height: 10,
                      mb: 1,
                      width: 10,
                    }}
                  />
                  <Typography variant="subtitle2">{label}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {series[index]} rides
                  </Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
};

OverviewRideStatus.propTypes = {
  labels: PropTypes.array,
  loading: PropTypes.bool,
  series: PropTypes.array,
  sx: PropTypes.object,
};
