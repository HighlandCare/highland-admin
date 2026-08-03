import PropTypes from "prop-types";
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowTrendingUpIcon from "@heroicons/react/24/solid/ArrowTrendingUpIcon";
import XMarkIcon from "@heroicons/react/24/solid/XMarkIcon";

const FEED_DOT = {
  green: "#22c55e",
  yellow: "#eab308",
  blue: "#3b82f6",
  purple: "#a855f7",
  red: "#ef4444",
};

function formatFeedLocation(location) {
  if (!location) return "DFW Metro";
  if (/^\d+\.\d+,\s*\d+\.\d+$/.test(String(location).trim())) {
    return "DFW Metro";
  }
  return location;
}

function LiveStatCard({ label, value, sublabel, accent }) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: "12px",
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        sx={{
          color: "text.secondary",
          fontSize: 11,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: accent,
          fontSize: 26,
          fontWeight: 800,
          lineHeight: 1.2,
          mt: 0.5,
        }}
      >
        {value}
      </Typography>
      {sublabel ? (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
          <ArrowTrendingUpIcon width={14} style={{ color: "#16a34a" }} />
          <Typography sx={{ color: "text.secondary", fontSize: 11 }}>{sublabel}</Typography>
        </Stack>
      ) : null}
    </Box>
  );
}

LiveStatCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sublabel: PropTypes.string,
  accent: PropTypes.string,
};

export default function LiveOpsRightPanel({
  feed,
  stats,
  filter,
  onFilterChange,
  onFeedItemClick,
  onViewAllSignups,
  mobile,
  onClose,
}) {
  const tabs = [
    { key: "all", label: "All" },
    { key: "customer_signup", label: "Customers" },
    { key: "driver_signup", label: "Drivers" },
    { key: "ride_request", label: "Bookings" },
    { key: "food_order", label: "Food" },
  ];

  const visibleFeed =
    filter === "all" ? feed : feed.filter((item) => item.type === filter);

  const s = stats ?? {};

  return (
    <Box
      sx={{
        width: mobile ? "100%" : 360,
        height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "background.paper",
        borderLeft: mobile ? "none" : "1px solid",
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          pt: 2.5,
          pb: 1.5,
          flexShrink: 0,
          zIndex: 2,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography sx={{ color: "text.primary", fontWeight: 800, fontSize: 18 }}>
            Live Signups
          </Typography>
          {mobile ? (
            <IconButton
              onClick={onClose}
              aria-label="Close live signups"
              sx={{ width: 40, height: 40, color: "text.secondary" }}
            >
              <XMarkIcon width={20} />
            </IconButton>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.75 }}>
          {tabs.map((tab) => (
            <Chip
              key={tab.key}
              size="small"
              label={tab.label}
              onClick={() => onFilterChange?.(tab.key)}
              sx={{
                bgcolor: filter === tab.key ? "primary.main" : "neutral.50",
                color: filter === tab.key ? "primary.contrastText" : "text.primary",
                fontWeight: 600,
                border: "1px solid",
                borderColor: filter === tab.key ? "primary.main" : "divider",
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box
        sx={{
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        <Box sx={{ px: 2.5, pt: 2, pb: 2 }}>
          <Stack spacing={1}>
            {visibleFeed.length === 0 ? (
              <Typography sx={{ color: "text.secondary", fontSize: 13, py: 2 }}>
                No events in this filter
              </Typography>
            ) : (
              visibleFeed.map((item) => (
                <Box
                  key={item.id}
                  onClick={() => onFeedItemClick?.(item)}
                  sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: "background.default",
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    gap: 1.25,
                    cursor: "pointer",
                    transition: "border-color 120ms ease, box-shadow 120ms ease",
                    "&:hover": {
                      borderColor: "primary.light",
                      boxShadow: "0 4px 14px rgba(0, 130, 138, 0.12)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "10px",
                      bgcolor: `${FEED_DOT[item.color] ?? "#9DA4AE"}22`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: FEED_DOT[item.color] ?? "#9DA4AE",
                      }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ color: "text.primary", fontSize: 13, fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                    <Typography
                      sx={{
                        color: "text.secondary",
                        fontSize: 12,
                        mt: 0.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.detail}
                    </Typography>
                    <Typography sx={{ color: "text.disabled", fontSize: 11, mt: 0.5 }}>
                      {formatFeedLocation(item.location)} · {item.timeLabel}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Stack>

          <Button
            fullWidth
            onClick={() => onViewAllSignups?.(filter)}
            sx={{
              mt: 2,
              color: "primary.main",
              borderColor: "primary.alpha30",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
            }}
            variant="outlined"
          >
            View All Signups
          </Button>
        </Box>

        <Divider />

        <Box sx={{ px: 2.5, pt: 2, pb: 2.5 }}>
          <Typography sx={{ color: "text.primary", fontWeight: 800, fontSize: 16, mb: 1.5 }}>
            Live Stats
          </Typography>
          <Stack spacing={1.25}>
            <LiveStatCard
              label="Total Signups Today"
              value={(s.customerRegistrationsToday ?? 0) + (s.driverRegistrationsToday ?? 0)}
              sublabel="Today"
              accent="#00828A"
            />
            <LiveStatCard
              label="Online Drivers"
              value={s.driversOnline ?? 0}
              sublabel="Active now"
              accent="#ca8a04"
            />
            <LiveStatCard
              label="Active Bookings"
              value={(s.activeRides ?? 0) + (s.activeFoodDeliveries ?? 0)}
              sublabel="In progress"
              accent="#0284c7"
            />
            <LiveStatCard
              label="Revenue Today"
              value={`$${Number(s.revenueToday ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              accent="#059669"
            />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

LiveOpsRightPanel.propTypes = {
  feed: PropTypes.array,
  stats: PropTypes.object,
  filter: PropTypes.string,
  onFilterChange: PropTypes.func,
  onFeedItemClick: PropTypes.func,
  onViewAllSignups: PropTypes.func,
  mobile: PropTypes.bool,
  onClose: PropTypes.func,
};
