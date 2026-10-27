import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useGoogleMap } from "@react-google-maps/api";
import {
  DEMAND_ZONE_COLOR,
  getHotspotDisplayRadiusMeters,
  normalizeHotspotCoords,
} from "../../utils/liveOpsHotspots";

/**
 * Native google.maps.Circle layer — reliable across refresh (react Circle often fails).
 */
export default function LiveOpsDemandHotspotsLayer({
  hotspots = [],
  showHotspots = true,
  onHotspotSelect,
}) {
  const map = useGoogleMap();
  const circlesRef = useRef([]);

  useEffect(() => {
    circlesRef.current.forEach((circle) => circle.setMap(null));
    circlesRef.current = [];

    if (!map || !window.google?.maps || !showHotspots) return undefined;

    (hotspots || []).forEach((hotspot) => {
      if (hotspot?.active === false) return;
      const coords = normalizeHotspotCoords(hotspot);
      if (!coords) return;

      const displayRadius = getHotspotDisplayRadiusMeters(hotspot.radiusMeters);
      const isHigh = hotspot.intensity === "high";

      const circle = new window.google.maps.Circle({
        map,
        center: coords,
        radius: displayRadius,
        fillColor: DEMAND_ZONE_COLOR || "#ef4444",
        fillOpacity: isHigh ? 0.32 : 0.26,
        strokeColor: DEMAND_ZONE_COLOR || "#ef4444",
        strokeOpacity: 0.95,
        strokeWeight: isHigh ? 3.5 : 3,
        clickable: true,
        zIndex: 1,
      });

      circle.addListener("click", () => onHotspotSelect?.(hotspot));
      circlesRef.current.push(circle);
    });

    return () => {
      circlesRef.current.forEach((circle) => circle.setMap(null));
      circlesRef.current = [];
    };
  }, [hotspots, map, onHotspotSelect, showHotspots]);

  return null;
}

LiveOpsDemandHotspotsLayer.propTypes = {
  hotspots: PropTypes.array,
  showHotspots: PropTypes.bool,
  onHotspotSelect: PropTypes.func,
};
