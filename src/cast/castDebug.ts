export function isCastDebugEnabled() {
  if (typeof window === "undefined") return false;

  const params = new URLSearchParams(window.location.search);
  if (params.get("onurCastDebug") === "1") return true;

  try {
    return window.localStorage.getItem("ONUR_CAST_DEBUG") === "1";
  } catch {
    return false;
  }
}
