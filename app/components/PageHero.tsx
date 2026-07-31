import type { ReactNode } from "react";

export default function PageHero({
  eyebrow,
  title,
  intro,
  children,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children?: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <section className={`page-hero page-hero--${tone}`}>
      <div className="shell page-hero__inner">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-hero__intro">{intro}</p>
        {children}
      </div>
    </section>
  );
}
