import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import CampusMap from "../components/CampusMap";
import LocationCard from "../components/LocationCard";
import { LocationCardSkeleton, MapLoadingSkeleton, SkeletonBlock } from "../components/Skeletons";
import SearchBar from "../components/SearchBar";
import { getLocationCategoryConfig } from "../data/locationCategories";

import useLocations from "../hooks/useLocations";
import useDelayedLoading from "../hooks/useDelayedLoading";
import { getCategories } from "../services/api";

export default function Home() {
  const { locations, loading, error } = useLocations();
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const showLoading = useDelayedLoading(loading);
  const showCategoriesLoading = useDelayedLoading(categoriesLoading);

  useEffect(() => {
    toast.success("Welcome to WayFinder!");

    getCategories()
      .then(({ data }) => {
        setCategories(data);
      })
      .catch(() => {})
      .finally(() => setCategoriesLoading(false));
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section px-4 py-16 text-white sm:py-20">
        <div className="hero-content relative z-10 mx-auto max-w-6xl text-center">
          <p className="eyebrow mb-4">
            CAMPUS NAVIGATION GUIDE
          </p>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Find your way around <span className="accent-text">campus.</span>
          </h1>

          <p className="silver-text mx-auto mt-5 max-w-2xl leading-7">
            Search buildings, explore the map, and get simple walking
            directions in seconds.
          </p>

          <div className="mx-auto mt-7 max-w-2xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Campus Map Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">THE CAMPUS, AT A GLANCE</p>
            <h2 className="text-2xl font-bold text-white">Explore the campus</h2>
            <p className="muted-text mt-1">
              Click a marker to discover a place.
            </p>
          </div>

          <Link
            to="/map"
            className="accent-text shrink-0 text-sm font-bold hover:text-white"
          >
            Open full map →
          </Link>
        </div>

        {error ? (
          <p className="error-banner p-4">{error}</p>
        ) : loading ? (
          showLoading ? <MapLoadingSkeleton /> : <div role="status" aria-label="Loading campus map" aria-busy="true" className="map-card" />
        ) : (
          <CampusMap locations={locations} />
        )}
      </section>

      {/* Categories Section */}
      <section className="border-y border-white/5 bg-[#101113] px-4 py-12 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow mb-2">EXPLORE YOUR WAY</p>
          <h2 className="text-2xl font-bold text-white">
            Browse by category
          </h2>

          <div
            className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
            role={categoriesLoading && showCategoriesLoading ? "status" : undefined}
            aria-label={categoriesLoading && showCategoriesLoading ? "Loading categories" : undefined}
            aria-busy={categoriesLoading || undefined}
          >
            {categoriesLoading && showCategoriesLoading ? Array.from({ length: 6 }, (_, index) => (
              <div key={index} aria-hidden="true" className="category-card p-4 text-center sm:p-5">
                <SkeletonBlock className="mx-auto h-[52px] w-[52px] rounded-2xl" />
                <SkeletonBlock className="mx-auto mt-3 h-4 w-20" />
              </div>
            )) : !categoriesLoading && categories.map((category) => {
              const { Icon, color } = getLocationCategoryConfig(category.name);
              return (
                <Link
                  key={category.id}
                  to={`/map?category=${encodeURIComponent(category.name)}`}
                  className="category-card p-4 text-center sm:p-5"
                >
                  <span
                    className="category-icon"
                    style={{
                      color,
                      backgroundColor: `${color}18`,
                      borderColor: `${color}55`,
                    }}
                  >
                    <Icon size={25} strokeWidth={2.1} aria-hidden="true" />
                  </span>
                  <p className="mt-3 font-semibold text-white">
                    {category.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Locations Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
        <p className="eyebrow mb-2">QUICK ACCESS</p>
        <h2 className="text-2xl font-bold text-white">
          Popular locations
        </h2>

        <p className="muted-text mt-1">
          The places visitors search for most often.
        </p>

        {loading ? (
          showLoading ? (
            <div role="status" aria-label="Loading popular locations" aria-busy="true" className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <LocationCardSkeleton key={index} />)}
            </div>
          ) : null
        ) : error ? (
          <p className="error-banner mt-5 p-4">Popular locations could not be loaded.</p>
        ) : locations.length === 0 ? (
          <p className="empty-state mt-5 p-5">No campus locations are available yet.</p>
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
