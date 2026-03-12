"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const INSTAGRAM_REEL_RE =
  /^https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p)\/[\w-]+\/?$/i;
const HANDLE_RE = /^@?[\w.]{1,30}$/;

type InputMode = "urls" | "handles";
type Goal = "Grow following" | "Generate leads" | "Build brand awareness";
type Depth = "quick" | "deep";

export default function InputForm() {
  const router = useRouter();

  const [mode, setMode] = useState<InputMode>("urls");
  const [urlText, setUrlText] = useState("");
  const [handles, setHandles] = useState(["", "", ""]);
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState<Goal>("Grow following");
  const [depth, setDepth] = useState<Depth>("quick");

  const [errors, setErrors] = useState<string[]>([]);
  const [dupWarning, setDupWarning] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- Client-side validation ---
  const validate = useCallback((): {
    valid: boolean;
    urls: string[];
    handles: string[];
    errors: string[];
  } => {
    const errs: string[] = [];
    let urls: string[] = [];
    let validHandles: string[] = [];

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
    } else {
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
    }

    if (!niche.trim()) {
      errs.push("Niche is required.");
    }

    return { valid: errs.length === 0, urls, handles: validHandles, errors: errs };
  }, [mode, urlText, handles, niche]);

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
        depth,
      };
      if (mode === "urls") {
        body.urls = v.urls;
      } else {
        body.handles = v.handles;
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
          Instagram Handles
        </button>
      </div>

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
          <option>Grow following</option>
          <option>Generate leads</option>
          <option>Build brand awareness</option>
        </select>
      </div>

      {/* Depth toggle */}
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
        {submitting ? "Starting analysis..." : "Analyze Reels"}
      </button>
    </form>
  );
}
