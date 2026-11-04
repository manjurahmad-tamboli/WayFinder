import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import CampusMap from "../components/CampusMap";
import Loader from "../components/Loader";
import SearchResultCard from "../components/SearchResultCard";
import Reveal from "../components/Reveal";
import SearchBar from "../components/SearchBar";
import ErrorNotice from "../components/ErrorNotice";
import useLocations from "../hooks/useLocations";
import { createRoute, getCampusSearch, getCategories } from "../services/api";
import { getLocationMapUrl } from "../services/mapLinks";
import { useMapActions } from "../contexts/MapActionContext";
import { useDistance } from "../contexts/DistanceContext";
import { createCampusOrigin, createGpsOrigin, isValidCoordinates, sortLocationsByDistance } from "../services/distanceUtils";
import { getApiErrorMessage, isRequestCanceled } from "../services/apiErrors";

export default function MapPage() {
  const [params, setParams] = useSearchParams();
  const { mapAction, dispatchMapAction } = useMapActions();
  const { origin, campusReference, setOrigin: setDistanceOrigin, ensureCampusReference } = useDistance();
  const goTo = useNavigate();
  const category = params.get("category") || "";
  const queryParam = params.get("q") || "";
  const destinationParam = params.get("destination") || "";
  const focusParam = params.get("focus") || "";
  const navigateParam = params.get("navigate") || "";
  const navigateRequest = params.get("request") || "";
  const { locations: initial, loading, error, retry: retryLocations } = useLocations(category || undefined);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesRetry, setCategoriesRetry] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchRetry, setSearchRetry] = useState(0);
  const [query, setQuery] = useState(queryParam);
  const [sortMode, setSortMode] = useState(() => queryParam ? "relevance" : "name");
  const [sourceId, setSourceId] = useState(params.get("from") || "");
  const [destinationId, setDestinationId] = useState(destinationParam);
  const [selectedLocationId, setSelectedLocationId] = useState(
    Number(params.get("focus") || destinationParam) || null,
  );
  const [sourceMode, setSourceMode] = useState("manual");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [locating, setLocating] = useState(false);
  const [route, setRoute] = useState(null);
  const [routeSource, setRouteSource] = useState(null);
  const [routing, setRouting] = useState(false);
  const lastAppliedRouteAction = useRef(null);
  const lastAutoNavigateRequest = useRef("");
  const pendingNavigationDestination = useRef(null);

  useEffect(() => {
    if (!queryParam) setLocations(initial);
  }, [initial, queryParam]);
  useEffect(() => {
    const controller = new AbortController();
    setCategoriesError("");
    getCategories({ signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setCategories(data); })
      .catch((requestError) => {
        if (!controller.signal.aborted && !isRequestCanceled(requestError)) {
          setCategoriesError(getApiErrorMessage(requestError, "Categories could not be loaded."));
        }
      });
    return () => controller.abort();
  }, [categoriesRetry]);
  useEffect(() => {
    setQuery(queryParam);
    setSortMode(queryParam ? "relevance" : "name");
  }, [queryParam]);
  useEffect(() => {
    if (!origin) ensureCampusReference();
  }, [origin, ensureCampusReference]);
  useEffect(() => {
    if (!queryParam) {
      setSearching(false);
      setSearchError("");
      return undefined;
    }
    const controller = new AbortController();
    setSearching(true);
    setSearchError("");
    getCampusSearch(queryParam, { category: category || undefined, limit: 50, signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        setLocations(data.locations || []);
        toast.success(data.locations?.length
          ? `${data.locations.length} matching location${data.locations.length === 1 ? "" : "s"}`
          : "No matching campus locations");
      })
      .catch((requestError) => {
        if (!controller.signal.aborted && !isRequestCanceled(requestError)) {
          setSearchError(getApiErrorMessage(requestError, "Search could not be completed."));
          setLocations([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });
    return () => controller.abort();
  }, [category, queryParam, searchRetry]);
  useEffect(() => {
    if (!destinationParam) return;
    setDestinationId(destinationParam);
    setSelectedLocationId(Number(destinationParam) || null);
  }, [destinationParam]);
  useEffect(() => {
    const selectedId = Number(focusParam || destinationParam) || null;
    if (!selectedId || loading) return undefined;
    if (focusParam) setSelectedLocationId(selectedId);
    const frame = window.requestAnimationFrame(() => scrollToMap());
    return () => window.cancelAnimationFrame(frame);
  }, [destinationParam, focusParam, loading]);

  useEffect(() => {
    if (mapAction?.type !== "show_route" || !mapAction.route || lastAppliedRouteAction.current === mapAction.eventId) return;
    lastAppliedRouteAction.current = mapAction.eventId;
    setRoute(mapAction.route);
    setRouteSource("assistant");
    setDestinationId(String(mapAction.destination_id || ""));
    setSelectedLocationId(Number(mapAction.destination_id) || null);
    if (mapAction.source_is_current) {
      const firstPoint = mapAction.route.route?.[0];
      setSourceMode("current");
      setSourceId("");
      setCurrentPosition(firstPoint ? { latitude: firstPoint[0], longitude: firstPoint[1] } : null);
      if (firstPoint) setDistanceOrigin(createGpsOrigin({ latitude: firstPoint[0], longitude: firstPoint[1] }));
      setLocationMessage("Route start shared with WayFinder AI.");
    } else if (mapAction.source_id) {
      setSourceMode("manual");
      setSourceId(String(mapAction.source_id));
      setCurrentPosition(null);
    }
  }, [mapAction, setDistanceOrigin]);

  useEffect(() => {
    if (mapAction?.type !== "clear_selection" || lastAppliedRouteAction.current === mapAction.eventId) return;
    lastAppliedRouteAction.current = mapAction.eventId;
    if (routeSource === "assistant") {
      setRoute(null);
      setRouteSource(null);
    }
  }, [mapAction, routeSource]);

  function submitSearch(value) {
    const nextParams = new URLSearchParams();
    if (value.trim()) nextParams.set("q", value.trim());
    if (category) nextParams.set("category", category);
    if (value.trim() === queryParam) setSearchRetry((count) => count + 1);
    setParams(nextParams);
  }

  function showSearchResult(location) {
    dispatchMapAction({ type: "show_location", location_id: location.id });
    setSelectedLocationId(location.id);
    goTo(getLocationMapUrl(location.id));
  }

  function planSearchResult(location) {
    dispatchMapAction({ type: "show_location", location_id: location.id });
    setSelectedLocationId(location.id);
    setDestinationId(String(location.id));
    goTo(getLocationMapUrl(location.id, "navigate"));
  }

  const all = useMemo(() => initial.length ? initial : locations, [initial, locations]);
  const sortedLocations = useMemo(
    () => sortMode === "distance" ? sortLocationsByDistance(locations, origin) : locations,
    [locations, origin, sortMode],
  );

  useEffect(() => {
    if (sourceMode !== "manual" || !sourceId) return;
    const manualSource = all.find((item) => Number(item.id) === Number(sourceId));
    const campusOrigin = createCampusOrigin(manualSource);
    if (campusOrigin) setDistanceOrigin(campusOrigin);
  }, [all, setDistanceOrigin, sourceId, sourceMode]);

  function useManualStart() {
    setSourceMode("manual");
    setLocationMessage("");
    setRoute(null);
    if (sourceId) {
      const campusOrigin = createCampusOrigin(all.find((item) => Number(item.id) === Number(sourceId)));
      setDistanceOrigin(campusOrigin);
    } else setDistanceOrigin(null);
  }

  function scrollToMap({ focusStart = false } = {}) {
    window.requestAnimationFrame(() => {
      document.getElementById("map-route-planner")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      if (focusStart) {
        window.setTimeout(() => {
          document.getElementById("route-start")?.focus({ preventScroll: true });
        }, 450);
      }
    });
  }

  function fallbackToManualStart(message, destination = null) {
    setSourceMode("manual");
    setSourceId("");
    setCurrentPosition(null);
    setDistanceOrigin(null);
    setRoute(null);
    setRouteSource(null);
    setLocationMessage(message + " Choose a campus starting point manually to continue.");
    setLocating(false);
    pendingNavigationDestination.current = destination ? Number(destination.id) : null;
    toast.error(message);
    scrollToMap({ focusStart: true });
  }

  function requestCurrentLocation(destination = null) {
    if (!navigator.geolocation) {
      fallbackToManualStart("Location is unavailable in this browser.", destination);
      return;
    }

    setLocating(true);
    setLocationMessage("Requesting your location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const gpsOrigin = createGpsOrigin({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        if (!gpsOrigin) {
          fallbackToManualStart("The browser returned invalid coordinates.", destination);
          return;
        }
        setCurrentPosition({ latitude: gpsOrigin.latitude, longitude: gpsOrigin.longitude });
        setDistanceOrigin(gpsOrigin);
        setSourceMode("current");
        setSourceId("");
        setLocationMessage("Using your current position as the route start.");
        setRoute(null);
        setRouteSource(null);
        setLocating(false);
        toast.success("Current location set as your start");
        if (destination) void createWalkingRouteFrom(gpsOrigin, destination, "current");
      },
      (geolocationError) => {
        const messages = {
          1: "Location access was denied.",
          2: "Your location could not be determined.",
          3: "The location request timed out.",
        };
        fallbackToManualStart(messages[geolocationError.code] || "Could not get your location.", destination);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  async function createWalkingRouteFrom(source, destination, mode) {
    if (routing) return;
    if (!source) {
      toast.error("Choose a starting point with valid coordinates");
      return;
    }
    if (!destination || !isValidCoordinates(destination.latitude, destination.longitude)) {
      toast.error("Choose a destination with valid coordinates");
      return;
    }
    if (source.id != null && Number(source.id) === Number(destination.id)) {
      toast.error("Choose two different locations");
      return;
    }

    setRouting(true);
    setRoute(null);
    try {
      const { data } = await createRoute({
        source: { latitude: source.latitude, longitude: source.longitude },
        destination: { latitude: destination.latitude, longitude: destination.longitude },
        source_name: mode === "current" ? "Your current location" : source.name || "Chosen campus place",
        destination_name: destination.name,
      });
      setRoute(data);
      setRouteSource("manual");
      setSelectedLocationId(destination.id);
      pendingNavigationDestination.current = null;
      toast.success("Walking route generated");
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, "Unable to generate the walking route."));
    } finally {
      setRouting(false);
    }
  }

  async function createWalkingRoute() {
    const manualSource = all.find((item) => Number(item.id) === Number(sourceId));
    const destination = all.find((item) => Number(item.id) === Number(destinationId));
    const source = sourceMode === "current"
      ? currentPosition
      : sourceMode === "reference"
        ? campusReference
        : createCampusOrigin(manualSource);
    return createWalkingRouteFrom(source, destination, sourceMode);
  }

  function beginNavigation(destination) {
    if (!destination || !isValidCoordinates(destination.latitude, destination.longitude)) {
      toast.error("This destination does not have valid map coordinates");
      return;
    }

    pendingNavigationDestination.current = Number(destination.id);
    setDestinationId(String(destination.id));
    setSelectedLocationId(Number(destination.id));
    setRoute(null);
    setRouteSource(null);

    if (sourceMode === "manual" && sourceId) {
      const manualSource = all.find((item) => Number(item.id) === Number(sourceId));
      const manualOrigin = createCampusOrigin(manualSource);
      if (manualOrigin) return void createWalkingRouteFrom(manualOrigin, destination, "manual");
    }
    if (sourceMode === "current" && currentPosition) {
      return void createWalkingRouteFrom(currentPosition, destination, "current");
    }
    if (sourceMode === "reference" && campusReference) {
      return void createWalkingRouteFrom(campusReference, destination, "reference");
    }
    if (origin?.type === "gps" && isValidCoordinates(origin.latitude, origin.longitude)) {
      setSourceMode("current");
      setCurrentPosition({ latitude: origin.latitude, longitude: origin.longitude });
      setSourceId("");
      return void createWalkingRouteFrom(origin, destination, "current");
    }
    if (origin?.type === "campus" && isValidCoordinates(origin.latitude, origin.longitude)) {
      setSourceMode("manual");
      setSourceId(String(origin.id));
      return void createWalkingRouteFrom(origin, destination, "manual");
    }

    requestCurrentLocation(destination);
  }

  function selectManualStartingPoint(nextId) {
    const start = all.find((item) => Number(item.id) === Number(nextId));
    const nextOrigin = nextId ? createCampusOrigin(start) : null;
    setSourceMode("manual");
    setSourceId(nextId);
    setDistanceOrigin(nextOrigin);
    setSelectedLocationId(nextId ? Number(nextId) : null);
    setLocationMessage("");
    setRoute(null);
    if (nextId && !nextOrigin) {
      toast.error("This place has missing or invalid coordinates");
      return;
    }

    const pendingId = pendingNavigationDestination.current;
    const pendingDestination = pendingId
      ? all.find((item) => Number(item.id) === pendingId)
      : null;
    if (nextOrigin && pendingDestination) {
      void createWalkingRouteFrom(nextOrigin, pendingDestination, "manual");
    }
  }

  useEffect(() => {
    if (loading || navigateParam !== "1" || !navigateRequest) return;
    const requestKey = String(destinationParam) + ":" + navigateRequest;
    if (lastAutoNavigateRequest.current === requestKey) return;
    lastAutoNavigateRequest.current = requestKey;

    const destination = all.find((item) => Number(item.id) === Number(destinationParam));
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("navigate");
      next.delete("request");
      return next;
    }, { replace: true });

    if (!destination) {
      toast.error("That destination is not available in the campus directory");
      return;
    }
    beginNavigation(destination);
  }, [all, destinationParam, loading, navigateParam, navigateRequest, setParams]);

  if (loading) return <div className="page-wrap"><Loader /></div>;
  if (error) return <section className="page-wrap"><ErrorNotice message={error} onRetry={retryLocations} /></section>;

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

      <Reveal id="map-route-planner" className="route-planner-grid">
        <CampusMap
          locations={locations}
          route={route?.route}
          mapAction={mapAction}
          userPosition={sourceMode === "current" ? currentPosition : null}
          selectedLocationId={selectedLocationId}
          onSelectLocation={setSelectedLocationId}
        />

        <aside className="route-panel panel">
          <p className="eyebrow">Walking directions</p>
          <h2 className="section-title">Plan your route</h2>
          <span className="route-label">Start from</span>
          <div className={`start-mode-switch${campusReference ? " has-reference" : ""}`} role="group" aria-label="Choose how to set your starting point">
            <button type="button" className={sourceMode === "current" ? "start-mode active" : "start-mode"} onClick={requestCurrentLocation} disabled={locating}>
              <span aria-hidden="true">◎</span> {locating ? "Locating…" : "My location"}
            </button>
            <button type="button" className={sourceMode === "manual" ? "start-mode active" : "start-mode"} onClick={useManualStart}>
              <span aria-hidden="true">⌖</span> Choose place
            </button>
            {campusReference && <button type="button" className={sourceMode === "reference" ? "start-mode active" : "start-mode"} onClick={() => {
              setSourceMode("reference");
              setCurrentPosition(null);
              setDistanceOrigin(campusReference);
              setLocationMessage(`Using ${campusReference.name} as the campus reference point, not your live position.`);
              setRoute(null);
            }}>
              <span aria-hidden="true">⌖</span> Campus ref
            </button>}
          </div>

          {sourceMode === "manual" ? (
            <>
              <label className="route-label" htmlFor="route-start">Starting place</label>
              <select id="route-start" className="route-select" value={sourceId} onChange={(event) => selectManualStartingPoint(event.target.value)}>
                <option value="">Choose starting point</option>
                {all.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </>
          ) : (
            <div className="current-location-status" role="status">
              <span className="current-location-dot" aria-hidden="true" />
              <span>{sourceMode === "reference"
                ? locationMessage || `${campusReference?.name || "Campus reference"} is a configured reference point, not a live position.`
                : currentPosition ? "Current position ready" : locationMessage || "Tap My location to request your position."}</span>
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
              <div className="route-summary">
                <div className="route-metric">Walking-route distance<strong>{route.distance_meters} m</strong></div>
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
        <SearchBar value={query} onChange={setQuery} onSearch={submitSearch} initialQuery={queryParam} compact />
        <select className="route-select category-filter" value={category} aria-label="Filter by category" onChange={(event) => goTo(event.target.value ? `/map?category=${encodeURIComponent(event.target.value)}` : "/map")}>
          <option value="">All categories</option>
          {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
      </Reveal>
      {categoriesError && <ErrorNotice message={categoriesError} onRetry={() => setCategoriesRetry((count) => count + 1)} />}

      <Reveal className="section-head location-results-head" delay={90}>
        <div>
          <p className="eyebrow">Campus directory</p>
          <h2 className="section-title">{category || "All locations"}</h2>
        </div>
        <label className="directory-sort-control">
          <span>Sort by</span>
          <select className="route-select" aria-label="Sort locations" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            {queryParam ? (
              <>
                <option value="relevance">Best match</option>
                <option value="distance">Distance · nearest first</option>
              </>
            ) : (
              <>
                <option value="name">Name</option>
                <option value="distance">Distance · nearest first</option>
              </>
            )}
          </select>
        </label>
      </Reveal>
      {searchError && queryParam ? (
        <div className="panel panel-pad search-results-error" role="alert">
          <p>{searchError}</p>
          <button type="button" className="nearby-retry" onClick={() => setSearchRetry((count) => count + 1)}>Try search again</button>
        </div>
      ) : searching && queryParam ? (
        <div className="search-directory-grid search-directory-skeletons" role="status" aria-label="Loading search results">
          {[0, 1, 2].map((index) => <div className="search-result-skeleton" key={index}><span /><div><i /><i /><i /></div></div>)}
        </div>
      ) : locations.length ? (
        <Reveal className="search-directory-grid" delay={120}>
          {sortedLocations.map((item) => (
            <SearchResultCard
              key={item.id}
              location={item}
              onViewMap={showSearchResult}
              onNavigate={planSearchResult}
              className="search-directory-card"
            />
          ))}
        </Reveal>
      ) : <p className="panel panel-pad text-muted">No locations match this search.</p>}
    </section>
  );
}
