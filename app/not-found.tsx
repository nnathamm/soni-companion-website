import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found shell">
      <p className="eyebrow">404</p>
      <h1>This page moved with the old site.</h1>
      <p>The Community Companion dashboards are no longer part of the public Soni website.</p>
      <Link className="button button--dark" href="/">Return home</Link>
    </section>
  );
}
