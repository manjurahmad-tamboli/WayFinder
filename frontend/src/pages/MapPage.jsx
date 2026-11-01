import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import CampusMap from "../components/CampusMap";
import Loader from "../components/Loader";
import LocationCard from "../components/LocationCard";
import Reveal from "../components/Reveal";
import useLocations from "../hooks/useLocations";
import { createRoute, getCategories, searchLocations } from "../services/api";

export default function MapPage() {
  const [params] = useSearchParams();
  const goTo = useNavigate();
  const category = params.get("category") || "";
  const queryParam = params.get("q") || "";
  const destinationParam = params.get("destination") || "";
  const { locations: initial, loading, error } = useLocations(category || undefined);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(queryParam);
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [sourceMode, setSourceMode] = useState("manual");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [route, setRoute] = useState(null);
  const [routing, setRouting] = useState(false);

  useEffect(() => setLocations(initial), [initial]);
  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data)).catch(() => {});
  }, []);
  useEffect(() => {
    if (destinationParam) setDestinationId(destinationParam);
  }, [destinationParam]);

  async function runSearch(value = query) {
    if (!value.trim()) {
      setLocations(initial);
      return;
    }
    try {
      const { data } = await searchLocations({ query: value, category: category || null });
      setLocations(data);
      toast.success(data.length ? `${data.length} location${data.length === 1 ? "" : "s"} found` : "No matching locations");
    } catch {
      toast.error("Search could not be completed");
    }
  }

  const all = useMemo(() => initial.length ? initial : locations, [initial, locations]);

  function useManualStart() {
    setSourceMode("manual");
    setLocationMessage("");
    setRoute(null);
  }

  function requestCurrentLocation() {
    if (!navigator.geolocation) {
      setSourceMode("manual");
      setLocationMessage("Location is not available in this browser. Choose a campus place below.");
      toast.error("Location is unavailable. Choose a campus start point instead.");
      return;
    }

    setLocating(true);
    setLocationMessage("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentPosition({ latitude: coords.latitude, longitude: coords.longitude });
        setSourceMode("current");
        setLocationMessage("Using your current position as the route start.");
        setRoute(null);
        setLocating(false);
        toast.success("Current location set as your start");
      },
      (geolocationError) => {
        const messages = {
          1: "Location access was denied. Choose a campus starting point manually.",
          2: "Your location could not be determined. Choose a campus starting point manually.",
          3: "The location request timed out. Try again or choose a start manually.",
        };
        const message = messages[geolocationError.code] || "Could not get your location. Choose a start manually.";
        setSourceMode("manual");
        setCurrentPosition(null);
        setLocationMessage(message);
        setLocating(false);
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  async function createWalkingRoute() {
    const manualSource = all.find((item) => item.id === Number(sourceId));
    const destination = all.find((item) => item.id === Number(destinationId));
    const source = sourceMode === "current" ? currentPosition : manualSource;
    if (!source || !destination || (sourceMode === "manual" && manualSource.id === destination.id)) {
      toast.error(sourceMode === "current" ? "Choose a destination" : "Choose two different locations");
      return;
    }
    setRouting(true);
    try {
      const { data } = await createRoute({
        source: { latitude: source.latitude, longitude: source.longitude },
        destination: { latitude: destination.latitude, longitude: destination.longitude },
        source_name: sourceMode === "current" ? "Your current location" : source.name,
        destination_name: destination.name,
      });
      setRoute(data);
      setSelectedLocationId(destination.id);
      toast.success("Shortest route generated");
    } catch (requestError) {
      toast.error(requestError.response?.data?.detail || "Unable to generate route");
    } finally {
      setRouting(false);
    }
  }

  if (loading) return <div className="page-wrap"><Loader /></div>;

  return (
    <section className="page-wrap map-page">
      <div className="section-head">
        <div>
          <p className="eyebrow">Explore · plan · arrive</p>
          <h1 className="page-title">Campus map</h1>
          <p className="page-lead">Search the campus, start from your current position or a campus place, and follow a walking route.</p>
        </div>
        <span className="meta-pill">{locations.length} places shown</span>
      </div>

      {error && <p className="panel panel-pad text-silver">{error}</p>}

      <Reveal className="route-planner-grid">
        <CampusMap
          locations={locations}
          route={route?.route}
          userPosition={sourceMode === "current" ? currentPosition : null}
          selectedLocationId={selectedLocationId}
          onSelectLocation={setSelectedLocationId}
        />

        <aside className="route-panel panel">
          <p className="eyebrow">Walking directions</p>
          <h2 className="section-title">Plan your route</h2>
          <span className="route-label">Start from</span>
          <div className="start-mode-switch" role="group" aria-label="Choose how to set your starting point">
            <button type="button" className={sourceMode === "current" ? "start-mode active" : "start-mode"} onClick={requestCurrentLocation} disabled={locating}>
              <span aria-hidden="true">◎</span> {locating ? "Locating…" : "My location"}
            </button>
            <button type="button" className={sourceMode === "manual" ? "start-mode active" : "start-mode"} onClick={useManualStart}>
              <span aria-hidden="true">⌖</span> Choose place
            </button>
          </div>

          {sourceMode === "manual" ? (
            <>
              <label className="route-label" htmlFor="route-start">Starting place</label>
              <select id="route-start" className="route-select" value={sourceId} onChange={(event) => { setSourceId(event.target.value); setSelectedLocationId(event.target.value ? Number(event.target.value) : null); setRoute(null); }}>
                <option value="">Choose starting point</option>
                {all.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </>
          ) : (
            <div className="current-location-status" role="status">
              <span className="current-location-dot" aria-hidden="true" />
              <span>{currentPosition ? "Current position ready" : locationMessage || "Tap My location to request your position."}</span>
            </div>
          )}
          {locationMessage && sourceMode === "manual" && <p className="location-fallback-message" role="status">{locationMessage}</p>}

          <label className="route-label" htmlFor="route-end">Destination</label>
          <select id="route-end" className="route-select" value={destinationId} onChange={(event) => { setDestinationId(event.target.value); setSelectedLocationId(event.target.value ? Number(event.target.value) : null); setRoute(null); }}>
            <option value="">Choose destination</option>
            {all.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>

          <button className="primary-button route-submit mt-5 w-full px-4 py-3" onClick={createWalkingRoute} disabled={routing}>
            {routing ? "Finding shortest path…" : "Get directions"}
            {!routing && <span aria-hidden="true">↗</span>}
          </button>

          {route && (
            <div className="route-result">
              <p className="route-algorithm">Shortest path · {route.algorithm}</p>
              <div className="route-summary">
                <div className="route-metric">Total distance<strong>{route.distance_meters} m</strong></div>
                <div className="route-metric">Estimated walk<strong>~{route.walking_minutes} min</strong></div>
              </div>
              <h3 className="directions-heading">Step-by-step</h3>
              <ol className="directions-list">
                {route.directions.map((direction, index) => <li key={`${index}-${direction}`}>{direction}</li>)}
              </ol>
              <p className="route-footnote">{route.network_note} Walking time is an estimate; follow campus signs.</p>
            </div>
          )}
        </aside>
      </Reveal>

      <Reveal className="discovery-toolbar panel" delay={60}>
        <form className="discovery-search" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
          <input className="form-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campus locations" aria-label="Search locations" />
          <button className="primary-button px-5 py-3" type="submit">Search</button>
        </form>
        <select className="route-select category-filter" value={category} aria-label="Filter by category" onChange={(event) => goTo(event.target.value ? `/map?category=${encodeURIComponent(event.target.value)}` : "/map")}>
          <option value="">All categories</option>
          {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
      </Reveal>

      <Reveal className="section-head location-results-head" delay={90}>
        <div>
          <p className="eyebrow">Campus directory</p>
          <h2 className="section-title">{category || "All locations"}</h2>
        </div>
      </Reveal>
      {locations.length ? <Reveal className="location-grid" delay={120}>{locations.map((item) => <LocationCard key={item.id} location={item} />)}</Reveal> : <p className="panel panel-pad text-muted">No locations match this search.</p>}
    </section>
  );
}
