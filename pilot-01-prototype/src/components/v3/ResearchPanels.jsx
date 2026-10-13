import { SourceLink } from "../shared/SourceLink.jsx";
import { useState } from "react";
import { researchForVenue } from "../../data/exchange-research";
import { BrandMark } from "../brand/BrandMark";
import "./research.css";

const labels = {
  en: ["Inside the platform", "Source-linked facts, not a score", "Read source", "Research checked", "Original research in English", "Compare the details", "Show differences only", "Products", "Fees", "Custody", "Account & access", "Execution", "Not documented in this research", "All available fields match", "Official references"],
  "zh-Hans": ["平台具体有什么", "看事实与差异，不看虚构评分", "查看来源", "资料核对", "以下为英文原始研究", "逐项看清差异", "只看差异", "交易产品", "费用机制", "资产托管", "账户与访问", "执行机制", "本次研究未收录", "现有字段没有差异", "官方参考资料"],
  "zh-Hant": ["平台具體有什麼", "看事實與差異，不看虛構評分", "查看來源", "資料核對", "以下為英文原始研究", "逐項看清差異", "只看差異", "交易產品", "費用機制", "資產託管", "帳戶與存取", "執行機制", "本次研究未收錄", "現有欄位沒有差異", "官方參考資料"],
  es: ["La plataforma en detalle", "Hechos con fuentes, sin puntuaciones", "Ver fuente", "Revisado", "Investigación original en inglés", "Comparar detalles", "Solo diferencias", "Productos", "Comisiones", "Custodia", "Cuenta y acceso", "Ejecución", "No documentado", "Sin diferencias en los campos disponibles", "Referencias oficiales"],
  "pt-BR": ["A plataforma em detalhe", "Fatos com fontes, sem notas", "Ver fonte", "Revisado", "Pesquisa original em inglês", "Comparar detalhes", "Só diferenças", "Produtos", "Taxas", "Custódia", "Conta e acesso", "Execução", "Não documentado", "Sem diferenças nos campos disponíveis", "Referências oficiais"],
  fr: ["La plateforme en détail", "Des faits sourcés, pas de notes", "Voir la source", "Vérifié", "Recherche originale en anglais", "Comparer les détails", "Différences uniquement", "Produits", "Frais", "Garde des actifs", "Compte et accès", "Exécution", "Non documenté", "Aucune différence dans les champs disponibles", "Références officielles"],
  de: ["Die Plattform im Detail", "Belegte Fakten statt Bewertungen", "Quelle öffnen", "Geprüft", "Originalrecherche auf Englisch", "Details vergleichen", "Nur Unterschiede", "Produkte", "Gebühren", "Verwahrung", "Konto und Zugang", "Ausführung", "Nicht dokumentiert", "Keine Unterschiede in verfügbaren Feldern", "Offizielle Quellen"],
  ja: ["プラットフォームの詳細", "点数ではなく出典付きの事実", "出典を見る", "確認日", "以下は英語の原文です", "違いを比較", "相違点のみ", "商品", "手数料", "資産管理", "口座とアクセス", "執行方式", "今回の調査に記載なし", "現在の項目に相違はありません", "公式参考資料"],
  ko: ["플랫폼 자세히 보기", "점수 대신 출처가 있는 사실", "출처 보기", "확인일", "아래는 영어 원문입니다", "세부 비교", "차이점만 보기", "상품", "수수료", "자산 보관", "계정 및 접근", "체결 방식", "이번 조사에 미수록", "현재 항목에 차이가 없습니다", "공식 참고 자료"],
  ar: ["تفاصيل المنصة", "حقائق موثقة لا تقييمات مختلقة", "عرض المصدر", "تاريخ المراجعة", "البحث الأصلي باللغة الإنجليزية", "مقارنة التفاصيل", "الفروق فقط", "المنتجات", "الرسوم", "حفظ الأصول", "الحساب والوصول", "التنفيذ", "غير موثق في هذا البحث", "لا فروق في الحقول المتاحة", "مراجع رسمية"],
  tr: ["Platformun ayrıntıları", "Puan yerine kaynaklı bilgiler", "Kaynağı aç", "Kontrol tarihi", "İngilizce özgün araştırma", "Ayrıntıları karşılaştır", "Yalnızca farklar", "Ürünler", "Ücretler", "Varlık saklama", "Hesap ve erişim", "İşlem yürütme", "Bu araştırmada belgelenmedi", "Mevcut alanlarda fark yok", "Resmî kaynaklar"],
  ru: ["Подробнее о платформе", "Факты с источниками, а не рейтинги", "Открыть источник", "Проверено", "Оригинальное исследование на английском", "Сравнить детали", "Только различия", "Продукты", "Комиссии", "Хранение", "Аккаунт и доступ", "Исполнение", "Не описано в исследовании", "Доступные поля совпадают", "Официальные источники"],
  id: ["Detail platform", "Fakta bersumber, bukan skor", "Lihat sumber", "Diperiksa", "Riset asli dalam bahasa Inggris", "Bandingkan detail", "Hanya perbedaan", "Produk", "Biaya", "Penyimpanan aset", "Akun dan akses", "Eksekusi", "Belum didokumentasikan", "Tidak ada perbedaan pada kolom tersedia", "Referensi resmi"],
  vi: ["Chi tiết nền tảng", "Dữ kiện có nguồn, không chấm điểm", "Xem nguồn", "Ngày kiểm tra", "Nghiên cứu gốc bằng tiếng Anh", "So sánh chi tiết", "Chỉ xem khác biệt", "Sản phẩm", "Phí", "Lưu ký", "Tài khoản và truy cập", "Khớp lệnh", "Chưa được ghi nhận", "Các trường hiện có không khác biệt", "Tài liệu chính thức"],
  it: ["La piattaforma in dettaglio", "Fatti con fonti, non punteggi", "Leggi la fonte", "Verificato", "Ricerca originale in inglese", "Confronta i dettagli", "Solo differenze", "Prodotti", "Commissioni", "Custodia", "Account e accesso", "Esecuzione", "Non documentato nella ricerca", "Nessuna differenza nei campi disponibili", "Riferimenti ufficiali"],
  // l10n: needs native review
  ur: ["پلیٹ فارم کی تفصیل", "ماخذ سے جڑے حقائق، اسکور نہیں", "ماخذ پڑھیں", "تحقیق کی جانچ", "اصل تحقیق انگریزی میں ہے", "تفصیلات کا موازنہ", "صرف فرق دکھائیں", "مصنوعات", "فیس", "تحویل", "اکاؤنٹ اور رسائی", "عمل درآمد", "اس تحقیق میں درج نہیں", "دستیاب خانوں میں کوئی فرق نہیں", "سرکاری حوالہ جات"],
  // l10n: needs native review
  uk: ["Платформа докладно", "Факти з джерелами, а не оцінка", "Читати джерело", "Дослідження перевірено", "Оригінальне дослідження англійською", "Порівняти деталі", "Показати лише відмінності", "Продукти", "Комісії", "Зберігання активів", "Акаунт і доступ", "Виконання", "Не задокументовано в цьому дослідженні", "У доступних полях немає відмінностей", "Офіційні посилання"],
};
const textFor = (locale) => labels[locale] ?? labels[String(locale || "").split("-")[0]] ?? labels.en;
const isRtlLocale = (locale) => ["ar", "ur"].includes(String(locale || "").split("-")[0]);
const axes = ["products", "fees", "custody", "access", "execution"];

export function ResearchPanel({ slug, locale }) {
  const research = researchForVenue(slug, locale);
  const text = textFor(locale);
  if (!research) return null;
  return <section className="v2-section research-panel" id="platform-facts">
    <div className="research-heading"><div><p>{text[1]}</p><h2>{text[0]}</h2></div><small>{text[3]} <time dateTime={research.checkedAt}>{new Date(research.checkedAt).toISOString().slice(0, 10)}</time></small></div>
    {research.contentLocale !== locale && <p className="research-language-note">{text[4]}</p>}
    <dl className="research-facts" lang={research.contentLocale} dir={isRtlLocale(research.contentLocale) ? "rtl" : "ltr"}>
      {research.facts.map((fact) => <div key={fact.id ?? fact.label}><dt>{fact.label}</dt><dd>{fact.value}<SourceLink locale={locale} href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" lang={locale} aria-label={`${text[2]}: ${fact.label}`}>{text[2]} <span aria-hidden="true">↗</span></SourceLink></dd></div>)}
    </dl>
    <details className="research-references"><summary>{text[14]} <span>{research.sources.length}</span></summary><ul>{research.sources.map((source) => <li key={source.url}><SourceLink locale={locale} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</SourceLink></li>)}</ul></details>
  </section>;
}

export function ResearchComparison({ profiles, locale }) {
  const [differences, setDifferences] = useState(false);
  const text = textFor(locale);
  const research = profiles.map((profile) => researchForVenue(profile.slug, locale));
  if (!research.some(Boolean)) return null;
  const rows = axes.map((id, index) => ({id, label:text[index + 7], facts:research.map((entry) => entry?.facts.filter((fact) => fact.axis === id) ?? [])}))
    .filter((row) => row.facts.some((facts) => facts.length))
    .filter((row) => !differences || new Set(row.facts.map((facts) => facts.map((fact) => fact.value).join("\n"))).size > 1);
  return <section className="v2-section research-comparison" id="research-comparison">
    <div className="research-heading"><h2>{text[5]}</h2><label className="research-differences"><input type="checkbox" checked={differences} onChange={(event) => setDifferences(event.target.checked)} />{text[6]}</label></div>
    {research.some((entry) => entry && entry.contentLocale !== locale) && <p className="research-language-note">{text[4]}</p>}
    {rows.length ? <table className="research-table"><thead><tr><th scope="col">{text[5]}</th>{profiles.map((profile) => <th scope="col" key={profile.slug}><span translate="no" lang="en" dir="ltr"><BrandMark slug={profile.slug} compact />{profile.name}</span></th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.id}><th scope="row">{row.label}</th>{row.facts.map((facts, index) => <td key={profiles[index].slug} data-platform={profiles[index].name} lang={facts.length ? research[index].contentLocale : locale} dir={facts.length ? (isRtlLocale(research[index].contentLocale) ? "rtl" : "ltr") : undefined}>{facts.length ? facts.map((fact) => <p key={fact.id}>{fact.value}<SourceLink locale={locale} href={fact.sourceUrl} target="_blank" rel="noopener noreferrer" lang={locale}>{text[2]} ↗</SourceLink></p>) : text[12]}</td>)}</tr>)}</tbody>
    </table> : <p role="status">{text[13]}</p>}
  </section>;
}
