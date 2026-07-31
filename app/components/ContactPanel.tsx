import Link from "next/link";

const CONTACT_EMAIL = "soni.companion@gmail.com";

export default function ContactPanel({
  title = "Bring Soni into the conversation.",
  copy = "We are speaking with senior communities, educators, research partners, and supporters interested in the prototype.",
}: {
  title?: string;
  copy?: string;
}) {
  return (
    <section className="contact-panel shell">
      <div>
        <p className="eyebrow">Start a conversation</p>
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="contact-panel__actions">
        <Link className="button button--light" href="/contact">
          Request a demo
        </Link>
        <a className="contact-panel__email" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </div>
    </section>
  );
}
