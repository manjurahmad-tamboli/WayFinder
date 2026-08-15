import { useEffect, useState } from 'react'
import profilePhoto from '../../assets/manjurahmad-tamboli-profile.jpeg'
import { Icon } from './Icons'
import Reveal from './Reveal'

const socials = [
  ['github', 'GitHub', 'https://github.com/manjurahmad-tamboli'],
  ['linkedin', 'LinkedIn', 'https://www.linkedin.com/in/manjurahmadtamboli19'],
  ['email', 'Email Manjurahmad', 'mailto:mrtamboli19@gmail.com'],
]

export default function Hero() {
  const [position, setPosition] = useState({ x: 52, y: 38 })
  useEffect(() => {
    const move = (event) => setPosition({ x: event.clientX / window.innerWidth * 100, y: event.clientY / window.innerHeight * 100 })
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  return <section id="home" className="relative flex min-h-[690px] items-center pt-20" aria-labelledby="hero-heading">
    <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(430px circle at ${position.x}% ${position.y}%, rgba(45,212,191,.10), transparent 62%)` }} />
    <span className="orb orb-one" aria-hidden="true" /><span className="orb orb-two" aria-hidden="true" />
    <div className="portfolio-shell relative grid items-center gap-14 py-20 lg:grid-cols-[1.15fr_.85fr] lg:py-24">
      <Reveal>
        <p className="eyebrow">Available for opportunities</p>
        <h1 id="hero-heading" className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-.055em] text-white sm:text-6xl lg:text-7xl">I build useful digital experiences with <span className="gradient-text">code and clarity.</span></h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">I'm <strong className="font-semibold text-slate-200">Manjurahmad Tamboli</strong>, a Computer Science & Engineering student focused on software development, data analytics, and practical problem-solving.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><a href="#projects" className="primary-button">View projects <Icon name="arrow" size={17} /></a><a href="/resume/Manjurahmad-Tamboli-Resume.pdf" download className="secondary-button">Download resume <Icon name="download" size={17} /></a></div>
        <div className="mt-9 flex items-center gap-3" aria-label="Social links">{socials.map(([icon, label, href]) => <a key={icon} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="icon-button" aria-label={label}><Icon name={icon} /></a>)}<span className="ml-2 hidden text-xs text-slate-500 sm:inline">Miraj, Maharashtra</span></div>
      </Reveal>
      <Reveal className="reveal-delay-2">
        <div className="relative mx-auto grid w-full max-w-[390px] place-items-center py-7">
          <div className="absolute h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
          <div className="relative rounded-full bg-gradient-to-br from-teal-200 via-teal-300/60 to-blue-400 p-1.5 shadow-[0_0_60px_rgba(45,212,191,.22)]">
            <div className="rounded-full bg-[#080b14] p-1"><img src={profilePhoto} alt="Manjurahmad Tamboli" className="h-64 w-64 rounded-full object-cover object-[50%_32%] sm:h-80 sm:w-80" /></div>
          </div>
          <div className="glass relative -mt-5 rounded-xl px-5 py-3 text-center"><p className="text-xs font-medium uppercase tracking-[.16em] text-teal-200">Software development · Data analytics</p><p className="mt-1.5 text-lg font-semibold text-white">Manjurahmad Tamboli</p></div>
          <div className="glass absolute bottom-0 left-0 hidden rounded-xl px-4 py-3 sm:block"><p className="text-xs text-slate-500">Based in</p><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-100"><Icon name="location" size={15} /> Maharashtra, India</p></div>
          <div className="glass absolute right-0 top-4 hidden rounded-xl px-4 py-3 sm:block"><p className="text-2xl font-semibold text-teal-200">3rd</p><p className="mt-1 text-xs text-slate-400">IGNITE PVPIT 2026</p></div>
        </div>
      </Reveal>
    </div>
  </section>
}
