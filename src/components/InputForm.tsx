"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const INSTAGRAM_REEL_RE =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/[\w-]+\/?$/i;
const HANDLE_RE = /^@?[\w.]{1,30}$/;

type InputMode = "urls" | "handles" | "scripts";
type Goal =
  | "Grow followers"
  | "Get DMs & leads"
  | "Sell a product"
  | "Build authority"
  | "Drive traffic"
  | "Build brand awareness";
type Tone = "" | "casual" | "professional" | "hype" | "storytelling";
type Depth = "quick" | "deep";

interface ScriptEntry {
  title: string;
  content: string;
}

export default function InputForm() {
  const router = useRouter();

  const [mode, setMode] = useState<InputMode>("urls");
  const [urlText, setUrlText] = useState("");
  const [handles, setHandles] = useState(["", "", ""]);
  const [scripts, setScripts] = useState<ScriptEntry[]>([
    { title: "", content: "" },
  ]);
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState<Goal>("Grow followers");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState<Tone>("");
  const [offerDescription, setOfferDescription] = useState("");
  const [depth, setDepth] = useState<Depth>("quick");

  const [errors, setErrors] = useState<string[]>([]);
  const [dupWarning, setDupWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- Script helpers ---
  const addScript = () => {
    if (scripts.length < 10) {
      setScripts((prev) => [...prev, { title: "", content: "" }]);
    }
  };

  const removeScript = (idx: number) => {
    if (scripts.length > 1) {
      setScripts((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const updateScript = (
    idx: number,
    field: "title" | "content",
    value: string
  ) => {
    setScripts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // --- Client-side validation ---
  const validate = useCallback((): {
    valid: boolean;
    urls: string[];
    handles: string[];
    scripts: ScriptEntry[];
    errors: string[];
  } => {
    const errs: string[] = [];
    const urls: string[] = [];
    let validHandles: string[] = [];
    const validScripts: ScriptEntry[] = [];

    if (mode === "urls") {
      const lines = urlText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        errs.push("Paste at least one Instagram Reel URL.");
      }

      for (const line of lines) {
        if (!INSTAGRAM_REEL_RE.test(line)) {
          errs.push(`Invalid URL: "${line.slice(0, 60)}${line.length > 60 ? "..." : ""}"`);
        }
      }

      // Dedup
      const seen = new Set<string>();
      let dupes = 0;
      for (const line of lines) {
        const norm = line.replace(/\/+$/, "").toLowerCase();
        if (seen.has(norm)) {
          dupes++;
        } else {
          seen.add(norm);
          urls.push(line.replace(/\/+$/, ""));
        }
      }
      if (dupes > 0) {
        setDupWarning(`${dupes} duplicate URL${dupes > 1 ? "s" : ""} removed.`);
      } else {
        setDupWarning("");
      }

      if (urls.length > 30) {
        errs.push(`Maximum 30 URLs allowed (you have ${urls.length}).`);
      }
    } else if (mode === "handles") {
      validHandles = handles
        .map((h) => h.trim())
        .filter(Boolean);

      if (validHandles.length === 0) {
        errs.push("Enter at least one Instagram handle.");
      }

      for (const h of validHandles) {
        if (!HANDLE_RE.test(h)) {
          errs.push(`Invalid handle: "${h}"`);
        }
      }
    } else {
      // Scripts mode
      const nonEmpty = scripts.filter((s) => s.content.trim().length > 0);
      if (nonEmpty.length === 0) {
        errs.push("Write at least one script.");
      }

      for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i];
        const content = s.content.trim();
        if (!content) continue;

        const wordCount = content.split(/\s+/).filter(Boolean).length;
        if (wordCount < 20) {
          const title = s.title.trim() || `Script ${i + 1}`;
          errs.push(
            `"${title}" has only ${wordCount} words. Minimum 20 words required.`
          );
        } else {
          validScripts.push({
            title: s.title.trim() || `Script ${i + 1}`,
            content,
          });
        }
      }
    }

    if (!niche.trim()) {
      errs.push("Niche is required.");
    }

    return {
      valid: errs.length === 0,
      urls,
      handles: validHandles,
      scripts: validScripts,
      errors: errs,
    };
  }, [mode, urlText, handles, scripts, niche]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    setErrors(v.errors);
    if (!v.valid) return;

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        niche: niche.trim(),
        goal,
      };

      if (mode === "urls") {
        body.urls = v.urls;
        body.depth = depth;
      } else if (mode === "handles") {
        body.handles = v.handles;
        body.depth = depth;
      } else {
        body.jobType = "scripts";
        body.scripts = v.scripts;
        if (targetAudience.trim()) body.targetAudience = targetAudience.trim();
        if (tone) body.tone = tone;
        if (offerDescription.trim()) body.offerDescription = offerDescription.trim();
      }

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? [data.error ?? "Something went wrong."]);
        return;
      }

      router.push(`/analysis/${data.jobId}`);
    } catch {
      setErrors(["Network error. Please try again."]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetHandle = (idx: number, val: string) => {
    setHandles((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 rounded-lg bg-zinc-900 p-1">
        <button
          type="button"
          onClick={() => setMode("urls")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            mode === "urls"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Reel URLs
        </button>
        <button
          type="button"
          onClick={() => setMode("handles")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            mode === "handles"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Handles
        </button>
        <button
          type="button"
          onClick={() => setMode("scripts")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            mode === "scripts"
              ? "bg-violet-600 text-white"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Script Lab
        </button>
      </div>

      {/* Script Lab description */}
      {mode === "scripts" && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3">
          <p className="text-sm text-violet-300">
            Paste your own scripts to get them audited against Instagram&apos;s growth
            theory framework. Each script gets a scorecard with grades, issues,
            and a refined opening.
          </p>
        </div>
      )}

      {/* URL textarea */}
      {mode === "urls" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Reel URLs <span className="text-zinc-500">(one per line, max 30)</span>
          </label>
          <textarea
            rows={6}
            placeholder={"https://www.instagram.com/reel/ABC123\nhttps://www.instagram.com/reel/DEF456"}
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {dupWarning && (
            <p className="mt-1 text-xs text-amber-400">{dupWarning}</p>
          )}
        </div>
      )}

      {/* Handle inputs */}
      {mode === "handles" && (
        <div className="space-y-3">
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Instagram Handles <span className="text-zinc-500">(up to 3)</span>
          </label>
          {handles.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm">@</span>
              <input
                type="text"
                placeholder={`handle${i + 1}`}
                value={h}
                onChange={(e) => handleSetHandle(i, e.target.value)}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* Script inputs */}
      {mode === "scripts" && (
        <div className="space-y-4">
          {scripts.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-600/20 text-[10px] font-bold text-violet-400 tabular-nums">
                  {i + 1}
                </span>
                <input
                  type="text"
                  placeholder={`Script ${i + 1} title (optional)`}
                  value={s.title}
                  onChange={(e) => updateScript(i, "title", e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {scripts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeScript(i)}
                    className="text-zinc-600 hover:text-red-400 transition"
                    title="Remove script"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <textarea
                rows={6}
                placeholder="Paste your script here... (minimum 20 words)"
                value={s.content}
                onChange={(e) => updateScript(i, "content", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              {s.content.trim() && (
                <p className="text-xs text-zinc-500">
                  {s.content.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              )}
            </div>
          ))}

          {scripts.length < 10 && (
            <button
              type="button"
              onClick={addScript}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 py-3 text-sm text-zinc-500 hover:border-violet-500 hover:text-violet-400 transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add another script
            </button>
          )}
        </div>
      )}

      {/* Niche */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          Your Niche
        </label>
        <input
          type="text"
          placeholder='e.g. "video editing education"'
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {/* Goal */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-300">
          Goal
        </label>
        <select
          value={goal}
          onChange={(e) => setGoal(e.target.value as Goal)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option>Grow followers</option>
          <option>Get DMs &amp; leads</option>
          <option>Sell a product</option>
          <option>Build authority</option>
          <option>Drive traffic</option>
          <option>Build brand awareness</option>
        </select>
      </div>

      {/* Script Lab extras */}
      {mode === "scripts" && (
        <>
          {/* Target Audience */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Target Audience{" "}
              <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              type="text"
              placeholder='e.g. "beginner video editors aged 18-25"'
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Tone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Tone / Voice{" "}
              <span className="text-zinc-500">(optional)</span>
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              <option value="">Auto-detect from script</option>
              <option value="casual">Casual &amp; conversational</option>
              <option value="professional">Professional &amp; polished</option>
              <option value="hype">High-energy &amp; hype</option>
              <option value="storytelling">Storytelling &amp; narrative</option>
            </select>
          </div>

          {/* Offer / Product Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              What are you promoting?{" "}
              <span className="text-zinc-500">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder='e.g. "A clip pack with 500+ cinematic shots, b-roll, and movie clips organized by vibe — $29 one-time"'
              value={offerDescription}
              onChange={(e) => setOfferDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
        </>
      )}

      {/* Depth toggle (only for reels mode) */}
      {mode !== "scripts" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-300">
            Analysis Depth
          </label>
          <div className="flex gap-2 rounded-lg bg-zinc-900 p-1 border border-zinc-700">
            <button
              type="button"
              onClick={() => setDepth("quick")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                depth === "quick"
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Quick <span className="text-xs opacity-70">(top 10)</span>
            </button>
            <button
              type="button"
              onClick={() => setDepth("deep")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
                depth === "deep"
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Deep <span className="text-xs opacity-70">(top 25)</span>
            </button>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-red-400">
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting
          ? mode === "scripts"
            ? "Starting audit..."
            : "Starting analysis..."
          : mode === "scripts"
          ? "Audit Scripts"
          : "Analyze Reels"}
      </button>
    </form>
  );
}
