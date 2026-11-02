import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import CampusMap from "../components/CampusMap";
import CategoryIcon from "../components/CategoryIcon";
import Loader from "../components/Loader";
import LocationCard from "../components/LocationCard";
import Reveal from "../components/Reveal";
import SearchBar from "../components/SearchBar";
import useLocations from "../hooks/useLocations";
import { getCategories } from "../services/api";
import { getCategoryStyle } from "../components/categoryConfig";
import ErrorNotice from "../components/ErrorNotice";
import { getApiErrorMessage, isRequestCanceled } from "../services/apiErrors";

function RoutePreview() {
  return (
    <div className="hero-visual panel">
      <div className="preview-topline">
        <span className="live-dot" />
        <span>Campus route finder</span>
        <span className="preview-badge">WALKING</span>
      </div>
      <div className="preview-map" aria-label="Decorative campus path illustration">
        <span className="map-label map-label-one">CAMPUS PATH</span>
        <span className="map-label map-label-two">BUILDINGS</span>
        <svg viewBox="0 0 520 270" role="img" aria-hidden="true">
          <path className="map-grid-line" d="M0 55h520M0 135h520M0 215h520M80 0v270M200 0v270M320 0v270M440 0v270" />
          <path className="campus-route-shadow" d="M52 211 145 211 145 166 224 166 224 116 321 116 321 70 426 70" />
          <path className="campus-route-line" d="M52 211 145 211 145 166 224 166 224 116 321 116 321 70 426 70" />
          <circle className="route-point-start" cx="52" cy="211" r="9" />
          <circle className="route-point-end" cx="426" cy="70" r="9" />
          <circle className="route-waypoint" cx="145" cy="166" r="5" />
          <circle className="route-waypoint" cx="224" cy="116" r="5" />
          <circle className="route-waypoint" cx="321" cy="70" r="5" />
          <rect className="map-building" x="84" y="54" width="71" height="51" rx="8" />
          <rect className="map-building" x="263" y="184" width="88" height="46" rx="8" />
          <rect className="map-building" x="370" y="136" width="73" height="43" rx="8" />
        </svg>
        <span className="preview-point-label start-label">START</span>
        <span className="preview-point-label end-label">DESTINATION</span>
      </div>
      <div className="preview-footer">
        <div><span className="preview-number">01</span><span>Choose a place</span></div>
        <div><span className="preview-number">02</span><span>Get a walking route</span></div>
        <div><span className="preview-number">03</span><span>Arrive with confidence</span></div>
      </div>
    </div>
  );
}

export default function Home() {
  const { locations, loading, error, retry: retryLocations } = useLocations();
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesRetry, setCategoriesRetry] = useState(0);

  useEffect(() => {
    toast.success("Welcome to WayFinder!");
  }, []);

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

  return (
    <>
      <section className="home-hero">
        <div className="hero-content hero-grid">
          <div className="hero-copy-block">
            <p className="hero-kicker">Campus navigation guide</p>
            <h1 className="hero-title">Your campus, <span>within reach.</span></h1>
            <p className="hero-copy">
              Find the places that matter, explore the map, and follow a clear walking route to your destination.
            </p>
            <div className="hero-search"><SearchBar /></div>
            <div className="hero-meta">
              <span className="meta-pill"><strong>{locations.length || "—"}</strong> campus places</span>
              <span className="meta-pill"><strong>{categories.length || "—"}</strong> useful categories</span>
              <span className="meta-pill">Shortest paths with Dijkstra</span>
            </div>
          </div>
          <RoutePreview />
        </div>
      </section>

      <Reveal as="section" className="page-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Get your bearings</p>
            <h2 className="section-title">Explore the campus</h2>
            <p className="section-copy">Select a marker to see details, then plan your route.</p>
          </div>
          <Link to="/map" className="inline-link">Open full map <span aria-hidden="true">↗</span></Link>
        </div>
        {loading ? <Loader /> : error ? <ErrorNotice message={error} onRetry={retryLocations} /> : <CampusMap locations={locations} />}
      </Reveal>

      <Reveal as="section" className="page-section section-categories" delay={60}>
        <div className="section-head">
          <div>
            <p className="eyebrow">Browse with ease</p>
            <h2 className="section-title">Find the right category</h2>
          </div>
        </div>
        {categoriesError ? <ErrorNotice message={categoriesError} onRetry={() => setCategoriesRetry((count) => count + 1)} /> : <div className="category-grid">
          {categories.map((category) => (
            <Link key={category.id} to={`/map?category=${encodeURIComponent(category.name)}`} className="category-card">
              <span
                className="category-icon"
                style={{ "--category-color": getCategoryStyle(category.name).color }}
              >
                <CategoryIcon category={category.name} size={20} />
              </span>
              <span className="category-name">{category.name}</span>
            </Link>
          ))}
        </div>}
      </Reveal>

      <Reveal as="section" className="page-section" delay={100}>
        <div className="section-head">
          <div>
            <p className="eyebrow">Worth knowing</p>
            <h2 className="section-title">Popular locations</h2>
            <p className="section-copy">Explore the places visitors look for most.</p>
          </div>
        </div>
        {loading ? <Loader /> : error ? <p className="empty-state">Popular locations are unavailable until the campus data connection is restored.</p> : (
          <div className="location-grid">
            {locations.slice(0, 4).map((location) => <LocationCard key={location.id} location={location} />)}
          </div>
        )}
      </Reveal>
    </>
  );
}
