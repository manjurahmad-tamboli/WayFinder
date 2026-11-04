import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Heart, Home, Info, Mail, MapPin, Menu, Moon, Sun, X } from "lucide-react";
import { useFavorites } from "../contexts/FavoritesContext";
import { useTheme } from "../contexts/ThemeContext";

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
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function closeOnOutsidePointer(event) {
      if (!menuRef.current?.contains(event.target) && !menuButtonRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const desktopBreakpoint = window.matchMedia("(min-width: 761px)");
    const closeOnDesktop = (event) => {
      if (event.matches) setMenuOpen(false);
    };
    desktopBreakpoint.addEventListener("change", closeOnDesktop);
    return () => desktopBreakpoint.removeEventListener("change", closeOnDesktop);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-navbar">
      <nav className="nav-inner" aria-label="Main navigation">
        <NavLink to="/" onClick={closeMenu} className="brand" aria-label="WayFinder home">
          <span className="brand-mark"><PinMark /></span>
          <span>WayFinder</span>
        </NavLink>

        <div ref={menuRef} id="primary-navigation" className={`nav-links${menuOpen ? " is-open" : ""}`}>
          <NavLink to="/" end className={navClass} onClick={closeMenu} tabIndex={menuOpen || window.innerWidth > 760 ? 0 : -1}>
            <Home className="mobile-nav-icon" size={18} aria-hidden="true" /><span>Home</span>
          </NavLink>
          <NavLink to="/map" className={navClass} onClick={closeMenu} tabIndex={menuOpen || window.innerWidth > 760 ? 0 : -1}>
            <MapPin className="mobile-nav-icon" size={18} aria-hidden="true" /><span>Map</span>
          </NavLink>
          <NavLink
            to="/favorites"
            className={({ isActive }) => `${navClass({ isActive })} nav-favorites`}
            aria-label={`Favorites${favoriteIds.size ? `, ${favoriteIds.size} saved` : ""}`}
            title="Favorites"
            onClick={closeMenu}
            tabIndex={menuOpen || window.innerWidth > 760 ? 0 : -1}
          >
            <Heart size={15} aria-hidden="true" /> <span>Favorites</span>
            {favoriteIds.size > 0 && <span className="nav-favorite-count">{favoriteIds.size}</span>}
          </NavLink>
          <NavLink to="/about" className={navClass} onClick={closeMenu} tabIndex={menuOpen || window.innerWidth > 760 ? 0 : -1}>
            <Info className="mobile-nav-icon" size={18} aria-hidden="true" /><span>About</span>
          </NavLink>
          <NavLink to="/contact" className={navClass} onClick={closeMenu} tabIndex={menuOpen || window.innerWidth > 760 ? 0 : -1}>
            <Mail className="mobile-nav-icon" size={18} aria-hidden="true" /><span>Contact</span>
          </NavLink>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "dark"}
            title={`Current theme: ${theme === "dark" ? "Dark" : "Light"}. Switch theme`}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
            <span>{theme === "dark" ? "Dark" : "Light"}</span>
          </button>
          <button
            type="button"
            ref={menuButtonRef}
            className="mobile-menu-toggle"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
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
