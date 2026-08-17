import type { Metadata } from "next";
import Link from "next/link";
import ContactPanel from "../components/ContactPanel";
import { companionFeatures } from "@/lib/features";
import PortalEntryLink from "../components/PortalEntryLink";

export const metadata: Metadata = {
  title: "Connected companion platform",
  description: "Explore Soni's privacy-led family, memory, routine, wellbeing, and trusted-display capabilities.",
};

export default function FeaturesPage() {
  return (
    <>
      <section className="platform-hero">
        <div className="shell shell--wide platform-hero__grid">
          <div>
            <p className="eyebrow">The connected companion platform</p>
            <h1>Conversation that can strengthen a whole circle of care.</h1>
          </div>
          <div className="platform-hero__intro">
            <p>Soni is being built to connect everyday conversation with memories, routines, family participation, and trusted screens—while keeping the senior in control.</p>
            <div className="button-row">
              <PortalEntryLink className="button button--dark" />
              <Link className="product-link" href="/privacy">Read the privacy boundaries <span aria-hidden="true">›</span></Link>
            </div>
          </div>
        </div>
      </section>
      <section className="section platform-capabilities">
        <div className="shell shell--wide">
          <div className="platform-heading"><p className="eyebrow">Capability map</p><h2>Advanced, but never invisible.</h2><p>Each sensitive feature is separate, permissioned, reversible, and designed for human review.</p></div>
          <div className="platform-grid">
            {companionFeatures.map((feature, index) => (
              <article key={feature.key}>
                <div className="platform-card__meta"><span>0{index + 1}</span><span>{feature.eyebrow}</span></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="platform-boundary"><strong>Boundary</strong><span>{feature.boundary}</span></div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="platform-trust"><div className="shell"><p className="eyebrow">One non-negotiable</p><h2>People make care decisions. Soni helps them arrive better prepared.</h2><p>Soni is not a medical device, a diagnostic system, an emergency monitor, or a replacement for family and professional care.</p></div></section>
      <ContactPanel />
    </>
  );
}
