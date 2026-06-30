"use client";

import { useEffect, useRef } from "react";
import {
  TRAIL_INKS, brushParams, nextPaintColor, pickMedium, trailEnabled, type BrushParams,
} from "@/lib/craft/paint";

type Pt = { x: number; y: number; color: string; brush: BrushParams; life: number };

export function CursorPaint() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!trailEnabled({ finePointer, reducedMotion })) return;

    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pts: Pt[] = [];
    let raf = 0;
    let stroke = 0;
    let color = nextPaintColor(stroke, TRAIL_INKS);
    let medium = pickMedium(stroke);
    let last: { x: number; y: number } | null = null;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const onMove = (e: PointerEvent) => {
      if (last) {
        if (Math.hypot(e.clientX - last.x, e.clientY - last.y) > 60) {
          stroke++;
          color = nextPaintColor(stroke, TRAIL_INKS);
          medium = pickMedium(stroke * 7 + 3);
        }
        pts.push({ x: e.clientX, y: e.clientY, color, brush: brushParams(medium), life: 1 });
        if (pts.length > 240) pts.splice(0, pts.length - 240);
      }
      last = { x: e.clientX, y: e.clientY };
    };

    const frame = () => {
      // Clear in CSS pixels; the active dpr transform maps this to the full canvas.
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let k = 1; k < pts.length; k++) {
        const a = pts[k - 1];
        const b = pts[k];
        b.life -= 0.02;
        if (b.life <= 0) continue;
        ctx.globalAlpha = Math.max(0, b.brush.alpha * b.life);
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.brush.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = b.brush.blur;
        ctx.shadowColor = b.color;
        const jx = Math.sin(k * 1.7) * b.brush.jitter;
        const jy = Math.cos(k * 1.3) * b.brush.jitter;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x + jx, b.y + jy);
        ctx.stroke();
      }
      while (pts.length && pts[0].life <= 0) pts.shift();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = window.requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        raf = window.requestAnimationFrame(frame);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("visibilitychange", onVisibility);
    raf = window.requestAnimationFrame(frame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="cursor-paint" />;
}
