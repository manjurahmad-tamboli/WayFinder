import { useEffect, useState } from 'react'
import { Icon } from './Icons'

const links = ['About', 'Skills', 'Projects', 'Experience', 'Education', 'Contact']

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('')
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14)
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)), { rootMargin: '-35% 0px -55% 0px' })
    links.forEach((label) => { const section = document.getElementById(label.toLowerCase()); if (section) observer.observe(section) })
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll()
    return () => { window.removeEventListener('scroll', onScroll); observer.disconnect() }
  }, [])
  const goTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false) }
  return <header className={`fixed inset-x-0 top-0 z-30 transition ${scrolled ? 'border-b border-white/10 bg-[#080b14]/85 backdrop-blur-xl' : ''}`}>
    <nav className="portfolio-shell flex h-[72px] items-center justify-between" aria-label="Main navigation">
      <button onClick={() => goTo('home')} className="group text-left" aria-label="Back to the top"><span className="font-semibold tracking-tight text-white">MT<span className="text-teal-300">.</span></span><span className="ml-2 hidden text-xs text-slate-500 sm:inline">Manjurahmad Tamboli</span></button>
      <div className="hidden items-center gap-5 lg:flex">{links.map((label) => <button key={label} onClick={() => goTo(label.toLowerCase())} className={`nav-link ${active === label.toLowerCase() ? 'active' : ''}`}>{label}</button>)}</div>
      <div className="hidden items-center gap-3 sm:flex"><a href="/resume/Manjurahmad-Tamboli-Resume.pdf" download className="secondary-button !rounded-lg !px-4 !py-2">Resume <Icon name="download" size={16} /></a></div>
      <button className="icon-button sm:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}><Icon name={open ? 'close' : 'menu'} /></button>
    </nav>
    <div id="mobile-menu" className={`overflow-hidden border-t border-white/10 bg-[#0b0f1b]/98 backdrop-blur-xl transition-all duration-300 sm:hidden ${open ? 'max-h-[440px] opacity-100' : 'max-h-0 border-transparent opacity-0'}`}>
      <div className="portfolio-shell flex flex-col py-3">{links.map((label) => <button key={label} onClick={() => goTo(label.toLowerCase())} className="py-3 text-left text-sm text-slate-300 hover:text-teal-200">{label}</button>)}<a href="/resume/Manjurahmad-Tamboli-Resume.pdf" download className="mb-2 mt-2 text-sm font-semibold text-teal-200">Download Resume</a></div>
    </div>
  </header>
}
