import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Info, Mail, MapPin, Menu, X } from "lucide-react";

const navClass = ({ isActive }) =>
  `nav-link ${isActive ? "nav-link-active" : ""}`;

const links = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/map", label: "Map", icon: MapPin },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Mail },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    function closeOnOutsidePointer(event) {
      if (
        !menuRef.current?.contains(event.target) &&
        !menuButtonRef.current?.contains(event.target)
      ) {
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
    const desktopBreakpoint = window.matchMedia("(min-width: 1025px)");
    const closeOnDesktop = (event) => {
      if (event.matches) setMenuOpen(false);
    };

    desktopBreakpoint.addEventListener("change", closeOnDesktop);
    return () => desktopBreakpoint.removeEventListener("change", closeOnDesktop);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

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

        <div className="hidden items-center gap-2 min-[1025px]:flex">
          {links.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              {label}
            </NavLink>
          ))}
        </div>

        <button
          type="button"
          ref={menuButtonRef}
          className="menu-toggle min-[1025px]:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>

        <ul
          ref={menuRef}
          id="mobile-navigation"
          className={`mobile-nav min-[1025px]:hidden${menuOpen ? " mobile-nav-open" : ""}`}
          aria-label="Mobile primary navigation"
          aria-hidden={!menuOpen}
        >
          {links.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={navClass}
                onClick={closeMenu}
                tabIndex={menuOpen ? 0 : -1}
              >
                <Icon size={19} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
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
