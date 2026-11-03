const features = [
  "Interactive campus map with building markers",
  "Quick search and category filters",
  "Walking route estimates and turn guidance",
  "Location details and opening hours",
  "Contact messages for feedback",
];

export default function About() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <p className="eyebrow">ABOUT THE PROJECT</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
        Make a new campus feel <span className="accent-text">familiar.</span>
      </h1>
      <p className="silver-text mt-5 max-w-3xl text-lg leading-8">
        WayFinder is a student-built campus navigation guide for new students,
        parents, faculty, and visitors. It brings important places, practical
        details, and easy directions together in one friendly interface.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="surface-card p-6 sm:p-7">
          <p className="eyebrow">MADE TO HELP</p>
          <h2 className="mt-2 text-xl font-bold text-white">What it does</h2>
          <ul className="mt-5 space-y-4">
            {features.map((feature) => (
              <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
                <span className="accent-text font-black" aria-hidden="true">✦</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="surface-card overflow-hidden p-6 sm:p-7">
          <p className="eyebrow">BUILT FOR A HACKATHON</p>
          <h2 className="mt-2 text-xl font-bold text-white">Simple, useful technology</h2>
          <p className="silver-text mt-4 leading-7">
            Our goal was to make campus navigation approachable without
            requiring a complicated app. The project uses React,
            Leaflet/OpenStreetMap, FastAPI, SQLAlchemy, and SQLite.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["React", "Leaflet", "FastAPI", "SQLite"].map((technology) => (
              <span key={technology} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
                {technology}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card mt-5 flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="eyebrow">THE PEOPLE BEHIND IT</p>
          <h2 className="mt-2 text-xl font-bold text-white">Team WayFinder</h2>
        </div>
        <p className="muted-text max-w-xl leading-7">
          A college student team focused on solving small everyday problems
          with clean, useful technology.
        </p>
      </div>
    </section>
  );
}
