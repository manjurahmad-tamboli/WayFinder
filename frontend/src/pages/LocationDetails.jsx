import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import CampusMap from "../components/CampusMap";
import Loader from "../components/Loader";
import Reveal from "../components/Reveal";
import { getImageUrl, getLocation } from "../services/api";

export default function LocationDetails() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLocation(null);
    setError("");
    getLocation(id).then(({ data }) => setLocation(data)).catch(() => setError("This location could not be found."));
  }, [id]);

  if (error) {
    return (
      <section className="error-state">
        <p className="eyebrow">Location unavailable</p>
        <h1>{error}</h1>
        <Link className="primary-button mt-4 px-5 py-3" to="/map">Back to map</Link>
      </section>
    );
  }

  if (!location) return <div className="page-wrap"><Loader /></div>;

  return (
    <section className="page-wrap">
      <Link className="inline-link" to="/map">← Back to campus map</Link>
      <Reveal as="article" className="location-detail mt-5">
        <img className="detail-image" src={getImageUrl(location.image)} alt={location.name} />
        <div className="detail-body">
          <p className="eyebrow">{location.category}</p>
          <h1 className="page-title">{location.name}</h1>
          <p className="page-lead">{location.description}</p>
          <div className="detail-meta"><span className="detail-meta-icon">◷</span><span><strong>Opening hours</strong><br />{location.opening_hours}</span></div>
          <div className="detail-meta"><span className="detail-meta-icon">⌖</span><span><strong>Coordinates</strong><br />{Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}</span></div>
          <Link
            to={`/map?destination=${location.id}`}
            onClick={() => toast.success("Choose a starting point to navigate")}
            className="primary-button mt-7 px-5 py-3"
          >
            Navigate here <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </Reveal>
      <Reveal className="detail-map" delay={80}><CampusMap locations={[location]} /></Reveal>
    </section>
  );
}
