"use client";

import { useEffect, useState } from "react";
import { buildFrames } from "@/lib/craft/typewriter";

const SCRIPT = ["AI", "", "human made"];
const FRAMES = buildFrames(SCRIPT);
const FINAL = SCRIPT[SCRIPT.length - 1];

export function Typewriter({ className }: { className?: string }) {
  // SSR / no-JS / reduced-motion all render the real final phrase.
  const [text, setText] = useState(FINAL);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    // All setState happens inside timer callbacks (never synchronously in the
    // effect body), so the chain recurses cleanly without cascading renders.
    const step = () => {
      setText(FRAMES[idx]);
      if (idx >= FRAMES.length - 1) return;
      const cur = FRAMES[idx];
      const next = FRAMES[idx + 1];
      // Pause at the empty pivot; backspace fast; type at a steady clip.
      const delay = next === "" ? 450 : next.length < cur.length ? 55 : 115;
      idx += 1;
      timer = setTimeout(step, delay);
    };

    timer = setTimeout(step, 120);
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className={className} aria-label={FINAL}>
      <span aria-hidden="true">{text}</span>
      <span className="caret" aria-hidden="true" />
    </span>
  );
}
