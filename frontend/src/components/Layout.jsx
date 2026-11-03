import { useState } from "react";
import { NavLink } from "react-router-dom";

const navClass = ({ isActive }) =>
  `nav-link ${isActive ? "nav-link-active" : ""}`;

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/map", label: "Explore map" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header sticky top-0 z-30">
      <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
        <NavLink
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3 text-white"
          aria-label="WayFinder home"
        >
          <span className="brand-mark">W</span>
          <span className="text-lg font-bold tracking-tight">WayFinder</span>
        </NavLink>

        <div className="hidden items-center gap-2 md:flex">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              {label}
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          className="menu-toggle md:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          )}
        </button>

        {menuOpen && (
          <div className="mobile-nav md:hidden">
            {links.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={navClass}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer mt-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-7 text-center sm:flex-row sm:text-left">
        <span className="font-semibold text-white">WayFinder</span>
        <span>Built for a better campus experience</span>
      </div>
    </footer>
  );
}
