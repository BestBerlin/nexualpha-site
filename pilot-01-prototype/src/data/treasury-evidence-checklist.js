import treasuryRightsOpsAsset from "../../public/research/wave48-tokenized-treasury-rights-ops.json" with { type: "json" };

export const TREASURY_EVIDENCE_CHECKLIST_ASSET_URL = "https://nexualpha.com/research/wave48-tokenized-treasury-rights-ops.json";

export const TREASURY_EVIDENCE_STATUS_VALUES = ["pending", "read", "uncertain"];

export const TREASURY_EVIDENCE_STEPS = [
  {
    id: "issuer",
    fields: ["legalClaimOrIssuerSpv", "eligibilityJurisdiction"],
    labels: {
      en: "Issuer, legal wrapper and eligibility boundary",
      "zh-Hans": "发行方、法律载体与资格边界",
    },
    next: {
      en: "Read issuer and eligibility evidence",
      "zh-Hans": "阅读发行与资格证据",
    },
  },
  {
    id: "redemption",
    fields: ["redemption"],
    labels: {
      en: "Redemption path",
      "zh-Hans": "赎回路径",
    },
    next: {
      en: "Read redemption evidence",
      "zh-Hans": "阅读赎回证据",
    },
  },
  {
    id: "recordkeeper",
    fields: ["recordkeeper"],
    labels: {
      en: "Recordkeeper and official register",
      "zh-Hans": "登记方与官方记录",
    },
    next: {
      en: "Read recordkeeper evidence",
      "zh-Hans": "阅读登记证据",
    },
  },
  {
    id: "custody",
    fields: ["custody", "unknownsLimits"],
    labels: {
      en: "Custody, chain support and unresolved limits",
      "zh-Hans": "托管、支持链与未解决限制",
    },
    next: {
      en: "Read custody and unknowns",
      "zh-Hans": "阅读托管与未知项",
    },
  },
];

const STATUS_SET = new Set(TREASURY_EVIDENCE_STATUS_VALUES);
const STEP_SET = new Set(TREASURY_EVIDENCE_STEPS.map((step) => step.id));
const UNSAFE_RECORD_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function localize(value, locale) {
  return value?.[locale] || value?.en || "";
}

function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (Object.getPrototypeOf(value) !== Object.prototype) return false;
  return Object.keys(value).every((key) => !UNSAFE_RECORD_KEYS.has(key));
}

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isSafeSourceUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

function textValue(record, field) {
  const value = record?.[field];
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim())) return value.map((item) => item.trim());
  return "";
}

function hasStrictField(record, field) {
  const value = record?.[field];
  if (field === "unknownsLimits") return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === "string" && item.trim());
  return typeof value === "string" && value.trim().length > 0;
}

function hasStepFields(record, step) {
  return step.fields.every((field) => hasStrictField(record, field));
}

function validateRecord(record) {
  if (!isPlainRecord(record)) return null;
  if (typeof record.id !== "string" || !/^[a-z0-9][a-z0-9-]{2,80}$/.test(record.id)) return null;
  if (typeof record.name !== "string" || !record.name.trim()) return null;
  if (!isValidDateOnly(record.checkedAt)) return null;
  if (!isSafeSourceUrl(record.sourceUrl)) return null;
  if (!Array.isArray(record.sourceEvidence) || record.sourceEvidence.length === 0 || record.sourceEvidence.some((item) => typeof item !== "string" || !item.trim())) return null;
  if (!Array.isArray(record.unknownsLimits) || record.unknownsLimits.some((item) => typeof item !== "string" || !item.trim())) return null;
  if (!TREASURY_EVIDENCE_STEPS.every((step) => hasStepFields(record, step))) return null;
  return record;
}

function recordStepEvidence(record, step, locale) {
  const excerpt = step.fields.flatMap((field) => {
    const value = textValue(record, field);
    const label = field === "legalClaimOrIssuerSpv"
      ? localize({ en: "legalClaimOrIssuerSpv", "zh-Hans": "legalClaimOrIssuerSpv 英文历史原文" }, locale)
      : field === "eligibilityJurisdiction"
        ? localize({ en: "eligibilityJurisdiction", "zh-Hans": "eligibilityJurisdiction 英文历史原文" }, locale)
        : field === "unknownsLimits"
          ? localize({ en: "unknownsLimits", "zh-Hans": "unknownsLimits 英文历史原文" }, locale)
          : `${field}${locale === "zh-Hans" ? " 英文历史原文" : ""}`;
    if (Array.isArray(value)) {
      return value.map((item) => ({ field, label, text: item }));
    }
    return [{ field, label, text: value }];
  });

  return {
    id: step.id,
    label: localize(step.labels, locale),
    sourceUrl: record.sourceUrl,
    checkedAt: record.checkedAt,
    excerpt,
  };
}

export function createTreasuryEvidenceStates() {
  const next = {};
  for (const step of TREASURY_EVIDENCE_STEPS) next[step.id] = "pending";
  return next;
}

function normalizeTreasuryEvidenceStates(states) {
  if (!isPlainRecord(states)) return createTreasuryEvidenceStates();
  const next = createTreasuryEvidenceStates();
  for (const step of TREASURY_EVIDENCE_STEPS) {
    if (STATUS_SET.has(states[step.id])) next[step.id] = states[step.id];
  }
  return next;
}

export function setTreasuryEvidenceStatus(states, stepId, status) {
  const normalized = normalizeTreasuryEvidenceStates(states);
  if (!STEP_SET.has(stepId) || !STATUS_SET.has(status)) return normalized;
  return { ...normalized, [stepId]: status };
}

export function summarizeTreasuryEvidenceStates(states) {
  const normalized = normalizeTreasuryEvidenceStates(states);
  let read = 0;
  let pending = 0;
  let uncertain = 0;
  let nextStepId = null;
  let nextUncertainStepId = null;

  for (const step of TREASURY_EVIDENCE_STEPS) {
    const status = STATUS_SET.has(normalized[step.id]) ? normalized[step.id] : "pending";
    if (status === "read") read += 1;
    if (status === "uncertain") {
      uncertain += 1;
      if (!nextUncertainStepId) nextUncertainStepId = step.id;
    }
    if (status === "pending") {
      pending += 1;
      if (!nextStepId) nextStepId = step.id;
    }
  }

  return {
    total: TREASURY_EVIDENCE_STEPS.length,
    read,
    pending,
    uncertain,
    allRead: read === TREASURY_EVIDENCE_STEPS.length,
    nextStepId: nextUncertainStepId || nextStepId,
  };
}

export function buildTreasuryEvidenceChecklist(asset = treasuryRightsOpsAsset, locale = "en") {
  const records = Array.isArray(asset) ? asset : asset?.products;
  if (!Array.isArray(records)) {
    return { available: false, products: [], steps: TREASURY_EVIDENCE_STEPS, error: "NO_PRODUCTS" };
  }

  const validRecords = records.map(validateRecord);
  if (validRecords.some((record) => !record)) {
    return { available: false, products: [], steps: TREASURY_EVIDENCE_STEPS, error: "INVALID_PRODUCT_RECORD" };
  }

  const productIds = new Set();
  for (const record of validRecords) {
    if (productIds.has(record.id)) {
      return { available: false, products: [], steps: TREASURY_EVIDENCE_STEPS, error: "DUPLICATE_PRODUCT_ID" };
    }
    productIds.add(record.id);
  }

  const products = validRecords.map((record) => ({
    id: record.id,
    name: record.name,
    productName: record.productName || record.name,
    productType: record.productType || "unknown",
    checkedAt: record.checkedAt,
    sourceUrl: record.sourceUrl,
    sourceType: record.sourceType || "source",
    limitations: record.unknownsLimits.slice(),
    evidence: Object.fromEntries(TREASURY_EVIDENCE_STEPS.map((step) => [step.id, recordStepEvidence(record, step, locale)])),
  }));

  return {
    available: products.length > 0,
    products,
    steps: TREASURY_EVIDENCE_STEPS,
    assetUrl: TREASURY_EVIDENCE_CHECKLIST_ASSET_URL,
    checkedAt: typeof asset?.boundary?.checkedAt === "string" ? asset.boundary.checkedAt : products[0]?.checkedAt || null,
  };
}

export const TREASURY_EVIDENCE_CHECKLIST = buildTreasuryEvidenceChecklist(treasuryRightsOpsAsset, "en");
