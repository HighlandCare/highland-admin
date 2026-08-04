import { getServerGoogleMapsApiKey } from "../../../utils/googleMaps";

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "HighlandCareAdmin/1.0 (live-operations-map)",
};

function toPrediction(item) {
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

async function nominatimAutocomplete(input) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", input);
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  const response = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
  if (!response.ok) {
    throw new Error(`Nominatim request failed (${response.status})`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(toPrediction) : [];
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

  if (apiKey) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
      url.searchParams.set("input", input);
      url.searchParams.set("language", "en");
      url.searchParams.set("key", apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === "OK" && Array.isArray(data.predictions) && data.predictions.length > 0) {
        return res.status(200).json(data);
      }
      if (data.status === "OK" || data.status === "ZERO_RESULTS") {
        // Fall through to Nominatim when Google has no matches.
      } else {
        console.error("Google autocomplete status:", data.status, data.error_message);
      }
    } catch (error) {
      // Fall through to Nominatim.
      console.error("Google autocomplete failed:", error.message);
    }
  }

  try {
    const predictions = await nominatimAutocomplete(input);
    return res.status(200).json({
      status: "OK",
      predictions,
      provider: "nominatim",
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      error_message: error.message || "Autocomplete request failed",
    });
  }
}
