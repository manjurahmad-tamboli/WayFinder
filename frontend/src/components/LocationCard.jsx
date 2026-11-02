import { Link } from "react-router-dom";
import { getImageUrl } from "../services/api";
import FavoriteButton from "./FavoriteButton";
import ShareLocationButton from "./ShareLocationButton";
import DistanceLabel from "./DistanceLabel";

export default function LocationCard({ location }) {
  return (
    <article className="location-card">
      <div className="location-image-frame">
        <img className="location-image" src={getImageUrl(location.image)} alt={location.name} loading="lazy" />
        <FavoriteButton location={location} className="favorite-button-overlay" />
        <ShareLocationButton location={location} className="share-location-overlay" />
      </div>
      <div className="location-body">
        <p className="location-category">{location.category}</p>
        <h3 className="location-name">{location.name}</h3>
        <p className="location-description">{location.description}</p>
        <DistanceLabel location={location} />
        <Link className="location-link" to={`/locations/${location.id}`}>
          Explore location <span className="ml-1" aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
