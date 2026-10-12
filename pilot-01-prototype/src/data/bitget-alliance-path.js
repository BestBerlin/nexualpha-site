// Route of the Bitget Alliance campaign page. Kept dependency-free: the browser entry (App.jsx routeState) imports it.
export const BITGET_ALLIANCE_PATH = "/activities/bitget-alliance";
export function parseBitgetAlliancePath(pathname) {
  const path = String(pathname || "").split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return path === BITGET_ALLIANCE_PATH;
}
