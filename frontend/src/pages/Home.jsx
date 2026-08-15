import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import CampusMap from "../components/CampusMap";
import Loader from "../components/Loader";
import LocationCard from "../components/LocationCard";
import SearchBar from "../components/SearchBar";

import useLocations from "../hooks/useLocations";
import { getCategories } from "../services/api";

const icons = {
  Academic: "🎓",
  Hostel: "🏠",
  Food: "🍽️",
  Administration: "🏛️",
  Sports: "⚽",
  Facilities: "🧭",
};

export default function Home() {
  const { locations, loading, error } = useLocations();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    toast.success("Welcome to WayFinder!");

    getCategories()
      .then(({ data }) => {
        setCategories(data);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-500 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl text-center">
          <p className="mb-3 font-semibold text-blue-100">
            CAMPUS NAVIGATION GUIDE
          </p>

          <h1 className="text-4xl font-extrabold sm:text-5xl">
            Find your way around campus.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            Search buildings, explore the map, and get simple walking
            directions in seconds.
          </p>

          <div className="mx-auto mt-7 max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Campus Map Section */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Explore the campus</h2>
            <p className="text-slate-600">
              Click a marker to discover a place.
            </p>
          </div>

          <Link
            to="/map"
            className="text-sm font-semibold text-blue-700"
          >
            Open full map →
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <p className="rounded-xl bg-red-50 p-4 text-red-700">
            {error}
          </p>
        ) : (
          <CampusMap locations={locations} />
        )}
      </section>

      {/* Categories Section */}
      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold">
            Browse by category
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/map?category=${category.name}`}
                className="rounded-2xl border border-slate-100 p-5 text-center shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                <span className="text-2xl">
                  {icons[category.name] || "📍"}
                </span>

                <p className="mt-2 font-semibold">
                  {category.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Locations Section */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold">
          Popular locations
        </h2>

        <p className="mt-1 text-slate-600">
          The places visitors search for most often.
        </p>

        {loading ? (
          <Loader />
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {locations.slice(0, 4).map((location) => (
              <LocationCard
                key={location.id}
                location={location}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}