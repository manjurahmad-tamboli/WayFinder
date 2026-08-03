import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.png'

const navClass = ({ isActive }) => `text-sm font-medium transition ${isActive ? 'text-blue-700' : 'text-slate-600 hover:text-blue-700'}`
export function Navbar() {
  return <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"><NavLink to="/" className="flex items-center gap-2 font-bold text-slate-900"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-lg text-white">W</span><span>WayFinder</span></NavLink><div className="flex gap-4 sm:gap-6"><NavLink className={navClass} to="/">Home</NavLink><NavLink className={navClass} to="/map">Map</NavLink><NavLink className={navClass} to="/about">About</NavLink><NavLink className={navClass} to="/contact">Contact</NavLink></div></nav></header>
}
export function Footer() { return <footer className="mt-12 bg-slate-900 py-7 text-center text-sm text-slate-300">WayFinder · Built for a better campus experience</footer> }

