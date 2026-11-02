import { useEffect, useRef, useState } from "react";
import { AlertCircle, LocateFixed, MapPin, RefreshCw, Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useMapActions } from "../contexts/MapActionContext";
import { useDistance } from "../contexts/DistanceContext";
import { createRoute, getCategories, getLocations, getNearbyLocations } from "../services/api";
import { createCampusOrigin, requestGpsOrigin, resolveGpsFailureOrigin } from "../services/distanceUtils";
import SearchResultCard from "./SearchResultCard";

export default function NearbyDiscovery({ query = "", onClose }) {
  const navigate = useNavigate();
  const { dispatchMapAction } = useMapActions();
  const { origin, campusReference, setOrigin, setReferenceLocations, ensureCampusReference } = useDistance();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualLocations, setManualLocations] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [navigatingId, setNavigatingId] = useState(null);
  const [sortBy, setSortBy] = useState("distance");
  const requestNumber = useRef(0);

  useEffect(() => {
    let active = true;
    getCategories()
      .then(({ data }) => { if (active) setCategories(data); })
      .catch(() => { if (active) setCategories([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!origin) return undefined;
    const requestId = ++requestNumber.current;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await getNearbyLocations({
          latitude: origin.latitude,
          longitude: origin.longitude,
          query: query.trim(),
          category,
          sortBy,
          limit: 10,
          signal: controller.signal,
        });
        if (requestNumber.current === requestId) setLocations(data);
      } catch (requestError) {
        if (requestError.name !== "CanceledError" && requestError.code !== "ERR_CANCELED" && requestNumber.current === requestId) {
          setError("Nearby places could not be loaded. Check your connection and try again.");
          setLocations([]);
        }
      } finally {
        if (requestNumber.current === requestId) setLoading(false);
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [origin, query, category, sortBy]);

  useEffect(() => {
    if (!origin) ensureCampusReference();
  }, [origin, ensureCampusReference]);

  useEffect(() => {
    if (!query.trim()) setSortBy("distance");
  }, [query]);

  function useManualStartingPoint() {
    setManualMode(true);
    setOrigin(null);
    setError("");
    if (manualLocations.length || manualLoading) return;
    setManualLoading(true);
    getLocations()
      .then(({ data }) => {
        setManualLocations(data);
        setReferenceLocations(data);
      })
      .catch(() => setError("Campus starting places could not be loaded. Please retry."))
      .finally(() => setManualLoading(false));
  }

  async function requestCurrentLocation() {
    if (!navigator.geolocation) {
      const message = campusReference
        ? `GPS is unavailable. Using ${campusReference.name} as the campus reference point.`
        : "This browser does not provide GPS location. Choose a campus starting place instead.";
      setError(message);
      if (campusReference) {
        setOrigin(campusReference);
        setManualMode(false);
      } else useManualStartingPoint();
      return;
    }
    setError("");
    try {
      const gpsOrigin = await requestGpsOrigin(navigator.geolocation);
      setOrigin(gpsOrigin);
      setManualMode(false);
      toast.success("Nearby search is using your current location");
    } catch (locationError) {
      const message = locationError.code === 1
        ? "Location access was denied."
        : locationError.message === "The browser returned invalid coordinates"
          ? locationError.message
          : "Your location could not be determined.";
      const fallbackOrigin = resolveGpsFailureOrigin(campusReference);
      const fallback = fallbackOrigin
        ? `${message} Measuring from ${fallbackOrigin.name} (campus reference point), not your live location.`
        : `${message} Choose a campus starting point manually.`;
      setError(fallback);
      if (fallbackOrigin) {
        setOrigin(fallbackOrigin);
        setManualMode(false);
        toast.error("GPS is unavailable; using the campus reference point");
      } else {
        setOrigin(null);
        useManualStartingPoint();
        toast.error("GPS is unavailable. Select a campus start point instead.");
      }
    }
  }

  function chooseManualLocation(locationId) {
    const location = manualLocations.find((item) => Number(item.id) === Number(locationId));
    if (!location) {
      setOrigin(null);
      return;
    }
    const campusOrigin = createCampusOrigin(location);
    if (!campusOrigin) {
      setError("This campus place has missing or invalid coordinates. Choose another starting place.");
      return;
    }
    setError("");
    setOrigin(campusOrigin);
    setManualMode(false);
    toast.success(`Nearby places measured from ${location.name}`);
  }

  function viewOnMap(location) {
    dispatchMapAction({ type: "show_location", location_id: location.id });
    navigate(`/map?focus=${location.id}`);
    onClose?.();
  }

  async function navigateTo(location) {
    if (!origin) return;
    setNavigatingId(location.id);
    try {
      const { data } = await createRoute({
        source: { latitude: origin.latitude, longitude: origin.longitude },
        destination: { latitude: location.latitude, longitude: location.longitude },
        source_name: origin.name || "Your current location",
        destination_name: location.name,
      });
      dispatchMapAction({
        type: "show_route",
        route: data,
        destination_id: location.id,
        source_id: origin.type === "campus" || origin.type === "reference" ? origin.id : null,
        source_is_current: origin.type === "gps",
      });
      navigate(`/map?destination=${location.id}`);
      onClose?.();
      toast.success("Walking route generated");
    } catch (requestError) {
      toast.error(requestError.response?.data?.detail || "Unable to generate a route from this start point");
    } finally {
      setNavigatingId(null);
    }
  }

  return (
    <section className="nearby-panel" aria-label="Nearby campus locations">
      <div className="nearby-panel-heading">
        <div>
          <p className="nearby-kicker"><LocateFixed size={14} /> NEARBY DISCOVERY</p>
          <h2>Find a place around you</h2>
        </div>
        <button type="button" className="nearby-close" onClick={onClose} aria-label="Close nearby discovery"><X size={17} /></button>
      </div>

      <div className="nearby-origin-row">
        {origin && !manualMode ? (
          <div className="nearby-origin-status" role="status">
            <span className="nearby-origin-dot" />
            <span>Measuring from <strong>{origin.name}{origin.type === "reference" ? " · campus reference" : ""}</strong></span>
            <button type="button" onClick={() => { setOrigin(null); setLocations([]); setManualMode(true); useManualStartingPoint(); }}>Change</button>
          </div>
        ) : (
          <>
            <button type="button" className="nearby-origin-button" onClick={requestCurrentLocation}>
              <LocateFixed size={16} /> Use my location
            </button>
            <button type="button" className="nearby-origin-link" onClick={useManualStartingPoint}>
              <MapPin size={15} /> Choose a campus start
            </button>
            {campusReference && <button type="button" className="nearby-origin-link" onClick={() => { setOrigin(campusReference); setManualMode(false); setError(""); }}>
              <MapPin size={15} /> Use {campusReference.name} reference
            </button>}
          </>
        )}
      </div>

      {manualMode && !origin && (
        <div className="nearby-manual-start">
          <label htmlFor="nearby-start">Starting place on campus</label>
          <select id="nearby-start" className="route-select" value={origin?.type === "campus" ? origin.id : ""} onChange={(event) => chooseManualLocation(event.target.value)} disabled={manualLoading}>
            <option value="">{manualLoading ? "Loading campus places…" : "Choose a starting place"}</option>
            {manualLocations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {error && <p className="nearby-error" role="alert">{error}</p>}
        </div>
      )}

      <div className="nearby-filter-row">
        <span><Search size={14} /> {query.trim() ? `Matching “${query.trim()}”` : "Any campus place"}</span>
        <div className="nearby-filter-controls">
          <select className="route-select" aria-label="Filter nearby locations by category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
          <select className="route-select nearby-sort" aria-label="Sort nearby results" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="distance">Nearest first</option>
            <option value="relevance">{query.trim() ? "Best match" : "Name · A–Z"}</option>
          </select>
        </div>
      </div>

      {error && !manualMode && <p className="nearby-error" role="alert">{error}</p>}
      {!origin || manualMode ? (
        <div className="nearby-empty-state">
          <LocateFixed size={20} />
          <p>{manualMode ? "Select a campus starting point, use GPS, or measure from the labeled campus reference point." : "Choose GPS or a campus starting point to sort real locations by distance."}</p>
        </div>
      ) : loading ? (
        <div className="nearby-loading" role="status" aria-live="polite">
          <span className="nearby-spinner" /> Finding the closest matches…
        </div>
      ) : error ? (
        <button type="button" className="nearby-retry" onClick={() => { setOrigin({ ...origin }); }}><RefreshCw size={15} /> Try again</button>
      ) : locations.length ? (
        <div className="nearby-results" aria-live="polite">
          {locations.map((location) => (
            <SearchResultCard
              key={location.id}
              location={location}
              distanceMeters={location.distance_meters}
              onViewMap={viewOnMap}
              onNavigate={navigateTo}
              navigating={navigatingId === location.id}
            />
          ))}
        </div>
      ) : (
        <div className="nearby-empty-state">
          <Search size={19} />
          <p>No saved campus locations match this search. Try another keyword or category.</p>
        </div>
      )}
      <p className="nearby-note"><AlertCircle size={13} /> Distances are straight-line Haversine measurements, not walking distances. Dijkstra walking-route distance is shown separately when you plan a route.</p>
    </section>
  );
}
