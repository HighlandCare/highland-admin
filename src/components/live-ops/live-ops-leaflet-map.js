import { useEffect } from "react";
import PropTypes from "prop-types";
import { MapContainer, Marker, TileLayer, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEFAULT_MAP_CENTER, sanitizeLiveOpsMarkers } from "../../utils/googleMaps";
import { buildLeafletMarkerIcon } from "../../utils/liveOpsMarkerIcons";

function MapViewport({ center, zoom, mapZoom, fitToMarkers, markers, userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (!center?.lat || center?.lng == null) return;

    if (fitToMarkers && markers?.length) {
      const points = markers.map((m) => [m.lat, m.lng]);
      if (userLocation?.lat != null && userLocation?.lng != null) {
        points.push([userLocation.lat, userLocation.lng]);
      }
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: zoom ?? 12, animate: true });
      return;
    }

    map.setView([center.lat, center.lng], mapZoom ?? zoom ?? 11, { animate: true });
  }, [center?.lat, center?.lng, zoom, mapZoom, fitToMarkers, markers, userLocation, map]);

  return null;
}

MapViewport.propTypes = {
  center: PropTypes.object,
  zoom: PropTypes.number,
  mapZoom: PropTypes.number,
  fitToMarkers: PropTypes.bool,
  markers: PropTypes.array,
  userLocation: PropTypes.object,
};

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
  const safeMarkers = sanitizeLiveOpsMarkers(markers);
  const mapCenter = {
    lat: center?.lat ?? DEFAULT_MAP_CENTER.lat,
    lng: center?.lng ?? DEFAULT_MAP_CENTER.lng,
  };

  const tileUrl = showTraffic
    ? "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={zoom ?? 11}
      style={{ height: "100%", width: "100%", background: "#f8fafb" }}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer attribution='&copy; OpenStreetMap &copy; CARTO' url={tileUrl} />
      <ZoomControl position="bottomright" />
      <MapViewport
        center={mapCenter}
        zoom={zoom}
        mapZoom={mapZoom}
        fitToMarkers={fitToMarkers}
        markers={safeMarkers}
        userLocation={userLocation}
      />
      {safeMarkers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={buildLeafletMarkerIcon(L, marker.type, marker.color)}
          zIndexOffset={
            marker.type === "emergency" ? 500 : marker.type === "online_driver" ? 400 : 200
          }
          eventHandlers={{
            click: () => onMarkerSelect?.(marker),
          }}
        />
      ))}
      {userLocation?.lat != null && userLocation?.lng != null ? (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={buildLeafletMarkerIcon(L, "user_location")}
          zIndexOffset={999}
        />
      ) : null}
    </MapContainer>
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
