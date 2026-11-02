import { useEffect, useMemo } from "react";
import { Heart, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Loader from "../components/Loader";
import Reveal from "../components/Reveal";
import SearchResultCard from "../components/SearchResultCard";
import useLocations from "../hooks/useLocations";
import { useFavorites } from "../contexts/FavoritesContext";
import { useMapActions } from "../contexts/MapActionContext";
import ErrorNotice from "../components/ErrorNotice";

export default function Favorites() {
  const navigate = useNavigate();
  const { dispatchMapAction } = useMapActions();
  const { favoriteIds, pruneFavorites } = useFavorites();
  const { locations, loading, error, retry } = useLocations();

  useEffect(() => {
    if (!loading && !error) pruneFavorites(locations.map((location) => location.id));
  }, [favoriteIds, loading, error, locations, pruneFavorites]);

  const savedLocations = useMemo(
    () => locations.filter((location) => favoriteIds.has(Number(location.id))),
    [favoriteIds, locations],
  );

  function showOnMap(location) {
    dispatchMapAction({ type: "show_location", location_id: location.id });
    navigate(`/map?focus=${location.id}`);
  }

  function navigateTo(location) {
    dispatchMapAction({ type: "show_location", location_id: location.id });
    navigate(`/map?destination=${location.id}`);
  }

  return (
    <section className="page-wrap favorites-page">
      <div className="section-head favorites-heading">
        <div>
          <p className="eyebrow">Your campus shortlist</p>
          <h1 className="page-title">Favorites</h1>
          <p className="page-lead">Keep the places you visit most close at hand.</p>
        </div>
        {favoriteIds.size > 0 && <span className="meta-pill favorites-count"><Heart size={14} fill="currentColor" /> {favoriteIds.size} saved</span>}
      </div>

      {favoriteIds.size === 0 ? (
        <div className="favorites-empty panel">
          <span className="favorites-empty-icon"><Heart size={25} /></span>
          <h2>No favorites yet</h2>
          <p>Tap the heart on any place card, search result, map marker, or AI result to save it here.</p>
          <Link className="primary-button mt-3 px-5 py-3" to="/map"><MapPin size={16} /> Explore the campus</Link>
        </div>
      ) : error ? (
        <ErrorNotice message={error} onRetry={retry} />
      ) : loading ? (
        <Loader />
      ) : savedLocations.length ? (
        <Reveal className="search-directory-grid">
          {savedLocations.map((location) => (
            <SearchResultCard
              key={location.id}
              location={location}
              onViewMap={showOnMap}
              onNavigate={navigateTo}
              className="search-directory-card"
            />
          ))}
        </Reveal>
      ) : (
        <div className="favorites-empty panel">
          <span className="favorites-empty-icon"><Heart size={25} /></span>
          <h2>Those places are no longer available</h2>
          <p>WayFinder removed saved IDs that no longer match a campus location.</p>
          <Link className="primary-button mt-3 px-5 py-3" to="/map"><MapPin size={16} /> Browse current locations</Link>
        </div>
      )}
    </section>
  );
}
