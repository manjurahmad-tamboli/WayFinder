import { Heart } from "lucide-react";
import { useFavorites } from "../contexts/FavoritesContext";

export default function FavoriteButton({ location, locationId, className = "", showLabel = false, size = 18 }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const id = location?.id ?? locationId;
  const active = isFavorite(id);
  const label = active ? "Remove from favorites" : "Add to favorites";

  return (
    <button
      type="button"
      className={`favorite-button${active ? " is-favorite" : ""}${showLabel ? " has-label" : ""} ${className}`.trim()}
      aria-label={`${label}${location?.name ? `: ${location.name}` : ""}`}
      aria-pressed={active}
      title={label}
      onClick={(event) => { event.stopPropagation(); toggleFavorite(id); }}
    >
      <Heart size={size} strokeWidth={2} fill={active ? "currentColor" : "none"} aria-hidden="true" />
      {showLabel && <span>{active ? "Saved" : "Save place"}</span>}
    </button>
  );
}
