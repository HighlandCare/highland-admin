import { useMemo } from "react";
import PropTypes from "prop-types";
import { Circle } from "@react-google-maps/api";
import {
  DEMAND_ZONE_COLOR,
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
      fillColor: DEMAND_ZONE_COLOR || "#ef4444",
      fillOpacity: isHigh ? 0.32 : 0.26,
      strokeColor: DEMAND_ZONE_COLOR || "#ef4444",
      strokeOpacity: isHigh ? 0.95 : 0.85,
      strokeWeight: isHigh ? 3.5 : 3,
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
