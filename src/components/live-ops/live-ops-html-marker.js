import { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { OverlayView, OverlayViewF } from "@react-google-maps/api";
import { buildLiveOpsMarkerSvg } from "../../utils/liveOpsMarkerIcons";

function markerZIndex(type) {
  if (type === "emergency" || type === "dispute") return 500;
  if (type === "online_driver") return 400;
  if (type === "user_location") return 999;
  return 200;
}

function defaultMarkerSize(type) {
  if (type === "emergency" || type === "dispute") return 40;
  if (type === "customer_signup" || type === "driver_signup" || type === "online_driver") {
    return 36;
  }
  return 34;
}

/**
 * HTML/SVG map marker via OverlayView — always visible (unlike SVG data-URL Marker icons).
 */
export default function LiveOpsHtmlMarker({
  lat,
  lng,
  type,
  color,
  title,
  selected = false,
  size: sizeProp,
  onClick,
}) {
  const size = sizeProp || defaultMarkerSize(type);
  const svg = useMemo(() => buildLiveOpsMarkerSvg(type, color), [type, color]);

  const getPixelPositionOffset = useCallback(
    (width, height) => ({
      x: -(width / 2),
      y: -(height / 2),
    }),
    []
  );

  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return null;
  }

  return (
    <OverlayViewF
      position={{ lat: Number(lat), lng: Number(lng) }}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      getPixelPositionOffset={getPixelPositionOffset}
      zIndex={markerZIndex(type) + (selected ? 50 : 0)}
    >
      <button
        type="button"
        className="live-ops-html-marker"
        title={title || ""}
        aria-label={title || "Map marker"}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClick?.();
        }}
        style={{
          width: size,
          height: size,
          padding: 0,
          margin: 0,
          border: selected ? "2px solid #111827" : "none",
          borderRadius: "50%",
          background: "transparent",
          boxShadow: selected
            ? "0 0 0 3px rgba(0,130,138,0.35), 0 6px 16px rgba(0,0,0,0.28)"
            : "0 4px 12px rgba(0,0,0,0.22)",
          cursor: "pointer",
          transform: selected ? "scale(1.12)" : "scale(1)",
          transition: "transform 120ms ease",
        }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </OverlayViewF>
  );
}

LiveOpsHtmlMarker.propTypes = {
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired,
  type: PropTypes.string,
  color: PropTypes.string,
  title: PropTypes.string,
  selected: PropTypes.bool,
  size: PropTypes.number,
  onClick: PropTypes.func,
};
