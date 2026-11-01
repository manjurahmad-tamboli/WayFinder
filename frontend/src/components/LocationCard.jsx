import { Link } from "react-router-dom";
import { getImageUrl } from "../services/api";

export default function LocationCard({ location }) {
  return (
    <article className="location-card">
      <img className="location-image" src={getImageUrl(location.image)} alt={location.name} loading="lazy" />
      <div className="location-body">
        <p className="location-category">{location.category}</p>
        <h3 className="location-name">{location.name}</h3>
        <p className="location-description">{location.description}</p>
        <Link className="location-link" to={`/locations/${location.id}`}>
          Explore location <span className="ml-1" aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
