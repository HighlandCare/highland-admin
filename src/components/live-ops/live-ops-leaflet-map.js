import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, sanitizeLiveOpsMarkers } from "../../utils/googleMaps";
import { buildLeafletMarkerIcon } from "../../utils/liveOpsMarkerIcons";
import {
  clusterColor,
  clusterDisplaySize,
  clusterLiveOpsMarkers,
  findZoomToSplit,
  markerDisplaySize,
} from "../../utils/liveOpsClusters";

const DEFAULT_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TRAFFIC_TILE_URL = "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION = "&copy; OpenStreetMap &copy; CARTO";

function buildLeafletClusterIcon(L, cluster) {
  const size = clusterDisplaySize(cluster.count);
  const color = clusterColor(cluster.members);
  return L.divIcon({
    className: "live-ops-leaflet-marker",
    html: `<button type="button" class="live-ops-cluster-marker" style="width:${size}px;height:${size}px;border:3px solid #fff;border-radius:50%;background:${color};color:#fff;font-size:${
      cluster.count > 99 ? 11 : 13
    }px;font-weight:800;box-shadow:0 6px 16px rgba(15,23,42,.28)">${cluster.count}</button>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function LiveOpsLeafletMap({
  center,
  zoom,
  mapZoom,
  markers,
  showTraffic,
  userLocation,
  fitToMarkers,
  mapFitKey = 0,
  onFitComplete,
  onMarkerSelect,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const lastFitKeyRef = useRef(null);
  const lastCameraRef = useRef("");
  const [viewZoom, setViewZoom] = useState(mapZoom ?? zoom ?? DEFAULT_MAP_ZOOM);
  const [expandedIds, setExpandedIds] = useState([]);
  const sanitizedMarkers = useMemo(() => sanitizeLiveOpsMarkers(markers), [markers]);
  const expandedIdSet = useMemo(() => new Set(expandedIds), [expandedIds]);
  const clusteredItems = useMemo(
    () => clusterLiveOpsMarkers(sanitizedMarkers, viewZoom, { expandedIds: expandedIdSet }),
    [expandedIdSet, sanitizedMarkers, viewZoom]
  );
  const centerLat = center?.lat ?? DEFAULT_MAP_CENTER.lat;
  const centerLng = center?.lng ?? DEFAULT_MAP_CENTER.lng;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: true,
      zoomControl: false,
    }).setView([DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng], DEFAULT_MAP_ZOOM);

    L.control.zoom({ position: "bottomleft" }).addTo(map);
    tileLayerRef.current = L.tileLayer(DEFAULT_TILE_URL, {
      attribution: TILE_ATTRIBUTION,
    }).addTo(map);
    markerLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.on("zoomend", () => {
      const nextZoom = map.getZoom();
      setViewZoom((current) => {
        if (current !== nextZoom) setExpandedIds((ids) => (ids.length ? [] : ids));
        return nextZoom;
      });
    });
    map.on("click", () => setExpandedIds((ids) => (ids.length ? [] : ids)));

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
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    clusteredItems.forEach((item) => {
      if (item.kind === "cluster") {
        L.marker([item.lat, item.lng], {
          icon: buildLeafletClusterIcon(L, item),
          zIndexOffset: 600 + Math.min(item.count, 40),
        })
          .on("click", (event) => {
            L.DomEvent.stopPropagation(event);
            const members = item.members || [];
            if (members.length <= 1) {
              onMarkerSelect?.(members[0]);
              return;
            }
            const currentZoom = map.getZoom() || viewZoom;
            const splitZoom = findZoomToSplit(members, currentZoom);
            if (splitZoom != null) {
              setExpandedIds([]);
              map.setView([item.lat, item.lng], splitZoom);
              return;
            }
            setExpandedIds(members.map((marker) => marker.id).filter(Boolean));
            map.panTo([item.lat, item.lng]);
          })
          .addTo(layer);
        return;
      }

      const marker = item.marker;
      const size = markerDisplaySize(marker.type, viewZoom);
      L.marker([marker.lat, marker.lng], {
        icon: buildLeafletMarkerIcon(L, marker.type, marker.color, size),
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
  }, [clusteredItems, onMarkerSelect, userLocation, viewZoom]);

  // Fit once per intentional request — not on every live marker update.
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

  // Pan/zoom only for explicit search / current-location / tour (mapZoom set).
  // After a fit, leave the viewport alone so live updates don't re-zoom.
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
  mapFitKey: PropTypes.number,
  onFitComplete: PropTypes.func,
  onMarkerSelect: PropTypes.func,
};
