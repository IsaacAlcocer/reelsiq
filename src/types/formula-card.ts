export interface AlgorithmSignal {
  signal: string;
  status: "aligned" | "partially_aligned" | "misaligned";
  note: string;
}

export interface AlgorithmAlignmentScore {
  overall: "strong" | "moderate" | "weak";
  signals: AlgorithmSignal[];
  biggestGap: string;
  biggestStrength: string;
}

export interface TwoStepTestResults {
  passedBothGates: number;
  clarityOnlyNoGap: number;
  gapOnlyNoClarity: number;
  failedBoth: number;
  insight: string;
}

export interface BrainTriggerTrifectaUsage {
  fullTrifecta: number;
  partialCount: number;
  noneCount: number;
  recommendation: string;
}

export interface HookDiagnosticData {
  twoStepTestResults: TwoStepTestResults;
  brainTriggerTrifectaUsage: BrainTriggerTrifectaUsage;
  dominantHookCategory: string;
  dominantHookCategoryFrequency: number;
}

export interface WinningHook {
  category: string;
  template: string;
  example: string;
  frequency: number;
  frequencyPercent: number;
  confidenceLevel: "high" | "medium" | "low";
  twoStepVerdict: string;
  psychologyNote: string;
}

export interface PackagingRecommendation {
  framework: string;
  template: string;
  example: string;
  whyItWorks: string;
}

export interface PackagingBreakdownItem {
  framework: string;
  count: number;
}

export interface PackagingStrategyData {
  dominantPackaging: string;
  dominantPackagingFrequency: number;
  packagingBreakdown: PackagingBreakdownItem[];
  recommendedPackaging: PackagingRecommendation[];
  insight: string;
}

export interface PayoffDelayAnalysis {
  earlyPayoff: number;
  middlePayoff: number;
  delayedPayoff: number;
  noClearPayoff: number;
  insight: string;
}

export interface NarrativeStructure {
  type: string;
  frequency: number;
  breakdown: string[];
  note: string;
}

export interface RetentionArchitectureData {
  payoffDelayAnalysis: PayoffDelayAnalysis;
  avgRhetoricalInterrupts: number;
  interruptDensityVerdict: "high_density" | "moderate" | "low_density";
  interruptRecommendation: string;
  dominantStructure: NarrativeStructure;
  secondaryStructure?: NarrativeStructure;
}

export interface VocabularyProfileData {
  level: string;
  sentenceStyle: string;
  wordsToUse: string[];
  wordsToAvoid: string[];
  authenticityNote: string;
}

export interface SessionBehaviorBreakdown {
  profileDrivers: number;
  externalLinks: number;
  engagementPrompts: number;
  seriesReferences: number;
  noCta: number;
}

export interface SessionTimeStrategyData {
  sessionBehaviorBreakdown: SessionBehaviorBreakdown;
  sessionKillerWarning: string | null;
  bingeabilityScore: "high" | "medium" | "low";
  bingeabilityNote: string;
  seriesRecommendation: string;
}

export interface CTAPattern {
  style: "soft" | "direct" | "embedded";
  template: string;
  frequency: number;
  sessionImpact: "session_extending" | "session_neutral" | "session_killing";
}

export interface StorySequence {
  story1: string;
  story2: string;
  story3: string;
}

export interface DeploymentPlaybookData {
  trialReelStrategy: string;
  storySequence: StorySequence;
  optimizationLoop: string;
  seriesLaunchPlan: string;
  pcrTracking: string;
  postingCadence: string;
}

export interface PaceProfile {
  rhythm: string;
  avgEstimatedWordCount: number;
  avgDurationSeconds: number;
  dominantDurationBucket: string;
  sweetSpotAlignment: "aligned" | "misaligned";
  sweetSpotNote: string;
}

export interface FormulaCardData {
  hookDiagnostic: HookDiagnosticData;
  winningHooks: WinningHook[];
  packagingStrategy: PackagingStrategyData;
  retentionArchitecture: RetentionArchitectureData;
  vocabularyProfile: VocabularyProfileData;
  emotionalJourney: string;
  sessionTimeStrategy: SessionTimeStrategyData;
  ctaPatterns: CTAPattern[];
  paceProfile: PaceProfile;
  algorithmAlignmentScore: AlgorithmAlignmentScore;
  crossNicheTransferables: string[];
  readyToUseScriptOpening: string;
  topInsight: string;
  deploymentPlaybook: DeploymentPlaybookData;
}

export interface FormulaCardResponse {
  nicheName: string;
  reelsAnalyzed: number;
  formulaCard: FormulaCardData;
}
