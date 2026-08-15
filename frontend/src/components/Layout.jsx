import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";

const navClass = ({ isActive }) =>
  `text-sm font-medium transition ${
    isActive
      ? "text-blue-700"
      : "text-slate-600 hover:text-blue-700"
  }`;

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <NavLink
          to="/"
          className="flex items-center gap-2 font-bold text-slate-900"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-lg text-white">
            W
          </span>

          <span>WayFinder</span>
        </NavLink>

        {/* Navigation Links */}
        <div className="flex gap-4 sm:gap-6">
          <NavLink
            to="/"
            className={navClass}
          >
            Home
          </NavLink>

          <NavLink
            to="/map"
            className={navClass}
          >
            Map
          </NavLink>

          <NavLink
            to="/about"
            className={navClass}
          >
            About
          </NavLink>

          <NavLink
            to="/contact"
            className={navClass}
          >
            Contact
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 bg-slate-900 py-7 text-center text-sm text-slate-300">
      WayFinder Â· Built for a better campus experience
    </footer>
  );
}
