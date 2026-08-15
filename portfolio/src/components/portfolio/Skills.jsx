import Reveal from './Reveal'

const groups = [
  { title: 'Programming', detail: 'Languages used across projects and coursework.', skills: ['Python', 'C++', 'C', 'JavaScript', 'SQL'] },
  { title: 'Web development', detail: 'Building responsive frontend and API-driven applications.', skills: ['React.js', 'HTML5', 'CSS3', 'Tailwind CSS', 'FastAPI', 'REST APIs'] },
  { title: 'Data & analytics', detail: 'Exploring, cleaning, and communicating useful insights.', skills: ['Pandas', 'NumPy', 'Matplotlib', 'Data Cleaning', 'EDA', 'Power BI', 'Tableau'] },
  { title: 'Tools & foundations', detail: 'Reliable workflows backed by core computer-science knowledge.', skills: ['Git', 'GitHub', 'VS Code', 'MySQL', 'SQLite', 'DSA', 'OOP', 'DBMS'] },
]

export default function Skills() { return <section id="skills" className="border-y border-white/[.07] bg-white/[.018] py-24 sm:py-28" aria-labelledby="skills-heading"><div className="portfolio-shell"><Reveal><p className="eyebrow">Technical toolkit</p><h2 id="skills-heading" className="section-title">Tools I use to take an idea further.</h2><p className="section-copy">A focused toolkit shaped by hands-on web, backend, and data-analysis work.</p></Reveal><div className="mt-12 grid gap-4 md:grid-cols-2">{groups.map((group, index) => <Reveal key={group.title} className={index % 2 ? 'reveal-delay-1' : ''}><article className="glass group h-full rounded-2xl p-6 transition duration-300 hover:border-teal-200/25"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold text-white">{group.title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{group.detail}</p></div><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-300 shadow-[0_0_14px_rgba(94,234,212,.7)]" /></div><div className="mt-6 flex flex-wrap gap-2">{group.skills.map((skill) => <span key={skill} className="tag transition group-hover:border-white/15">{skill}</span>)}</div></article></Reveal>)}</div></div></section> }
