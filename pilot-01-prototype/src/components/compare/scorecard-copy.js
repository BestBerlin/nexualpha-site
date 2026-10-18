import { licenseCopy } from "../../data/licenses.js";
// Presentation translations preserve the original evidence and ranking rules.
const rows = {
  'zh-Hans': ['已核验现货费率', '已核验合约费率', '前 200 币种覆盖', '资金费率矩阵覆盖', '本币入金指南', '已审阅活动', '合约产品证据', '官方监管登记', '低现货费率', '币种覆盖', '合约费率', '入金与费率'],
  'zh-Hant': ['已核驗現貨費率', '已核驗合約費率', '前 200 幣種覆蓋', '資金費率矩陣覆蓋', '本幣入金指南', '已審閱活動', '合約產品證據', '官方監管登記', '低現貨費率', '幣種覆蓋', '合約費率', '入金與費率'],
  ar: ['رسوم التداول الفوري المتحققة', 'رسوم العقود المتحققة', 'تغطية أفضل 200 عملة', 'المشاركة في مصفوفة التمويل', 'دليل التمويل بالعملة المحلية', 'الحملات المراجعة', 'توثيق منتج العقود', 'سجلات الجهات التنظيمية', 'أقل رسوم فورية', 'تغطية العملات', 'رسوم العقود', 'التمويل والرسوم'],
};
const keys = ['spotFees', 'perpFees', 'top200Coins', 'fundingCoverage', 'localFiatRails', 'currentPromotion', 'futures', 'licenses', 'lowestFees', 'mostCoins', 'futuresVerdict', 'beginners'];
const rules = {
  'zh-Hans': ['先比较已核验吃单费率，再比较挂单费率；相同费率并列。', '按币种数据中的前 200 币种实际覆盖数量比较。', '仅说明是否纳入已审阅的资金费率矩阵，不代表实时交易对数量。', '仅采用换算工具的已审阅本币入金指南。', '活动须通过时间、来源、语言、市场及合作方条件检查。', '以已核验合约费率为产品证据。', '采用官方监管登记目录中的记录；监管状态不同，不评选领先平台。', '优先采用已审阅本币入金指南，其次比较已核验现货吃单及挂单费率。'],
  'zh-Hant': ['先比較已核驗吃單費率，再比較掛單費率；相同費率並列。', '按幣種資料中的前 200 幣種實際覆蓋數量比較。', '僅說明是否納入已審閱的資金費率矩陣，不代表即時交易對數量。', '僅採用換算工具的已審閱本幣入金指南。', '活動須通過時間、來源、語言、市場及合作方條件檢查。', '以已核驗合約費率為產品證據。', '採用官方監管登記目錄中的記錄；監管狀態不同，不評選領先平台。', '優先採用已審閱本幣入金指南，其次比較已核驗現貨吃單及掛單費率。'],
  ar: ['تُقارن رسوم الآخذ المتحققة ثم رسوم الصانع؛ القيم المتساوية تتعادل.', 'تُقارن أعداد الإدراج الفعلية لأفضل 200 عملة في بيانات العملات.', 'توضح المشاركة في مصفوفة التمويل المراجعة ولا تستنتج عدد أزواج مباشر.', 'تُحتسب أدلة التمويل المحلية المراجعة في أداة التحويل فقط.', 'يجب اجتياز ضوابط الوقت والمصدر واللغة والسوق والشريك.', 'يستند توثيق العقود إلى بيانات رسوم العقود المتحققة.', 'سجلات من دليل الجهات التنظيمية الرسمية؛ اختلاف الحالات يمنع اختيار فائز.', 'تُفضل أدلة التمويل المحلية المراجعة ثم أقل رسوم آخذ وصانع فورية متحققة.'],
};
export function localizedScorecardRow(key, locale, fallback) { return rows[locale]?.[keys.indexOf(key)] || fallback; }
export function localizedScorecardRule(key, locale, fallback) {
  const index = ({ spotFees: 0, perpFees: 0, lowestFees: 0, futures: 5, top200Coins: 1, mostCoins: 1, fundingCoverage: 2, localFiatRails: 3, currentPromotion: 4, licenses: 6, beginners: 7 })[key];
  return rules[locale]?.[index] || fallback;
}
export function scorecardCaption(locale) { return ({ 'zh-Hans': '仅比较已公布数据。费率按挂单 / 吃单百分比显示；缺失数据不参与评选，相同数值并列。', 'zh-Hant': '僅比較已公布資料。費率按掛單 / 吃單百分比顯示；缺失資料不參與評選，相同數值並列。', ar: 'بيانات منشورة فقط. الرسوم نسب مئوية للصانع / الآخذ. البيانات الناقصة لا تفوز والقيم المتساوية تتعادل.' })[locale] || 'Published data only. Fees are maker / taker, in percent. Missing data cannot win; equal values share the lead.'; }
export function sourceLabel(locale) { return ({ 'zh-Hans': '来源', 'zh-Hant': '來源', ar: 'المصدر' })[locale] || 'Source'; }
export function localizedScorecardValue(value, locale) {
  const translated = {
    'zh-Hans': ['是', '否', '已纳入资金费率矩阵', '不在已审阅资金费率矩阵内', '有已审阅活动', '暂无已审阅活动'],
    'zh-Hant': ['是', '否', '已納入資金費率矩陣', '不在已審閱資金費率矩陣內', '有已審閱活動', '暫無已審閱活動'],
    ar: ['نعم', 'لا', 'ضمن مصفوفة معدلات التمويل', 'خارج مصفوفة التمويل المراجعة', 'تتوفر حملة مراجعة', 'لا تتوفر حملة مراجعة'],
  }[locale];
  if (!translated) return value;
  const index = ['Yes', 'No', 'Included in funding-rate matrix', 'Outside the reviewed funding matrix', 'Reviewed campaign offer', 'No reviewed campaign offer'].indexOf(value);
  if (index >= 0) return translated[index];
  if (/of top-200$/.test(value)) return value.replace('of top-200', locale === 'ar' ? 'من أفضل 200' : '/ 前 200');
  if (/ guide available$/.test(value)) return value.replace(' guide available', locale === 'ar' ? ' دليل متاح' : ' 入金指南');
  return typeof value === "string" ? value.replace(/: (licensed|registered|applied|withdrawn|warning|revoked)\b/g, (_, status) => `: ${licenseCopy(locale).statuses[status] || status}`) : value;
}
