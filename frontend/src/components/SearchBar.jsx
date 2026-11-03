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
      className="flex rounded-2xl border border-white/10 bg-[#17181b] p-1.5 shadow-2xl shadow-black/30"
    >
      <input
        className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-2.5 text-white placeholder:text-slate-500 outline-none"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search Library, Canteen, Hostel..."
        aria-label="Search campus"
      />

      <button
        type="submit"
        className="button-primary px-5 py-2.5"
      >
        Search
      </button>
    </form>
  );
}
