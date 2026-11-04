import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

import { getLocations } from "../services/api";
import { haversineDistanceMeters, isValidCoordinates } from "../services/distanceUtils";

const DistanceContext = createContext(null);

function findCampusReference(locations) {
  const mainGate = locations.find((item) => String(item.name || "").trim().toLowerCase() === "main gate");
  if (!mainGate || !isValidCoordinates(mainGate.latitude, mainGate.longitude)) return null;
  return {
    id: mainGate.id,
    name: mainGate.name,
    latitude: Number(mainGate.latitude),
    longitude: Number(mainGate.longitude),
    type: "reference",
  };
}

export function DistanceProvider({ children }) {
  const [campusReference, setCampusReference] = useState(null);
  const [origin, setOriginState] = useState(null);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const [referenceUnavailable, setReferenceUnavailable] = useState(false);
  const userChoseOrigin = useRef(false);
  const referenceRequest = useRef(null);
  const requestAttempted = useRef(false);

  const setReferenceLocations = useCallback((locations) => {
    if (!Array.isArray(locations)) return null;
    const reference = findCampusReference(locations);
    if (!reference) return null;
    setCampusReference(reference);
    setReferenceUnavailable(false);
    setOriginState((current) => userChoseOrigin.current || current ? current : reference);
    return reference;
  }, []);

  const setOrigin = useCallback((nextOrigin) => {
    userChoseOrigin.current = true;
    if (nextOrigin && !isValidCoordinates(nextOrigin.latitude, nextOrigin.longitude)) {
      setOriginState(null);
      return;
    }
    setOriginState(nextOrigin ? {
      ...nextOrigin,
      latitude: Number(nextOrigin.latitude),
      longitude: Number(nextOrigin.longitude),
    } : null);
  }, []);

  const useCampusReference = useCallback(() => {
    if (!campusReference) return false;
    setOrigin(campusReference);
    return true;
  }, [campusReference, setOrigin]);

  const ensureCampusReference = useCallback(({ retry = false } = {}) => {
    if (campusReference) return Promise.resolve(campusReference);
    if (referenceRequest.current) return referenceRequest.current;
    if (requestAttempted.current && !retry) return Promise.resolve(null);
    requestAttempted.current = true;
    setReferenceLoading(true);
    referenceRequest.current = getLocations()
      .then(({ data }) => {
        const reference = setReferenceLocations(data);
        setReferenceUnavailable(!reference);
        return reference;
      })
      .catch(() => {
        setReferenceUnavailable(true);
        return null;
      })
      .finally(() => {
        setReferenceLoading(false);
        referenceRequest.current = null;
      });
    return referenceRequest.current;
  }, [campusReference, setReferenceLocations]);

  const distanceTo = useCallback((location) => haversineDistanceMeters(origin, location), [origin]);
  const value = useMemo(() => ({
    origin,
    campusReference,
    referenceLoading,
    referenceUnavailable,
    setOrigin,
    setReferenceLocations,
    ensureCampusReference,
    useCampusReference,
    distanceTo,
  }), [origin, campusReference, referenceLoading, referenceUnavailable, setOrigin, setReferenceLocations, ensureCampusReference, useCampusReference, distanceTo]);

  return <DistanceContext.Provider value={value}>{children}</DistanceContext.Provider>;
}

export function useDistance() {
  const value = useContext(DistanceContext);
  if (!value) throw new Error("useDistance must be used inside DistanceProvider");
  return value;
}
