"use client";

import { useState, useEffect, useCallback } from "react";

const TOUR_STORAGE_KEY = "reelsiq-tour-completed";

interface TourStep {
  selector: string;
  title: string;
  description: string;
}

const tourSteps: TourStep[] = [
  {
    selector: '[data-tour="algorithmAlignmentScore"]',
    title: "Algorithm Alignment Score",
    description:
      "Your overall alignment with Instagram's 2026 algorithm. This is the hero metric showing how well the analyzed content plays into what the algorithm rewards.",
  },
  {
    selector: '[data-tour="hookDiagnostic"]',
    title: "Hook Diagnostic",
    description:
      "How hooks perform against the Two-Step Test and Brain Trigger Trifecta. Shows whether hooks succeed through clarity, curiosity, or both.",
  },
  {
    selector: '[data-tour="packagingFramework"]',
    title: "Packaging Strategy",
    description:
      "The structural frameworks used to deliver information. Strong packaging matters more than perfect hook wording.",
  },
  {
    selector: '[data-tour="retentionArchitecture"]',
    title: "Retention Architecture",
    description:
      "How videos keep viewers watching — payoff positioning, rhetorical interrupts, and narrative structures that prevent swiping away.",
  },
  {
    selector: '[data-tour="sessionTimeStrategy"]',
    title: "Session Time Strategy",
    description:
      "Whether CTAs extend or kill viewing sessions. The algorithm rewards content that keeps people on-platform.",
  },
  {
    selector: '[data-tour="deploymentPlaybook"]',
    title: "Deployment Playbook",
    description:
      "Your concrete action plan. Trial reels, story sequences, PCR tracking, and posting cadence — everything you need to execute this week.",
  },
];

export default function GuidedTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const scrollToStep = useCallback((idx: number) => {
    const s = tourSteps[idx];
    if (!s) return;
    const el = document.querySelector(s.selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setHighlight(rect);
      }, 400);
    } else {
      setHighlight(null);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    scrollToStep(step);
  }, [active, step, scrollToStep]);

  // Update highlight position on scroll/resize
  useEffect(() => {
    if (!active) return;
    const updatePos = () => {
      const s = tourSteps[step];
      if (!s) return;
      const el = document.querySelector(s.selector);
      if (el) setHighlight(el.getBoundingClientRect());
    };
    window.addEventListener("scroll", updatePos, { passive: true });
    window.addEventListener("resize", updatePos, { passive: true });
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [active, step]);

  const finish = useCallback(() => {
    setActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  }, []);

  const next = useCallback(() => {
    if (step < tourSteps.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }, [step, finish]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  if (!active) return null;

  const currentStep = tourSteps[step];
  const isLast = step === tourSteps.length - 1;

  // Position tooltip near the highlighted element
  const tooltipTop = highlight
    ? highlight.bottom + 16
    : "50%";
  const tooltipLeft = highlight
    ? Math.min(Math.max(highlight.left, 16), window.innerWidth - 380)
    : "50%";

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={finish} />

      {/* Highlight cutout */}
      {highlight && (
        <div
          className="absolute border-2 border-violet-400 rounded-xl pointer-events-none z-[101]"
          style={{
            top: highlight.top - 8,
            left: highlight.left - 8,
            width: highlight.width + 16,
            height: highlight.height + 16,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 30px rgba(139,92,246,0.3)",
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="absolute z-[102] w-[360px] rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl"
        style={{
          top: typeof tooltipTop === "number" ? tooltipTop : tooltipTop,
          left: typeof tooltipLeft === "number" ? tooltipLeft : tooltipLeft,
          ...(typeof tooltipTop === "string" ? { transform: "translate(-50%, -50%)" } : {}),
        }}
      >
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-md bg-violet-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-400">
            Step {step + 1} of {tourSteps.length}
          </span>
          <div className="flex-1" />
          <button
            onClick={finish}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Skip tour
          </button>
        </div>

        <h4 className="text-sm font-bold text-zinc-200 mb-1.5">{currentStep.title}</h4>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">{currentStep.description}</p>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-4">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-4 bg-violet-400" : i < step ? "w-1.5 bg-violet-400/50" : "w-1.5 bg-zinc-700"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          {step > 0 && (
            <button
              onClick={prev}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-500 transition-colors"
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
