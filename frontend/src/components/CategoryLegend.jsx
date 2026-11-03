import {
  LOCATION_CATEGORY_LIST,
  normalizeCategoryName,
} from "../data/locationCategories";

export default function CategoryLegend({
  selectedCategories,
  onToggleCategory,
  onSelectAll,
  onClearAll,
}) {
  return (
    <aside className="map-category-legend" aria-label="Map category legend">
      <h3 className="map-category-legend-title">MAP KEY</h3>
      <ul className="map-category-legend-list">
        {LOCATION_CATEGORY_LIST.map(({ label, color, Icon }) => {
          const isSelected = selectedCategories.has(normalizeCategoryName(label));
          return (
            <li key={label}>
              <button
                type="button"
                className={`map-category-legend-item ${isSelected ? "is-selected" : "is-unselected"}`}
                style={{ "--category-color": isSelected ? color : "#85858D" }}
                aria-pressed={isSelected}
                onClick={() => onToggleCategory(label)}
              >
                <Icon size={16} strokeWidth={2.2} aria-hidden="true" />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="map-category-legend-actions">
        <button type="button" onClick={onSelectAll}>Select all</button>
        <button type="button" onClick={onClearAll}>Clear all</button>
      </div>
    </aside>
  );
}
