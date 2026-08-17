import Image from "next/image";
import type { DemoProfile, DemoSignal } from "@/lib/demo-profiles";

function Sparkline({ signal }: { signal: DemoSignal }) {
  const width = 180;
  const height = 52;
  const minimum = Math.min(...signal.points);
  const maximum = Math.max(...signal.points);
  const range = Math.max(maximum - minimum, 1);
  const points = signal.points.map((point, index) => {
    const x = signal.points.length === 1 ? width / 2 : (index / (signal.points.length - 1)) * width;
    const y = height - 6 - ((point - minimum) / range) * (height - 12);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg className={`demo-sparkline demo-sparkline--${signal.tone}`} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${signal.label}: ${signal.value}, ${signal.context}`}>
      <line x1="0" y1={height - 6} x2={width} y2={height - 6} />
      <polyline points={points} />
      <circle cx={points.split(" ").at(-1)?.split(",")[0]} cy={points.split(" ").at(-1)?.split(",")[1]} r="3.5" />
    </svg>
  );
}

export default function DemoProfileExperience({ profile, enabledFeatures }: { profile: DemoProfile; enabledFeatures: readonly string[] }) {
  const enabled = new Set(enabledFeatures);

  return (
    <div className="demo-experience">
      <aside className="demo-disclosure" aria-label="Synthetic demonstration notice">
        <span>Synthetic scholarship demo</span>
        <p>Every person, event, trend, medication reminder, and family update below is fictional. No participant data is used.</p>
      </aside>

      <section className="demo-today" aria-labelledby="demo-today-title">
        <div className="demo-section-heading">
          <div><p className="eyebrow">Soni today</p><h2 id="demo-today-title">A calm view of what matters now.</h2></div>
          <p>{profile.greeting}</p>
        </div>
        <div className="demo-today-grid">
          {profile.today.map((item) => <article key={item.label}><strong>{item.value}</strong><span>{item.label}</span></article>)}
        </div>
      </section>

      {enabled.has("media_enrichment") && <section className="demo-memory" aria-labelledby="demo-memory-title">
        <div className="demo-memory__image">
          <Image src={profile.image} alt={profile.imageAlt} fill sizes="(max-width: 800px) 100vw, 58vw" priority />
          <span>Synthetic family media</span>
        </div>
        <div className="demo-memory__copy">
          <p className="eyebrow">Living Memory Mosaic</p>
          <h2 id="demo-memory-title">{profile.memory.title}</h2>
          <p>{profile.memory.caption}</p>
          <blockquote>“{profile.memory.prompt}”</blockquote>
          <div className="demo-chip-row">{profile.memory.facts.map((fact) => <span key={fact}>{fact}</span>)}</div>
          <small>Only senior-approved media and context can appear in a real profile.</small>
        </div>
      </section>}

      <div className="demo-feature-pair">
        <section className="demo-card demo-card--conversation" aria-labelledby="demo-conversation-title">
          <div className="demo-card__meta"><span>Conversation intelligence</span><span>Today</span></div>
          <h2 id="demo-conversation-title">A story worth returning to.</h2>
          <blockquote>“{profile.conversation.quote}”</blockquote>
          <dl><div><dt>Theme noticed</dt><dd>{profile.conversation.theme}</dd></div><div><dt>Respectful next step</dt><dd>{profile.conversation.followUp}</dd></div></dl>
          <p className="demo-data-note">Summary only · no raw audio or transcript retained</p>
        </section>

        {enabled.has("gentle_activities") && <section className="demo-card demo-card--activity" aria-labelledby="demo-activity-title">
          <div className="demo-card__meta"><span>Gentle cognitive activity</span><span>Opt-in</span></div>
          <h2 id="demo-activity-title">{profile.activity.title}</h2>
          <p>{profile.activity.description}</p>
          <div className="demo-result"><strong>How it went</strong><span>{profile.activity.result}</span></div>
          <p className="demo-data-note">Unscored · no diagnosis · stops immediately on request</p>
        </section>}
      </div>

      {enabled.has("wellbeing_patterns") && <section className="demo-wellbeing" aria-labelledby="demo-wellbeing-title">
        <div className="demo-section-heading">
          <div><p className="eyebrow">Personal wellbeing baseline</p><h2 id="demo-wellbeing-title">{profile.wellbeing.headline}</h2></div>
          <p>{profile.wellbeing.explanation}</p>
        </div>
        <div className="demo-signal-grid">
          {profile.wellbeing.signals.map((signal) => <article key={signal.label}>
            <div><span>{signal.label}</span><strong>{signal.value}</strong><small>{signal.context}</small></div>
            <Sparkline signal={signal} />
          </article>)}
        </div>
        <p className="demo-clinical-boundary"><strong>Human review required.</strong> These conversational signals can suggest a caring check-in; they cannot detect, diagnose, or predict a medical condition.</p>
      </section>}

      <div className="demo-routine-grid">
        {enabled.has("medication_support") && <section className="demo-panel" aria-labelledby="demo-medication-title">
          <div className="demo-panel__heading"><div><p className="eyebrow">Medication support</p><h2 id="demo-medication-title">Verified routine</h2></div><span className="demo-live-dot">On schedule</span></div>
          <div className="demo-list">{profile.medication.map((item) => <article key={`${item.time}-${item.label}`}><time>{item.time}</time><div><strong>{item.label}</strong><span>{item.status}</span></div></article>)}</div>
          <p className="demo-data-note">Soni repeats a confirmed schedule. She never selects a medication or dose.</p>
        </section>}

        {enabled.has("trusted_displays") && <section className="demo-panel" aria-labelledby="demo-devices-title">
          <div className="demo-panel__heading"><div><p className="eyebrow">Soni Link</p><h2 id="demo-devices-title">Trusted devices</h2></div><span className="demo-live-dot">Local approval</span></div>
          <div className="demo-list demo-device-list">{profile.devices.map((device) => <article key={device.name}><span className="demo-device-icon" aria-hidden="true">▣</span><div><strong>{device.name}</strong><span>{device.detail}</span></div><em>{device.status}</em></article>)}</div>
          <p className="demo-data-note">A real TV must be approved on Soni’s touchscreen before it receives anything.</p>
        </section>}
      </div>

      {enabled.has("care_planning") && <section className="demo-care" aria-labelledby="demo-care-title">
        <div className="demo-section-heading">
          <div><p className="eyebrow">Care Circle</p><h2 id="demo-care-title">Turn daily context into a shared plan.</h2></div>
          <p>Family and care partners see only what the senior has approved. Suggestions remain collaborative, reversible, and human-led.</p>
        </div>
        <div className="demo-care-grid">
          <div className="demo-care-updates"><h3>Recent circle updates</h3>{profile.careCircle.map((person) => <article key={`${person.initials}-${person.name}`}><span>{person.initials}</span><div><strong>{person.name} · {person.relationship}</strong><p>{person.update}</p></div></article>)}</div>
          <div className="demo-plan"><h3>Support plan</h3>{profile.plan.map((item) => <article key={item.title}><span>{item.status}</span><h4>{item.title}</h4><p>{item.detail}</p></article>)}</div>
        </div>
      </section>}
    </div>
  );
}
