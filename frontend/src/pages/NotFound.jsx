import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <span className="category-icon mx-auto text-3xl" aria-hidden="true">🧭</span>
      <p className="eyebrow mt-6">OFF THE MAP</p>
      <h1 className="mt-3 text-4xl font-extrabold text-white">404 — Lost on campus?</h1>
      <p className="muted-text mt-3">The page you were looking for does not exist.</p>
      <Link to="/" className="button-primary mt-7 inline-flex min-h-11 items-center px-5">
        Take me home
      </Link>
    </section>
  );
}
