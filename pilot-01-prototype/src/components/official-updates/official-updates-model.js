export function visibleOfficialUpdates(updates = [], now = Date.now()) {
  if (!Array.isArray(updates)) return [];
  return updates.filter((update) => {
    if (!update || typeof update !== "object") return false;
    const hasRawReviewFields = Object.prototype.hasOwnProperty.call(update, "reviewStatus") || Object.prototype.hasOwnProperty.call(update, "fixture");
    const passesReviewGate = hasRawReviewFields ? update.reviewStatus === "APPROVED" && update.fixture === false : true;
    return passesReviewGate && hasValidUrl(update.officialSource?.url) && Number.isFinite(Date.parse(update.discoveredAt)) && Number.isFinite(Date.parse(update.verifiedAt)) && (!update.expiresAt || Date.parse(update.expiresAt) > now);
  });
}

function hasValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}
