import { describe, expect, it, beforeEach } from "vitest";
import { isCastDebugEnabled } from "../cast/castDebug";

describe("cast debug visibility", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
    window.localStorage.clear();
  });

  it("stays hidden by default and ignores the old castDebug flag", () => {
    expect(isCastDebugEnabled()).toBe(false);

    window.history.replaceState({}, "", "/?castDebug=1");

    expect(isCastDebugEnabled()).toBe(false);
  });

  it("only appears with the explicit ONUr debug flag", () => {
    window.history.replaceState({}, "", "/?onurCastDebug=1");

    expect(isCastDebugEnabled()).toBe(true);
  });
});
