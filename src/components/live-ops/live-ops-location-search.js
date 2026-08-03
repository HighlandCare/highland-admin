import PropTypes from "prop-types";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Tooltip,
} from "@mui/material";
import MagnifyingGlassIcon from "@heroicons/react/24/solid/MagnifyingGlassIcon";
import MapPinIcon from "@heroicons/react/24/solid/MapPinIcon";
import { toast } from "react-toastify";
import { parseCoordinateQuery } from "../../utils/googleMaps";

const glass = {
  bgcolor: "rgba(255, 255, 255, 0.96)",
  backdropFilter: "blur(12px)",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: "14px",
  boxShadow: "0 8px 28px rgba(15, 23, 42, 0.08)",
};

async function geocodeLatLng(lat, lng) {
  const response = await fetch(`/api/maps/geocode?latlng=${lat},${lng}`);
  return response.json();
}

function normalizePredictions(data) {
  if (!Array.isArray(data?.predictions)) return [];
  return data.predictions
    .map((item) => ({
      description: item.description || item.display_name || "",
      placeId: item.place_id || item.placeId || "",
      lat: Number.isFinite(Number(item.lat)) ? Number(item.lat) : undefined,
      lng: Number.isFinite(Number(item.lng)) ? Number(item.lng) : undefined,
    }))
    .filter((item) => item.description);
}

export default function LiveOpsLocationSearch({
  value,
  onChange,
  onPlaceSelect,
  onCurrentLocation,
  locating,
}) {
  const [predictions, setPredictions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const fetchPredictions = useCallback((input) => {
    const trimmed = input.trim();
    if (trimmed.length < 2 || parseCoordinateQuery(trimmed)) {
      setPredictions([]);
      return;
    }

    const requestId = ++requestIdRef.current;
    setSearching(true);

    fetch(`/api/maps/autocomplete?input=${encodeURIComponent(trimmed)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error_message || "Search failed");
        }
        return data;
      })
      .then((data) => {
        if (requestId !== requestIdRef.current) return;
        setPredictions(normalizePredictions(data));
      })
      .catch((error) => {
        if (requestId !== requestIdRef.current) return;
        setPredictions([]);
        toast.error(error.message || "Unable to search locations.");
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setSearching(false);
        }
      });
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleInputChange = (event) => {
    const next = event.target.value;
    onChange?.(next);
    setOpenSuggestions(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(next), 280);
  };

  const resolveSelection = async ({ placeId, address, lat, lng }) => {
    if (lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      onPlaceSelect?.({
        lat: Number(lat),
        lng: Number(lng),
        address: address || value,
      });
      setOpenSuggestions(false);
      setPredictions([]);
      return;
    }

    const query = placeId
      ? `/api/maps/geocode?place_id=${encodeURIComponent(placeId)}`
      : `/api/maps/geocode?address=${encodeURIComponent(address)}`;

    try {
      const payload = await fetch(query).then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(data?.error_message || "Unable to resolve location.");
        }
        return data;
      });

      const result = payload?.results?.[0];
      const location = result?.geometry?.location;
      if (!location) {
        toast.info("No matching location found.");
        return;
      }

      onPlaceSelect?.({
        lat: location.lat,
        lng: location.lng,
        address: result.formatted_address || address,
      });
      setOpenSuggestions(false);
      setPredictions([]);
    } catch (error) {
      toast.error(error.message || "Unable to resolve location.");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const coords = parseCoordinateQuery(value);
    if (coords) {
      try {
        const payload = await geocodeLatLng(coords.lat, coords.lng);
        const result = payload?.results?.[0];
        onPlaceSelect?.({
          lat: coords.lat,
          lng: coords.lng,
          address: result?.formatted_address || value,
        });
        setOpenSuggestions(false);
        setPredictions([]);
      } catch (error) {
        onPlaceSelect?.({
          lat: coords.lat,
          lng: coords.lng,
          address: value,
        });
      }
      return;
    }

    if (value.trim()) {
      await resolveSelection({ address: value.trim() });
    }
  };

  const handleSelectPrediction = (prediction) => {
    onChange?.(prediction.description);
    resolveSelection({
      placeId: prediction.placeId,
      address: prediction.description,
      lat: prediction.lat,
      lng: prediction.lng,
    });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ position: "relative", flex: 1, minWidth: 0, zIndex: 1100 }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Search location or lat, lng..."
        value={value}
        onChange={handleInputChange}
        onFocus={() => setOpenSuggestions(true)}
        onBlur={() => {
          // Delay so suggestion clicks still register.
          setTimeout(() => setOpenSuggestions(false), 150);
        }}
        autoComplete="off"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MagnifyingGlassIcon width={18} style={{ color: "#9DA4AE" }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {searching ? <CircularProgress size={16} sx={{ color: "text.secondary" }} /> : null}
              <Tooltip title="Use my current location">
                <span>
                  <IconButton
                    size="small"
                    type="button"
                    disabled={locating}
                    onClick={onCurrentLocation}
                    sx={{ color: "primary.main" }}
                  >
                    <MapPinIcon width={18} />
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
          sx: {
            ...glass,
            height: 48,
            color: "text.primary",
            fontSize: 14,
            "& fieldset": { border: "none" },
            "& .MuiInputBase-input": {
              height: "auto",
              py: 0,
              lineHeight: "20px",
            },
            "& .MuiInputAdornment-root": {
              height: "100%",
              alignItems: "center",
              mt: "0 !important",
            },
            "& .MuiInputAdornment-root svg": {
              display: "block",
            },
          },
        }}
      />

      {openSuggestions && predictions.length > 0 ? (
        <Paper
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 1200,
            ...glass,
            maxHeight: 240,
            overflow: "auto",
          }}
        >
          <List dense disablePadding>
            {predictions.map((item) => (
              <ListItemButton
                key={item.placeId || item.description}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelectPrediction(item)}
              >
                <ListItemText
                  primary={item.description}
                  primaryTypographyProps={{ fontSize: 13, color: "text.primary" }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      ) : null}
    </Box>
  );
}

LiveOpsLocationSearch.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onPlaceSelect: PropTypes.func,
  onCurrentLocation: PropTypes.func,
  locating: PropTypes.bool,
};
