import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAppleSafeScrollLock } from "../hooks/useAppleSafeScrollLock";

function ScrollLockProbe({ active }: { active: boolean }) {
  useAppleSafeScrollLock(active);
  return null;
}

describe("useAppleSafeScrollLock", () => {
  afterEach(() => {
    document.documentElement.className = "";
    document.documentElement.removeAttribute("style");
    document.body.removeAttribute("style");
    vi.restoreAllMocks();
  });

  it("locks and restores document scrolling", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const { unmount } = render(<ScrollLockProbe active />);

    expect(document.documentElement).toHaveClass("apple-safe-scroll-lock");
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.documentElement).not.toHaveClass("apple-safe-scroll-lock");
    expect(document.body.style.position).toBe("");
    expect(scrollTo).toHaveBeenCalled();
  });

  it("does not lock when inactive", () => {
    render(<ScrollLockProbe active={false} />);

    expect(document.documentElement).not.toHaveClass("apple-safe-scroll-lock");
    expect(document.body.style.position).toBe("");
  });
});
