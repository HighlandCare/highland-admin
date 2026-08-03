import PropTypes from "prop-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Typography,
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
      source: item.provider || "places",
    }))
    .filter((item) => item.description);
}

function markerMatchesQuery(marker, query) {
  if (!marker || !query) return false;
  const haystack = [
    marker.title,
    marker.subtitle,
    marker.label,
    marker.detail,
    marker.phone,
    marker.type,
    marker.address,
    marker.city,
    marker.region,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function markersToSuggestions(markers, query) {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  return (markers || [])
    .filter((marker) => Number.isFinite(Number(marker?.lat)) && Number.isFinite(Number(marker?.lng)))
    .filter((marker) => markerMatchesQuery(marker, trimmed))
    .slice(0, 8)
    .map((marker) => ({
      description:
        [marker.title, marker.subtitle].filter(Boolean).join(" — ") ||
        marker.label ||
        "Map location",
      placeId: `map-marker-${marker.id}`,
      lat: Number(marker.lat),
      lng: Number(marker.lng),
      source: "map",
      marker,
    }));
}

export default function LiveOpsLocationSearch({
  value,
  onChange,
  onPlaceSelect,
  onCurrentLocation,
  locating,
  mapMarkers,
}) {
  const [placePredictions, setPlacePredictions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [openSuggestions, setOpenSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const mapSuggestions = useMemo(
    () => markersToSuggestions(mapMarkers, value || ""),
    [mapMarkers, value]
  );

  const predictions = useMemo(() => {
    const placeOnly = placePredictions.filter(
      (item) =>
        !mapSuggestions.some(
          (mapItem) =>
            mapItem.description.toLowerCase() === item.description.toLowerCase() ||
            (Number.isFinite(item.lat) &&
              Number.isFinite(mapItem.lat) &&
              Math.abs(item.lat - mapItem.lat) < 0.0001 &&
              Math.abs(item.lng - mapItem.lng) < 0.0001)
        )
    );
    return [...mapSuggestions, ...placeOnly].slice(0, 16);
  }, [mapSuggestions, placePredictions]);

  const fetchPredictions = useCallback((input) => {
    const trimmed = input.trim();
    if (trimmed.length < 2 || parseCoordinateQuery(trimmed)) {
      setPlacePredictions([]);
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
        setPlacePredictions(normalizePredictions(data));
      })
      .catch((error) => {
        if (requestId !== requestIdRef.current) return;
        setPlacePredictions([]);
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
    debounceRef.current = setTimeout(() => fetchPredictions(next), 250);
  };

  const resolveSelection = async ({ placeId, address, lat, lng, marker }) => {
    if (marker) {
      onPlaceSelect?.({
        lat: Number(marker.lat),
        lng: Number(marker.lng),
        address: address || value,
        marker,
      });
      setOpenSuggestions(false);
      setPlacePredictions([]);
      return;
    }

    if (lat != null && lng != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
      onPlaceSelect?.({
        lat: Number(lat),
        lng: Number(lng),
        address: address || value,
      });
      setOpenSuggestions(false);
      setPlacePredictions([]);
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
      setPlacePredictions([]);
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
        setPlacePredictions([]);
      } catch (error) {
        onPlaceSelect?.({
          lat: coords.lat,
          lng: coords.lng,
          address: value,
        });
      }
      return;
    }

    if (predictions.length) {
      handleSelectPrediction(predictions[0]);
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
      marker: prediction.marker,
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
        placeholder="Search any place worldwide..."
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          setOpenSuggestions(true);
          if (value.trim().length >= 2 && !placePredictions.length) {
            fetchPredictions(value);
          }
        }}
        onBlur={() => {
          setTimeout(() => setOpenSuggestions(false), 180);
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
          elevation={8}
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 1400,
            ...glass,
            maxHeight: 360,
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
                  secondary={item.source === "map" ? "On live map" : "Place suggestion"}
                  primaryTypographyProps={{ fontSize: 13, color: "text.primary" }}
                  secondaryTypographyProps={{ fontSize: 11, color: "text.secondary" }}
                />
              </ListItemButton>
            ))}
          </List>
          {searching ? (
            <Typography sx={{ px: 2, py: 1, fontSize: 11, color: "text.secondary" }}>
              Searching more places…
            </Typography>
          ) : null}
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
  mapMarkers: PropTypes.array,
};
