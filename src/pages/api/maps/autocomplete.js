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

  const input = String(req.query.input ?? "").trim();
  if (input.length < 2) {
    return res.status(200).json({ status: "OK", predictions: [] });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("language", "en");
  url.searchParams.set("components", "country:us");
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      error_message: error.message || "Autocomplete request failed",
    });
  }
}
