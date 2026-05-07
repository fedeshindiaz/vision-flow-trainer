import { describe, expect, it } from "vitest";
import { getDeviceEnvironment, isAppleEnvironment, isAppleTouchEnvironment, isSafariLike } from "../utils/deviceDetection";

const iphoneSafari = {
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  platform: "iPhone",
  maxTouchPoints: 5,
};

const ipadDesktopMode = {
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  platform: "MacIntel",
  maxTouchPoints: 5,
};

const macSafari = {
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  platform: "MacIntel",
  maxTouchPoints: 0,
};

const windowsChrome = {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  platform: "Win32",
  maxTouchPoints: 0,
};

const androidChrome = {
  userAgent:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  platform: "Linux armv8l",
  maxTouchPoints: 5,
};

describe("deviceDetection", () => {
  it("detects iPhone as an Apple touch environment", () => {
    expect(isAppleEnvironment(iphoneSafari)).toBe(true);
    expect(isAppleTouchEnvironment(iphoneSafari)).toBe(true);
  });

  it("detects iPadOS desktop mode as Apple touch", () => {
    const environment = getDeviceEnvironment(ipadDesktopMode);

    expect(environment.isAppleEnvironment).toBe(true);
    expect(environment.isIPadOSLike).toBe(true);
    expect(environment.isAppleTouchEnvironment).toBe(true);
  });

  it("detects Mac Safari as Apple desktop, not Apple touch", () => {
    const environment = getDeviceEnvironment(macSafari);

    expect(environment.isAppleEnvironment).toBe(true);
    expect(environment.isMacSafari).toBe(true);
    expect(environment.isAppleTouchEnvironment).toBe(false);
  });

  it("does not detect Windows Chrome as Apple", () => {
    expect(isAppleEnvironment(windowsChrome)).toBe(false);
    expect(isSafariLike(windowsChrome)).toBe(false);
  });

  it("does not detect Android Chrome as Apple", () => {
    expect(isAppleEnvironment(androidChrome)).toBe(false);
    expect(isAppleTouchEnvironment(androidChrome)).toBe(false);
  });
});
