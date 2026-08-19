import { filterMarkersNearLocation } from "../hooks/useSmoothLiveOpsMarkers";

const CITY_RADIUS_KM = 40;

export const DEFAULT_GEO_FILTER = {
  country: { isoCode: "US", name: "United States", latitude: "39.8283", longitude: "-98.5795" },
  state: null,
  city: null,
  bounds: null,
};

export function parseGeoCoords(place) {
  const lat = Number(place?.latitude ?? place?.lat);
  const lng = Number(place?.longitude ?? place?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function markerHaystack(marker) {
  return [
    marker?.title,
    marker?.subtitle,
    marker?.label,
    marker?.detail,
    marker?.address,
    marker?.city,
    marker?.state,
    marker?.region,
    marker?.location,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function markerMentionsPlace(marker, cityName, stateName, stateIso) {
  const haystack = markerHaystack(marker);
  if (!haystack) return false;

  if (cityName && haystack.includes(String(cityName).toLowerCase())) return true;
  if (stateIso && haystack.includes(String(stateIso).toLowerCase())) return true;
  if (stateName && haystack.includes(String(stateName).toLowerCase())) return true;
  return false;
}

function isMarkerInBounds(marker, bounds) {
  if (!bounds) return false;
  const lat = Number(marker?.lat);
  const lng = Number(marker?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

export function filterMarkersByGeo(markers = [], geoFilter = {}) {
  const state = geoFilter?.state;
  const city = geoFilter?.city;

  if (city) {
    const coords = parseGeoCoords(city);
    const nearby = coords ? filterMarkersNearLocation(markers, coords, CITY_RADIUS_KM) : [];
    const named = markers.filter((marker) =>
      markerMentionsPlace(marker, city.name, state?.name, state?.isoCode)
    );
    const ids = new Set(nearby.map((marker) => marker.id));
    named.forEach((marker) => ids.add(marker.id));
    return markers.filter((marker) => ids.has(marker.id));
  }

  if (state) {
    return markers.filter(
      (marker) =>
        isMarkerInBounds(marker, geoFilter.bounds) ||
        markerMentionsPlace(marker, null, state.name, state.isoCode)
    );
  }

  return markers;
}
