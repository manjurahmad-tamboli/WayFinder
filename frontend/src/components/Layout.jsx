import { NavLink } from "react-router-dom";
import { Heart } from "lucide-react";
import { useFavorites } from "../contexts/FavoritesContext";

const navClass = ({ isActive }) => `nav-link${isActive ? " active" : ""}`;

function PinMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M19 10.2c0 5.1-7 11.2-7 11.2S5 15.3 5 10.2a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function Navbar() {
  const { favoriteIds } = useFavorites();
  return (
    <header className="site-navbar">
      <nav className="nav-inner" aria-label="Main navigation">
        <NavLink to="/" className="brand" aria-label="WayFinder home">
          <span className="brand-mark"><PinMark /></span>
          <span>WayFinder</span>
        </NavLink>

        <div className="nav-links">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/map" className={navClass}>Map</NavLink>
          <NavLink to="/favorites" className={({ isActive }) => `${navClass({ isActive })} nav-favorites`} aria-label={`Favorites${favoriteIds.size ? `, ${favoriteIds.size} saved` : ""}`} title="Favorites">
            <Heart size={15} aria-hidden="true" /> <span>Favorites</span>
            {favoriteIds.size > 0 && <span className="nav-favorite-count">{favoriteIds.size}</span>}
          </NavLink>
          <NavLink to="/about" className={navClass}>About</NavLink>
          <NavLink to="/contact" className={navClass}>Contact</NavLink>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-brand">WayFinder</span>
        <span>Built for a better campus experience</span>
        <span>Explore confidently. Arrive easily.</span>
      </div>
    </footer>
  );
}
