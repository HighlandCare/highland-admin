import { useMemo } from "react";
import PropTypes from "prop-types";
import { MarkerF } from "@react-google-maps/api";
import { buildClusterMarkerIcon } from "../../utils/liveOpsMarkerIcons";

export default function LiveOpsClusterMarker({ lat, lng, count, members, onClick }) {
  const icon = useMemo(
    () => buildClusterMarkerIcon(count, members),
    [count, members]
  );

  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || !icon) {
    return null;
  }

  return (
    <MarkerF
      position={{ lat: Number(lat), lng: Number(lng) }}
      title={`${count} live items — click to expand`}
      icon={icon}
      zIndex={600 + Math.min(count, 40)}
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

LiveOpsClusterMarker.propTypes = {
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  members: PropTypes.array,
  onClick: PropTypes.func,
};

