import Image from "next/image";
import ContactPanel from "../components/ContactPanel";
import PageHero from "../components/PageHero";

const flow = [
  ["01", "Start naturally", "A participant speaks to Soni without navigating an app or holding a device."],
  ["02", "Listen and understand", "The microphone captures speech for transcription and conversational response."],
  ["03", "Respond with warmth", "Soni answers through its speakers while its animated face supports the interaction."],
  ["04", "Keep useful context", "The prototype can retain limited conversational context, subject to owner-controlled memory settings."],
];

export const metadata = {
  title: "How Soni works",
  description: "See how Soni combines voice, an animated face, memory controls, and a portable tabletop form.",
};

export default function HowSoniWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How Soni works"
        title="A conversation, made physical."
        intro="Soni brings voice AI into a calm tabletop form with a screen face, stereo audio, protected controls, and no camera."
      />

      <section className="section section--light">
        <div className="shell process-grid">
          {flow.map(([number, title, copy]) => (
            <article key={number} className="process-step">
              <span>{number}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="feature-showcase feature-showcase--dark">
        <div className="feature-showcase__copy">
          <p className="eyebrow">Simple on the outside</p>
          <h2>A focused set of components inside.</h2>
          <p>
            The prototype is built around a Raspberry Pi 5, a five-inch touchscreen,
            a USB microphone, stereo speakers, and a rechargeable battery. A removable
            shell is being designed for cooling, service access, and future upgrades.
          </p>
        </div>
        <div className="feature-showcase__image feature-showcase__image--diagram">
          <Image
            src="/images/soni/soni-internal-layout.webp"
            alt="Technical interior layout diagram of Soni's components"
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>
      </section>

      <section className="section section--soft">
        <div className="shell section-heading section-heading--split">
          <div>
            <p className="eyebrow">The touchscreen</p>
            <h2>Face first. Controls when needed.</h2>
          </div>
          <div className="prose-stack">
            <p>
              During normal use, the display is Soni’s animated face. A protected
              maintenance mode is planned for diagnostics, configuration, updates,
              testing, restart, and shutdown.
            </p>
            <p>
              Owner-only memory controls are planned for clearing the current session,
              an individual participant’s stored memory, all long-term memory, or the
              entire device. Destructive actions require confirmation and PIN protection.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--light">
        <div className="shell specification-grid">
          <article><span>Form</span><strong>Stationary tabletop robot</strong><p>Portable enough to move between rooms, stable enough for touchscreen use.</p></article>
          <article><span>Vision</span><strong>No camera planned</strong><p>The prototype is intentionally centered on conversation rather than visual monitoring.</p></article>
          <article><span>Audio</span><strong>USB microphone + stereo speakers</strong><p>Components can be positioned inside the shell for clearer pickup and playback.</p></article>
          <article><span>Power</span><strong>Portable battery</strong><p>Designed to run away from a wall outlet during demonstrations and sessions.</p></article>
        </div>
      </section>

      <ContactPanel title="See the prototype take shape." copy="Talk with us about a demonstration, a facility pilot, or a research collaboration." />
    </>
  );
}
