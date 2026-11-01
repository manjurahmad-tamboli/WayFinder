import { MapPinned, Navigation } from "lucide-react";
import { useState } from "react";
import CategoryIcon from "./CategoryIcon";
import { getCategoryStyle } from "./categoryConfig";
import { formatDistance } from "./SearchSuggestion";
import { getImageUrl } from "../services/api";

export default function SearchResultCard({ location, distanceMeters, onViewMap, onNavigate, navigating = false, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const style = getCategoryStyle(location.category);

  return (
    <article className={`nearby-result-card ${className}`.trim()}>
      <div className="nearby-result-main">
        {!imageFailed && location.image ? (
          <img
            className="nearby-result-image"
            src={getImageUrl(location.image)}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="nearby-result-image nearby-result-image-fallback" style={{ "--category-color": style.color }}>
            <CategoryIcon category={location.category} size={21} />
          </span>
        )}
        <div className="nearby-result-copy">
          <strong>{location.name}</strong>
          <span className="nearby-result-category" style={{ "--category-color": style.color }}>
            <CategoryIcon category={location.category} size={13} /> {location.category}
            {distanceMeters != null && <span className="nearby-distance">{formatDistance(distanceMeters)}</span>}
          </span>
          {location.description && <span className="nearby-result-description">{location.description}</span>}
        </div>
      </div>
      <div className="nearby-result-actions">
        <button type="button" className="nearby-action secondary-button" onClick={() => onViewMap(location)}>
          <MapPinned size={14} /> Map
        </button>
        <button type="button" className="nearby-action nearby-action-primary" onClick={() => onNavigate(location)} disabled={navigating}>
          <Navigation size={14} /> {navigating ? "Planning…" : "Navigate"}
        </button>
      </div>
    </article>
  );
}
