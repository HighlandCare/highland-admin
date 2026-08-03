import { getServerGoogleMapsApiKey } from "../../../utils/googleMaps";

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "HighlandCareAdmin/1.0 (live-operations-map)",
};

function uniquePredictions(items = []) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    if (!item?.description) continue;
    const key = `${String(item.place_id || "").toLowerCase()}|${item.description.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function toNominatimPrediction(item) {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  return {
    description: item.display_name,
    place_id: item.place_id ? String(item.place_id) : `nominatim-${item.osm_type}-${item.osm_id}`,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    provider: "nominatim",
  };
}

function toPhotonPrediction(item) {
  const props = item?.properties || {};
  const coords = item?.geometry?.coordinates;
  const lng = Number(coords?.[0]);
  const lat = Number(coords?.[1]);
  const parts = [props.name, props.street, props.city || props.town || props.village, props.state, props.country]
    .filter(Boolean)
    .filter((part, index, arr) => arr.indexOf(part) === index);
  const description = parts.join(", ") || props.name;

  if (!description) return null;

  return {
    description,
    place_id: props.osm_id
      ? `photon-${props.osm_type || "place"}-${props.osm_id}`
      : `photon-${description}`,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    provider: "photon",
  };
}

function toGoogleTextPrediction(item) {
  const lat = Number(item?.geometry?.location?.lat);
  const lng = Number(item?.geometry?.location?.lng);
  const description =
    item?.formatted_address && item?.name && !String(item.formatted_address).includes(item.name)
      ? `${item.name}, ${item.formatted_address}`
      : item?.formatted_address || item?.name;

  if (!description) return null;

  return {
    description,
    place_id: item.place_id,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
    provider: "google_text",
  };
}

async function googlePlaceAutocomplete(input, apiKey) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("language", "en");
  // No country/components/location bias — worldwide suggestions.
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  const data = await response.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || data.status || "Google autocomplete failed");
  }

  return Array.isArray(data.predictions)
    ? data.predictions.map((item) => ({
        description: item.description,
        place_id: item.place_id,
        provider: "google",
      }))
    : [];
}

async function googleTextSearch(input, apiKey) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("query", input);
  url.searchParams.set("language", "en");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString());
  const data = await response.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || data.status || "Google text search failed");
  }

  return Array.isArray(data.results)
    ? data.results.map(toGoogleTextPrediction).filter(Boolean)
    : [];
}

async function photonAutocomplete(input) {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", input);
  url.searchParams.set("limit", "12");
  url.searchParams.set("lang", "en");

  const response = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Photon request failed (${response.status})`);
  }
  const data = await response.json();
  return Array.isArray(data?.features)
    ? data.features.map(toPhotonPrediction).filter(Boolean)
    : [];
}

async function nominatimAutocomplete(input) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", input);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "12");
  // Worldwide — no countrycodes filter.

  const response = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
  if (!response.ok) {
    throw new Error(`Nominatim request failed (${response.status})`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(toNominatimPrediction) : [];
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: "ERROR", error_message: "Method not allowed" });
  }

  const input = String(req.query.input ?? "").trim();
  if (input.length < 2) {
    return res.status(200).json({ status: "OK", predictions: [] });
  }

  const apiKey = getServerGoogleMapsApiKey();
  const predictions = [];

  if (apiKey) {
    const googleResults = await Promise.allSettled([
      googlePlaceAutocomplete(input, apiKey),
      googleTextSearch(input, apiKey),
    ]);

    googleResults.forEach((result) => {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        predictions.push(...result.value);
      } else if (result.status === "rejected") {
        console.error("Google places search failed:", result.reason?.message || result.reason);
      }
    });
  }

  // Always enrich with open worldwide providers so short keywords still return
  // locations across countries (Google IP bias can otherwise feel "limited").
  const openResults = await Promise.allSettled([photonAutocomplete(input), nominatimAutocomplete(input)]);
  openResults.forEach((result) => {
    if (result.status === "fulfilled" && Array.isArray(result.value)) {
      predictions.push(...result.value);
    } else if (result.status === "rejected") {
      console.error("Open places search failed:", result.reason?.message || result.reason);
    }
  });

  const merged = uniquePredictions(predictions).slice(0, 15);

  if (!merged.length) {
    return res.status(200).json({ status: "ZERO_RESULTS", predictions: [] });
  }

  return res.status(200).json({
    status: "OK",
    predictions: merged,
  });
}
