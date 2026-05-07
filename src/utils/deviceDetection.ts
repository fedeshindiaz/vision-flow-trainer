interface DeviceNavigatorLike {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
  vendor?: string;
  standalone?: boolean;
}

function getNavigator(): DeviceNavigatorLike | undefined {
  return typeof navigator === "undefined" ? undefined : navigator;
}

export function isIOSLike(navigatorLike: DeviceNavigatorLike | undefined = getNavigator()) {
  const userAgent = navigatorLike?.userAgent ?? "";
  const platform = navigatorLike?.platform ?? "";

  return /iPhone|iPad|iPod/i.test(userAgent) || /iPhone|iPad|iPod/i.test(platform);
}

export function isIPadOSLike(navigatorLike: DeviceNavigatorLike | undefined = getNavigator()) {
  return navigatorLike?.platform === "MacIntel" && (navigatorLike.maxTouchPoints ?? 0) > 1;
}

export function isMacLike(navigatorLike: DeviceNavigatorLike | undefined = getNavigator()) {
  return /Mac/i.test(navigatorLike?.platform ?? "") && !isIPadOSLike(navigatorLike);
}

export function isSafariLike(navigatorLike: DeviceNavigatorLike | undefined = getNavigator()) {
  const userAgent = navigatorLike?.userAgent ?? "";

  return /Safari/i.test(userAgent) && !/Chrome|Chromium|CriOS|FxiOS|Edg|EdgiOS|OPR|OPiOS|SamsungBrowser/i.test(userAgent);
}

export function isAppleTouchEnvironment(navigatorLike: DeviceNavigatorLike | undefined = getNavigator()) {
  return isIOSLike(navigatorLike) || isIPadOSLike(navigatorLike);
}

export function isAppleEnvironment(navigatorLike: DeviceNavigatorLike | undefined = getNavigator()) {
  return isAppleTouchEnvironment(navigatorLike) || (isMacLike(navigatorLike) && isSafariLike(navigatorLike));
}

export function isStandalonePWA(
  navigatorLike: DeviceNavigatorLike | undefined = getNavigator(),
  windowLike: Pick<Window, "matchMedia"> | undefined = typeof window === "undefined" ? undefined : window,
) {
  return Boolean(navigatorLike?.standalone || windowLike?.matchMedia?.("(display-mode: standalone)").matches);
}

export function supportsFullscreenApi(target?: Element | null, documentLike: Document | undefined = typeof document === "undefined" ? undefined : document) {
  return Boolean(target?.requestFullscreen && documentLike?.exitFullscreen);
}

export function getDeviceEnvironment(navigatorLike: DeviceNavigatorLike | undefined = getNavigator()) {
  const appleTouch = isAppleTouchEnvironment(navigatorLike);
  const macSafari = isMacLike(navigatorLike) && isSafariLike(navigatorLike);

  return {
    isAppleEnvironment: appleTouch || macSafari,
    isAppleTouchEnvironment: appleTouch,
    isIOSLike: isIOSLike(navigatorLike),
    isIPadOSLike: isIPadOSLike(navigatorLike),
    isMacLike: isMacLike(navigatorLike),
    isSafariLike: isSafariLike(navigatorLike),
    isMacSafari: macSafari,
  };
}
