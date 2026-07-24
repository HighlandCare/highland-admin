import PropTypes from "prop-types";
import {
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

const FEED_DOT = {
  green: "#22c55e",
  yellow: "#eab308",
  blue: "#3b82f6",
  purple: "#a855f7",
  red: "#ef4444",
};

export default function LiveOpsFeed({ feed, filter, onFilterChange }) {
  const tabs = [
    { key: "all", label: "All" },
    { key: "customer_signup", label: "Customers" },
    { key: "driver_signup", label: "Drivers" },
    { key: "ride_request", label: "Rides" },
    { key: "food_order", label: "Food" },
    { key: "emergency", label: "Urgent" },
  ];

  const visibleFeed =
    filter === "all" ? feed : feed.filter((item) => item.type === filter);

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#111827",
        borderLeft: "1px solid rgba(148,163,184,.15)",
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid rgba(148,163,184,.15)" }}>
        <Typography variant="h6" sx={{ color: "#f8fafc", fontWeight: 700 }}>
          Live Feed
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.75 }}>
          {tabs.map((tab) => (
            <Chip
              key={tab.key}
              size="small"
              label={tab.label}
              onClick={() => onFilterChange?.(tab.key)}
              sx={{
                bgcolor: filter === tab.key ? "rgba(124,58,237,.35)" : "rgba(30,41,59,.8)",
                color: "#e2e8f0",
                border: "1px solid rgba(148,163,184,.2)",
              }}
            />
          ))}
        </Stack>
      </Box>

      <List
        dense
        sx={{
          flex: 1,
          overflow: "auto",
          px: 1,
          "& .MuiListItem-root": { borderRadius: 1.5, mb: 0.5 },
        }}
      >
        {visibleFeed.length === 0 ? (
          <ListItem>
            <ListItemText
              primary="No live events in this filter"
              primaryTypographyProps={{ color: "#94a3b8", fontSize: 13 }}
            />
          </ListItem>
        ) : (
          visibleFeed.map((item) => (
            <ListItem
              key={item.id}
              sx={{
                bgcolor: "rgba(15,23,42,.75)",
                border: "1px solid rgba(148,163,184,.12)",
                alignItems: "flex-start",
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: FEED_DOT[item.color] ?? "#94a3b8",
                  boxShadow: `0 0 10px ${FEED_DOT[item.color] ?? "#94a3b8"}`,
                  mt: 0.75,
                  mr: 1.25,
                  flexShrink: 0,
                }}
              />
              <ListItemText
                primary={
                  <Typography sx={{ color: "#f1f5f9", fontSize: 13, fontWeight: 600 }}>
                    {item.label} – {item.detail}
                  </Typography>
                }
                secondary={
                  <Typography sx={{ color: "#94a3b8", fontSize: 11, mt: 0.5 }}>
                    {item.location} · {item.timeLabel}
                  </Typography>
                }
              />
            </ListItem>
          ))
        )}
      </List>

      <Divider sx={{ borderColor: "rgba(148,163,184,.15)" }} />
      <Box sx={{ p: 1.5 }}>
        <Typography sx={{ color: "#64748b", fontSize: 11 }}>
          Updates every 15 seconds
        </Typography>
      </Box>
    </Box>
  );
}

LiveOpsFeed.propTypes = {
  feed: PropTypes.array,
  filter: PropTypes.string,
  onFilterChange: PropTypes.func,
};
