import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import CalendarDaysIcon from "@heroicons/react/24/outline/CalendarDaysIcon";
import ChevronLeftIcon from "@heroicons/react/24/solid/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/react/24/solid/ChevronRightIcon";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Popover,
  Stack,
  SvgIcon,
  TextField,
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

export function DateRangeFilter({
  endDate = "",
  label = "Date range",
  onChange = () => {},
  startDate = "",
  sx = {},
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => toDateValue(startDate) || new Date());
  const [draftStart, setDraftStart] = useState(() => toDateValue(startDate));
  const [draftEnd, setDraftEnd] = useState(() => toDateValue(endDate));

  const open = Boolean(anchorEl);
  const selectedStart = toDateValue(startDate);
  const selectedEnd = toDateValue(endDate);

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraftStart(selectedStart);
    setDraftEnd(selectedEnd);
    setVisibleMonth(selectedStart || selectedEnd || new Date());
  }, [open, startDate, endDate]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [visibleMonth]);

  const displayValue = formatRangeLabel(selectedStart, selectedEnd);

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

  const handleApply = () => {
    if (!draftStart) {
      onChange({ startDate: "", endDate: "" });
      handleClose();
      return;
    }

    const end = draftEnd || draftStart;
    onChange({
      startDate: toApiDate(draftStart),
      endDate: toApiDate(end),
    });
    handleClose();
  };

  const handleClear = () => {
    setDraftStart(null);
    setDraftEnd(null);
    onChange({ startDate: "", endDate: "" });
    handleClose();
  };

  const getDayState = (day) => {
    const rangeStart = draftStart;
    const effectiveEnd = draftEnd;
    const inRange =
      rangeStart &&
      effectiveEnd &&
      !isBefore(day, rangeStart) &&
      !isAfter(day, effectiveEnd);
    const isStart = Boolean(rangeStart && isSameDay(day, rangeStart));
    const isEnd = Boolean(effectiveEnd && isSameDay(day, effectiveEnd));
    const isEndpoint = isStart || isEnd;
    const outsideMonth = !isSameMonth(day, visibleMonth);
    const isRangeMiddle = inRange && !isEndpoint;

    return { inRange, isEndpoint, isStart, isEnd, isRangeMiddle, outsideMonth };
  };

  return (
    <>
      <TextField
        InputLabelProps={{
          shrink: true,
          sx: {
            bgcolor: "background.paper",
            px: 0.5,
          },
        }}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end" sx={{ ml: 0.5 }}>
              <SvgIcon fontSize="small" sx={{ color: "neutral.400" }}>
                <CalendarDaysIcon />
              </SvgIcon>
            </InputAdornment>
          ),
        }}
        inputProps={{
          title: displayValue || undefined,
        }}
        label={label}
        onClick={handleOpen}
        placeholder="Select date range"
        size="small"
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          minWidth: { xs: "100%", sm: 280 },
          width: { xs: "100%", sm: 300 },
          "& .MuiOutlinedInput-root": {
            alignItems: "center",
            cursor: "pointer",
            minHeight: 40,
            pl: 1.5,
            pr: 1.25,
          },
          "& .MuiOutlinedInput-input": {
            cursor: "pointer",
            overflow: "hidden",
            py: 1.125,
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          },
          "& .MuiInputAdornment-root": {
            height: "auto",
            maxHeight: "none",
            marginTop: 0,
          },
          ...sx,
        }}
        value={displayValue}
      />

      <Popover
        PaperProps={{
          sx: {
            border: "1px solid",
            borderColor: "neutral.200",
            borderRadius: 2.5,
            boxShadow: "0 16px 40px rgba(0,0,0,0.12)",
            mt: 1.25,
            overflow: "visible",
            width: { xs: "calc(100vw - 32px)", sm: 340 },
          },
        }}
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        disableScrollLock
        onClose={handleClose}
        open={open}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
      >
        <Box sx={{ p: 2.25, pb: 2 }}>
          <Stack spacing={1.75}>
            <Stack alignItems="center" direction="row" justifyContent="space-between">
              <IconButton
                aria-label="Previous month"
                onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
                size="small"
              >
                <SvgIcon fontSize="small">
                  <ChevronLeftIcon />
                </SvgIcon>
              </IconButton>
              <Typography fontWeight={700} variant="subtitle1">
                {format(visibleMonth, "MMMM yyyy")}
              </Typography>
              <IconButton
                aria-label="Next month"
                onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
                size="small"
              >
                <SvgIcon fontSize="small">
                  <ChevronRightIcon />
                </SvgIcon>
              </IconButton>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                rowGap: 0.5,
              }}
            >
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => (
                <Typography
                  align="center"
                  color="text.secondary"
                  key={weekday}
                  sx={{ fontSize: 12, fontWeight: 600, py: 0.5 }}
                  variant="caption"
                >
                  {weekday}
                </Typography>
              ))}

              {days.map((day) => {
                const { isEndpoint, isStart, isEnd, isRangeMiddle, outsideMonth } =
                  getDayState(day);

                return (
                  <Box
                    key={day.toISOString()}
                    sx={{
                      alignItems: "center",
                      bgcolor: isRangeMiddle ? alpha(brand.primary, 0.12) : "transparent",
                      borderRadius: isStart
                        ? "18px 0 0 18px"
                        : isEnd
                          ? "0 18px 18px 0"
                          : 0,
                      display: "flex",
                      height: 36,
                      justifyContent: "center",
                      position: "relative",
                    }}
                  >
                    <Box
                      component="button"
                      onClick={() => handleDayClick(day)}
                      type="button"
                      sx={{
                        alignItems: "center",
                        bgcolor: isEndpoint ? brand.primary : "transparent",
                        border: "none",
                        borderRadius: "50%",
                        color: isEndpoint
                          ? "#fff"
                          : outsideMonth
                            ? "neutral.400"
                            : "text.primary",
                        cursor: "pointer",
                        display: "flex",
                        flexShrink: 0,
                        fontSize: 13,
                        fontWeight: isEndpoint ? 700 : 500,
                        height: 34,
                        justifyContent: "center",
                        lineHeight: 1,
                        p: 0,
                        width: 34,
                        "&:hover": {
                          bgcolor: isEndpoint
                            ? brand.primary
                            : alpha(brand.primary, 0.16),
                        },
                      }}
                    >
                      {format(day, "d")}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                bgcolor: alpha(brand.primary, 0.06),
                borderRadius: 1.5,
                px: 1.5,
                py: 1,
              }}
            >
              <Typography color="text.secondary" variant="caption">
                {draftStart && draftEnd
                  ? formatRangeLabel(draftStart, draftEnd)
                  : draftStart
                    ? "Select end date"
                    : "Select start date"}
              </Typography>
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ pt: 0.25 }}>
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
          </Stack>
        </Box>
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
};
