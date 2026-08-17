export const DEMO_PROFILE_LABELS = [
  "Demo home · Margaret",
  "Demo home · Walter",
  "Demo home · June",
] as const;

export type DemoSignal = {
  label: string;
  value: string;
  context: string;
  points: readonly number[];
  tone: "steady" | "positive" | "review";
};

export type DemoProfile = {
  key: string;
  profileLabel: (typeof DEMO_PROFILE_LABELS)[number];
  preferredName: string;
  location: string;
  summary: string;
  accent: string;
  image: string;
  imageAlt: string;
  greeting: string;
  today: readonly { value: string; label: string }[];
  memory: {
    title: string;
    caption: string;
    prompt: string;
    facts: readonly string[];
  };
  conversation: {
    quote: string;
    theme: string;
    followUp: string;
  };
  activity: {
    title: string;
    description: string;
    result: string;
  };
  wellbeing: {
    headline: string;
    explanation: string;
    signals: readonly DemoSignal[];
  };
  medication: readonly {
    time: string;
    label: string;
    status: "Acknowledged" | "Upcoming" | "Family check-in";
  }[];
  devices: readonly {
    name: string;
    detail: string;
    status: string;
  }[];
  careCircle: readonly {
    initials: string;
    name: string;
    relationship: string;
    update: string;
  }[];
  plan: readonly {
    title: string;
    detail: string;
    status: string;
  }[];
};

export const demoProfiles: readonly DemoProfile[] = [
  {
    key: "margaret-garden",
    profileLabel: "Demo home · Margaret",
    preferredName: "Margaret",
    location: "Fictional home · Midwest",
    summary: "Storytelling, family memories, daily routines, and a steady wellbeing baseline.",
    accent: "Garden stories",
    image: "/images/demo/living-memory-mosaic.webp",
    imageAlt: "Synthetic vintage family photographs of a garden, lakeside picnic, and birthday gathering.",
    greeting: "Good afternoon, Margaret. Your rose-garden story is ready to continue whenever you are.",
    today: [
      { value: "3", label: "Warm check-ins" },
      { value: "24 min", label: "Conversation" },
      { value: "2 / 2", label: "Routines confirmed" },
      { value: "Steady", label: "Personal pattern" },
    ],
    memory: {
      title: "The roses behind the first house",
      caption: "Soni connected today’s comment about pink roses with three senior-approved family memories.",
      prompt: "You once said the climbers did best beside the kitchen window. What was your secret?",
      facts: ["Rose garden · 1968", "Lake picnic · 1976", "Family birthday · 1982"],
    },
    conversation: {
      quote: "The roses always looked their best after a soft summer rain.",
      theme: "Home, gardening, and family traditions",
      followUp: "Offer the lake-picnic photograph if Margaret wants to keep reminiscing.",
    },
    activity: {
      title: "Finish the garden saying",
      description: "A light word-and-memory prompt woven into garden talk—never scored and easy to skip.",
      result: "Accepted with a laugh · stopped naturally after 4 minutes",
    },
    wellbeing: {
      headline: "Conversation rhythm remains within Margaret’s usual range.",
      explanation: "Soni compares only with this fictional profile’s own multi-day baseline. One unusual day never becomes a conclusion.",
      signals: [
        { label: "Engagement", value: "Steady", context: "near 28-day baseline", points: [58, 60, 57, 62, 61, 63, 62], tone: "steady" },
        { label: "Positive language", value: "+8%", context: "after family call", points: [42, 45, 43, 47, 51, 54, 56], tone: "positive" },
        { label: "Response pauses", value: "Typical", context: "no sustained change", points: [44, 43, 45, 44, 46, 45, 44], tone: "steady" },
      ],
    },
    medication: [
      { time: "8:00 AM", label: "Morning medication · schedule verified", status: "Acknowledged" },
      { time: "6:00 PM", label: "Evening medication · schedule verified", status: "Upcoming" },
    ],
    devices: [
      { name: "Living room TV", detail: "Soni face and approved memories", status: "Ready" },
      { name: "Family tablet", detail: "Care Circle summaries", status: "Connected" },
      { name: "Soni touchscreen", detail: "Local consent and privacy control", status: "Primary" },
    ],
    careCircle: [
      { initials: "AL", name: "Alex", relationship: "Daughter", update: "Shared a labeled garden photograph for Margaret to approve." },
      { initials: "DR", name: "Dana", relationship: "Care coordinator", update: "Reviewed the weekly non-diagnostic wellbeing summary." },
    ],
    plan: [
      { title: "Plan a garden-center visit", detail: "Ask Margaret which Saturday feels best before involving family.", status: "Ask Margaret" },
      { title: "Keep evening calls predictable", detail: "Family noticed that a regular call supports an easier evening routine.", status: "In discussion" },
    ],
  },
  {
    key: "walter-workshop",
    profileLabel: "Demo home · Walter",
    preferredName: "Walter",
    location: "Fictional home · Great Lakes",
    summary: "Purposeful activities, subtle pattern review, and collaborative family support.",
    accent: "Workshop memories",
    image: "/images/demo/workshop-memory-mosaic.webp",
    imageAlt: "Synthetic vintage photographs of radio repair, fishing, and a neighborhood cookout.",
    greeting: "Morning, Walter. I found the radio-repair memory you approved last week.",
    today: [
      { value: "2", label: "Warm check-ins" },
      { value: "18 min", label: "Conversation" },
      { value: "1", label: "Family message" },
      { value: "Review", label: "Gentle follow-up" },
    ],
    memory: {
      title: "The radio that came back to life",
      caption: "A story about fixing a dial prompted an approved workshop photograph and a new family question.",
      prompt: "Your grandson wondered how you knew which tube had failed. Would you tell him the trick?",
      facts: ["Workshop · 1966", "Fishing lesson · 1977", "Block cookout · 1981"],
    },
    conversation: {
      quote: "You listened for the hum before you ever reached for a screwdriver.",
      theme: "Craft, problem-solving, and passing knowledge forward",
      followUp: "Save Walter’s explanation as a family-approved story after he reviews the wording.",
    },
    activity: {
      title: "What tool am I describing?",
      description: "A conversational clue game based on Walter’s interests, offered only after he asked for something fun.",
      result: "Completed 5 prompts · no score retained",
    },
    wellbeing: {
      headline: "A small pause-pattern shift is worth a human check-in, not an alarm.",
      explanation: "The fictional trend crossed a conservative multi-day threshold. Soni recommends a friendly conversation and continued observation—not a diagnosis.",
      signals: [
        { label: "Engagement", value: "Slightly lower", context: "4 days, still variable", points: [64, 63, 61, 58, 55, 54, 53], tone: "review" },
        { label: "Vocabulary variety", value: "Typical", context: "within personal range", points: [55, 57, 56, 54, 55, 56, 55], tone: "steady" },
        { label: "Response pauses", value: "+11%", context: "consider a check-in", points: [41, 42, 44, 47, 49, 51, 52], tone: "review" },
      ],
    },
    medication: [
      { time: "9:00 AM", label: "Morning medication · schedule verified", status: "Acknowledged" },
      { time: "1:00 PM", label: "Midday medication · schedule verified", status: "Family check-in" },
    ],
    devices: [
      { name: "Den television", detail: "Captions and memory cards", status: "Ready" },
      { name: "Caregiver phone", detail: "Approved reminders and plans", status: "Connected" },
      { name: "Soni touchscreen", detail: "Local consent and privacy control", status: "Primary" },
    ],
    careCircle: [
      { initials: "MW", name: "Morgan", relationship: "Son", update: "Asked for a low-pressure afternoon call this week." },
      { initials: "KC", name: "Kai", relationship: "Caregiver", update: "Noted that Walter skipped lunch before yesterday’s conversation." },
    ],
    plan: [
      { title: "Friendly afternoon check-in", detail: "Ask about sleep, lunch, and how Walter is feeling before interpreting any pattern.", status: "Family review" },
      { title: "Record a radio story", detail: "Invite Walter to make a short voice keepsake only if he opts in.", status: "Proposed" },
    ],
  },
  {
    key: "june-music",
    profileLabel: "Demo home · June",
    preferredName: "June",
    location: "Fictional residence · Pacific Northwest",
    summary: "Music-led connection, shared family moments, and seamless room-to-room displays.",
    accent: "Music and connection",
    image: "/images/demo/music-memory-mosaic.webp",
    imageAlt: "Synthetic vintage photographs of singing, dancing, and baking with grandchildren.",
    greeting: "Hello, June. Your living-room display is ready, and the family song request is waiting.",
    today: [
      { value: "4", label: "Warm check-ins" },
      { value: "31 min", label: "Conversation" },
      { value: "3", label: "Shared memories" },
      { value: "Upbeat", label: "Conversation tone" },
    ],
    memory: {
      title: "The song everyone knew",
      caption: "Soni connected June’s humming with approved photographs from family music nights and a community dance.",
      prompt: "Was that the song everyone joined after supper, or am I thinking of another favorite?",
      facts: ["Piano night · 1964", "Community dance · 1973", "Cookie day · 1983"],
    },
    conversation: {
      quote: "Nobody needed the words on paper—we all knew when to come in.",
      theme: "Music, community, and family rituals",
      followUp: "Offer the family’s new audio greeting after June approves using the television speakers.",
    },
    activity: {
      title: "Name that memory",
      description: "Soni offers a gentle choice between a song, photograph, or story prompt and follows June’s lead.",
      result: "June chose a story · activity flowed into conversation",
    },
    wellbeing: {
      headline: "Social engagement rose on days with music and family contact.",
      explanation: "This fictional association helps the family plan more of what June enjoys. It does not claim that music caused a health outcome.",
      signals: [
        { label: "Engagement", value: "+16%", context: "music and family days", points: [45, 47, 50, 54, 57, 61, 64], tone: "positive" },
        { label: "Positive language", value: "Above usual", context: "3-day pattern", points: [48, 49, 52, 56, 59, 61, 62], tone: "positive" },
        { label: "Response pauses", value: "Typical", context: "within personal range", points: [46, 45, 47, 46, 44, 45, 45], tone: "steady" },
      ],
    },
    medication: [
      { time: "8:30 AM", label: "Morning medication · schedule verified", status: "Acknowledged" },
      { time: "8:30 PM", label: "Evening medication · schedule verified", status: "Upcoming" },
    ],
    devices: [
      { name: "Living room TV", detail: "Soni face, captions, and memories", status: "Live" },
      { name: "Kitchen display", detail: "Reminders and family greetings", status: "Ready" },
      { name: "Family tablet", detail: "Care Circle summaries", status: "Connected" },
    ],
    careCircle: [
      { initials: "SJ", name: "Sam", relationship: "Grandchild", update: "Shared a new audio greeting for June to approve." },
      { initials: "RJ", name: "Riley", relationship: "Daughter", update: "Suggested another family music hour next Sunday." },
    ],
    plan: [
      { title: "Sunday music hour", detail: "Coordinate the television display and family call around June’s preferred time.", status: "Approved" },
      { title: "Build a song memory collection", detail: "Add titles one at a time with June’s approval and personal context.", status: "In progress" },
    ],
  },
] as const;

const demoByLabel = new Map<string, DemoProfile>(demoProfiles.map((profile) => [profile.profileLabel, profile]));

export function demoProfileForLabel(label: string) {
  return demoByLabel.get(label) ?? null;
}
