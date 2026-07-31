import type { ReactNode } from "react";

export default function ConceptDisclaimer({
  children = "Concept rendering — Soni’s physical design is still a work in progress and may change during fit testing.",
  className = "",
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <p className={`concept-disclaimer ${className}`.trim()} role="note">
      {children}
    </p>
  );
}
