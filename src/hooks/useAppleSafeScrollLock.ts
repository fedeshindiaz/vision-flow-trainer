import { useEffect } from "react";

export function useAppleSafeScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof window === "undefined") return undefined;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    const previousBodyStyle = {
      left: body.style.left,
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    const previousHtmlOverflow = html.style.overflow;

    const preventTouchScroll = (event: TouchEvent) => {
      event.preventDefault();
    };

    html.classList.add("apple-safe-scroll-lock");
    html.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    document.addEventListener("touchmove", preventTouchScroll, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventTouchScroll);
      html.classList.remove("apple-safe-scroll-lock");
      html.style.overflow = previousHtmlOverflow;
      body.style.position = previousBodyStyle.position;
      body.style.top = previousBodyStyle.top;
      body.style.left = previousBodyStyle.left;
      body.style.width = previousBodyStyle.width;
      body.style.overflow = previousBodyStyle.overflow;
      window.scrollTo(scrollX, scrollY);
    };
  }, [active]);
}
