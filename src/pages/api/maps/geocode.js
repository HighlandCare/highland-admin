import { getServerGoogleMapsApiKey } from "../../../utils/googleMaps";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: "ERROR", error_message: "Method not allowed" });
  }

  const apiKey = getServerGoogleMapsApiKey();
  if (!apiKey) {
    return res.status(500).json({
      status: "ERROR",
      error_message: "Google Maps API key is not configured",
    });
  }

  const placeId = String(req.query.place_id ?? "").trim();
  const address = String(req.query.address ?? "").trim();
  const latlng = String(req.query.latlng ?? "").trim();

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("key", apiKey);

  if (placeId) {
    url.searchParams.set("place_id", placeId);
  } else if (latlng) {
    url.searchParams.set("latlng", latlng);
  } else if (address) {
    url.searchParams.set("address", address);
  } else {
    return res.status(400).json({
      status: "INVALID_REQUEST",
      error_message: "Provide place_id, address, or latlng",
    });
  }

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      error_message: error.message || "Geocode request failed",
    });
  }
}
