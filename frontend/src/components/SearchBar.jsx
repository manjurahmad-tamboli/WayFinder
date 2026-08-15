import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();

    if (query.trim()) {
      navigate(`/map?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex rounded-xl bg-white p-1.5 shadow-lg"
    >
      <input
        className="min-w-0 flex-1 rounded-lg px-4 py-2 text-slate-900 placeholder:text-slate-400 outline-none"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Library, Canteen, Hostel..."
        aria-label="Search campus"
      />

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
      >
        Search
      </button>
    </form>
  );
}