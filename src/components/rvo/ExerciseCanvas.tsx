import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";
import type { BackgroundKey, DotColor, ExerciseMode, Axis, SaccadeDirection } from "@/lib/rvo-types";

export interface CanvasParams {
  mode: ExerciseMode;
  axis: Axis;
  saccadeDirection: SaccadeDirection;
  frequency: number;
  amplitude: number; // %
  dotSize: number;
  dotColor: DotColor;
  background: BackgroundKey;
  running: boolean;
}

export interface CanvasHandle {
  recenter: () => void;
}

interface Props {
  params: CanvasParams;
  containerRef?: React.RefObject<HTMLDivElement>;
}

const COLOR_MAP: Record<DotColor, string> = {
  red: "hsl(0 84% 55%)",
  blue: "hsl(217 91% 55%)",
  black: "hsl(0 0% 8%)",
  white: "hsl(0 0% 100%)",
};

const BG_CLASS: Record<BackgroundKey, string> = {
  plain: "bg-plain",
  grid: "bg-grid",
  stripes: "bg-stripes",
  busy: "bg-busy",
};

export const ExerciseCanvas = forwardRef<CanvasHandle, Props>(function ExerciseCanvas({ params, containerRef }, ref) {
  const innerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const wrapRef = containerRef ?? innerRef;

  // Volatile params via refs
  const p = useRef(params);
  p.current = params;

  // animation state
  const startRef = useRef<number>(performance.now());
  const lastJumpRef = useRef<number>(0);
  const lastJumpPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number>(0);

  const setDot = (x: number, y: number) => {
    if (dotRef.current) {
      dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    }
  };

  useImperativeHandle(ref, () => ({
    recenter: () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setDot(r.width / 2, r.height / 2);
    },
  }));

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setDot(r.width / 2, r.height / 2);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    startRef.current = performance.now();
    lastJumpRef.current = 0;

    const loop = (t: number) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const cur = p.current;

      if (!cur.running || cur.mode === "fixed") {
        setDot(cx, cy);
      } else if (cur.mode === "moving") {
        const elapsed = (t - startRef.current) / 1000;
        const phase = Math.sin(2 * Math.PI * cur.frequency * elapsed);
        if (cur.axis === "vertical") {
          const ay = (cur.amplitude / 100) * (rect.height / 2);
          setDot(cx, cy + phase * ay);
        } else {
          const ax = (cur.amplitude / 100) * (rect.width / 2);
          setDot(cx + phase * ax, cy);
        }
      } else if (cur.mode === "jump") {
        const interval = 1000 / Math.max(0.1, cur.frequency);
        if (t - lastJumpRef.current >= interval) {
          lastJumpRef.current = t;
          const ax = (cur.amplitude / 100) * (rect.width / 2);
          const ay = (cur.amplitude / 100) * (rect.height / 2);
          let pos = { x: cx, y: cy };
          const dir = cur.saccadeDirection;
          const pickSign = () => (Math.random() < 0.5 ? -1 : 1);
          if (dir === "horizontal") {
            pos = { x: cx + pickSign() * ax, y: cy };
          } else if (dir === "vertical") {
            pos = { x: cx, y: cy + pickSign() * ay };
          } else if (dir === "diagonal") {
            pos = { x: cx + pickSign() * ax, y: cy + pickSign() * ay };
          } else {
            // random — 4 corners + center alternatives, avoid same as last
            const choices = [
              { x: cx + ax, y: cy },
              { x: cx - ax, y: cy },
              { x: cx, y: cy + ay },
              { x: cx, y: cy - ay },
              { x: cx + ax, y: cy + ay },
              { x: cx - ax, y: cy - ay },
              { x: cx + ax, y: cy - ay },
              { x: cx - ax, y: cy + ay },
            ];
            let pick = choices[Math.floor(Math.random() * choices.length)];
            const last = lastJumpPosRef.current;
            let guard = 0;
            while (last && Math.abs(pick.x - last.x) < 1 && Math.abs(pick.y - last.y) < 1 && guard < 6) {
              pick = choices[Math.floor(Math.random() * choices.length)];
              guard++;
            }
            pos = pick;
          }
          lastJumpPosRef.current = pos;
          setDot(pos.x, pos.y);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [wrapRef]);

  return (
    <div ref={wrapRef} className={`relative h-full w-full overflow-hidden ${BG_CLASS[params.background]}`}>
      <div
        ref={dotRef}
        className="pointer-events-none absolute left-0 top-0 rounded-full dot-glow"
        style={{
          width: params.dotSize,
          height: params.dotSize,
          backgroundColor: COLOR_MAP[params.dotColor],
          color: COLOR_MAP[params.dotColor],
          border: params.dotColor === "white" ? "1px solid hsl(var(--border))" : "none",
          willChange: "transform",
        }}
      />
    </div>
  );
});
