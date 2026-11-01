import Reveal from "../components/Reveal";

const features = [
  "Interactive campus map with building markers",
  "Quick search and category filters",
  "Dijkstra shortest-path walking routes",
  "Location details and opening hours",
  "Contact messages stored for the team",
];

export default function About() {
  return (
    <section className="page-wrap">
      <p className="eyebrow">About the project</p>
      <h1 className="page-title">Make an unfamiliar campus feel familiar.</h1>
      <p className="page-lead">
        WayFinder is a student-built campus navigation guide for new students, parents, faculty, and visitors. It brings important places, practical details, and clear walking directions together in one easy-to-use experience.
      </p>

      <Reveal className="info-grid">
        <article className="info-card">
          <p className="eyebrow">What WayFinder does</p>
          <h2>Useful from the first visit</h2>
          <ul className="mt-5 space-y-3 pl-5">
            {features.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
        </article>
        <article className="info-card about-stack-card">
          <p className="eyebrow">Built with familiar tools</p>
          <h2>Simple, modular technology</h2>
          <p className="mt-4">React and Vite power the interface, Leaflet and OpenStreetMap provide the map, and a FastAPI service with SQLAlchemy and SQLite handles campus data.</p>
          <div className="tech-tags">
            {["React", "Leaflet", "OpenStreetMap", "FastAPI", "SQLite"].map((tech) => <span key={tech}>{tech}</span>)}
          </div>
        </article>
      </Reveal>

      <Reveal as="article" className="info-card team-card" delay={80}>
        <p className="eyebrow">Team WayFinder</p>
        <h2>Designed as a practical campus project</h2>
        <p className="mb-0">A college student team focused on solving everyday navigation problems with clear design and approachable technology.</p>
      </Reveal>
    </section>
  );
}
