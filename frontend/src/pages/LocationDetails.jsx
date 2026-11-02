import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import CampusMap from "../components/CampusMap";
import Loader from "../components/Loader";
import Reveal from "../components/Reveal";
import { getImageUrl, getLocation } from "../services/api";
import FavoriteButton from "../components/FavoriteButton";
import ShareLocationButton from "../components/ShareLocationButton";
import DistanceLabel from "../components/DistanceLabel";
import ErrorNotice from "../components/ErrorNotice";
import { getApiErrorMessage, isRequestCanceled } from "../services/apiErrors";
import { isValidCoordinates } from "../services/distanceUtils";

export default function LocationDetails() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLocation(null);
    setError("");
    setNotFound(false);
    getLocation(id, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setLocation(data); })
      .catch((requestError) => {
        if (!controller.signal.aborted && !isRequestCanceled(requestError)) {
          setError(getApiErrorMessage(requestError, "This location could not be loaded."));
          setNotFound(requestError.response?.status === 404);
        }
      });
    return () => controller.abort();
  }, [id, retryCount]);

  if (error) {
    return (
      <section className="error-state">
        <p className="eyebrow">Location details</p>
        <h1 className="page-title">We couldn’t load this place.</h1>
        <ErrorNotice message={error} onRetry={notFound ? null : () => setRetryCount((count) => count + 1)} />
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
          <DistanceLabel location={location} showOrigin />
          <div className="detail-meta"><span className="detail-meta-icon">◷</span><span><strong>Opening hours</strong><br />{location.opening_hours}</span></div>
          <div className="detail-meta"><span className="detail-meta-icon">⌖</span><span><strong>Coordinates</strong><br />{isValidCoordinates(location.latitude, location.longitude) ? `${Number(location.latitude).toFixed(5)}, ${Number(location.longitude).toFixed(5)}` : "Not available"}</span></div>
          <div className="location-detail-actions">
            <FavoriteButton location={location} showLabel className="detail-favorite-button" />
            <ShareLocationButton location={location} showLabel className="detail-share-button" />
            <Link
              to={`/map?destination=${location.id}`}
              onClick={() => toast.success("Choose a starting point to navigate")}
              className="primary-button px-5 py-3"
            >
              Navigate here <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </Reveal>
      <Reveal className="detail-map" delay={80}><CampusMap locations={[location]} /></Reveal>
    </section>
  );
}
