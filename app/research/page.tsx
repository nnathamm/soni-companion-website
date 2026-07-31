import ContactPanel from "../components/ContactPanel";
import PageHero from "../components/PageHero";

const measures = [
  ["Before", "Establish a baseline with an appropriate wellbeing or loneliness measure."],
  ["During", "Offer structured opportunities to speak with Soni over a defined period."],
  ["After", "Repeat the selected measure and compare de-identified outcomes."],
];

export const metadata = {
  title: "Research study",
  description: "Learn about the planned consent-based study of Soni's effect on older adult wellbeing.",
};

export default function ResearchPage() {
  return (
    <>
      <PageHero
        eyebrow="Research study"
        title="Study the outcome, not the private conversation."
        intro="Soni began as a business-oriented capstone idea: test whether a conversational companion can support older adults while keeping the research data narrow, consent-based, and de-identified."
        tone="dark"
      />

      <section className="section section--light">
        <div className="shell section-heading section-heading--split">
          <div>
            <p className="eyebrow">Planned approach</p>
            <h2>A defined pilot with clear boundaries.</h2>
          </div>
          <div className="prose-stack">
            <p>
              The intended participants are older adults who can understand the study
              and provide informed consent. The current concept does not target people
              with significant cognitive impairment.
            </p>
            <p>
              The exact protocol, measures, retention periods, and oversight requirements
              must be finalized with the participating institution and appropriate research
              guidance before recruitment begins.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="shell research-timeline">
          {measures.map(([phase, copy], index) => (
            <article key={phase}>
              <span>0{index + 1}</span>
              <p className="eyebrow">{phase}</p>
              <h2>{phase} the pilot</h2>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--dark">
        <div className="shell safeguards-grid">
          <div>
            <p className="eyebrow">Research safeguards</p>
            <h2>What the study should protect.</h2>
          </div>
          <div className="safeguard-list">
            <article><strong>Voluntary participation</strong><p>Participants should know what the study involves and be free to stop.</p></article>
            <article><strong>Minimal research data</strong><p>Collect only the outcome information necessary to answer the research question.</p></article>
            <article><strong>De-identification</strong><p>Report results without names or details that trace back to an individual participant.</p></article>
            <article><strong>Deletion plan</strong><p>Define when personal conversation context and participant-linked records are removed.</p></article>
          </div>
        </div>
      </section>

      <section className="section section--light">
        <div className="shell note-panel">
          <p className="eyebrow">Current status</p>
          <h2>This is a prototype and planned study—not a completed clinical claim.</h2>
          <p>
            The site describes the intended direction. It does not claim that Soni has
            been proven to reduce loneliness, improve health, or replace professional or
            personal support.
          </p>
        </div>
      </section>

      <ContactPanel title="Help shape a responsible pilot." copy="We are interested in conversations with senior communities, faculty, and research partners who can help refine the study design." />
    </>
  );
}
