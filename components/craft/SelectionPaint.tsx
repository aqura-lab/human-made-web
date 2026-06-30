"use client";

import { useEffect, useRef } from "react";
import { nextPaintColor, SELECTION_INKS } from "@/lib/craft/paint";

export function SelectionPaint() {
  const count = useRef(0);
  const had = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onChange = () => {
      const sel = document.getSelection();
      const has = !!sel && !sel.isCollapsed && sel.toString().length > 0;
      if (has && !had.current) {
        const color = nextPaintColor(count.current++, SELECTION_INKS);
        document.documentElement.style.setProperty("--paint-selection", color);
      }
      had.current = has;
    };

    document.addEventListener("selectionchange", onChange);
    return () => document.removeEventListener("selectionchange", onChange);
  }, []);

  return null;
}
