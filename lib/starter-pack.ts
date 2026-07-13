// Brian's starter pack — interests with weights/angles plus feeds that were
// live-verified (fetched, valid RSS/Atom, fresh items) on 2026-07-13.
// Installed in one tap from /fuelup; safe to re-run (upserts by URL).

export type StarterFeed = { title: string; url: string };

export type StarterInterest = {
  label: string;
  why: string;
  weight: number;
  subtopics: string[];
  feeds: StarterFeed[];
};

export const STARTER_PACK: StarterInterest[] = [
  {
    label: "Performance & creative strategy",
    why: "Runs performance creative — cares about what actually makes ads work: creative strategy, testing, the craft behind campaigns.",
    weight: 1.0,
    subtopics: ["creative testing", "brand campaigns", "ad platforms", "media buying"],
    feeds: [
      { title: "AdExchanger", url: "https://www.adexchanger.com/feed/" },
      { title: "Adweek", url: "https://www.adweek.com/feed/" },
      { title: "Marketing Dive", url: "https://www.marketingdive.com/feeds/news/" },
      {
        title: "Google News — performance marketing & ad creative",
        url: "https://news.google.com/rss/search?q=%22performance+marketing%22+OR+%22ad+creative%22&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  {
    label: "AI advertising tools (Meta & beyond)",
    why: "Meta's AI ad stack specifically — Advantage+, generative creative — plus the wider wave of AI tools reshaping marketing work.",
    weight: 1.0,
    subtopics: ["Meta Advantage+", "generative ad creative", "AI marketing tools", "platform updates"],
    feeds: [
      { title: "Meta Newsroom", url: "https://about.fb.com/news/feed/" },
      {
        title: "Google News — Meta Advantage+ AI ads",
        url: "https://news.google.com/rss/search?q=Meta+Advantage%2B+AI+ads&hl=en-US&gl=US&ceid=US:en",
      },
      { title: "Social Media Examiner", url: "https://www.socialmediaexaminer.com/feed/" },
      { title: "Marketing AI Institute", url: "https://www.marketingaiinstitute.com/blog/rss.xml" },
      { title: "Ben's Bites", url: "https://www.bensbites.com/feed" },
      { title: "Social Media Today", url: "https://www.socialmediatoday.com/feeds/news/" },
    ],
  },
  {
    label: "AI & vibe coding",
    why: "Follows the frontier — model releases, agents, and the vibe-coding way of building software.",
    weight: 1.0,
    subtopics: ["model releases", "coding agents", "vibe coding", "AI tooling"],
    feeds: [
      { title: "Simon Willison", url: "https://simonwillison.net/atom/everything/" },
      { title: "Hacker News front page", url: "https://hnrss.org/frontpage" },
      { title: "Latent Space", url: "https://www.latent.space/feed" },
      { title: "OpenAI News", url: "https://openai.com/news/rss.xml" },
      { title: "Ars Technica — AI", url: "https://arstechnica.com/ai/feed/" },
      {
        title: "Google News — Anthropic Claude",
        url: "https://news.google.com/rss/search?q=Anthropic+Claude&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  {
    label: "Pickleball",
    why: "Plays — wants pro-tour drama, gear talk, and the culture war between pickleball and everyone else's tennis courts.",
    weight: 0.8,
    subtopics: ["pro tour", "gear", "technique", "the culture"],
    feeds: [
      { title: "The Dink", url: "https://www.thedinkpickleball.com/rss/" },
      { title: "r/Pickleball", url: "https://www.reddit.com/r/Pickleball/.rss" },
      { title: "PPA Tour", url: "https://www.ppatour.com/feed/" },
      {
        title: "Google News — pickleball",
        url: "https://news.google.com/rss/search?q=pickleball&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  {
    label: "Comedy & Kill Tony",
    why: "Kill Tony devotee — the regulars, the breakout sets, plus the broader stand-up scene.",
    weight: 0.8,
    subtopics: ["Kill Tony", "stand-up specials", "comedy scene", "Austin comedy"],
    feeds: [
      { title: "r/Killtony", url: "https://www.reddit.com/r/Killtony/.rss" },
      {
        title: "Kill Tony on YouTube",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCwzCMiicL-hBUzyjWiJaseg",
      },
      { title: "Chortle", url: "https://www.chortle.co.uk/rss" },
      { title: "The Comic's Comic", url: "https://thecomicscomic.com/feed/" },
      {
        title: "Google News — Kill Tony",
        url: "https://news.google.com/rss/search?q=%22Kill+Tony%22&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  {
    label: "Diet, peptides & longevity",
    why: "Mostly fuel for friends who are deep in peptides and protocols — enough fluency to ask great questions.",
    weight: 0.5,
    subtopics: ["peptides", "longevity research", "protocols", "sleep & recovery"],
    feeds: [
      { title: "Peter Attia MD", url: "https://peterattiamd.com/feed/" },
      { title: "Huberman Lab", url: "https://feeds.megaphone.fm/hubermanlab" },
      { title: "r/Peptides", url: "https://www.reddit.com/r/Peptides/.rss" },
      { title: "Lifespan.io", url: "https://www.lifespan.io/feed/" },
      {
        title: "Google News — peptides & longevity",
        url: "https://news.google.com/rss/search?q=peptides+longevity+research&hl=en-US&gl=US&ceid=US:en",
      },
    ],
  },
  {
    label: "Modern Wisdom & big ideas",
    why: "Chris Williamson's beat — psychology, status games, self-improvement with intellectual teeth.",
    weight: 0.8,
    subtopics: ["psychology", "philosophy", "self-improvement", "podcast guests"],
    feeds: [
      { title: "Modern Wisdom (podcast)", url: "https://feeds.megaphone.fm/modernwisdom" },
      {
        title: "Chris Williamson on YouTube",
        url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCIaH-gZIVC432YRjNVvnyCA",
      },
      { title: "Astral Codex Ten", url: "https://www.astralcodexten.com/feed" },
      { title: "The Art of Manliness", url: "https://www.artofmanliness.com/feed/" },
    ],
  },
];
