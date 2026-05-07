import { useEffect, useRef, type RefObject } from "react";

type DrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  elapsed: number,
  backgroundElapsed: number,
  deltaSeconds: number,
) => void;

export function useCanvasRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  hostRef: RefObject<HTMLDivElement | null>,
  running: boolean,
  resetKey: number,
  draw: DrawFn,
  syncElapsedSeconds = 0,
  syncStartMs: number | null = null,
  syncBaseElapsedSeconds = 0,
) {
  const elapsedRef = useRef(0);
  const backgroundElapsedRef = useRef(0);
  const resetKeyRef = useRef<number | null>(null);
  const lastRef = useRef(performance.now());
  const drawRef = useRef(draw);
  const sizeRef = useRef({ width: 0, height: 0 });

  drawRef.current = draw;

  useEffect(() => {
    const shouldResetBackground = resetKeyRef.current === null || resetKeyRef.current !== resetKey;
    resetKeyRef.current = resetKey;
    elapsedRef.current = syncStartMs === null ? syncElapsedSeconds : syncBaseElapsedSeconds;
    if (shouldResetBackground) {
      backgroundElapsedRef.current = elapsedRef.current;
    }
    lastRef.current = performance.now();
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx && width > 0 && height > 0) {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(ctx, width, height, elapsedRef.current, backgroundElapsedRef.current, 0);
    }
  }, [canvasRef, resetKey, syncBaseElapsedSeconds, syncElapsedSeconds, syncStartMs]);

  useEffect(() => {
    if (!syncElapsedSeconds || syncStartMs !== null) return;

    const drift = Math.abs(elapsedRef.current - syncElapsedSeconds);

    if (drift > 0.25) {
      elapsedRef.current = syncElapsedSeconds;
    }
  }, [syncElapsedSeconds, syncStartMs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;

    if (!canvas || !host) return undefined;

    const drawStillFrame = () => {
      const { width, height } = sizeRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx || width <= 0 || height <= 0) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(ctx, width, height, elapsedRef.current, backgroundElapsedRef.current, 0);
    };

    const resizeCanvas = () => {
      const rect = host.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const nextWidth = Math.max(1, Math.floor(rect.width));
      const nextHeight = Math.max(1, Math.floor(rect.height));
      const pixelWidth = Math.max(1, Math.floor(nextWidth * dpr));
      const pixelHeight = Math.max(1, Math.floor(nextHeight * dpr));

      sizeRef.current = { width: nextWidth, height: nextHeight };

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${nextWidth}px`;
        canvas.style.height = `${nextHeight}px`;
      }

      requestAnimationFrame(drawStillFrame);
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(host);

    return () => observer.disconnect();
  }, [canvasRef, hostRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const { width, height } = sizeRef.current;
    const ctx = canvas?.getContext("2d");

    if (!running && canvas && ctx && width > 0 && height > 0) {
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(ctx, width, height, elapsedRef.current, backgroundElapsedRef.current, 0);
    }
  });

  useEffect(() => {
    if (!running) {
      lastRef.current = performance.now();
      return undefined;
    }

    let raf = 0;

    const loop = (now: number) => {
      const canvas = canvasRef.current;
      const { width, height } = sizeRef.current;
      const ctx = canvas?.getContext("2d");

      if (canvas && ctx && width > 0 && height > 0) {
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const delta = Math.min(0.05, (now - lastRef.current) / 1000);
        lastRef.current = now;

        if (syncStartMs === null) {
          elapsedRef.current += delta;
        } else {
          elapsedRef.current = syncBaseElapsedSeconds + Math.max(0, (now - syncStartMs) / 1000);
        }
        backgroundElapsedRef.current += delta;

        drawRef.current(ctx, width, height, elapsedRef.current, backgroundElapsedRef.current, delta);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [canvasRef, running, syncBaseElapsedSeconds, syncStartMs]);
}
