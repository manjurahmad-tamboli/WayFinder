import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocateFixed, LoaderCircle, Search, X } from "lucide-react";
import toast from "react-hot-toast";

import NearbyDiscovery from "./NearbyDiscovery";
import { SearchSuggestion } from "./SearchSuggestion";
import { useMapActions } from "../contexts/MapActionContext";
import { getLocationAutocomplete } from "../services/api";

export default function SearchBar({
  value,
  onChange,
  onSearch,
  initialQuery = "",
  placeholder = "Search locations, buildings, categories…",
  compact = false,
}) {
  const navigate = useNavigate();
  const { dispatchMapAction } = useMapActions();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [draft, setDraft] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState({ locations: [], categories: [] });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryCount, setRetryCount] = useState(0);
  const query = value === undefined ? draft : value;
  const options = useMemo(() => [
    ...suggestions.locations.map((item) => ({ kind: "location", item })),
    ...suggestions.categories.map((item) => ({ kind: "category", item })),
  ], [suggestions]);

  useEffect(() => {
    if (value === undefined) setDraft(initialQuery);
  }, [initialQuery, value]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setDropdownOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const searchText = query.trim();
    if (!dropdownOpen || !searchText) {
      setSuggestions({ locations: [], categories: [] });
      setLoading(false);
      setSuggestionError("");
      return undefined;
    }

    const controller = new AbortController();
    setSuggestions({ locations: [], categories: [] });
    setLoading(true);
    setSuggestionError("");
    setActiveIndex(-1);
    const timer = window.setTimeout(async () => {
      try {
        const { data } = await getLocationAutocomplete(searchText, { signal: controller.signal, limit: 8 });
        if (!controller.signal.aborted) setSuggestions({ locations: data.locations || [], categories: data.categories || [] });
      } catch (error) {
        if (!controller.signal.aborted && error.code !== "ERR_CANCELED") {
          setSuggestionError("Suggestions are temporarily unavailable.");
          setSuggestions({ locations: [], categories: [] });
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [dropdownOpen, query, retryCount]);

  function changeQuery(nextValue) {
    if (value === undefined) setDraft(nextValue);
    onChange?.(nextValue);
    setDropdownOpen(true);
    setNearbyOpen(false);
  }

  function submitSearch(event) {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      toast.error("Enter a place or category to search");
      inputRef.current?.focus();
      return;
    }
    setDropdownOpen(false);
    setActiveIndex(-1);
    if (onSearch) {
      onSearch(cleanQuery);
    } else {
      toast.success("Searching campus locations");
      navigate(`/map?q=${encodeURIComponent(cleanQuery)}`);
    }
  }

  function selectSuggestion(option) {
    const { item, kind } = option;
    if (value === undefined) setDraft(item.name);
    onChange?.(item.name);
    setDropdownOpen(false);
    setNearbyOpen(false);
    setActiveIndex(-1);
    if (kind === "category") {
      dispatchMapAction({ type: "filter_category", category: item.name });
      navigate(`/map?category=${encodeURIComponent(item.name)}`);
      toast.success(`${item.name} locations selected`);
      return;
    }
    dispatchMapAction({ type: "show_location", location_id: item.id });
    navigate(`/map?focus=${item.id}`);
    toast.success(`${item.name} found`);
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown" && options.length) {
      event.preventDefault();
      setDropdownOpen(true);
      setActiveIndex((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === "ArrowUp" && options.length) {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && activeOption) {
      event.preventDefault();
      selectSuggestion(activeOption);
    } else if (event.key === "Escape") {
      setDropdownOpen(false);
      setActiveIndex(-1);
    }
  }

  const activeOption = options[activeIndex];

  return (
    <div ref={rootRef} className={`universal-search-root${compact ? " is-compact" : ""}`}>
      <form className="search-form universal-search-form" role="search" onSubmit={submitSearch}>
        <span className="search-symbol" aria-hidden="true"><Search size={19} /></span>
        <input
          ref={inputRef}
          className="search-input"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search campus locations and categories"
          aria-autocomplete="list"
          aria-expanded={dropdownOpen && Boolean(query.trim())}
          aria-controls="wayfinder-search-options"
          aria-activedescendant={activeOption ? `wayfinder-search-option-${activeIndex}` : undefined}
          autoComplete="off"
        />
        {query && <button className="search-clear-button" type="button" aria-label="Clear search" onClick={() => { changeQuery(""); inputRef.current?.focus(); }}><X size={17} /></button>}
        {loading && <LoaderCircle className="search-loading-icon" size={18} aria-label="Loading suggestions" />}
        <button
          className={`nearby-toggle-button${nearbyOpen ? " is-active" : ""}`}
          type="button"
          aria-expanded={nearbyOpen}
          onClick={() => { setNearbyOpen((open) => !open); setDropdownOpen(false); setActiveIndex(-1); }}
          title="Discover nearby campus places"
        >
          <LocateFixed size={17} /><span>Nearby</span>
        </button>
        <button type="submit" className="primary-button search-submit">Search</button>
      </form>

      {dropdownOpen && Boolean(query.trim()) && (
        <div className="search-suggestions" id="wayfinder-search-options" role="listbox" aria-label="Search suggestions">
          {loading && <div className="search-suggestion-status" role="status"><span className="search-suggestion-spinner" /> Searching campus records…</div>}
          {!loading && suggestionError && (
            <div className="search-suggestion-status is-error" role="alert">
              <span>{suggestionError}</span><button type="button" onClick={() => setRetryCount((count) => count + 1)}>Retry</button>
            </div>
          )}
          {!loading && !suggestionError && options.length === 0 && (
            <div className="search-suggestion-status">No matching campus records yet. Try another keyword.</div>
          )}
          {!loading && suggestions.locations.length > 0 && (
            <>
              <p className="search-suggestion-heading">MATCHING LOCATIONS</p>
              {suggestions.locations.map((item) => {
                const index = options.findIndex((option) => option.kind === "location" && option.item.id === item.id);
                return <SearchSuggestion key={`location-${item.id}`} item={item} kind="location" query={query} active={activeIndex === index} optionId={`wayfinder-search-option-${index}`} onSelect={() => selectSuggestion({ kind: "location", item })} />;
              })}
            </>
          )}
          {!loading && suggestions.categories.length > 0 && (
            <>
              <p className="search-suggestion-heading">MATCHING CATEGORIES</p>
              {suggestions.categories.map((item) => {
                const index = options.findIndex((option) => option.kind === "category" && option.item.id === item.id);
                return <SearchSuggestion key={`category-${item.id}`} item={item} kind="category" query={query} active={activeIndex === index} optionId={`wayfinder-search-option-${index}`} onSelect={() => selectSuggestion({ kind: "category", item })} />;
              })}
            </>
          )}
          {!loading && options.length > 0 && <p className="search-keyboard-hint">Use ↑ ↓ to select · Enter to open · Esc to close</p>}
        </div>
      )}

      {nearbyOpen && <NearbyDiscovery query={query} onClose={() => setNearbyOpen(false)} />}
    </div>
  );
}
