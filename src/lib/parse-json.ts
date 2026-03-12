/**
 * Robust JSON parse pipeline per BUILD_SPEC Section 11.
 *
 * Steps:
 * 1. Try JSON.parse(raw) directly
 * 2. Strip ```json and ``` fences, try again
 * 3. Regex extract first { ... } block, try again
 * 4. Return null (caller handles retry with Claude)
 */

export function tryParseJson<T = unknown>(raw: string): T | null {
  // Step 1: Direct parse
  try {
    return JSON.parse(raw) as T;
  } catch {
    // continue
  }

  // Step 2: Strip markdown fences
  const stripped = raw
    .replace(/^```(?:json)?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    // continue
  }

  // Step 3: Regex extract first { ... } block (greedy match for nested objects)
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as T;
    } catch {
      // continue
    }
  }

  // Step 4: All local attempts failed
  return null;
}
