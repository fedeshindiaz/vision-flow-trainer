import { useEffect, useRef, type RefObject } from "react";

type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number) => void;

export function useCanvasRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  hostRef: RefObject<HTMLDivElement | null>,
  running: boolean,
  resetKey: number,
  draw: DrawFn,
) {
  const elapsedRef = useRef(0);
  const lastRef = useRef(performance.now());
  const drawRef = useRef(draw);
  const sizeRef = useRef({ width: 0, height: 0 });

  drawRef.current = draw;

  useEffect(() => {
    elapsedRef.current = 0;
    lastRef.current = performance.now();
  }, [resetKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;

    if (!canvas || !host) return undefined;

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
    };

    resizeCanvas();

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(host);

    return () => observer.disconnect();
  }, [canvasRef, hostRef]);

  useEffect(() => {
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

        if (running) elapsedRef.current += delta;

        drawRef.current(ctx, width, height, elapsedRef.current);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, [canvasRef, running]);
}
