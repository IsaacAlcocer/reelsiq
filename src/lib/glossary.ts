export interface GlossaryEntry {
  label: string;
  shortDescription: string;
  example: string;
}

export const glossary: Record<string, GlossaryEntry> = {
  algorithmAlignmentScore: {
    label: "Algorithm Alignment Score",
    shortDescription:
      "A composite rating of how well the analyzed content aligns with Instagram's 2026 ranking signals. The algorithm prioritizes session time, viewer satisfaction, and engagement over raw watch time.",
    example:
      'A reel with profile-driving CTAs, delayed payoff, and strong hooks scores "Strong Alignment" because it optimizes for session time and viewer satisfaction.',
  },
  twoStepTest: {
    label: "Two-Step Hook Test",
    shortDescription:
      "Every hook must pass two gates to work on cold audiences: (1) Instant Clarity — the viewer immediately recognizes 'this is for me,' and (2) Curiosity Gap — they wonder 'but how?' creating a question only the full video answers.",
    example:
      '"3 editing tricks that will save you 10 hours this week" passes both gates — clarity (this is for editors) and gap (what are the tricks?).',
  },
  brainTriggerTrifecta: {
    label: "Brain Trigger Trifecta",
    shortDescription:
      "The highest-performing hooks layer three simultaneous triggers: a visual trigger (familiar setting), text hook (on-screen text), and spoken line (verbal hook). All three fire at once in the first 1-2 seconds.",
    example:
      "A cooking reel showing a kitchen (visual), 'Secret restaurant technique' on screen (text), and saying 'Chefs don't want you to know this' (spoken).",
  },
  payoffDelay: {
    label: "Payoff Delay",
    shortDescription:
      "A retention technique where the core answer or reveal is deliberately held until the final moments of the video. If viewers get the answer early, they swipe away and retention drops.",
    example:
      "A reel about a morning routine teases '...but the one thing that changed everything' in the first 5 seconds and only reveals it in the last 3 seconds.",
  },
  packagingFramework: {
    label: "Packaging Framework",
    shortDescription:
      "The unique lens or structural framework used to deliver information. Strong packaging makes the idea itself interesting — you don't need to stress over exact hook wording. Videos fail more often from weak packaging than weak hooks.",
    example:
      "'Millionaire Morning Routine vs. Broke Morning Routine' uses a Comparison A vs B framework, making ordinary advice feel compelling.",
  },
  sessionBehavior: {
    label: "Session Behavior",
    shortDescription:
      "How the CTA at the end of a reel affects the viewer's session on Instagram. The algorithm rewards content that extends sessions (drives to profile/series) and penalizes content that kills sessions (external links).",
    example:
      "'Follow for Part 2' extends the session (profile driver), while 'Link in bio to buy' kills the session (external link).",
  },
  rhetoricalInterrupts: {
    label: "Rhetorical Interrupts",
    shortDescription:
      "Mid-script pivots, questions, topic shifts, or pattern breaks that re-capture attention. High-performing 40-second reels can have 30+ secondary hooks. These are the spoken equivalents of visual zooms and scene cuts.",
    example:
      "Phrases like 'But here's the thing...', 'Wait, it gets better', 'Now this is where it gets interesting' are all rhetorical interrupts.",
  },
  confidenceLevel: {
    label: "Confidence Level",
    shortDescription:
      "Indicates how reliable a detected pattern is based on sample size. High confidence means the pattern appeared consistently across many reels; low confidence means it was seen in only a few.",
    example:
      "A hook template found in 8 out of 10 reels gets 'high' confidence; one found in 2 out of 10 gets 'low' confidence.",
  },
  pcr: {
    label: "PCR (Post-to-Conversion Rate)",
    shortDescription:
      "A tracking framework to measure how effectively your reels convert viewers into followers, leads, or customers. Track this metric week-over-week to measure the real ROI of your content strategy.",
    example:
      "If a reel gets 10,000 views and drives 50 new followers, the PCR is 0.5%. The deployment playbook suggests tracking this across posting cadences.",
  },
  hookDiagnostic: {
    label: "Hook Diagnostic",
    shortDescription:
      "A breakdown of how the analyzed reels' hooks perform against the Two-Step Test and Brain Trigger Trifecta. Reveals whether hooks succeed through clarity, curiosity, or both.",
    example:
      "If 7 of 10 hooks pass both gates but only 2 use the full trifecta, there's an opportunity to add visual and text triggers.",
  },
  winningHooks: {
    label: "Winning Hook Formulas",
    shortDescription:
      "Reusable fill-in-the-blank hook templates extracted from the top-performing reels, ranked by frequency and grounded in hook psychology theory.",
    example:
      "Template: 'Why [RESULT] is actually [COUNTERINTUITIVE CLAIM]' — e.g., 'Why waking up at 5am is actually killing your productivity.'",
  },
  retentionArchitecture: {
    label: "Retention Architecture",
    shortDescription:
      "The structural blueprint of how videos keep viewers watching. Covers payoff positioning, rhetorical interrupt density, and narrative structures (problem-solution, story arc, etc.).",
    example:
      "A reel using problem-solution with delayed payoff and 8 rhetorical interrupts per minute has strong retention architecture.",
  },
  emotionalJourney: {
    label: "Emotional Journey",
    shortDescription:
      "The emotional arc that runs through the analyzed content. Effective reels take viewers through a deliberate emotional sequence — from curiosity to insight, or from frustration to relief.",
    example:
      "A pattern of 'frustration (hook) -> curiosity (setup) -> validation (payoff)' keeps viewers emotionally invested throughout.",
  },
  sessionTimeStrategy: {
    label: "Session Time Strategy",
    shortDescription:
      "How the analyzed content affects viewer session time on Instagram. The algorithm optimizes for total session time — content that keeps people on-platform gets distributed further.",
    example:
      "A signature series like 'Day 1 of learning piano' creates binge sessions because viewers watch multiple parts, extending session time.",
  },
  ctaPatterns: {
    label: "CTA Patterns",
    shortDescription:
      "The call-to-action styles found across analyzed reels, categorized as soft (subtle nudge), direct (explicit ask), or embedded (woven into content). Each is rated for session impact.",
    example:
      "'Follow for more' (direct, session-extending) vs. 'Link in bio' (direct, session-killing) vs. content that naturally makes you check the profile (embedded).",
  },
  bingeabilityScore: {
    label: "Bingeability Score",
    shortDescription:
      "Rates how likely viewers are to watch multiple reels in a row from the same creator. High bingeability means the content creates a 'Netflix effect' where viewers consume several videos in sequence.",
    example:
      "A creator with a numbered series, consistent format, and profile-driving CTAs scores 'high' bingeability.",
  },
  crossNicheTransferables: {
    label: "Cross-Niche Transferables",
    shortDescription:
      "Structural patterns from the analyzed content that work regardless of niche. These are universal engagement mechanics that can be adapted to any topic area.",
    example:
      "'Using contrarian framing to challenge assumptions' works whether you're teaching cooking, fitness, or software development.",
  },
  deploymentPlaybook: {
    label: "Deployment Playbook",
    shortDescription:
      "A concrete, week-by-week action plan for implementing the extracted patterns. Includes trial reel strategy, story sequences, optimization loops, and posting cadence recommendations.",
    example:
      "Week 1: Post 3 trial reels using the top hook template. Week 2: Double down on the best performer. Week 3: Launch a signature series.",
  },
  vocabularyProfile: {
    label: "Vocabulary & Rhythm",
    shortDescription:
      "The language register, sentence style, and key words that resonate in this niche. Includes words to use (proven engagement drivers) and words to avoid (engagement killers or trust breakers).",
    example:
      "In a fitness niche: use 'unlock', 'game-changer', 'nobody talks about' (action-oriented). Avoid 'synergy', 'optimize', 'leverage' (corporate/AI-sounding).",
  },
  topInsight: {
    label: "Top Insight",
    shortDescription:
      "The single most important, actionable finding from the entire analysis. This is the one thing that would make the biggest difference if implemented immediately.",
    example:
      "'The top performers in this niche all delay their payoff to the final 3 seconds — none of the analyzed reels reveal the answer before the 80% mark.'",
  },
  sessionKiller: {
    label: "Session Killer",
    shortDescription:
      "Any CTA or content element that drives viewers away from Instagram, reducing session time. The algorithm actively penalizes this behavior, especially for smaller accounts.",
    example:
      "'Click the link in my bio' or 'Head to my website' are session killers because they send viewers off-platform.",
  },
  signatureSeries: {
    label: "Signature Series",
    shortDescription:
      "A numbered or themed series of reels designed to create binge sessions. The 'Netflix mental model' — your profile becomes a library that viewers want to binge through.",
    example:
      "'Day 1 of my 30-day design challenge', 'Underrated tools Pt. 7', or 'Cooking myths debunked #12' all create series-driven binge behavior.",
  },
  narrativeStructure: {
    label: "Narrative Structure",
    shortDescription:
      "The storytelling format used in a reel — problem-solution, before-after, numbered list, story arc, how-to, rant, case study, or myth bust. Each structure has different retention characteristics.",
    example:
      "Problem-solution works well for educational content ('You're making this mistake -> here's the fix'), while story arc works for personal brand building.",
  },
  trustRecession: {
    label: "Trust Recession",
    shortDescription:
      "The 2026 audience trend where viewers actively repel anything that feels robotic, AI-generated, or performative. Authenticity and genuine value are the only durable advantages in content creation.",
    example:
      "Audiences can now detect AI-generated scripts instantly. Creators who sound 'real' and share genuine experiences dominate the trust economy.",
  },
  paceProfile: {
    label: "Pace Profile",
    shortDescription:
      "The rhythm and timing characteristics of the analyzed content, including words per minute, average duration, and alignment with Instagram's optimal length sweet spots (11-30s or 60-120s).",
    example:
      "A 'rapid-fire' pace with 180 words/minute in a 25-second reel fits the quick-attention sweet spot perfectly.",
  },
};

export type GlossaryKey = keyof typeof glossary;

export function getGlossaryEntry(key: string): GlossaryEntry | undefined {
  return glossary[key];
}
