// The Craft Library — principles from Carnegie, Headlee, Van Edwards, Duhigg,
// Brooks, Fine, and storytelling craft. Stored as data so it can rotate through
// the Daily Download colophon, power the /craft page, and arm the Ember.
//
// Voice: warm, practical, second person. Never "say this to Bob."

export type CraftTag =
  | "asking"
  | "listening"
  | "telling"
  | "hooks"
  | "people"
  | "curiosity"
  | "structure"
  | "presence";

export type CraftNote = {
  id: string;
  source: string;
  principle: string;
  body: string;
  tags: CraftTag[];
};

export const CRAFT_NOTES: CraftNote[] = [
  // --- Dale Carnegie — How to Win Friends and Influence People (1936) ---
  {
    id: "carnegie-their-interests",
    source: "Dale Carnegie",
    principle: "Talk in terms of the other person's interests",
    body: "The royal road to a person's heart is to talk about the things they treasure most. Before you launch into your topic, ask yourself: what does this person light up about — their kid's soccer season, their sourdough starter, their industry? Frame your story or your ask through that door and they'll walk through it with you.",
    tags: ["people", "telling", "hooks"],
  },
  {
    id: "carnegie-roosevelt-homework",
    source: "Dale Carnegie",
    principle: "Do your homework like Roosevelt",
    body: "Whenever Theodore Roosevelt expected a visitor, he stayed up late the night before reading up on the subject he knew his guest cared about. You can do the two-minute version: before coffee with a friend, recall what they mentioned last time — the job interview, the trip, the ailing parent — and open there. Preparation is how you make interest visible.",
    tags: ["people", "curiosity", "presence"],
  },
  {
    id: "carnegie-duvernoy",
    source: "Dale Carnegie",
    principle: "Duvernoy's four wasted years",
    body: "A baker named Duvernoy pitched bread to a hotel manager every week for four years and got nowhere — then learned the manager was passionate about his hotel-executives society, asked about that, and got the order within days. When you're stuck with someone, stop pushing your agenda and find their passion. The shortest path to your topic often runs straight through theirs.",
    tags: ["people", "asking", "curiosity"],
  },
  {
    id: "carnegie-chalif-pride",
    source: "Dale Carnegie",
    principle: "Lead with their pride, not your request",
    body: "Edward Chalif needed a corporate president to fund one Boy Scout's trip to Europe — so he opened by asking to see the framed million-dollar cancelled check the man was famously proud of. He left with funding for five boys and more. Before making any ask, spend real time on what the other person is proudest of.",
    tags: ["people", "asking", "hooks"],
  },
  {
    id: "carnegie-genuine-interest",
    source: "Dale Carnegie",
    principle: "Become genuinely interested in other people",
    body: "You'll make more friends in two months by becoming interested in other people than in two years of trying to get people interested in you. Carnegie's proof is the dog — the one animal that makes its living by giving nothing but love. Interest is not a tactic you deploy; it's an orientation you practice.",
    tags: ["curiosity", "people", "presence"],
  },
  {
    id: "carnegie-thurston",
    source: "Dale Carnegie",
    principle: "Thurston's stage whisper",
    body: "Howard Thurston, the most successful magician of his era, said many magicians looked at audiences and thought \"suckers\"; before every show he instead repeated, \"I love my audience. I'll give them my very best.\" People detect which stance you're in within seconds. Walk into every conversation on Thurston's side of that line.",
    tags: ["presence", "people"],
  },
  {
    id: "carnegie-listener",
    source: "Dale Carnegie",
    principle: "The brilliant conversationalist who barely spoke",
    body: "Carnegie once spent a dinner party mostly listening to a botanist, said almost nothing — and was later described as \"a most interesting conversationalist.\" Few humans are proof against the implied flattery of rapt attention. To be interesting, be interested: exclusive attention is the compliment.",
    tags: ["listening", "presence", "people"],
  },
  {
    id: "carnegie-open-valve",
    source: "Dale Carnegie",
    principle: "Encourage others to talk about themselves",
    body: "When someone is wound up — excited or angry — your job is to open the valve, not compete for airtime. Lincoln once summoned an old friend just to be heard while deciding on Emancipation; furious customers soften the moment someone lets them empty the grievance without interruption. Ask, then let them finish completely.",
    tags: ["listening", "asking", "people"],
  },
  {
    id: "carnegie-important",
    source: "Dale Carnegie",
    principle: "Make the other person feel important — sincerely",
    body: "William James called the craving to be appreciated \"the deepest principle in human nature.\" Feed it honestly: notice something specific and true. The test that separates this from flattery: flattery tells people what they already think of themselves, from the teeth out; appreciation is specific, true, and from the heart.",
    tags: ["people", "presence"],
  },
  {
    id: "carnegie-enlargement",
    source: "Dale Carnegie",
    principle: "Their interests enlarge your life",
    body: "Howard Herzig, asked what he got from always talking to people's interests, said the reward was different from every person — but always \"an enlargement of his life.\" Talking in terms of others' interests isn't self-erasure; it's how you collect worlds. Every hobby you ask about is a free education.",
    tags: ["curiosity", "people"],
  },

  // --- Celeste Headlee — 10 Ways to Have a Better Conversation (TED) ---
  {
    id: "headlee-no-multitask",
    source: "Celeste Headlee",
    principle: "Don't multitask",
    body: "Be fully present — not half in the conversation and half in your phone or your lunch plans. If you want out of the conversation, get out; don't be half in it.",
    tags: ["presence", "listening"],
  },
  {
    id: "headlee-no-pontificate",
    source: "Celeste Headlee",
    principle: "Don't pontificate",
    body: "Enter every conversation assuming you have something to learn. If you want to state opinions with no pushback, write a blog. True listening requires setting yourself aside.",
    tags: ["presence", "curiosity", "listening"],
  },
  {
    id: "headlee-open-questions",
    source: "Celeste Headlee",
    principle: "Use open-ended questions",
    body: "Start with who, what, when, where, why, how. Ask \"What was that like?\" instead of \"Were you scared?\" — they'll stop to think, and you'll get the interesting answer instead of a yes or no.",
    tags: ["asking", "curiosity"],
  },
  {
    id: "headlee-flow",
    source: "Celeste Headlee",
    principle: "Go with the flow",
    body: "Let thoughts — including your clever prepared story — come and go. Follow the conversation that's actually happening, not the one you rehearsed.",
    tags: ["presence", "listening"],
  },
  {
    id: "headlee-say-so",
    source: "Celeste Headlee",
    principle: "If you don't know, say so",
    body: "Talk like you're on the record. Not bluffing makes everything else you say worth more.",
    tags: ["presence"],
  },
  {
    id: "headlee-not-your-story",
    source: "Celeste Headlee",
    principle: "Don't equate your experience with theirs",
    body: "Their lost job or their grief is not your cue for your version of the story. All experiences are individual — and more importantly, it is not about you. Ask what it was like for them.",
    tags: ["listening", "people"],
  },
  {
    id: "headlee-no-repeat",
    source: "Celeste Headlee",
    principle: "Don't repeat yourself",
    body: "Rephrasing your point over and over is condescending and boring. Land it once and move on.",
    tags: ["telling", "structure"],
  },
  {
    id: "headlee-weeds",
    source: "Celeste Headlee",
    principle: "Stay out of the weeds",
    body: "People don't care about the exact years, names, and dates you're struggling to recall. They care about you and what you two share — so drop the details and keep the story moving.",
    tags: ["telling", "structure"],
  },
  {
    id: "headlee-listen",
    source: "Celeste Headlee",
    principle: "Listen",
    body: "If your mouth is open, you're not learning. Listening is the most important skill and the hardest — we'd rather talk, and our minds run four times faster than speech. Spend the surplus on attention, not rehearsal.",
    tags: ["listening", "presence"],
  },
  {
    id: "headlee-brief",
    source: "Celeste Headlee",
    principle: "Be brief",
    body: "\"A good conversation is like a miniskirt: short enough to retain interest, long enough to cover the subject.\" Underneath all ten rules: be genuinely interested in other people, and prepare to be amazed.",
    tags: ["telling", "structure"],
  },

  // --- Vanessa Van Edwards — Captivate / Cues ---
  {
    id: "vve-sparkers",
    source: "Vanessa Van Edwards",
    principle: "Swap starters for sparkers",
    body: "\"How are you?\" and \"What do you do?\" trigger autopilot scripts. Conversation sparkers — \"Working on anything exciting these days?\", \"Any trips coming up?\", \"What's your story?\" — force a fresh answer. One upgraded question per conversation is enough to change its temperature.",
    tags: ["asking", "hooks", "curiosity"],
  },
  {
    id: "vve-novelty",
    source: "Vanessa Van Edwards",
    principle: "Ride the dopamine of novelty",
    body: "Novelty activates the brain's reward pathways — dopamine flows when people get to think a new thought or share something they've never been asked. Cause that little hit and the brain tags you as significant and memorable. Be the person who asks the question nobody else asks.",
    tags: ["asking", "hooks", "curiosity"],
  },
  {
    id: "vve-hot-buttons",
    source: "Vanessa Van Edwards",
    principle: "Hunt for hot buttons",
    body: "A hot button is any topic that visibly lights someone up — they lean in, their words speed up. Probe gently across topics and watch for the flare; when you find it, stay there and dig. Conversations are remembered by their peak moments, and hot buttons are how you make peaks.",
    tags: ["people", "listening", "curiosity"],
  },
  {
    id: "vve-story-stack",
    source: "Vanessa Van Edwards",
    principle: "Build a story stack",
    body: "Keep a pre-loaded toolbox: topics you expect to come up, a short sparking story for each, and a boomerang — a question that throws the ball back (\"…has anything like that ever happened to you?\"). You're not scripting; you're making sure that when a common topic lands, you have something better than a cliché.",
    tags: ["telling", "structure", "asking"],
  },
  {
    id: "vve-warmth",
    source: "Vanessa Van Edwards",
    principle: "Warmth before competence",
    body: "Charisma is a balance of warmth cues (real smiles, nodding, using names) and competence cues (steady voice, purposeful gestures) — most people over-signal one and starve the other. In casual conversation, lead with warmth: people decide whether they like you before they decide whether they're impressed.",
    tags: ["presence", "people"],
  },

  // --- Storytelling structures ---
  {
    id: "story-spine",
    source: "Kenn Adams (via Pixar)",
    principle: "The story spine",
    body: "\"Once upon a time… and every day… but one day… because of that… until finally… and ever since then.\" It forces a stable world, a disruption, causal consequences, and a changed ending. Retelling a news story? Find its \"but one day\": what was normal, what broke, and what's different now.",
    tags: ["structure", "telling"],
  },
  {
    id: "but-therefore",
    source: "Trey Parker & Matt Stone",
    principle: "The but/therefore rule",
    body: "If the beats of your story connect with \"and then… and then…\", it's dead. Each beat should connect with \"but\" or \"therefore\": \"Scientists found X, but it contradicted Y, therefore they tried Z.\" That's a story; a list of facts is a Wikipedia entry. Audit your retellings for \"and then.\"",
    tags: ["structure", "telling"],
  },
  {
    id: "lead-interesting",
    source: "Stand-up craft",
    principle: "Lead with the most interesting element",
    body: "Comedians ruthlessly reorder reality so the strangest, most vivid detail comes first — \"a guy tried to pay his taxes in live eels\" beats two minutes of setup. You have about ten seconds of granted attention; spend them on the hook, then backfill context only as needed. Get in late, get out early.",
    tags: ["hooks", "telling", "structure"],
  },
  {
    id: "moth-stakes",
    source: "The Moth",
    principle: "Stakes first",
    body: "A story needs stakes — what did someone have to gain or lose, and how were they different at the end? Even retelling news, add the personal layer: \"I read this and couldn't stop thinking about it because…\" A fact becomes a story the moment someone in it — or telling it — has something at risk.",
    tags: ["telling", "structure", "hooks"],
  },
  {
    id: "moth-anchors",
    source: "The Moth",
    principle: "Know your first and last lines",
    body: "Moth tellers memorize only two things: the opening line (drop us into a scene or a question) and the closing line (the landing that says what it meant). Everything between can flex. Two anchored sentences turn rambling into telling.",
    tags: ["structure", "telling", "hooks"],
  },
  {
    id: "stanton-care",
    source: "Andrew Stanton (Pixar)",
    principle: "Make me care — and use 2+2",
    body: "Stanton's first commandment: make me care within the first moments. His companion move is the 2+2 rule — don't give the audience four; give them two plus two and let them do the math. Pose the puzzle (\"Guess what the researchers found\") rather than delivering the answer flat.",
    tags: ["hooks", "telling", "curiosity"],
  },
  {
    id: "anchor-human",
    source: "Narrative journalism",
    principle: "Anchor the abstract in one human or one image",
    body: "Feature writers never open with the statistic; they open with the one nurse, the one town, the one number made physical (\"a data center that drinks as much water as 30,000 homes\"). Convert the abstraction into a single concrete anchor your listener can picture. Vivid beats comprehensive.",
    tags: ["hooks", "telling", "structure"],
  },

  // --- Duhigg, Brooks, Fine ---
  {
    id: "duhigg-deep-questions",
    source: "Charles Duhigg",
    principle: "Ask deep questions",
    body: "A deep question invites values, beliefs, or feelings rather than facts — \"What made you choose nursing?\" instead of \"Where do you work?\" People enjoy these questions far more than we predict, and almost never find them intrusive. Ask about the why behind the fact you'd normally ask about.",
    tags: ["asking", "curiosity", "people"],
  },
  {
    id: "duhigg-looping",
    source: "Charles Duhigg",
    principle: "Loop for understanding",
    body: "Three steps: ask a question, repeat back what you heard in your own words, then ask \"Did I get that right?\" It proves you listened rather than performed listening — and it's contagious: loop someone and they start looping you. Especially powerful when things get tense.",
    tags: ["listening", "asking", "people"],
  },
  {
    id: "duhigg-three-conversations",
    source: "Charles Duhigg",
    principle: "Match the conversation you're actually in",
    body: "Every discussion is really one of three conversations — practical (what's this about?), emotional (how do we feel?), or social (who are we?) — and connection fails when people are in different ones. Before offering solutions, check: does this person want help, a hug, or to be heard?",
    tags: ["listening", "people", "presence"],
  },
  {
    id: "brooks-illuminator",
    source: "David Brooks",
    principle: "Be an illuminator, not a diminisher",
    body: "Diminishers stereotype, ignore, and listen only to reply. Illuminators shine the beam of their attention on others and make them feel seen — lit by curiosity, affection, and receptivity. Be a loud listener, don't fear the pause, and ask big questions: \"What crossroads are you at?\"",
    tags: ["people", "listening", "curiosity", "presence"],
  },
  {
    id: "fine-appetizer",
    source: "Debra Fine",
    principle: "Small talk is the appetizer — and it's on you",
    body: "Take responsibility for the conversation: pick the person standing alone, use their name, and come with two or three openers so nothing depends on inspiration. The workhorse follow-up is \"Tell me more.\" Small talk isn't trivial; it's the on-ramp to every relationship worth having.",
    tags: ["asking", "people", "presence"],
  },
];

/** Deterministic daily rotation — same note all day, different tomorrow. */
export function craftNoteForDate(date: Date): CraftNote {
  const day = Math.floor(date.getTime() / 86_400_000);
  return CRAFT_NOTES[day % CRAFT_NOTES.length];
}

/** Condensed Carnegie chapter brief — fed to the Ember's system prompt. */
export const CARNEGIE_BRIEF = `Dale Carnegie's fifth principle for making people like you — "Talk in terms of the other person's interests" — holds that the royal road to a person's heart is to talk about the things they treasure most. Roosevelt stayed up late before any visit reading on the subject his guest cared about: interest is prepared, not improvised — a deliberate act of respect. Chalif won sponsorship for five Boy Scouts by opening with the framed million-dollar cancelled check the executive was proud of, not with his ask. Duvernoy sold bread to a hotel only after four failed years, once he began talking about the manager's beloved hotel-executives society. The mechanics: (1) research before contact; (2) enter through the other person's passion, not your agenda — the agenda often resolves itself; (3) attention to what someone is proud of reads as respect, not manipulation, provided it is sincere. Carnegie is explicit that flattery — counterfeit, self-serving, "from the teeth out" — fails and insults; genuine interest is specific, honest, and given without keeping score. The test: do you actually want the answer, and are you willing to be changed or delighted by it? Herzig, who practiced this all his life, said the reward was always "an enlargement of his life." Coaching implication: help the user recall or research what the other person loves, open there, ask real questions about it, and hold their own topic loosely.`;
