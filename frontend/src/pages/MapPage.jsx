import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import CampusMap from "../components/CampusMap";
import LocationCard from "../components/LocationCard";
import { LocationCardSkeleton, MapLoadingSkeleton } from "../components/Skeletons";

import useLocations from "../hooks/useLocations";
import useDelayedLoading from "../hooks/useDelayedLoading";
import {
  createRoute,
  getCategories,
  searchLocations,
} from "../services/api";

export default function MapPage() {
  const [params] = useSearchParams();

  const category = params.get("category") || "";
  const queryParam = params.get("q") || "";
  const destinationParam = params.get("destination") || "";

  const {
    locations: initial,
    loading,
    error,
  } = useLocations(category || undefined);

  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState(queryParam);
  const [sourceId, setSourceId] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [selectedMapLocationId, setSelectedMapLocationId] = useState(null);
  const [route, setRoute] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [originMode, setOriginMode] = useState("manual");
  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [gpsError, setGpsError] = useState("");
  const startSelectRef = useRef(null);
  const gpsRequestId = useRef(0);
  const searchRequestId = useRef(0);
  const hasSearched = useRef(false);
  const showLoading = useDelayedLoading(loading);
  const showSearchLoading = useDelayedLoading(isSearching);

  // Load initial locations
  useEffect(() => {
    if (!hasSearched.current) setLocations(initial);
  }, [initial]);

  // Load categories
  useEffect(() => {
    getCategories()
      .then(({ data }) => {
        setCategories(data);
      })
      .catch(() => {});
  }, []);

  // Search from URL query
  useEffect(() => {
    if (queryParam) {
      runSearch(queryParam);
    }
  }, [queryParam]);

  useEffect(() => () => {
    searchRequestId.current += 1;
  }, []);

  // Set destination from URL
  useEffect(() => {
    if (destinationParam) {
      setDestinationId(destinationParam);
      setSelectedMapLocationId(Number(destinationParam));
    }
  }, [destinationParam]);

  async function runSearch(value = query) {
    if (!value.trim()) {
      searchRequestId.current += 1;
      hasSearched.current = false;
      setIsSearching(false);
      setSearchError("");
      setLocations(initial);
      return;
    }

    const requestId = ++searchRequestId.current;
    hasSearched.current = true;
    setIsSearching(true);
    setSearchError("");
    try {
      const { data } = await searchLocations({
        query: value,
        category: category || null,
      });

      if (requestId !== searchRequestId.current) return;
      setLocations(data);

      toast.success(
        data.length
          ? `${data.length} location${data.length > 1 ? "s" : ""} found`
          : "No matching locations"
      );
    } catch {
      if (requestId === searchRequestId.current) {
        setSearchError("Search could not be completed. Check your connection and try again.");
      }
    } finally {
      if (requestId === searchRequestId.current) setIsSearching(false);
    }
  }

  const all = useMemo(() => {
    return initial.length ? initial : locations;
  }, [initial, locations]);

  function requestCurrentLocation() {
    const requestId = ++gpsRequestId.current;
    setGpsError("");
    setGpsStatus("loading");
    setRoute(null);

    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("This browser does not provide location access. Choose a campus start below.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requestId !== gpsRequestId.current) return;
        setGpsPosition({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        });
        setOriginMode("gps");
        setSourceId("");
        setRoute(null);
        setGpsStatus("ready");
        toast.success("Your current location is set as the start");
      },
      (locationError) => {
        if (requestId !== gpsRequestId.current) return;
        const messageByCode = {
          1: "Location permission was denied. Choose a campus starting point below.",
          2: "Your location could not be determined. Choose a campus starting point below.",
          3: "Location lookup took too long. Try again or choose a campus starting point below.",
        };
        const message = messageByCode[locationError.code] ||
          "Location access is unavailable. Choose a campus starting point below.";
        setGpsPosition(null);
        setOriginMode("manual");
        setGpsStatus("error");
        setGpsError(message);
        toast.error("Could not use your current location");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 }
    );
  }

  function chooseManualStart() {
    gpsRequestId.current += 1;
    setOriginMode("manual");
    setGpsPosition(null);
    setGpsStatus("idle");
    setGpsError("");
    setRoute(null);
    window.setTimeout(() => startSelectRef.current?.focus(), 0);
  }

  async function navigate() {
    const manualSource = originMode === "manual"
      ? all.find((x) => x.id === Number(sourceId))
      : null;
    const source = originMode === "gps" ? gpsPosition : manualSource;
    const destination = all.find(
      (x) => x.id === Number(destinationId)
    );

    if (
      !source ||
      !destination ||
      (manualSource && manualSource.id === destination.id)
    ) {
      return toast.error("Choose a start and a different destination");
    }

    if (
      !Number.isFinite(Number(source.latitude)) ||
      !Number.isFinite(Number(source.longitude)) ||
      !Number.isFinite(Number(destination.latitude)) ||
      !Number.isFinite(Number(destination.longitude))
    ) {
      return toast.error("One of these locations has invalid map coordinates");
    }

    setRoute(null);
    setIsRouting(true);
    try {
      const { data } = await createRoute({
        source: {
          latitude: source.latitude,
          longitude: source.longitude,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        destination_name: destination.name,
      });

      setRoute(data);
      setSelectedMapLocationId(destination.id);
      toast.success("Route generated successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to generate route"
      );
    } finally {
      setIsRouting(false);
    }
  }

  function formatDistance(meters) {
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      {/* Header */}
      <p className="eyebrow">DISCOVER YOUR CAMPUS</p>
      <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Campus Map</h1>

      <p className="muted-text mt-2">
        Find a location or plan a walking route between campus locations.
      </p>

      {/* Map & Route Planner */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {error && locations.length === 0 ? (
          <div className="map-card flex items-center justify-center p-4">
            <div role="alert" className="error-banner max-w-md p-5 text-center">
              <p>{error}</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-3 font-bold underline underline-offset-2">
                Retry loading locations
              </button>
            </div>
          </div>
        ) : loading ? (
          showLoading ? <MapLoadingSkeleton /> : <div className="map-card" aria-busy="true" />
        ) : (
          <CampusMap
            locations={locations}
            route={route?.route}
            selectedLocationId={selectedMapLocationId}
            onLocationSelect={setSelectedMapLocationId}
          />
        )}

        <aside className="surface-card h-fit p-5 sm:p-6">
          <p className="eyebrow !text-[0.68rem]">PLAN A WALK</p>
          <h2 className="mt-1 text-xl font-bold text-white">
            Plan Your Route
          </h2>

          {/* Route start: GPS is requested only after an explicit click. */}
          <label className="form-label mt-5 block">Start</label>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={requestCurrentLocation}
              disabled={gpsStatus === "loading" || isRouting}
              className="button-secondary inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-60"
            >
              <span aria-hidden="true">⌖</span>
              {gpsStatus === "loading" ? "Finding location…" : "Use my current location"}
            </button>
            {originMode === "gps" && (
              <button
                type="button"
                onClick={chooseManualStart}
                className="button-secondary min-h-11 px-3 py-2 text-sm"
              >
                Choose a campus start
              </button>
            )}
          </div>

          {originMode === "gps" && gpsPosition && (
            <p role="status" className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs leading-5 text-emerald-200">
              Using your current position as the start
              {Number.isFinite(gpsPosition.accuracy) && ` (GPS accuracy ±${Math.round(gpsPosition.accuracy)} m)`}.
            </p>
          )}

          {gpsStatus === "loading" && (
            <p role="status" className="muted-text mt-2 text-xs">Waiting for your device’s location permission…</p>
          )}

          {gpsStatus === "error" && (
            <div role="alert" className="error-banner mt-3 p-3 text-sm leading-5">
              <p>{gpsError}</p>
              <button
                type="button"
                onClick={chooseManualStart}
                className="mt-2 font-bold underline underline-offset-2"
              >
                Choose a starting point manually
              </button>
            </div>
          )}

          {originMode === "manual" && (
            <select
              ref={startSelectRef}
              aria-label="Choose starting location"
              className="site-input mt-3 p-3"
              disabled={loading}
              value={sourceId}
              onChange={(e) => {
                const value = e.target.value;
                setSourceId(value);
                setSelectedMapLocationId(value ? Number(value) : null);
                setRoute(null);
              }}
            >
              <option value="">Choose a campus starting point</option>
              {all.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          )}

          {/* Destination */}
          <label className="form-label mt-4 block">
            Destination
          </label>

          <select
            className="site-input mt-2 p-3"
            disabled={loading}
            value={destinationId}
            onChange={(e) => {
                const value = e.target.value;
                setDestinationId(value);
                setSelectedMapLocationId(value ? Number(value) : null);
              setRoute(null)
            }}
          >
            <option value="">
              Choose destination
            </option>

            {all.map((location) => (
              <option
                key={location.id}
                value={location.id}
              >
                {location.name}
              </option>
            ))}
          </select>

          {/* Navigate Button */}
          <button
            onClick={navigate}
            disabled={isRouting || gpsStatus === "loading" || loading}
            className="button-primary mt-4 min-h-11 w-full px-4 py-2"
          >
            {isRouting ? "Finding route…" : "Navigate"}
          </button>

          {/* Route Details */}
          {route && (
            <div className="mt-5 border-t border-white/10 pt-4">
              <h3 className="font-bold text-white">Walking route</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="metric-card p-3">
                  <p className="text-xs font-medium text-slate-400">Route distance</p>
                  <p className="accent-text mt-1 text-lg font-bold">
                    {formatDistance(route.distance_meters)}
                  </p>
                </div>
                <div className="metric-card p-3">
                  <p className="text-xs font-medium text-slate-400">Estimated walk</p>
                  <p className="accent-text mt-1 text-lg font-bold">
                    ~{route.walking_minutes} min
                  </p>
                </div>
              </div>
              <p className="muted-text mt-2 text-xs leading-5">
                Route uses the configured campus walking graph; walking time is an estimate at a typical pace.
              </p>

              <h4 className="mt-4 text-sm font-bold text-white">Directions</h4>
              <ol aria-label="Walking directions" className="mt-3 space-y-3">
                {route.directions.map((direction, index) => (
                  <li
                    key={`${index}-${direction}`}
                    className="route-step flex gap-3 text-sm text-slate-300"
                    style={{ "--step-index": index }}
                  >
                    <span className="accent-text flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rose-400/20 bg-rose-400/10 text-xs font-bold">
                      {index === route.directions.length - 1 ? "✓" : index + 1}
                    </span>
                    <span className="pt-0.5 leading-5">{direction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>
      </div>

      {/* Search & Filter */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) =>
            setQuery(e.target.value)
          }
          onKeyDown={(e) =>
            e.key === "Enter" && runSearch()
          }
          className="site-input px-4 py-2.5 sm:max-w-xs"
          disabled={loading}
          placeholder="Search locations"
        />

        <button
          onClick={() => runSearch()}
          disabled={isSearching || loading}
          className="button-primary min-h-11 px-5"
        >
          {isSearching ? "Searching…" : "Search"}
        </button>

        <select
          value={category}
          onChange={(e) =>
            location.assign(
              `/map?category=${e.target.value}`
            )
          }
          className="site-input px-4 py-2.5 sm:max-w-xs"
          disabled={loading}
        >
          <option value="">
            All categories
          </option>

          {categories.map((category) => (
            <option
              key={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Location Cards */}
      {searchError ? (
        <div role="alert" className="error-banner mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p>{searchError}</p>
          <button type="button" onClick={() => runSearch()} className="shrink-0 font-bold underline underline-offset-2">Retry search</button>
        </div>
      ) : loading ? (
        showLoading ? (
          <div role="status" aria-label="Loading campus locations" aria-busy="true" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => <LocationCardSkeleton key={index} />)}
          </div>
        ) : null
      ) : isSearching && showSearchLoading ? (
        <div role="status" aria-label={loading ? "Loading campus locations" : "Searching campus locations"} aria-busy="true" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <LocationCardSkeleton key={index} />)}
        </div>
      ) : error && !hasSearched.current ? null : locations.length === 0 ? (
        <p className="empty-state mt-6 p-5">No locations match this search. Try another name or category.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      )}
    </section>
  );
}
