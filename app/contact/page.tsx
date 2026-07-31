"use client";

import { useState } from "react";
import PageHero from "../components/PageHero";

const CONTACT_EMAIL = "soni.companion@gmail.com";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Let’s talk about Soni."
        intro="Share your interest in a demonstration, senior-community pilot, research collaboration, technical contribution, or project support."
      />
      <section className="section section--light">
        <div className="shell contact-layout">
          <div className="contact-layout__intro">
            <p className="eyebrow">Good conversations to start</p>
            <h2>Tell us where you fit into the project.</h2>
            <ul className="check-list">
              <li>Senior community or care organization</li>
              <li>Faculty or research partner</li>
              <li>Student, maker, or technical contributor</li>
              <li>Family member or older adult interested in the idea</li>
              <li>Potential sponsor or community supporter</li>
            </ul>
            <div className="contact-email-card">
              <span>Direct email</span>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </div>
            <p className="form-note">
              Submitting this form opens a prepared message in your email app. No form
              information is stored by the website.
            </p>
          </div>
          <form
            className="contact-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const name = String(form.get("name") || "");
              const email = String(form.get("email") || "");
              const organization = String(form.get("organization") || "");
              const interest = String(form.get("interest") || "");
              const message = String(form.get("message") || "");
              const subject = `Soni project inquiry — ${interest}`;
              const body = [
                `Name: ${name}`,
                `Email: ${email}`,
                organization ? `Organization: ${organization}` : "",
                `Interest: ${interest}`,
                "",
                message,
              ]
                .filter(Boolean)
                .join("\n");

              setSubmitted(true);
              window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            }}
          >
            <label>Name<input name="name" autoComplete="name" required /></label>
            <label>Email<input type="email" name="email" autoComplete="email" required /></label>
            <label>Organization <span>(optional)</span><input name="organization" autoComplete="organization" /></label>
            <label>I am interested in<select name="interest" defaultValue="A demonstration"><option>A demonstration</option><option>A senior-community pilot</option><option>Research collaboration</option><option>Technical collaboration</option><option>Supporting the project</option><option>Something else</option></select></label>
            <label>Message<textarea name="message" rows={6} required /></label>
            <button className="button button--dark" type="submit">Open email draft</button>
            {submitted && <p className="form-status" role="status">Your email app should open with a message addressed to {CONTACT_EMAIL}.</p>}
          </form>
        </div>
      </section>
    </>
  );
}
