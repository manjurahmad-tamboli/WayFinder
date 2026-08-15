import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import CampusMap from "../components/CampusMap";
import Loader from "../components/Loader";
import LocationCard from "../components/LocationCard";

import useLocations from "../hooks/useLocations";
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
  const [route, setRoute] = useState(null);

  // Load initial locations
  useEffect(() => {
    setLocations(initial);
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

  // Set destination from URL
  useEffect(() => {
    if (destinationParam) {
      setDestinationId(destinationParam);
    }
  }, [destinationParam]);

  async function runSearch(value = query) {
    if (!value.trim()) {
      setLocations(initial);
      return;
    }

    try {
      const { data } = await searchLocations({
        query: value,
        category: category || null,
      });

      setLocations(data);

      toast.success(
        data.length
          ? `${data.length} location${data.length > 1 ? "s" : ""} found`
          : "No matching locations"
      );
    } catch {
      toast.error("Search could not be completed");
    }
  }

  const all = useMemo(() => {
    return initial.length ? initial : locations;
  }, [initial, locations]);

  async function navigate() {
    const source = all.find(
      (x) => x.id === Number(sourceId)
    );

    const destination = all.find(
      (x) => x.id === Number(destinationId)
    );

    if (
      !source ||
      !destination ||
      source.id === destination.id
    ) {
      return toast.error("Choose two different locations");
    }

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
      });

      setRoute(data);
      toast.success("Route generated successfully");
    } catch {
      toast.error("Unable to generate route");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4">
        <Loader />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Header */}
      <h1 className="text-3xl font-bold">Campus Map</h1>

      <p className="mt-1 text-slate-600">
        Find a location or create a simple walking route.
      </p>

      {error && (
        <p className="mt-4 text-red-700">
          {error}
        </p>
      )}

      {/* Map & Route Planner */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <CampusMap
          locations={locations}
          route={route?.route}
        />

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-bold">
            Plan Your Route
          </h2>

          {/* Source */}
          <label className="mt-4 block text-sm font-medium">
            Start
          </label>

          <select
            className="mt-1 w-full rounded-lg border p-2"
            value={sourceId}
            onChange={(e) =>
              setSourceId(e.target.value)
            }
          >
            <option value="">
              Choose source
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

          {/* Destination */}
          <label className="mt-4 block text-sm font-medium">
            Destination
          </label>

          <select
            className="mt-1 w-full rounded-lg border p-2"
            value={destinationId}
            onChange={(e) =>
              setDestinationId(e.target.value)
            }
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
            className="mt-4 w-full rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Navigate
          </button>

          {/* Route Details */}
          {route && (
            <div className="mt-5 border-t pt-4">
              <p className="font-semibold">
                {route.distance_meters} m · ~
                {route.walking_minutes} min walk
              </p>

              <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-600">
                {route.directions.map((direction) => (
                  <li key={direction}>
                    {direction}
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
          className="rounded-lg border px-4 py-2 sm:w-80"
          placeholder="Search locations"
        />

        <button
          onClick={() => runSearch()}
          className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-white"
        >
          Search
        </button>

        <select
          value={category}
          onChange={(e) =>
            location.assign(
              `/map?category=${e.target.value}`
            )
          }
          className="rounded-lg border px-4 py-2"
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
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => (
          <LocationCard
            key={location.id}
            location={location}
          />
        ))}
      </div>
    </section>
  );
}