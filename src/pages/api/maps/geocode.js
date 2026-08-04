import { getServerGoogleMapsApiKey } from "../../../utils/googleMaps";

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "HighlandCareAdmin/1.0 (live-operations-map)",
};

function nominatimToGeocodeResult(item) {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  return {
    formatted_address: item.display_name,
    geometry: {
      location: {
        lat,
        lng,
      },
    },
    place_id: item.place_id ? String(item.place_id) : undefined,
  };
}

async function nominatimGeocode({ placeId, address, latlng }) {
  if (latlng) {
    const [lat, lng] = String(latlng)
      .split(",")
      .map((part) => Number(part.trim()));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return { status: "INVALID_REQUEST", results: [] };
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "json");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));

    const response = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
    if (!response.ok) {
      throw new Error(`Nominatim reverse geocode failed (${response.status})`);
    }
    const data = await response.json();
    if (!data?.display_name) {
      return {
        status: "OK",
        results: [
          {
            formatted_address: `${lat}, ${lng}`,
            geometry: { location: { lat, lng } },
          },
        ],
      };
    }
    return { status: "OK", results: [nominatimToGeocodeResult(data)] };
  }

  if (placeId && String(placeId).startsWith("nominatim-")) {
    // Predictions already include coordinates; address search is the fallback.
  }

  const query = address || placeId;
  if (!query) {
    return { status: "INVALID_REQUEST", results: [] };
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
  if (!response.ok) {
    throw new Error(`Nominatim geocode failed (${response.status})`);
  }
  const data = await response.json();
  if (!Array.isArray(data) || !data.length) {
    return { status: "ZERO_RESULTS", results: [] };
  }
  return { status: "OK", results: [nominatimToGeocodeResult(data[0])] };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: "ERROR", error_message: "Method not allowed" });
  }

  const placeId = String(req.query.place_id ?? "").trim();
  const address = String(req.query.address ?? "").trim();
  const latlng = String(req.query.latlng ?? "").trim();

  if (!placeId && !address && !latlng) {
    return res.status(400).json({
      status: "INVALID_REQUEST",
      error_message: "Provide place_id, address, or latlng",
    });
  }

  const apiKey = getServerGoogleMapsApiKey();

  if (apiKey && !String(placeId).startsWith("nominatim-")) {
    try {
      const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
      url.searchParams.set("key", apiKey);

      if (placeId) {
        url.searchParams.set("place_id", placeId);
      } else if (latlng) {
        url.searchParams.set("latlng", latlng);
      } else if (address) {
        url.searchParams.set("address", address);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === "OK" || data.status === "ZERO_RESULTS") {
        return res.status(200).json(data);
      }
    } catch (error) {
      console.error("Google geocode failed:", error.message);
    }
  }

  try {
    const data = await nominatimGeocode({ placeId, address, latlng });
    return res.status(200).json({ ...data, provider: "nominatim" });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      error_message: error.message || "Geocode request failed",
    });
  }
}
