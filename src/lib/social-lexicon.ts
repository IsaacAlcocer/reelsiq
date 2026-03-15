// ---------------------------------------------------------------------------
// Social Media Lexicon — language constraints for script refinement
// Layer 1: BANNED_WORDS_GUIDANCE — always active, constrains Claude's output
// Layer 2: HUMANIZER_GUIDANCE — only active when humanization is requested
// ---------------------------------------------------------------------------

/**
 * Always injected into refinement prompts. Prevents Claude from introducing
 * AI-sounding language even when making structural edits.
 */
export const BANNED_WORDS_GUIDANCE = `
YOUR OUTPUT RULES (hard constraints on YOUR writing — violating these is a failure):
- NEVER use these words/phrases in your output: leverage, utilize, delve, facilitate, encompass, robust, streamline, optimize, synergy, pivotal, holistic, elevate, empower, paradigm, innovative, cutting-edge, game-changing, transformative, harness, navigate, landscape, ecosystem, unlock, amplify
- NEVER use these transitions: furthermore, moreover, additionally, consequently, nevertheless, in addition, as a result, it is worth noting, it should be noted
- NEVER use these filler phrases: it's important to note, in today's landscape, at the end of the day, the reality is that, when it comes to, in terms of, the fact of the matter is, needless to say
- NEVER use hype/salesy language: level up, next level, absolute fire, insane, you're not ready, your [X] will never be the same, stop what you're doing, you NEED this, trust me on this, I'm not even kidding, drop everything
- NEVER use ALL-CAPS for emphasis (e.g. "LOADED", "INSANE") — reads as infomercial, not conviction
- NEVER front-load all value props — don't dump every feature in one paragraph. Unfold details progressively
- Use contractions always (don't, won't, here's, that's, it's)
- Fragment sentences are good ("Dead serious." "No joke." "Not even close.")
- Start sentences with "And," "But," "So," "Look," "Here's the thing" — that's how people talk
- One idea per sentence. Short. Punchy. No compound sentences with semicolons.
- NEVER use semicolons in social media scripts
- Write like someone talking to a friend, not presenting at a conference`;

/**
 * Only injected when humanization mode is active. Rewrites the entire script
 * to replace AI patterns with natural, conversational language.
 */
export const HUMANIZER_GUIDANCE = `
HUMANIZATION (apply to the ENTIRE script, not just your additions):
- Replace formal/corporate language with casual equivalents throughout
- Replace "utilize" → "use", "implement" → "do/try", "facilitate" → "help"
- Replace "the reality is" → "honestly" / "real talk"
- Replace "numerous" → "a ton of", "significant" → "huge/massive"
- Replace "in order to" → "to", "prior to" → "before"
- Add casual connectors: "here's the thing," "but wait," "so basically"
- Use rhetorical questions to break up monologues: "Right?" "Make sense?" "You know what I mean?"
- Numbers beat vague claims: "3 things" not "several things"
- It should sound like texting a friend who asked for advice
- If a sentence sounds like it could be in a corporate email, rewrite it
- IMPORTANT: "Casual" does NOT mean "hype." Don't replace corporate tone with infomercial tone.
  Bad: "Your edits are about to level up." Good: "Your edits will look way better."
  Bad: "This clip pack is LOADED." Good: "It's got 500 clips in it."
- State facts plainly. Let the value speak for itself — don't sell.`;
