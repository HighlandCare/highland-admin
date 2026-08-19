import { useCallback } from "react";
import PropTypes from "prop-types";
import { OverlayView, OverlayViewF } from "@react-google-maps/api";
import { clusterColor, clusterDisplaySize } from "../../utils/liveOpsClusters";

export default function LiveOpsClusterMarker({ lat, lng, count, members, onClick }) {
  const size = clusterDisplaySize(count);
  const color = clusterColor(members);
  const hasUrgent = (members || []).some(
    (item) => item.type === "emergency" || item.type === "dispute"
  );

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
      zIndex={600 + Math.min(count, 40)}
    >
      <button
        type="button"
        className="live-ops-cluster-marker"
        title={`${count} live items — click to expand`}
        aria-label={`${count} clustered map items`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onClick?.();
        }}
        style={{
          width: size,
          height: size,
          border: "3px solid #fff",
          borderRadius: "50%",
          background: color,
          color: "#fff",
          fontSize: count > 99 ? 11 : 13,
          fontWeight: 800,
          boxShadow: "0 6px 16px rgba(15, 23, 42, 0.28)",
          cursor: "pointer",
        }}
      >
        {hasUrgent ? (
          <span className="live-ops-cluster-pulse" style={{ borderColor: color }} />
        ) : null}
        {count}
      </button>
    </OverlayViewF>
  );
}

LiveOpsClusterMarker.propTypes = {
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  members: PropTypes.array,
  onClick: PropTypes.func,
};
