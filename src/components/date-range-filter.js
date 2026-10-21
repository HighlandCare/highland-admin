import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import CalendarDaysIcon from "@heroicons/react/24/outline/CalendarDaysIcon";
import ChevronLeftIcon from "@heroicons/react/24/solid/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/react/24/solid/ChevronRightIcon";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  SvgIcon,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isValid,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import { brand } from "../theme/colors";

const toDateValue = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return isValid(value) ? startOfDay(value) : null;
  }
  const parsed = parseISO(String(value));
  return isValid(parsed) ? startOfDay(parsed) : null;
};

const toApiDate = (value) => (value && isValid(value) ? format(value, "yyyy-MM-dd") : "");

const formatRangeLabel = (start, end) => {
  if (start && end) {
    if (isSameDay(start, end)) {
      return format(start, "MMM d, yyyy");
    }
    return `${format(start, "MMM d, yyyy")} – ${format(end, "MMM d, yyyy")}`;
  }
  if (start) {
    return `${format(start, "MMM d, yyyy")} – …`;
  }
  return "";
};

const getPresetRange = (key) => {
  const today = startOfDay(new Date());

  switch (key) {
    case "today":
      return { start: today, end: today };
    case "yesterday": {
      const day = subDays(today, 1);
      return { start: day, end: day };
    }
    case "thisWeek":
      return { start: startOfWeek(today), end: today };
    case "lastWeek": {
      const lastWeekEnd = subDays(startOfWeek(today), 1);
      return { start: startOfWeek(lastWeekEnd), end: lastWeekEnd };
    }
    case "thisMonth":
      return { start: startOfMonth(today), end: today };
    case "lastMonth": {
      const lastMonth = subMonths(today, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    }
    default:
      return { start: null, end: null };
  }
};

const PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "thisWeek", label: "This Week" },
  { key: "lastWeek", label: "Last Week" },
  { key: "thisMonth", label: "This Month" },
  { key: "lastMonth", label: "Last Month" },
];

const MonthGrid = ({
  month,
  draftStart,
  draftEnd,
  onDayClick,
  onPrev,
  onNext,
  showPrev,
  showNext,
}) => {
  const days = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    return eachDayOfInterval({
      start: startOfWeek(monthStart),
      end: endOfWeek(monthEnd),
    });
  }, [month]);

  const getDayState = (day) => {
    const inRange =
      draftStart &&
      draftEnd &&
      !isBefore(day, draftStart) &&
      !isAfter(day, draftEnd);
    const isStart = Boolean(draftStart && isSameDay(day, draftStart));
    const isEnd = Boolean(draftEnd && isSameDay(day, draftEnd));
    const isEndpoint = isStart || isEnd;
    const outsideMonth = !isSameMonth(day, month);

    return { inRange, isEndpoint, isStart, isEnd, outsideMonth, isRangeMiddle: inRange && !isEndpoint };
  };

  return (
    <Box sx={{ flexShrink: 0, minWidth: 280, width: 280 }}>
      <Stack alignItems="center" direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
        {showPrev ? (
          <IconButton aria-label="Previous month" onClick={onPrev} size="small">
            <SvgIcon fontSize="small">
              <ChevronLeftIcon />
            </SvgIcon>
          </IconButton>
        ) : (
          <Box sx={{ width: 34 }} />
        )}
        <Typography fontWeight={700} variant="subtitle2">
          {format(month, "MMMM yyyy")}
        </Typography>
        {showNext ? (
          <IconButton aria-label="Next month" onClick={onNext} size="small">
            <SvgIcon fontSize="small">
              <ChevronRightIcon />
            </SvgIcon>
          </IconButton>
        ) : (
          <Box sx={{ width: 34 }} />
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          rowGap: 0.25,
          width: "100%",
        }}
      >
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => (
          <Typography
            align="center"
            color="text.secondary"
            key={weekday}
            sx={{ fontSize: 11, fontWeight: 600, py: 0.5 }}
            variant="caption"
          >
            {weekday}
          </Typography>
        ))}

        {days.map((day) => {
          const { isEndpoint, isStart, isEnd, isRangeMiddle, outsideMonth } = getDayState(day);

          return (
            <Box
              key={day.toISOString()}
              sx={{
                alignItems: "center",
                bgcolor: isRangeMiddle ? alpha(brand.primary, 0.12) : "transparent",
                borderRadius: isStart ? "18px 0 0 18px" : isEnd ? "0 18px 18px 0" : 0,
                display: "flex",
                height: 34,
                justifyContent: "center",
              }}
            >
              <Box
                component="button"
                onClick={() => onDayClick(day)}
                type="button"
                sx={{
                  alignItems: "center",
                  bgcolor: isEndpoint ? brand.primary : "transparent",
                  border: "none",
                  borderRadius: "50%",
                  color: isEndpoint ? "#fff" : outsideMonth ? "neutral.400" : "text.primary",
                  cursor: "pointer",
                  display: "flex",
                  fontSize: 13,
                  fontWeight: isEndpoint ? 700 : 500,
                  height: 32,
                  justifyContent: "center",
                  p: 0,
                  width: 32,
                  "&:hover": {
                    bgcolor: isEndpoint ? brand.primary : alpha(brand.primary, 0.16),
                  },
                }}
              >
                {format(day, "d")}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

MonthGrid.propTypes = {
  draftEnd: PropTypes.object,
  draftStart: PropTypes.object,
  month: PropTypes.object.isRequired,
  onDayClick: PropTypes.func.isRequired,
  onNext: PropTypes.func,
  onPrev: PropTypes.func,
  showNext: PropTypes.bool,
  showPrev: PropTypes.bool,
};

export function DateRangeFilter({
  endDate = "",
  label = "Date range",
  onChange = () => {},
  startDate = "",
  sx = {},
  variant = "field",
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [leftMonth, setLeftMonth] = useState(() => toDateValue(startDate) || new Date());
  const [draftStart, setDraftStart] = useState(() => toDateValue(startDate));
  const [draftEnd, setDraftEnd] = useState(() => toDateValue(endDate));

  const open = Boolean(anchorEl);
  const selectedStart = toDateValue(startDate);
  const selectedEnd = toDateValue(endDate);
  const isPill = variant === "pill";
  const rightMonth = addMonths(startOfMonth(leftMonth), 1);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraftStart(selectedStart);
    setDraftEnd(selectedEnd);
    const base = selectedStart || selectedEnd || new Date();
    setLeftMonth(startOfMonth(base));
  }, [open, startDate, endDate]);

  const displayValue = formatRangeLabel(selectedStart, selectedEnd);
  const triggerLabel = displayValue || (isPill ? "All time" : "Select date range");

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDayClick = (day) => {
    const clicked = startOfDay(day);

    if (!draftStart || (draftStart && draftEnd)) {
      setDraftStart(clicked);
      setDraftEnd(null);
      return;
    }

    if (isBefore(clicked, draftStart)) {
      setDraftEnd(draftStart);
      setDraftStart(clicked);
      return;
    }

    setDraftEnd(clicked);
  };

  const commitRange = (start, end) => {
    if (!start) {
      onChange({ startDate: "", endDate: "" });
      handleClose();
      return;
    }

    const resolvedEnd = end || start;
    onChange({
      startDate: toApiDate(start),
      endDate: toApiDate(resolvedEnd),
    });
    handleClose();
  };

  const handleApply = () => {
    commitRange(draftStart, draftEnd || draftStart);
  };

  const handleClear = () => {
    setDraftStart(null);
    setDraftEnd(null);
    onChange({ startDate: "", endDate: "" });
    handleClose();
  };

  const handlePreset = (key) => {
    const { start, end } = getPresetRange(key);
    setDraftStart(start);
    setDraftEnd(end);
    if (start) {
      setLeftMonth(startOfMonth(start));
    }
    commitRange(start, end);
  };

  return (
    <>
      {isPill ? (
        <Button
          onClick={handleOpen}
          size="small"
          startIcon={
            <SvgIcon fontSize="small" sx={{ color: "neutral.500" }}>
              <CalendarDaysIcon />
            </SvgIcon>
          }
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "neutral.200",
            borderRadius: 999,
            color: "text.primary",
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 500,
            height: 40,
            minWidth: 128,
            px: 1.75,
            textTransform: "none",
            whiteSpace: "nowrap",
            "&:hover": { bgcolor: "neutral.50", borderColor: "neutral.300" },
            ...sx,
          }}
          variant="outlined"
        >
          {triggerLabel}
        </Button>
      ) : (
        <Button
          onClick={handleOpen}
          size="small"
          startIcon={
            <SvgIcon fontSize="small">
              <CalendarDaysIcon />
            </SvgIcon>
          }
          sx={{
            bgcolor: "background.paper",
            borderColor: "neutral.200",
            borderRadius: 2,
            color: "text.primary",
            height: 40,
            justifyContent: "flex-start",
            minWidth: { xs: "100%", sm: 220 },
            px: 1.5,
            textTransform: "none",
            ...sx,
          }}
          variant="outlined"
        >
          {displayValue || label}
        </Button>
      )}

      <Popover
        PaperProps={{
          sx: {
            border: "1px solid",
            borderColor: "neutral.200",
            borderRadius: 2.5,
            boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
            mt: 1.25,
            maxWidth: "calc(100vw - 24px)",
            overflow: "visible",
            // Sidebar (~168) + two 260px months + gaps/padding needs ~820px
            width: { xs: "calc(100vw - 24px)", md: 820 },
          },
        }}
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        disableScrollLock
        onClose={handleClose}
        open={open}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
      >
        <Stack direction={{ xs: "column", md: "row" }} sx={{ width: "100%" }}>
          <Box
            sx={{
              bgcolor: "neutral.50",
              borderRight: { md: "1px solid" },
              borderColor: { md: "neutral.200" },
              flexShrink: 0,
              minWidth: { md: 168 },
              p: 1.5,
            }}
          >
            <Stack spacing={0.5}>
              {PRESETS.map((preset) => (
                <Button
                  key={preset.key}
                  onClick={() => handlePreset(preset.key)}
                  size="small"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                    justifyContent: "flex-start",
                    px: 1.25,
                    textTransform: "none",
                    "&:hover": { bgcolor: alpha(brand.primary, 0.08), color: "text.primary" },
                  }}
                >
                  {preset.label}
                </Button>
              ))}
              <Divider sx={{ my: 0.75 }} />
              <Button
                onClick={handleClear}
                size="small"
                sx={{
                  color: "text.secondary",
                  justifyContent: "flex-start",
                  px: 1.25,
                  textTransform: "none",
                }}
              >
                All time
              </Button>
            </Stack>
          </Box>

          <Box sx={{ flex: 1, minWidth: 0, p: 2, overflow: "visible" }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "neutral.200",
                  borderRadius: 1.5,
                  flex: 1,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography color="text.secondary" variant="caption">
                  Start
                </Typography>
                <Typography fontWeight={600} variant="body2">
                  {draftStart ? format(draftStart, "MMM d, yyyy") : "—"}
                </Typography>
              </Box>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "neutral.200",
                  borderRadius: 1.5,
                  flex: 1,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography color="text.secondary" variant="caption">
                  End
                </Typography>
                <Typography fontWeight={600} variant="body2">
                  {draftEnd || draftStart
                    ? format(draftEnd || draftStart, "MMM d, yyyy")
                    : "—"}
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 2, md: 3 }}
              sx={{ justifyContent: "center", width: "100%" }}
            >
              <MonthGrid
                draftEnd={draftEnd}
                draftStart={draftStart}
                month={leftMonth}
                onDayClick={handleDayClick}
                onPrev={() => setLeftMonth((month) => addMonths(month, -1))}
                showNext={false}
                showPrev
              />
              <MonthGrid
                draftEnd={draftEnd}
                draftStart={draftStart}
                month={rightMonth}
                onDayClick={handleDayClick}
                onNext={() => setLeftMonth((month) => addMonths(month, 1))}
                showNext
                showPrev={false}
              />
            </Stack>

            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mt: 2 }}>
              <Button color="inherit" onClick={handleClear} size="small">
                Clear
              </Button>
              <Button
                disabled={!draftStart}
                onClick={handleApply}
                size="small"
                sx={{
                  color: "#fff",
                  minWidth: 84,
                  "&.Mui-disabled": { color: "rgba(255,255,255,0.7)" },
                }}
                variant="contained"
              >
                Apply
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Popover>
    </>
  );
}

DateRangeFilter.propTypes = {
  endDate: PropTypes.string,
  label: PropTypes.string,
  onChange: PropTypes.func,
  startDate: PropTypes.string,
  sx: PropTypes.object,
  variant: PropTypes.oneOf(["field", "pill"]),
};
