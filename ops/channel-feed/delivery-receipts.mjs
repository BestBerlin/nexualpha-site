// Shared durable Telegram intent receipts; no credentials or runtime side effects.
export function assertTelegramOk(result, context = "sendMessage") {
  if (result?.ok === true) return result;
  const code = result?.error_code || result?.status || "unknown";
  const description = String(result?.description || result?.error || "telegram request failed").slice(0, 300);
  throw new Error(`${context}: ${code} ${description}`);
}
// Persist intent before the request. A timeout/crash may happen after Telegram
// accepted it, so an unresolved receipt needs review rather than automatic replay.
// Explicit Bot API rejection is safe to retry; confirmed recipients are skipped.
export async function deliverOnce({ state, key, keys = [key], deliver, save, now = Date.now() }) {
  if (state.deliveryReceipts !== undefined && (!state.deliveryReceipts || typeof state.deliveryReceipts !== "object" || Array.isArray(state.deliveryReceipts))) throw new Error("delivery receipts corrupt; refusing to send");
  const receipts = state.deliveryReceipts ||= {};
  if (!keys.length || keys.some((k) => typeof k !== "string" || !k)) throw new Error("delivery receipt key required");
  const previous = keys.map((k) => receipts[k]);
  if (previous.some((r) => r && !["confirmed", "pending", "rejected"].includes(r.status))) throw new Error("delivery receipt corrupt; refusing to send");
  if (previous.every((r) => r?.status === "confirmed")) return { ok: true, skipped: true };
  if (previous.some((r) => r?.status === "confirmed")) throw new Error("partially confirmed group; remove confirmed items before sending");
  if (previous.some((r) => r?.status === "pending")) throw new Error("delivery outcome unknown; inspect deliveryReceipts before retry");
  if (previous.some((r) => r?.retryAt > now)) throw new Error("Telegram rate limit backoff still active");
  for (const k of keys) receipts[k] = { status: "pending", at: now };
  await save();
  const result = await deliver();
  if (result?.ok !== true) {
    const retryAfter = Number(result?.parameters?.retry_after);
    for (const k of keys) {
      if (Number.isFinite(retryAfter) && retryAfter > 0) receipts[k] = { status: "rejected", at: now, retryAt: now + retryAfter * 1000 };
      else delete receipts[k];
    }
    await save();
    assertTelegramOk(result);
  }
  for (const k of keys) receipts[k] = { status: "confirmed", at: now };
  await save();
  return result;
}
