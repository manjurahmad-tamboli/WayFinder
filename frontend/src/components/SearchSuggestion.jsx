import { ArrowUpRight, Layers3, MapPin } from "lucide-react";
import CategoryIcon from "./CategoryIcon";
import DistanceLabel from "./DistanceLabel";
import { getCategoryStyle } from "./categoryConfig";
export { formatDistance } from "../services/distanceUtils";

function HighlightedText({ text, query }) {
  const words = query.trim().split(/\s+/).filter((word) => word.length > 1);
  if (!words.length) return text;
  const expression = new RegExp(`(${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return text.split(expression).map((part, index) =>
    words.some((word) => part.toLowerCase() === word.toLowerCase())
      ? <mark key={`${part}-${index}`}>{part}</mark>
      : part,
  );
}

export function SearchSuggestion({ item, kind, query, active, onSelect, optionId }) {
  const isCategory = kind === "category";
  const category = isCategory ? item.name : item.category;
  const color = getCategoryStyle(category).color;
  return (
    <button
      id={optionId}
      type="button"
      role="option"
      aria-selected={active}
      className={`search-suggestion${active ? " is-active" : ""}`}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
    >
      <span className="search-suggestion-icon" style={{ "--category-color": color }}>
        {isCategory ? <Layers3 size={17} /> : <CategoryIcon category={category} size={17} />}
      </span>
      <span className="search-suggestion-copy">
        <strong><HighlightedText text={item.name} query={query} /></strong>
        <span>
          {isCategory ? `${item.location_count} campus places` : <><HighlightedText text={item.category} query={query} />{item.description ? ` · ${item.description}` : ""}</>}
        </span>
        {!isCategory && <DistanceLabel location={item} />}
      </span>
      <span className="search-suggestion-trailing" aria-hidden="true">
        {isCategory ? "Category" : <><MapPin size={14} /><ArrowUpRight size={14} /></>}
      </span>
    </button>
  );
}

