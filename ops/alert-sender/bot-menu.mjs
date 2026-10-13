// Poller-only language context. Keeps start-link language in the existing subscriptions file;
// does not subscribe members or change their chosen /alerts language.
import { readFileSync, writeFileSync, renameSync, mkdirSync } from "node:fs";
import path from "node:path";
import { isNeutralCtaLocale, langFromCode } from "./site-features.mjs";
const subscriptionsFile = () => process.env.ALERT_SUBSCRIPTIONS_FILE || "/var/lib/crypto-telegram-ops/alert-subscriptions.json";
const recognized = (lang) => isNeutralCtaLocale(lang) ? lang : langFromCode(lang);
function load(file) {
  try { return JSON.parse(readFileSync(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return { version: 1, users: {} }; throw error; }
}
export function recalledStartLanguage(userId, file = subscriptionsFile()) {
  return recognized(load(file).users?.[String(userId)]?.nxStartLanguage) || null;
}
export function rememberStartLanguage(userId, lang, file = subscriptionsFile()) {
  const doc = load(file), key = String(userId);
  if (lang === null) {
    if (!doc.users?.[key]?.nxStartLanguage) return;
    delete doc.users[key].nxStartLanguage;
  } else {
    const normalized = recognized(lang);
    if (!normalized) return;
    doc.users ??= {};
    doc.users[key] ??= { topics: [], createdAt: new Date().toISOString() };
    doc.users[key].nxStartLanguage = normalized;
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(`${file}.tmp`, JSON.stringify(doc));
  renameSync(`${file}.tmp`, file);
}
export function menuLanguage(command, currentStart, stored, remembered, ui) {
  const choices = [currentStart, stored, remembered, ui].map(recognized).filter(Boolean);
  // A neutral choice must survive an English UI or a different fallback language.
  return (command === "signup" || command === "hub" ? choices.find(isNeutralCtaLocale) : null) || choices[0] || "en";
}
