import { Icon } from './Icons'
import Reveal from './Reveal'

const points = [
  ['Practical builder', 'I turn coursework and ideas into focused projects, from campus navigation to analytical reporting.'],
  ['Data-minded', 'I enjoy cleaning, exploring, and visualizing information to uncover patterns that support better decisions.'],
  ['Always learning', 'I’m strengthening my foundations in software development while working on meaningful real-world problems.'],
]

export default function About() { return <section id="about" className="portfolio-shell py-24 sm:py-28" aria-labelledby="about-heading"><div className="grid gap-12 lg:grid-cols-[.82fr_1.18fr]"><Reveal><p className="eyebrow">About me</p><h2 id="about-heading" className="section-title">Curious by nature, deliberate in execution.</h2><p className="section-copy">My interest sits at the intersection of software development and data analytics: building accessible interfaces, working through problems methodically, and learning from every project.</p></Reveal><div className="grid gap-3 sm:grid-cols-3">{points.map(([title, copy], index) => <Reveal key={title} className={`reveal-delay-${index + 1}`}><article className="glass h-full rounded-2xl p-5 transition duration-300 hover:-translate-y-1 hover:border-teal-200/25"><div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-300/10 text-teal-200"><Icon name={index === 1 ? 'code' : index === 2 ? 'spark' : 'check'} size={17} /></div><h3 className="mt-8 text-base font-semibold text-white">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p></article></Reveal>)}</div></div></section>
}
