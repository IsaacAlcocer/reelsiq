// ---------------------------------------------------------------------------
// Deterministic Scoring — computes overallScore from area grades
// Replaces Sonnet's ad-hoc scoring with a fixed, reproducible rubric.
// ---------------------------------------------------------------------------

type Grade = "strong" | "moderate" | "weak";

interface ScoringInput {
  hookGrade: Grade;
  structureGrade: Grade;
  retentionGrade: Grade;
  authenticityGrade: Grade;
  algorithmGrade: Grade;
}

// Points awarded per grade level in each area
const GRADE_POINTS: Record<Grade, number> = {
  strong: 1.0,
  moderate: 0.6,
  weak: 0.2,
};

// Weight of each area (must sum to 100)
const AREA_WEIGHTS = {
  hook: 25,
  structure: 20,
  retention: 25,
  authenticity: 20,
  algorithm: 10,
} as const;

/**
 * Computes a deterministic 0-100 score from five area grades.
 *
 * Same grades always produce the same score. The weights reflect
 * which areas matter most for actual reel performance:
 *   Hook (25) + Retention (25) = 50% — these drive views
 *   Structure (20) + Authenticity (20) = 40% — these drive trust & engagement
 *   Algorithm alignment (10) = 10% — summary signal
 */
export function computeScore(input: ScoringInput): number {
  const score =
    AREA_WEIGHTS.hook * GRADE_POINTS[input.hookGrade] +
    AREA_WEIGHTS.structure * GRADE_POINTS[input.structureGrade] +
    AREA_WEIGHTS.retention * GRADE_POINTS[input.retentionGrade] +
    AREA_WEIGHTS.authenticity * GRADE_POINTS[input.authenticityGrade] +
    AREA_WEIGHTS.algorithm * GRADE_POINTS[input.algorithmGrade];

  return Math.round(score);
}

/**
 * Derives the overallVerdict from the computed score.
 * Ensures verdict is always consistent with the score.
 */
export function computeVerdict(
  score: number
): "ready_to_post" | "needs_refinement" | "rework_needed" {
  if (score >= 75) return "ready_to_post";
  if (score >= 50) return "needs_refinement";
  return "rework_needed";
}
