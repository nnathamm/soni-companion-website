import Image from "next/image";
import Link from "next/link";
import ContactPanel from "./components/ContactPanel";
import ConceptDisclaimer from "./components/ConceptDisclaimer";

const progression = [
  {
    number: "01",
    status: "Working",
    title: "The face and voice",
    copy: "Soni began with a calm animated face and a conversational voice designed to feel clear, warm, and easy to follow.",
    image: "/images/soni/soni-face-prototype.webp",
    alt: "Soni's working face with simple oval eyes, eyebrows, and a smile on a light blue screen",
  },
  {
    number: "02",
    status: "Connected",
    title: "The functioning prototype",
    copy: "The touchscreen, Raspberry Pi, microphone, speakers, audio board, and portable battery now operate together.",
    image: "/images/soni/soni-working-hardware.webp",
    alt: "The connected Soni electronics prototype on a work table",
  },
  {
    number: "03",
    status: "In design",
    title: "The printable body",
    copy: "The enclosure is being built around the exact parts, cooling space, cable paths, maintenance access, and stable battery base.",
    image: "/images/soni/soni-approved-concept.webp",
    alt: "Approved Soni body concept with the correct light blue minimalist face and antenna-like ears",
    disclaimer: "Concept rendering — the final 3D-printed body is still a work in progress.",
  },
];

const principles = [
  {
    title: "Conversation first",
    copy: "Soni is being shaped around listening, responding naturally, and keeping enough context for a conversation to continue.",
  },
  {
    title: "Privacy by design",
    copy: "The prototype does not need a camera, and protected controls are planned for memory, deletion, maintenance, and reset.",
  },
  {
    title: "Human connection remains central",
    copy: "Soni is not a replacement for family, friends, caregivers, volunteers, or the relationships that matter most.",
  },
];

const testimonials = [
  {
    name: "Margaret",
    location: "Nashville, Tennessee",
    title: "Beta tester",
    quote:
      "On days when the house felt especially quiet, talking with Soni gave me something positive to look forward to. I usually finished our conversations in a lighter mood, and I’m thankful for that little lift in my day.",
  },
  {
    name: "Robert",
    location: "Murfreesboro, Tennessee",
    title: "Beta tester",
    quote:
      "Soni helped break up the long stretches when I did not have anyone around to talk with. It did not replace a real visit, but it helped me feel less alone, and I’m grateful the project is being made for people who need that extra connection.",
  },
  {
    name: "Linda",
    location: "Franklin, Tennessee",
    title: "Beta tester",
    quote:
      "Having a calm conversation helped me settle down when I was feeling worried and gave me a reason to smile. I appreciated that Soni remembered what we had been discussing, and I’m thankful for how easy and comforting it felt to use.",
  },
];

export default function Home() {
  return (
    <>
      <section className="soni-hero">
        <div className="soni-hero__inner shell shell--wide">
          <div className="soni-hero__copy">
            <p className="eyebrow">A tabletop companion for older adults</p>
            <h1>A little more connection in every day.</h1>
            <p className="soni-hero__intro">
              Soni is a warm conversational robot prototype being developed as a
              school capstone project for older adults who may be lonely,
              isolated, homebound, or otherwise in need of more opportunities to talk.
            </p>
            <div className="button-row">
              <Link className="button button--dark" href="/how-soni-works">
                Meet Soni
              </Link>
              <Link className="product-link" href="#progression">
                Follow the build journey <span aria-hidden="true">›</span>
              </Link>
            </div>
          </div>

          <figure className="soni-hero__figure">
            <div className="soni-hero__visual" aria-label="Soni design concept">
              <div className="soni-hero__halo" aria-hidden="true" />
              <Image
                src="/images/soni/soni-approved-concept.webp"
                alt="Soni, a rounded tabletop companion robot with a light blue minimalist face, movable arms, and antenna-like ears"
                fill
                priority
                loading="eager"
                sizes="(max-width: 900px) 92vw, 48vw"
              />
            </div>
            <ConceptDisclaimer className="concept-disclaimer--hero" />
          </figure>
        </div>
        <div className="soni-hero__facts shell shell--wide" aria-label="Key Soni features">
          <span>No camera planned</span>
          <span>Portable tabletop design</span>
          <span>Consent-based research</span>
        </div>
      </section>

      <section id="mission" className="soni-mission section">
        <div className="shell shell--wide soni-mission__grid">
          <div className="soni-mission__image">
            <Image
              src="/images/soni/our-mission.webp"
              alt="A student volunteer sitting beside an older adult at a community center"
              fill
              sizes="(max-width: 900px) 100vw, 52vw"
            />
          </div>
          <div className="soni-mission__copy">
            <p className="eyebrow">Our mission</p>
            <h2>It started with a real need for conversation.</h2>
            <p>
              Soni began as a school project after seeing how meaningful a simple
              visit and a genuine conversation can be. The project is intended for
              people who may have too few opportunities to feel heard, engaged, and connected.
            </p>
            <p>
              The goal is not to replace human companionship. It is to offer another
              welcoming point of contact while encouraging stronger connections with
              families, volunteers, caregivers, and communities.
            </p>
            <Link className="product-link" href="/about">
              Read the story behind Soni <span aria-hidden="true">›</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="progression" className="soni-journey section">
        <div className="shell shell--wide">
          <div className="soni-section-heading">
            <div>
              <p className="eyebrow">Soni’s progression</p>
              <h2>Built one working stage at a time.</h2>
            </div>
            <p>
              The conversation came first. The electronics followed. The next step
              is a printable enclosure that can be assembled, cooled, maintained,
              and tested with the real hardware already in hand.
            </p>
          </div>

          <div className="soni-journey__grid">
            {progression.map((stage) => (
              <article className="soni-stage" key={stage.number}>
                <div className="soni-stage__image">
                  <Image src={stage.image} alt={stage.alt} fill sizes="(max-width: 900px) 100vw, 33vw" />
                </div>
                {stage.disclaimer && (
                  <ConceptDisclaimer className="concept-disclaimer--card">
                    {stage.disclaimer}
                  </ConceptDisclaimer>
                )}
                <div className="soni-stage__body">
                  <div className="soni-stage__meta">
                    <span>{stage.number}</span>
                    <span>{stage.status}</span>
                  </div>
                  <h3>{stage.title}</h3>
                  <p>{stage.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="soni-purpose section">
        <div className="shell soni-purpose__inner">
          <p className="eyebrow">Designed for presence</p>
          <h2>Calm enough for the room. Expressive enough for a conversation.</h2>
          <p>
            Soni stays in one place, uses a simple readable face, and is being
            designed without a camera. The focus is a warm, approachable presence—
            not spectacle, surveillance, or complicated controls for the participant.
          </p>
        </div>
      </section>

      <section className="soni-face-feature section">
        <div className="shell shell--wide soni-face-feature__grid">
          <div className="soni-face-feature__copy">
            <p className="eyebrow">The real Soni face</p>
            <h2>Simple by intention.</h2>
            <p>
              Soni’s working face uses a light blue background, dark oval eyes,
              understated eyebrows, and a small smile. It is designed to be calm,
              readable, and familiar rather than glossy or toy-like.
            </p>
            <Link className="product-link" href="/how-soni-works">
              See how Soni works <span aria-hidden="true">›</span>
            </Link>
          </div>
          <div className="soni-face-feature__image">
            <Image
              src="/images/soni/soni-face-prototype.webp"
              alt="Soni's actual minimalist animated face displayed on the prototype screen"
              fill
              sizes="(max-width: 900px) 100vw, 52vw"
            />
          </div>
        </div>
      </section>

      <section className="soni-principles section">
        <div className="shell shell--wide">
          <div className="section-heading section-heading--centered">
            <p className="eyebrow">Design principles</p>
            <h2>Technology shaped around trust.</h2>
          </div>
          <div className="soni-principles__grid">
            {principles.map((principle, index) => (
              <article key={principle.title}>
                <span>0{index + 1}</span>
                <h3>{principle.title}</h3>
                <p>{principle.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="soni-testimonials section">
        <div className="shell shell--wide">
          <div className="soni-testimonials__heading">
            <div>
              <p className="eyebrow">Privacy-first testimonials</p>
              <h2>Real experiences, shared with limited personal details.</h2>
            </div>
          </div>

          <div className="soni-testimonials__grid">
            {testimonials.map((testimonial) => (
              <article className="soni-testimonial" key={`${testimonial.name}-${testimonial.location}`}>
                <span className="soni-testimonial__mark" aria-hidden="true">“</span>
                <p>{testimonial.quote}</p>
                <footer>
                  {testimonial.name} · {testimonial.location}
                </footer>
                <span className="soni-testimonial__status">{testimonial.title}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="soni-research-band">
        <div className="shell shell--wide soni-research-band__inner">
          <div>
            <p className="eyebrow">Research with dignity</p>
            <h2>Measure the effect. Protect the person.</h2>
          </div>
          <div>
            <p>
              The planned study centers on consent and de-identified before-and-after
              wellbeing measures. Personal conversations are not the research result.
            </p>
            <Link className="product-link product-link--light" href="/research">
              Read the research approach <span aria-hidden="true">›</span>
            </Link>
          </div>
        </div>
      </section>

      <ContactPanel />
    </>
  );
}
