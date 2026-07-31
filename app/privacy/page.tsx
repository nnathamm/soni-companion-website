import ContactPanel from "../components/ContactPanel";
import PageHero from "../components/PageHero";

const controls = [
  ["No camera", "The current design does not include a camera. Soni is centered on voice and its animated face."],
  ["Protected maintenance mode", "Diagnostics, settings, updates, restart, and shutdown are intended for authorized access."],
  ["Memory controls", "The owner can clear a session, one participant's memory, all long-term memory, or perform a full reset."],
  ["Confirmation for destructive actions", "Sensitive deletion and reset actions require deliberate confirmation and PIN protection."],
  ["Recovery path", "An owner-only PIN recovery flow can use a separately stored recovery code or physical access to the Raspberry Pi."],
  ["Data minimization", "A future study should collect only what is needed for the defined research outcome."],
];

export const metadata = {
  title: "Safety and privacy",
  description: "Soni's planned privacy, memory, maintenance, and safety controls.",
};

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Safety & privacy"
        title="Trust should be visible."
        intro="Soni’s controls are being designed so participants, families, staff, and owners can understand what the device does—and stop, clear, or reset it when needed."
        tone="dark"
      />

      <section className="section section--light">
        <div className="shell control-grid">
          {controls.map(([title, copy]) => (
            <article key={title}><span className="control-grid__dot" /><h2>{title}</h2><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="section section--soft">
        <div className="shell section-heading section-heading--split">
          <div><p className="eyebrow">Behavioral safety</p><h2>A companion, not an authority.</h2></div>
          <div className="prose-stack">
            <p>Soni should not present itself as a doctor, therapist, emergency service, or substitute for staff and family.</p>
            <p>Its conversational behavior should respond calmly to difficult topics, avoid inappropriate humor, and direct urgent needs toward human help.</p>
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="shell note-panel note-panel--dark">
          <p className="eyebrow">Before deployment</p>
          <h2>Policies must match the real system—not just the design intent.</h2>
          <p>Final privacy notices, consent language, retention settings, vendor agreements, and incident procedures need review before any participant study or facility deployment.</p>
        </div>
      </section>

      <ContactPanel title="Ask a privacy or safety question." copy="We welcome direct questions from facilities, families, educators, and research partners." />
    </>
  );
}
