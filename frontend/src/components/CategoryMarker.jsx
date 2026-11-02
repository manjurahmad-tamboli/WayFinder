import { useEffect, useMemo, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Link } from "react-router-dom";
import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";

import CategoryIcon from "./CategoryIcon";
import { getCategoryStyle } from "./categoryConfig";
import FavoriteButton from "./FavoriteButton";
import ShareLocationButton from "./ShareLocationButton";

export default function CategoryMarker({ location, selected = false, openPopup = false, onSelect }) {
  const markerRef = useRef(null);
  const icon = useMemo(() => {
    const { color } = getCategoryStyle(location.category);
    const iconMarkup = renderToStaticMarkup(
      <CategoryIcon category={location.category} size={19} strokeWidth={2.2} />,
    );

    return L.divIcon({
      className: "category-marker-shell",
      html: '<span class="category-marker' + (selected ? ' category-marker-selected' : '') + '" style="--marker-color:' + color + '" aria-hidden="true">' + iconMarkup + '</span>',
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -20],
    });
  }, [location.category, selected]);

  useEffect(() => {
    if (openPopup) markerRef.current?.openPopup();
  }, [openPopup]);

  return (
    <Marker
      ref={markerRef}
      position={[Number(location.latitude), Number(location.longitude)]}
      icon={icon}
      zIndexOffset={selected ? 700 : 0}
      eventHandlers={{ click: () => onSelect?.(location.id) }}
    >
      <Tooltip direction="top" offset={[0, -17]} opacity={1} className="category-marker-tooltip">
        {location.name}
      </Tooltip>
      <Popup>
        <strong>{location.name}</strong>
        <br />
        <span>{location.category}</span>
        {location.description && <p className="map-popup-description">{location.description}</p>}
        {location.opening_hours && <p className="map-popup-hours">{location.opening_hours}</p>}
        <div className="map-popup-actions">
          <FavoriteButton location={location} className="map-popup-favorite" />
          <ShareLocationButton location={location} className="map-popup-share" />
          <Link to={"/locations/" + location.id} className="map-popup-link">View details</Link>
        </div>
      </Popup>
    </Marker>
  );
}
