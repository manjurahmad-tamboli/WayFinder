import { useEffect } from "react";

import { useDistance } from "../contexts/DistanceContext";
import { formatDistance, isValidCoordinates } from "../services/distanceUtils";

function describeOrigin(origin) {
  if (!origin) return "";
  if (origin.type === "reference") return `${origin.name} (campus reference)`;
  return origin.name || (origin.type === "gps" ? "your current location" : "selected campus place");
}

export default function DistanceLabel({ location, distanceMeters, showOrigin = false, className = "" }) {
  const { origin, distanceTo, ensureCampusReference } = useDistance();

  useEffect(() => {
    if (!origin) ensureCampusReference();
  }, [origin, ensureCampusReference]);

  const coordinatesAreValid = isValidCoordinates(location?.latitude, location?.longitude);
  const providedDistance = distanceMeters !== null && distanceMeters !== undefined ? Number(distanceMeters) : null;
  const measuredDistance = Number.isFinite(providedDistance) && providedDistance >= 0
    ? providedDistance
    : distanceTo(location);

  let label = "Choose a start to see distance";
  if (!coordinatesAreValid) label = "Distance unavailable";
  else if (measuredDistance !== null) {
    label = `${formatDistance(measuredDistance)} straight-line`;
    if (showOrigin && origin) label += ` · from ${describeOrigin(origin)}`;
  }

  const distanceTitle = measuredDistance !== null && measuredDistance >= 0
    ? `Straight-line distance (Haversine), not walking-route distance${origin && distanceMeters == null ? `, from ${describeOrigin(origin)}` : ""}`
    : coordinatesAreValid ? "Select an origin to calculate straight-line distance" : "This location has missing or invalid coordinates";

  return (
    <span
      className={`distance-label${className ? ` ${className}` : ""}`}
      title={distanceTitle}
      aria-label={distanceTitle}
    >
      {label}
    </span>
  );
}
