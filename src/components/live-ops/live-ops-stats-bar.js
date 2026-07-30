import PropTypes from "prop-types";
import { Box, Stack, Typography } from "@mui/material";

function KpiCard({ label, value, accent, sublabel }) {
  return (
    <Box
      sx={{
        flex: { xs: "0 0 140px", sm: "0 0 160px", lg: "1 1 180px" },
        minWidth: { xs: 140, sm: 160 },
        p: { xs: 1.5, md: 2 },
        borderRadius: "14px",
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        backgroundImage: `linear-gradient(135deg, ${accent}14 0%, transparent 60%)`,
      }}
    >
      <Typography
        sx={{
          color: "text.secondary",
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: accent,
          fontSize: { xs: 20, sm: 24 },
          fontWeight: 800,
          mt: 0.75,
          lineHeight: 1,
        }}
      >
        {value}
      </Typography>
      {sublabel ? (
        <Typography sx={{ color: "text.secondary", fontSize: 11, mt: 0.75 }}>{sublabel}</Typography>
      ) : null}
    </Box>
  );
}

KpiCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  accent: PropTypes.string,
  sublabel: PropTypes.string,
};

export default function LiveOpsStatsBar({ stats }) {
  const s = stats ?? {};

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2 },
        py: { xs: 1, md: 1.5 },
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        flexShrink: 0,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ minWidth: "max-content" }}>
        <KpiCard label="Live Bookings" value={s.liveBookings ?? 0} accent="#00828A" sublabel="In progress" />
        <KpiCard
          label="Revenue Today"
          value={`$${Number(s.revenueToday ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          accent="#059669"
          sublabel="Today"
        />
        <KpiCard label="Drivers Online" value={s.driversOnline ?? 0} accent="#ca8a04" sublabel="Active now" />
        <KpiCard label="Active Rides" value={s.activeRides ?? 0} accent="#0284c7" />
        <KpiCard label="Food Deliveries" value={s.activeFoodDeliveries ?? 0} accent="#7c3aed" />
        <KpiCard label="Customer Signups" value={s.customerRegistrationsToday ?? 0} accent="#16a34a" />
        <KpiCard label="Driver Signups" value={s.driverRegistrationsToday ?? 0} accent="#ea580c" />
        <KpiCard
          label="Commission Today"
          value={`$${Number(s.commissionToday ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          accent="#db2777"
        />
      </Stack>
    </Box>
  );
}

LiveOpsStatsBar.propTypes = {
  stats: PropTypes.object,
};
