import PropTypes from "prop-types";
import { Box, Stack, Typography } from "@mui/material";

function Sparkline({ color }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 72 20"
      sx={{ width: 72, height: 20, display: "block", mt: 1, opacity: 0.9 }}
      aria-hidden
    >
      <path
        d="M1 14 C10 13, 14 8, 22 9 S36 16, 44 8 S60 4, 71 6"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Box>
  );
}

Sparkline.propTypes = {
  color: PropTypes.string,
};

function KpiCard({ label, value, accent, sublabel }) {
  return (
    <Box
      sx={{
        flex: { xs: "0 0 140px", sm: "0 0 160px", lg: "1 1 180px" },
        minWidth: { xs: 140, sm: 160 },
        px: { xs: 1.5, md: 2 },
        py: { xs: 0.5, md: 0.5 },
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
      <Sparkline color={accent} />
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
        <KpiCard label="Live Bookings" value={s.liveBookings ?? 0} accent="#22c55e" sublabel="In progress" />
        <KpiCard
          label="Revenue Today"
          value={`$${Number(s.revenueToday ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          accent="#22c55e"
          sublabel="Paid rides"
        />
        <KpiCard label="Drivers Online" value={s.driversOnline ?? 0} accent="#eab308" sublabel="Active now" />
        <KpiCard label="Active Rides" value={s.activeRides ?? 0} accent="#3b82f6" />
        <KpiCard label="Customer Signups" value={s.customerRegistrationsToday ?? 0} accent="#22c55e" />
        <KpiCard label="Driver Signups" value={s.driverRegistrationsToday ?? 0} accent="#f97316" />
        <KpiCard
          label="Commission Today"
          value={`$${Number(s.commissionToday ?? 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}`}
          accent="#a855f7"
        />
      </Stack>
    </Box>
  );
}

LiveOpsStatsBar.propTypes = {
  stats: PropTypes.object,
};
