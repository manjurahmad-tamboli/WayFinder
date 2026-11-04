import { useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";

import CategoryIcon from "./CategoryIcon";
import { getCategoryStyle } from "./categoryConfig";
import { getLocationCategories, normalizeCategoryKey } from "./categoryUtils";

export default function CategoryLegend({
  locations = [],
  selectedCategories,
  onToggleCategory,
  onSelectAll,
  onClearAll,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const categories = getLocationCategories(locations);
  const selectedCount = categories.filter((category) =>
    selectedCategories.has(normalizeCategoryKey(category)),
  ).length;

  return (
    <aside
      className={"category-map-legend " + (isExpanded ? "is-expanded" : "is-minimized")}
      aria-label="Map filter panel"
    >
      <div className="category-map-expanded" aria-hidden={!isExpanded}>
        <div className="category-map-legend-header flex items-center justify-between gap-2">
          <p className="category-map-legend-title">Map Filter</p>
          <div className="category-map-header-actions flex items-center gap-2">
            <span className="category-map-legend-count" aria-live="polite">
              <span className="category-map-status-dot" aria-hidden="true" />
              {selectedCount}/{categories.length}
            </span>
            <button
              type="button"
              className="category-map-minimize flex items-center justify-center"
              aria-label="Minimize map filters"
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded(false)}
              tabIndex={isExpanded ? 0 : -1}
            >
              <ChevronUp size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <ul className="category-map-legend-list">
          {categories.map((category) => {
            const { color } = getCategoryStyle(category);
            const selected = selectedCategories.has(normalizeCategoryKey(category));
            return (
              <li key={category}>
                <button
                  type="button"
                  className={"category-map-legend-item" + (selected ? "" : " is-unselected")}
                  style={{ "--marker-color": color }}
                  aria-pressed={selected}
                  onClick={() => onToggleCategory(category)}
                  tabIndex={isExpanded ? 0 : -1}
                >
                  <span className="category-map-legend-icon">
                    <CategoryIcon category={category} size={15} strokeWidth={2.2} />
                  </span>
                  <span className="category-map-legend-name">{category}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="category-map-legend-actions flex items-center justify-between gap-2">
          <button type="button" onClick={onSelectAll} tabIndex={isExpanded ? 0 : -1}>Select All</button>
          <button type="button" onClick={onClearAll} tabIndex={isExpanded ? 0 : -1}>Clear All</button>
        </div>
      </div>
      <button
        type="button"
        className="category-map-collapsed flex items-center gap-2"
        aria-hidden={isExpanded}
        aria-label={"Expand map filters, " + selectedCount + " of " + categories.length + " categories selected"}
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded(true)}
        tabIndex={isExpanded ? -1 : 0}
      >
        <SlidersHorizontal size={17} aria-hidden="true" />
        <span className="category-map-collapsed-label">Filters</span>
        <span className="category-map-collapsed-count">{selectedCount}/{categories.length}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
    </aside>
  );
}
