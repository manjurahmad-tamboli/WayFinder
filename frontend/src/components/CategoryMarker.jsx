import { useMemo } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Link } from "react-router-dom";
import { Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";

import { getLocationCategoryConfig } from "../data/locationCategories";

function createCategoryIcon(category, selected) {
  const { Icon, color } = getLocationCategoryConfig(category);
  const svg = renderToStaticMarkup(
    <Icon size={19} strokeWidth={2.25} aria-hidden="true" />
  );
  const selectedClass = selected ? " category-marker-selected" : "";

  return L.divIcon({
    className: "category-marker-host",
    html: `<span class="category-marker-bubble${selectedClass}" style="--marker-color:${color}">${svg}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 41],
    popupAnchor: [0, -39],
    tooltipAnchor: [0, -35],
  });
}

export default function CategoryMarker({ location, selected = false, onSelect }) {
  const position = [Number(location.latitude), Number(location.longitude)];
  const category = getLocationCategoryConfig(location.category);
  const icon = useMemo(
    () => createCategoryIcon(location.category, selected),
    [location.category, selected]
  );

  return (
    <Marker
      position={position}
      icon={icon}
      title={location.name}
      riseOnHover
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect?.(location.id) }}
    >
      <Tooltip direction="top" offset={[0, -9]} opacity={0.98}>
        {location.name}
      </Tooltip>
      <Popup>
        <div className="map-popup-location">
          <strong>{location.name}</strong>
          <span style={{ color: category.color }}>{location.category || category.label}</span>
          <Link to={`/locations/${location.id}`}>View details</Link>
        </div>
      </Popup>
    </Marker>
  );
}
