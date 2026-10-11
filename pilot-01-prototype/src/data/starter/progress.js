export const STARTER_PROGRESS_KEY = "nexualpha-starter-v1";
const emptyProgress = () => ({ completed: [], checklists: {}, answers: {} });
export function readStarterProgress(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STARTER_PROGRESS_KEY) || "null");
    if (!saved || typeof saved !== "object") return emptyProgress();
    const cleanLists = value => Object.fromEntries(Object.entries(value && typeof value === "object" ? value : {}).filter(([slug, items]) => /^[a-z0-9-]+$/.test(slug) && Array.isArray(items)));
    return { completed: Array.isArray(saved.completed) ? [...new Set(saved.completed.filter(slug => typeof slug === "string" && /^[a-z0-9-]+$/.test(slug)))] : [], checklists: cleanLists(saved.checklists), answers: cleanLists(saved.answers) };
  } catch { return emptyProgress(); }
}
export function writeStarterProgress(storage, progress) {
  try { storage.setItem(STARTER_PROGRESS_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}
export const quizPassed = (quiz, answers) => quiz.length === 3 && quiz.every((question, i) => answers?.[i] === question.options.indexOf(question.answer));
export const checklistDone = (checklist, ticks) => checklist.length > 0 && checklist.every((_, i) => ticks?.[i] === true);
export const completeLevel = (progress, slug) => ({ ...progress, completed: [...new Set([...progress.completed, slug])] });
