export const companionFeatures = [
  {
    key: "media_enrichment",
    title: "Living Memory Mosaic",
    eyebrow: "Shared media",
    description: "Bring senior-approved photographs and family context into conversation at the right moment.",
    boundary: "Nothing is shared until the senior approves it.",
  },
  {
    key: "gentle_activities",
    title: "Gentle cognitive activities",
    eyebrow: "Conversation",
    description: "Offer optional reminiscence, word, orientation, and creativity prompts without turning conversation into a test.",
    boundary: "Activities are opt-in, unscored, and can stop immediately.",
  },
  {
    key: "wellbeing_patterns",
    title: "Wellbeing patterns",
    eyebrow: "Human review",
    description: "Summarize long-term changes in engagement, mood language, and conversation rhythm for thoughtful human review.",
    boundary: "No diagnosis, emergency monitoring, or hidden risk score.",
  },
  {
    key: "medication_support",
    title: "Medication support",
    eyebrow: "Daily routine",
    description: "Deliver reminders from a verified schedule and record simple acknowledgements for the household.",
    boundary: "Soni never chooses medication or dosage.",
  },
  {
    key: "care_planning",
    title: "Collaborative support plan",
    eyebrow: "Care circle",
    description: "Turn senior-approved observations into practical questions, check-ins, and support ideas families can discuss together.",
    boundary: "Suggestions remain human-reviewed and are never medical orders.",
  },
  {
    key: "trusted_displays",
    title: "Trusted displays",
    eyebrow: "Soni Link",
    description: "Continue Soni’s face, captions, reminders, and approved memories on a nearby television or shared screen.",
    boundary: "Every device requires local approval and can be revoked.",
  },
] as const;

export type FeatureKey = (typeof companionFeatures)[number]["key"];

export const featureKeys = new Set<FeatureKey>(companionFeatures.map((feature) => feature.key));
