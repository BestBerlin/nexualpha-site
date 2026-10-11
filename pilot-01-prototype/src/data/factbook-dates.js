// Factbook date layers (audit NX-06, 2026-10-11). A factbook shows three different records, each with its own date:
//   feesCheckedOn      — base fees re-read on the official fee page (exchange-facts.js, per venue);
//   benefitConfirmedOn — partner programme terms confirmed by the site owner (partner-benefit-status.js), or null;
//   dossierCompiledOn  — the source dossier (domains, KYC, reserves notes) compiled on AUDIT_DATE (2026-09-08).
// Dataset dateModified is the latest of these real review dates for the data on the page — never "today".
import { venueCheckedOn } from "./exchange-facts.js";
import { partnerBenefitStatus } from "./partner-benefit-status.js";

// The source dossier date (factbook-registry.js re-exports it as AUDIT_DATE). Kept here so the worker and the server
// can read the date layers without loading the whole registry.
export const FACTBOOK_DOSSIER_COMPILED_ON = "2026-09-08";

export function factbookDates(slug) {
  const feesCheckedOn = venueCheckedOn(slug) || null;
  const benefitConfirmedOn = partnerBenefitStatus(slug)?.confirmedOn || null;
  const dossierCompiledOn = FACTBOOK_DOSSIER_COMPILED_ON;
  const latestReviewOn = [feesCheckedOn, benefitConfirmedOn, dossierCompiledOn].filter(Boolean).sort().at(-1);
  return { feesCheckedOn, benefitConfirmedOn, dossierCompiledOn, latestReviewOn };
}

// fees checked, benefit terms confirmed, source dossier compiled, not yet checked / confirmed
const COPY = {
  en: ["Fees checked", "Benefit terms confirmed", "Source dossier compiled", "Not yet"],
  "zh-Hans": ["费率核验日期", "权益条款确认日期", "来源档案整理日期", "尚未"],
  "zh-Hant": ["費率核驗日期", "權益條款確認日期", "來源檔案整理日期", "尚未"],
  es: ["Comisiones verificadas", "Condiciones del beneficio confirmadas", "Expediente de fuentes compilado", "Aún no"],
  "pt-BR": ["Taxas verificadas", "Termos do benefício confirmados", "Dossiê de fontes compilado", "Ainda não"],
  fr: ["Frais vérifiés", "Conditions de l’avantage confirmées", "Dossier de sources constitué", "Pas encore"],
  de: ["Gebühren geprüft", "Vorteilsbedingungen bestätigt", "Quellendossier erstellt", "Noch nicht"],
  it: ["Commissioni verificate", "Condizioni del vantaggio confermate", "Dossier delle fonti compilato", "Non ancora"],
  ja: ["手数料の確認日", "特典条件の確認日", "出典資料の作成日", "未確認"],
  ko: ["수수료 확인일", "혜택 조건 확인일", "출처 자료 작성일", "미확인"],
  ru: ["Комиссии проверены", "Условия выгоды подтверждены", "Досье источников составлено", "Ещё нет"],
  tr: ["Ücretler kontrol edildi", "Avantaj koşulları teyit edildi", "Kaynak dosyası derlendi", "Henüz değil"],
  id: ["Biaya diperiksa", "Ketentuan manfaat dikonfirmasi", "Berkas sumber disusun", "Belum"],
  vi: ["Ngày kiểm tra phí", "Ngày xác nhận điều khoản ưu đãi", "Ngày lập hồ sơ nguồn", "Chưa"],
  // l10n: needs native review
  ur: ["فیس کی جانچ", "فوائد کی شرائط کی تصدیق", "ماخذ کی فائل تیار", "ابھی نہیں"],
  // l10n: needs native review
  uk: ["Комісії перевірено", "Умови переваг підтверджено", "Досьє джерел укладено", "Ще ні"],
  ar: ["تاريخ التحقق من الرسوم", "تاريخ تأكيد شروط الميزة", "تاريخ إعداد ملف المصادر", "ليس بعد"],
};

export function factbookDatesCopy(locale = "en") {
  const raw = String(locale || "en");
  const k = raw === "zh-CN" || raw === "zh" ? "zh-Hans" : raw === "zh-TW" || raw === "zh-HK" ? "zh-Hant" : raw;
  const [fees, benefit, dossier, notYet] = COPY[k] || COPY[k.split("-")[0]] || COPY.en;
  return { fees, benefit, dossier, notYet };
}
