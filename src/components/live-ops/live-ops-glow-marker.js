import { useMemo } from "react";
import PropTypes from "prop-types";
import { MarkerF } from "@react-google-maps/api";
import { buildGoogleMapsMarkerIcon } from "../../utils/liveOpsMarkerIcons";

function markerZIndex(type, selected) {
  let z = 200;
  if (type === "online_driver") z = 400;
  if (type === "emergency" || type === "dispute") z = 500;
  if (type === "user_location") z = 999;
  return z + (selected ? 50 : 0);
}

/**
 * Native Google Maps marker — pinned to lat/lng (no OverlayView drift on zoom).
 */
export default function LiveOpsGlowMarker({
  lat,
  lng,
  type,
  color,
  title,
  selected = false,
  onClick,
}) {
  const icon = useMemo(
    () => buildGoogleMapsMarkerIcon(type, color),
    [color, type]
  );

  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || !icon) {
    return null;
  }

  return (
    <MarkerF
      position={{ lat: Number(lat), lng: Number(lng) }}
      title={title || ""}
      icon={icon}
      zIndex={markerZIndex(type, selected)}
      onClick={(event) => {
        event?.domEvent?.preventDefault?.();
        event?.domEvent?.stopPropagation?.();
        onClick?.();
      }}
      options={{
        optimized: false,
      }}
    />
  );
}

LiveOpsGlowMarker.propTypes = {
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired,
  type: PropTypes.string,
  color: PropTypes.string,
  title: PropTypes.string,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
};
