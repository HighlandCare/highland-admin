import PropTypes from "prop-types";
import { Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { brand } from "../../theme/colors";
import { formatRideDurationSeconds } from "../../utils/rideUtils";

export function RideRouteStops({ stops = [] }) {
  if (!stops.length) {
    return (
      <Typography color="text.secondary" variant="body2">
        No stops recorded for this ride.
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {stops.map((stop, index) => {
        const isLast = index === stops.length - 1;
        const plannedWait = formatRideDurationSeconds(stop.plannedWaitingSeconds);
        const actualWait = formatRideDurationSeconds(stop.actualWaitingSeconds);
        const extraWait = formatRideDurationSeconds(stop.extraWaitingSeconds);
        const waitParts = [
          plannedWait && `Planned wait ${plannedWait}`,
          actualWait && `Actual wait ${actualWait}`,
          extraWait && `Extra wait ${extraWait}`,
        ].filter(Boolean);

        return (
          <Stack direction="row" key={`${stop.sequence ?? index}-${stop.kind || "stop"}`} spacing={2}>
            <Box sx={{ alignItems: "center", display: "flex", flexDirection: "column", width: 28 }}>
              <Box
                sx={{
                  alignItems: "center",
                  bgcolor: alpha(brand.primary, 0.12),
                  borderRadius: "50%",
                  color: "primary.main",
                  display: "flex",
                  flexShrink: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  height: 28,
                  justifyContent: "center",
                  width: 28,
                }}
              >
                {index + 1}
              </Box>
              {!isLast ? (
                <Box sx={{ bgcolor: "neutral.200", flex: 1, minHeight: 28, my: 0.5, width: 2 }} />
              ) : null}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 2.5 }}>
              <Typography fontWeight={600} variant="body2">
                {stop.address || "Address unavailable"}
              </Typography>
              {waitParts.length ? (
                <Typography color="text.secondary" sx={{ display: "block", mt: 0.5 }} variant="caption">
                  {waitParts.join(" · ")}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

RideRouteStops.propTypes = {
  stops: PropTypes.arrayOf(PropTypes.object),
};
