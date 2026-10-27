import { useMemo } from "react";
import PropTypes from "prop-types";
import { Circle } from "@react-google-maps/api";
import {
  getHotspotDisplayRadiusMeters,
  normalizeHotspotCoords,
} from "../../utils/liveOpsHotspots";

export default function LiveOpsDemandHotspot({ hotspot, onClick }) {
  const coords = normalizeHotspotCoords(hotspot);
  const displayRadius = useMemo(
    () => getHotspotDisplayRadiusMeters(hotspot?.radiusMeters),
    [hotspot?.radiusMeters]
  );
  const isHigh = hotspot?.intensity === "high";

  const circleOptions = useMemo(
    () => ({
      fillColor: "#ef4444",
      fillOpacity: isHigh ? 0.22 : 0.18,
      strokeColor: "#ef4444",
      strokeOpacity: isHigh ? 0.75 : 0.6,
      strokeWeight: isHigh ? 3 : 2,
      clickable: true,
      zIndex: 40,
    }),
    [isHigh]
  );

  if (!coords) return null;

  return (
    <Circle
      key={hotspot.id}
      center={coords}
      radius={displayRadius}
      options={circleOptions}
      onClick={() => onClick?.(hotspot)}
    />
  );
}

LiveOpsDemandHotspot.propTypes = {
  hotspot: PropTypes.shape({
    id: PropTypes.string,
    lat: PropTypes.number,
    lng: PropTypes.number,
    radiusMeters: PropTypes.number,
    intensity: PropTypes.string,
    active: PropTypes.bool,
  }),
  onClick: PropTypes.func,
};
