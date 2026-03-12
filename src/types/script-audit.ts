// ---------------------------------------------------------------------------
// Script Audit Types — V2 Script Lab
// ---------------------------------------------------------------------------

/** User-provided script input */
export interface ScriptInput {
  title: string;
  content: string;
}

/** Per-field assessment used throughout scorecards */
export interface AssessmentGrade {
  grade: "strong" | "moderate" | "weak";
  feedback: string;
}

/** Individual issue found in a script */
export interface ScriptIssue {
  area:
    | "hook"
    | "packaging"
    | "retention"
    | "authenticity"
    | "cta"
    | "pacing"
    | "emotion";
  severity: "critical" | "moderate" | "minor";
  issue: string;
  suggestion: string;
}

/** Algorithm signal alignment (reused from formula-card pattern) */
export interface AuditAlgorithmSignal {
  signal: string;
  status: "aligned" | "partially_aligned" | "misaligned";
  note: string;
}

/** Per-script scorecard produced by the audit synthesis */
export interface ScriptScorecard {
  scriptTitle: string;
  overallVerdict: "ready_to_post" | "needs_refinement" | "rework_needed";
  overallScore: number;

  hookAssessment: AssessmentGrade & {
    twoStepTestVerdict: string;
    hookText: string;
  };

  packagingAssessment: AssessmentGrade & {
    detectedFramework: string;
    recommendedFramework: string;
  };

  retentionAssessment: AssessmentGrade & {
    payoffPosition: string;
    interruptDensity: string;
  };

  authenticityAssessment: AssessmentGrade & {
    aiDetectionRisk: "low" | "medium" | "high";
    flaggedPhrases: string[];
  };

  algorithmAlignment: {
    grade: "strong" | "moderate" | "weak";
    signals: AuditAlgorithmSignal[];
  };

  topIssues: ScriptIssue[];

  refinedOpening: string;

  summaryNote: string;
}

/** Full audit result returned by the synthesis call */
export interface ScriptAuditResult {
  scriptsAudited: number;
  niche: string;
  scorecards: ScriptScorecard[];
  crossScriptPatterns: string[];
  topRecommendation: string;
}
