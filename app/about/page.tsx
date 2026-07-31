import Image from "next/image";
import ContactPanel from "../components/ContactPanel";
import PageHero from "../components/PageHero";
import ConceptDisclaimer from "../components/ConceptDisclaimer";

export const metadata = {
  title: "About the project",
  description: "The origin, mission, build direction, and future goals of the Soni companion robot project.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Soni"
        title="A school project becoming a real machine."
        intro="Soni began as a capstone question: could a small conversational robot support older adults who need more opportunities for connection without becoming intrusive, clinical, or difficult to use?"
      />

      <section className="section section--light">
        <div className="shell story-grid">
          <div className="story-grid__copy">
            <p className="eyebrow">The mission</p>
            <h2>Start with the person, then design the technology.</h2>
            <p>
              The project grew from time spent with older adults and from seeing the
              value of simply showing up, listening, and sharing a conversation. Soni
              is being developed for people who may be lonely, isolated, homebound,
              or otherwise in need of more regular social connection.
            </p>
            <p>
              The goal is not to build a robot simply because the technology exists.
              The physical design, conversation style, privacy controls, and research
              plan all follow the intended experience for older adults and senior communities.
            </p>
          </div>
          <div className="story-grid__image story-grid__image--mission">
            <Image
              src="/images/soni/our-mission.webp"
              alt="A student volunteer sitting beside an older adult at a community center"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
            />
          </div>
        </div>
      </section>

      <section className="section section--soft">
        <div className="shell story-grid story-grid--reverse">
          <div className="story-grid__copy">
            <p className="eyebrow">The prototype</p>
            <h2>Built around real parts and real constraints.</h2>
            <p>
              The first version is a stationary tabletop prototype with a five-inch
              screen face, stereo sound, a USB microphone, portable battery power,
              and a Raspberry Pi 5 inside a custom 3D-printed shell.
            </p>
            <p>
              Its body is being designed around the exact electronics, cable paths,
              cooling clearances, and maintenance access—not around an imaginary product render.
            </p>
          </div>
          <figure className="story-grid__figure">
            <div className="story-grid__image story-grid__image--contain">
              <Image
                src="/images/soni/soni-approved-concept.webp"
                alt="Soni body concept with its correct minimalist screen face"
                fill
                sizes="(max-width: 900px) 100vw, 45vw"
              />
            </div>
            <ConceptDisclaimer />
          </figure>
        </div>
      </section>

      <section className="section section--dark">
        <div className="shell milestone-grid">
          <article><span>Now</span><h2>Prototype integration</h2><p>Voice, screen, speakers, microphone, Raspberry Pi, portable power, and enclosure fit testing.</p></article>
          <article><span>Next</span><h2>Controlled demonstrations</h2><p>Evaluate usability, conversation quality, sound, physical form, and maintenance workflows.</p></article>
          <article><span>Then</span><h2>Responsible pilot study</h2><p>Finalize consent, measures, privacy, oversight, data handling, and facility partnership.</p></article>
        </div>
      </section>

      <section className="section section--soft">
        <div className="shell values-row">
          <div><span>Warm</span><p>Friendly without becoming childish.</p></div>
          <div><span>Clear</span><p>Understandable behavior and controls.</p></div>
          <div><span>Repairable</span><p>Accessible hardware and removable panels.</p></div>
          <div><span>Responsible</span><p>Consent, privacy, and human oversight.</p></div>
        </div>
      </section>

      <ContactPanel title="Follow or support the build." copy="The project is open to conversations with facilities, educators, research partners, makers, and supporters." />
    </>
  );
}
