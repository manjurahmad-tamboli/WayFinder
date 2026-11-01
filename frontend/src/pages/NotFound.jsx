import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="error-state">
      <span className="error-compass" aria-hidden="true">⌖</span>
      <p className="eyebrow">404 · Wrong turn</p>
      <h1>Lost on this page?</h1>
      <p>The page you were looking for isn’t here. Let’s get you back on track.</p>
      <Link to="/" className="primary-button px-5 py-3">Take me home</Link>
    </section>
  );
}
