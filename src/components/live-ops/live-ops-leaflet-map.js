import { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER, sanitizeLiveOpsMarkers } from "../../utils/googleMaps";
import { buildLeafletMarkerIcon } from "../../utils/liveOpsMarkerIcons";

const DEFAULT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TRAFFIC_TILE_URL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "&copy; OpenStreetMap &copy; CARTO";

export default function LiveOpsLeafletMap({
  center,
  zoom,
  mapZoom,
  markers,
  showTraffic,
  userLocation,
  fitToMarkers,
  onMarkerSelect,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const safeMarkers = useMemo(() => sanitizeLiveOpsMarkers(markers), [markers]);
  const centerLat = center?.lat ?? DEFAULT_MAP_CENTER.lat;
  const centerLng = center?.lng ?? DEFAULT_MAP_CENTER.lng;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: false,
    }).setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], 11);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    tileLayerRef.current = L.tileLayer(DEFAULT_TILE_URL, {
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeFrame = requestAnimationFrame(() => map.invalidateSize());

    return () => {
      cancelAnimationFrame(resizeFrame);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    tileLayerRef.current?.remove();
    tileLayerRef.current = L.tileLayer(showTraffic ? TRAFFIC_TILE_URL : DEFAULT_TILE_URL, {
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);
  }, [showTraffic]);

  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    safeMarkers.forEach((marker) => {
      L.marker([marker.lat, marker.lng], {
        icon: buildLeafletMarkerIcon(L, marker.type, marker.color),
        zIndexOffset:
          marker.type === "emergency" ? 500 : marker.type === "online_driver" ? 400 : 200,
      })
        .on("click", () => onMarkerSelect?.(marker))
        .addTo(layer);
    });

    if (userLocation?.lat != null && userLocation?.lng != null) {
      L.marker([userLocation.lat, userLocation.lng], {
        icon: buildLeafletMarkerIcon(L, "user_location"),
        zIndexOffset: 999,
      }).addTo(layer);
    }
  }, [onMarkerSelect, safeMarkers, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || centerLat == null || centerLng == null) return;

    if (fitToMarkers && safeMarkers.length) {
      const points = safeMarkers.map((marker) => [marker.lat, marker.lng]);
      if (userLocation?.lat != null && userLocation?.lng != null) {
        points.push([userLocation.lat, userLocation.lng]);
      }
      map.fitBounds(L.latLngBounds(points), {
        padding: [48, 48],
        maxZoom: zoom ?? 12,
        animate: true,
      });
      return;
    }

    map.setView([centerLat, centerLng], mapZoom ?? zoom ?? 11, { animate: true });
  }, [
    centerLat,
    centerLng,
    fitToMarkers,
    mapZoom,
    safeMarkers,
    userLocation,
    zoom,
  ]);

  return (
    <div
      ref={containerRef}
      style={{ height: "100%", width: "100%", background: "#f8fafb" }}
    />
  );
}

LiveOpsLeafletMap.propTypes = {
  center: PropTypes.object,
  zoom: PropTypes.number,
  mapZoom: PropTypes.number,
  markers: PropTypes.array,
  showTraffic: PropTypes.bool,
  userLocation: PropTypes.object,
  fitToMarkers: PropTypes.bool,
  onMarkerSelect: PropTypes.func,
};
