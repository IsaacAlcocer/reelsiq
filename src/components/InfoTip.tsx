"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { glossary, type GlossaryKey } from "@/lib/glossary";

interface InfoTipProps {
  termKey: GlossaryKey;
}

export default function InfoTip({ termKey }: InfoTipProps) {
  const entry = glossary[termKey];
  if (!entry) return null;

  return <InfoTipInner label={entry.label} description={entry.shortDescription} example={entry.example} />;
}

function InfoTipInner({
  label,
  description,
  example,
}: {
  label: string;
  description: string;
  example: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("above");
  const tipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);

  const updatePosition = useCallback(() => {
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    setPosition(rect.top < 240 ? "below" : "above");
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      if (tipRef.current && !tipRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, updatePosition]);

  return (
    <span className="relative inline-flex items-center ml-1" ref={tipRef}>
      <button
        ref={iconRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => { setOpen(true); updatePosition(); }}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-zinc-800 border border-zinc-700 text-[9px] font-bold text-zinc-500 hover:text-violet-400 hover:border-violet-500/40 transition-colors cursor-help"
        aria-label={`Info: ${label}`}
      >
        i
      </button>

      {open && (
        <div
          className={`absolute z-50 w-72 rounded-xl border border-zinc-700/80 bg-zinc-900 shadow-2xl shadow-black/40 p-4 ${
            position === "above"
              ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
              : "top-full mt-2 left-1/2 -translate-x-1/2"
          }`}
        >
          {/* Arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 border-zinc-700/80 bg-zinc-900 ${
              position === "above"
                ? "bottom-[-5px] border-b border-r"
                : "top-[-5px] border-t border-l"
            }`}
          />

          <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1.5">
            {label}
          </p>
          <p className="text-xs text-zinc-300 leading-relaxed mb-2">
            {description}
          </p>
          <div className="border-t border-zinc-800 pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">
              Example
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              {example}
            </p>
          </div>
        </div>
      )}
    </span>
  );
}
