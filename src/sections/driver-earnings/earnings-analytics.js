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
import {
  formatEarningsCurrency,
  getEarningsDriverName,
} from "../../utils/earningsUtils";

const useChartOptions = (categories) => {
  const theme = useTheme();

  return {
    chart: {
      background: "transparent",
      toolbar: { show: false },
    },
    colors: [theme.palette.primary.main],
    dataLabels: { enabled: false },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
    },
    legend: { show: false },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "45%",
        horizontal: true,
      },
    },
    theme: { mode: theme.palette.mode },
    tooltip: {
      y: {
        formatter: (value) => formatEarningsCurrency(value),
      },
    },
    xaxis: {
      categories,
      labels: {
        style: { colors: theme.palette.text.secondary },
      },
    },
    yaxis: {
      labels: {
        style: { colors: theme.palette.text.secondary },
      },
    },
  };
};

export const EarningsAnalytics = (props) => {
  const { analytics, loading = false, sx } = props;
  const topEarners = analytics?.topEarners || [];
  const categories = topEarners.map((driver) => getEarningsDriverName(driver));
  const series = [
    {
      name: "Total Earned",
      data: topEarners.map((driver) => Number(driver.totalEarned) || 0),
    },
  ];
  const chartOptions = useChartOptions(categories);
  const hasChartData = topEarners.length > 0;

  return (
    <Card sx={sx}>
      <CardHeader
        subheader="Top earning drivers from current earnings data"
        title="Earnings Analytics"
      />
      <CardContent>
        {loading ? (
          <Loader minHeight={320} size="md" />
        ) : !hasChartData ? (
          <Box sx={{ alignItems: "center", display: "flex", height: 280, justifyContent: "center" }}>
            <Typography color="text.secondary" variant="body2">
              No earnings analytics available yet.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            <Chart
              height={Math.max(280, topEarners.length * 42)}
              options={chartOptions}
              series={series}
              type="bar"
              width="100%"
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

EarningsAnalytics.propTypes = {
  analytics: PropTypes.object,
  loading: PropTypes.bool,
  sx: PropTypes.object,
};
