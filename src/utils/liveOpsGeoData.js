import { City, Country, State } from "country-state-city";
import { DEFAULT_GEO_FILTER } from "./liveOpsGeo";

export const USA_COUNTRY_CODE = "US";

export const USA_COUNTRY = Country.getCountryByCode(USA_COUNTRY_CODE) || DEFAULT_GEO_FILTER.country;

export const USA_STATES = State.getStatesOfCountry(USA_COUNTRY_CODE);

const stateBoundsCache = new Map();

export function getUsaCities(stateIso) {
  if (!stateIso) return [];
  return City.getCitiesOfState(USA_COUNTRY_CODE, stateIso);
}

export function getUsaStateBounds(stateIso) {
  if (!stateIso) return null;
  if (stateBoundsCache.has(stateIso)) return stateBoundsCache.get(stateIso);

  const cities = getUsaCities(stateIso);
  let south = 90;
  let north = -90;
  let west = 180;
  let east = -180;
  let found = false;

  cities.forEach((city) => {
    const lat = Number(city?.latitude);
    const lng = Number(city?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    found = true;
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    west = Math.min(west, lng);
    east = Math.max(east, lng);
  });

  const bounds = found
    ? {
        south: south - 0.35,
        north: north + 0.35,
        west: west - 0.35,
        east: east + 0.35,
      }
    : null;

  stateBoundsCache.set(stateIso, bounds);
  return bounds;
}
