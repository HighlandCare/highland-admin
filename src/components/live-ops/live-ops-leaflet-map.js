import { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, sanitizeLiveOpsMarkers } from "../../utils/googleMaps";
import { buildLeafletMarkerIcon } from "../../utils/liveOpsMarkerIcons";
import { useLiveOpsUi } from "../../contexts/live-ops-ui-context";
import { clusterLiveOpsMarkers, markerDisplaySize } from "../../utils/liveOpsClusters";
import {
  getHotspotDisplayRadiusMeters,
  normalizeHotspotCoords,
} from "../../utils/liveOpsHotspots";

const LIGHT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TRAFFIC_TILE_URL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "&copy; OpenStreetMap &copy; CARTO";

export default function LiveOpsLeafletMap({
  center,
  zoom,
  mapZoom,
  markers,
  hotspots = [],
  showHotspots = true,
  showTraffic,
  userLocation,
  fitToMarkers,
  mapFitKey = 0,
  onFitComplete,
  onMarkerSelect,
  onHotspotSelect,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const hotspotLayerRef = useRef(null);
  const lastFitKeyRef = useRef(null);
  const lastCameraRef = useRef("");
  const { mapTheme } = useLiveOpsUi();
  const sanitizedMarkers = useMemo(() => sanitizeLiveOpsMarkers(markers), [markers]);
  const mapItems = useMemo(() => clusterLiveOpsMarkers(sanitizedMarkers), [sanitizedMarkers]);
  const centerLat = center?.lat ?? DEFAULT_MAP_CENTER.lat;
  const centerLng = center?.lng ?? DEFAULT_MAP_CENTER.lng;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: false,
    }).setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], DEFAULT_MAP_ZOOM);

    L.control.zoom({ position: "bottomleft" }).addTo(map);
    tileLayerRef.current = L.tileLayer(mapTheme === "dark" ? DARK_TILE_URL : LIGHT_TILE_URL, {
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    hotspotLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const resizeFrame = requestAnimationFrame(() => map.invalidateSize());

    return () => {
      cancelAnimationFrame(resizeFrame);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markerLayerRef.current = null;
      hotspotLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    tileLayerRef.current?.remove();
    tileLayerRef.current = L.tileLayer(
      showTraffic ? TRAFFIC_TILE_URL : mapTheme === "dark" ? DARK_TILE_URL : LIGHT_TILE_URL,
      {
        attribution: TILE_ATTRIBUTION,
      }
    ).addTo(map);
  }, [mapTheme, showTraffic]);

  useEffect(() => {
    const layer = hotspotLayerRef.current;
    if (!layer) return;

    layer.clearLayers();
    if (!showHotspots) return;

    (hotspots || []).forEach((hotspot) => {
      if (hotspot?.active === false) return;
      const coords = normalizeHotspotCoords(hotspot);
      if (!coords) return;

      const displayRadius = getHotspotDisplayRadiusMeters(hotspot.radiusMeters);

      L.circle([coords.lat, coords.lng], {
        radius: displayRadius,
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: hotspot.intensity === "high" ? 0.22 : 0.18,
        weight: hotspot.intensity === "high" ? 3 : 2,
        className: "live-ops-demand-hotspot-pulse",
      })
        .on("click", () => onHotspotSelect?.(hotspot))
        .addTo(layer);
    });
  }, [hotspots, onHotspotSelect, showHotspots]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    mapItems.forEach((item) => {
      const marker = item.marker;
      const size = markerDisplaySize(marker.type);
      L.marker([item.lat ?? marker.lat, item.lng ?? marker.lng], {
        icon: buildLeafletMarkerIcon(L, marker.type, marker.color, size),
        zIndexOffset:
          marker.type === "emergency" || marker.type === "dispute"
            ? 500
            : marker.type === "online_driver"
              ? 400
              : 200,
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
  }, [mapItems, onMarkerSelect, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitToMarkers || !sanitizedMarkers.length) return;
    if (lastFitKeyRef.current === mapFitKey) return;

    lastFitKeyRef.current = mapFitKey;
    const points = sanitizedMarkers.map((marker) => [marker.lat, marker.lng]);
    if (userLocation?.lat != null && userLocation?.lng != null) {
      points.push([userLocation.lat, userLocation.lng]);
    }

    map.fitBounds(L.latLngBounds(points), {
      padding: [56, 56],
      maxZoom: 14,
      animate: true,
    });
    onFitComplete?.();
  }, [fitToMarkers, mapFitKey, onFitComplete, sanitizedMarkers, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || fitToMarkers || mapZoom == null || centerLat == null || centerLng == null) {
      return;
    }

    const cameraKey = `${centerLat},${centerLng},${mapZoom}`;
    if (lastCameraRef.current === cameraKey) return;
    lastCameraRef.current = cameraKey;

    map.setView([centerLat, centerLng], mapZoom, { animate: true });
  }, [centerLat, centerLng, fitToMarkers, mapZoom]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100%",
        width: "100%",
        background: mapTheme === "dark" ? "#0b1220" : "#f8fafb",
      }}
    />
  );
}

LiveOpsLeafletMap.propTypes = {
  center: PropTypes.object,
  zoom: PropTypes.number,
  mapZoom: PropTypes.number,
  markers: PropTypes.array,
  hotspots: PropTypes.array,
  showHotspots: PropTypes.bool,
  showTraffic: PropTypes.bool,
  userLocation: PropTypes.object,
  fitToMarkers: PropTypes.bool,
  mapFitKey: PropTypes.number,
  onFitComplete: PropTypes.func,
  onMarkerSelect: PropTypes.func,
  onHotspotSelect: PropTypes.func,
};
