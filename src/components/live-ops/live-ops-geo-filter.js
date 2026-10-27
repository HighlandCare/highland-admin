import PropTypes from "prop-types";
import { useMemo } from "react";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";
import { Button, Stack, TextField, Typography } from "@mui/material";
import { DEFAULT_GEO_FILTER } from "../../utils/liveOpsGeo";
import { getUsaCities, getUsaStateBounds, USA_COUNTRY, USA_STATES } from "../../utils/liveOpsGeoData";

const stateFilter = createFilterOptions({
  matchFrom: "any",
  stringify: (option) => `${option.name} ${option.isoCode || ""}`,
});

const cityFilter = createFilterOptions({
  matchFrom: "any",
  stringify: (option) => option.name || "",
});

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "background.paper",
    fontSize: 13,
  },
};

const listboxProps = {
  sx: { maxHeight: 240 },
};

export default function LiveOpsGeoFilter({ value, onChange }) {
  const country = value?.country || USA_COUNTRY;
  const state = value?.state || null;
  const city = value?.city || null;
  const hasSelection = Boolean(state || city);

  const cities = useMemo(() => getUsaCities(state?.isoCode), [state?.isoCode]);

  const emit = (nextState, nextCity) => {
    onChange?.({
      country: USA_COUNTRY,
      state: nextState || null,
      city: nextCity || null,
      bounds: nextState ? getUsaStateBounds(nextState.isoCode) : null,
    });
  };

  return (
    <Stack spacing={1.25} sx={{ mb: 1.75 }}>
      <Typography sx={{ color: "text.secondary", fontSize: 11 }}>Location</Typography>

      <Autocomplete
        disabled
        options={[USA_COUNTRY]}
        value={country}
        getOptionLabel={(option) => option?.name || "United States"}
        isOptionEqualToValue={(option, selected) => option?.isoCode === selected?.isoCode}
        renderInput={(params) => (
          <TextField {...params} label="Country" size="small" sx={fieldSx} />
        )}
      />

      <Autocomplete
        options={USA_STATES}
        value={state}
        onChange={(_, nextState) => emit(nextState, null)}
        getOptionLabel={(option) =>
          option?.isoCode ? `${option.name} (${option.isoCode})` : option?.name || ""
        }
        isOptionEqualToValue={(option, selected) => option?.isoCode === selected?.isoCode}
        filterOptions={stateFilter}
        ListboxProps={listboxProps}
        renderInput={(params) => (
          <TextField {...params} label="State" size="small" placeholder="Search state" sx={fieldSx} />
        )}
        componentsProps={{
          popper: { disablePortal: true, sx: { zIndex: 1600 } },
        }}
      />

      <Autocomplete
        disabled={!state}
        options={cities}
        value={city}
        onChange={(_, nextCity) => emit(state, nextCity)}
        getOptionLabel={(option) => option?.name || ""}
        isOptionEqualToValue={(option, selected) =>
          option?.name === selected?.name && option?.stateCode === selected?.stateCode
        }
        filterOptions={(options, params) => {
          const filtered = cityFilter(options, params);
          if (!params.inputValue) return filtered.slice(0, 80);
          return filtered.slice(0, 150);
        }}
        ListboxProps={listboxProps}
        noOptionsText={state ? "Type to search cities" : "Select a state first"}
        renderInput={(params) => (
          <TextField
            {...params}
            label="City"
            size="small"
            placeholder={state ? "Search city" : "Select a state first"}
            sx={fieldSx}
          />
        )}
        componentsProps={{
          popper: { disablePortal: true, sx: { zIndex: 1600 } },
        }}
      />

      {hasSelection ? (
        <Button
          size="small"
          onClick={() => onChange?.(DEFAULT_GEO_FILTER)}
          sx={{ alignSelf: "flex-start", textTransform: "none", px: 0 }}
        >
          Clear location
        </Button>
      ) : null}
    </Stack>
  );
}

LiveOpsGeoFilter.propTypes = {
  value: PropTypes.shape({
    country: PropTypes.object,
    state: PropTypes.object,
    city: PropTypes.object,
    bounds: PropTypes.object,
  }),
  onChange: PropTypes.func,
};
