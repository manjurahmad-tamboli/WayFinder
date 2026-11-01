import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function submit(event) {
    event.preventDefault();
    if (query.trim()) navigate(`/map?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form onSubmit={submit} className="search-form">
      <span className="search-symbol" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="10.8" cy="10.8" r="6.7" stroke="currentColor" strokeWidth="1.8" />
          <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <input
        className="search-input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Library, Canteen, Hostel..."
        aria-label="Search campus locations"
      />
      <button type="submit" className="primary-button search-submit">Search</button>
    </form>
  );
}
