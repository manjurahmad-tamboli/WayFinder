import { Icon } from './Icons'
import Reveal from './Reveal'

const contactLinks = [
  ['email', 'mrtamboli19@gmail.com', 'mailto:mrtamboli19@gmail.com'],
  ['linkedin', 'linkedin.com/in/manjurahmadtamboli19', 'https://www.linkedin.com/in/manjurahmadtamboli19'],
  ['github', 'github.com/manjurahmad-tamboli', 'https://github.com/manjurahmad-tamboli'],
]

export default function Contact() { return <section id="contact" className="portfolio-shell py-24 sm:py-28" aria-labelledby="contact-heading"><Reveal><div className="relative overflow-hidden rounded-[1.7rem] border border-teal-200/15 bg-gradient-to-br from-teal-300/[.13] via-[#0f172a]/80 to-blue-400/[.08] p-7 sm:p-12"><div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-teal-200/10 blur-3xl" /><div className="relative grid gap-10 lg:grid-cols-[1fr_.82fr]"><div><p className="eyebrow">Get in touch</p><h2 id="contact-heading" className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Let’s build something meaningful together.</h2><p className="mt-4 max-w-xl text-base leading-7 text-slate-300">Have an opportunity, project idea, or a question about my work? I’d be glad to connect.</p><a href="mailto:mrtamboli19@gmail.com" className="primary-button mt-7">Start a conversation <Icon name="arrow" size={17} /></a></div><div className="space-y-3">{contactLinks.map(([icon, label, href]) => <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="glass flex items-center gap-3 rounded-xl p-4 transition hover:border-teal-200/35 hover:bg-white/[.07]"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/[.06] text-teal-200"><Icon name={icon} size={17} /></span><span className="min-w-0 break-all text-sm text-slate-200">{label}</span><Icon name="arrow" size={15} /></a>)}</div></div></div></Reveal></section> }
