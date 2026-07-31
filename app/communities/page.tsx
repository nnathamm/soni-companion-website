import ContactPanel from "../components/ContactPanel";
import PageHero from "../components/PageHero";

export const metadata = {
  title: "For senior communities",
  description: "A practical overview for senior communities interested in a Soni demonstration or future pilot.",
};

const stages = [
  ["1", "Introductory conversation", "Discuss the community, residents, goals, staffing, and questions."],
  ["2", "On-site demonstration", "Let staff see the physical prototype, controls, sound, and interaction style."],
  ["3", "Pilot planning", "Define consent, eligibility, schedule, support, data handling, and stop conditions."],
  ["4", "Review and next steps", "Share de-identified findings and decide whether further work is appropriate."],
];

export default function CommunitiesPage() {
  return (
    <>
      <PageHero
        eyebrow="For senior communities"
        title="A pilot that fits the room it enters."
        intro="Soni is designed to sit in one place, be easy to understand, and operate within a clearly planned demonstration or study—not roam through a facility unattended."
      />

      <section className="section section--light">
        <div className="shell benefit-grid">
          <article><span>For residents</span><h2>A low-pressure interaction.</h2><p>Speak naturally without learning a new phone, app, or complicated interface.</p></article>
          <article><span>For staff</span><h2>Visible controls and boundaries.</h2><p>Protected maintenance, memory, restart, shutdown, and reset functions are part of the plan.</p></article>
          <article><span>For leadership</span><h2>A defined purpose.</h2><p>Demonstrations and pilots should begin with clear goals, roles, privacy practices, and success measures.</p></article>
        </div>
      </section>

      <section className="section section--dark">
        <div className="shell">
          <div className="section-heading section-heading--split">
            <div><p className="eyebrow">A possible path</p><h2>From first conversation to responsible pilot.</h2></div>
            <p>No facility should have to adopt an unfamiliar device before understanding how it works and what it records.</p>
          </div>
          <div className="stage-list">
            {stages.map(([number, title, copy]) => (
              <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="shell two-column-list">
          <div>
            <p className="eyebrow">What a community provides</p>
            <h2>Context, oversight, and participant care.</h2>
            <ul className="check-list">
              <li>A staff point of contact</li>
              <li>An appropriate, quiet location</li>
              <li>Help identifying eligible consenting participants</li>
              <li>Feedback on scheduling and resident experience</li>
              <li>Clear escalation and stop procedures</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">What the project provides</p>
            <h2>A transparent prototype experience.</h2>
            <ul className="check-list">
              <li>Setup, demonstration, and staff orientation</li>
              <li>Plain-language description of device behavior</li>
              <li>Documented privacy and data-handling plan</li>
              <li>Defined research or feedback protocol</li>
              <li>Technical support during the agreed pilot</li>
            </ul>
          </div>
        </div>
      </section>

      <ContactPanel title="Explore a Soni demonstration." copy="Tell us about your community, the people you serve, and what you would want to understand before considering a pilot." />
    </>
  );
}
