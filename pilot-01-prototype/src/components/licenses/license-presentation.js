// Presentation translations only. Source records keep their original regulator wording.
const types = {
  'MiCA CASP (PSCA) - passported authorisation': ['MiCA CASP（PSCA）跨境授权', 'ترخيص MiCA CASP (PSCA) عبر الحدود'],
  'Cross-border MiCA CASP services (Art. 65 MiCA)': ['MiCA CASP 跨境服务（MiCA 第65条）', 'خدمات MiCA CASP عبر الحدود (المادة 65)'],
  'Cyprus Investment Firm (MiFID investment services)': ['塞浦路斯投资公司（MiFID 投资服务）', 'شركة استثمار قبرصية (خدمات MiFID)'],
  'MiCA CASP authorisation': ['MiCA 加密资产服务商授权', 'ترخيص مقدم خدمات الأصول المشفرة MiCA'],
  'MiCA CASP authorisation (operation of a trading platform)': ['MiCA 加密资产服务商授权（运营交易平台）', 'ترخيص MiCA لتشغيل منصة تداول'],
  'VASP Licence (Exchange, Broker-Dealer, Lending and Borrowing, Management and Investment)': ['VASP 牌照（交易、经纪交易、借贷、管理及投资）', 'ترخيص VASP (التداول والوساطة والإقراض والاقتراض والإدارة والاستثمار)'],
  'VASP Licence (Broker-Dealer, Management and Investment)': ['VASP 牌照（经纪交易、管理及投资）', 'ترخيص VASP (الوساطة والإدارة والاستثمار)'],
  'VASP Licence (Exchange Services)': ['VASP 牌照（交易服务）', 'ترخيص VASP (خدمات التداول)'],
  'Recognised Investment Exchange (Multilateral Trading Facility)': ['认可投资交易所（多边交易设施）', 'بورصة استثمار معترف بها (مرفق تداول متعدد الأطراف)'],
  'Recognised Clearing House (Custody and Central Securities Depository)': ['认可清算所（托管及中央证券存管）', 'دار مقاصة معترف بها (الحفظ والإيداع المركزي للأوراق المالية)'],
  'Financial Services Permission': ['金融服务许可', 'تصريح خدمات مالية'],
  'Withdrawn Financial Services Permission': ['已撤回金融服务许可', 'تصريح خدمات مالية مسحوب'],
  'VARA enforcement register — cease-and-desist and penalties (2026-06-17)': ['VARA 执法登记：停止令与处罚（2026-06-17）', 'سجل إنفاذ VARA: أمر بالكف وعقوبات (2026-06-17)'],
  'PSAV registration': ['PSAV 登记', 'تسجيل PSAV'],
  'VASP AML/CTF registration': ['VASP 反洗钱及反恐融资登记', 'تسجيل VASP لمكافحة غسل الأموال وتمويل الإرهاب'],
  'Authorised crypto asset trading platform': ['获授权加密资产交易平台', 'منصة تداول أصول مشفرة مرخصة'],
  'MiCA crypto-asset service provider authorisation': ['MiCA 加密资产服务商授权', 'ترخيص مقدم خدمات الأصول المشفرة MiCA'],
  'Virtual asset trading platform (VATP)': ['虚拟资产交易平台（VATP）', 'منصة تداول أصول افتراضية (VATP)'],
  'VDA reporting entity registration (AML/CFT only); official snapshot 2026-03-09': ['VDA 报告实体登记（仅反洗钱及反恐融资）；官方快照 2026-03-09', 'تسجيل جهة إبلاغ VDA (لمكافحة غسل الأموال وتمويل الإرهاب فقط)؛ لقطة رسمية 2026-03-09'],
  'Crypto-asset Exchange Service Provider': ['加密资产交易服务商', 'مقدم خدمات تداول الأصول المشفرة'],
  'Unregistered overseas operator warning': ['未登记境外经营者警告', 'تحذير بشأن مشغل أجنبي غير مسجل'],
  'Major Payment Institution — Digital Payment Token Service': ['大型支付机构：数字支付代币服务', 'مؤسسة دفع كبرى: خدمات رموز الدفع الرقمية'],
  'Digital Asset Exchange and Digital Asset Broker (local BINANCE TH)': ['数字资产交易所及经纪商（当地 BINANCE TH）', 'بورصة ووسيط أصول رقمية (BINANCE TH المحلية)'],
  'Transitional operating list': ['过渡期经营名单', 'قائمة التشغيل الانتقالية'],
  'Transitional liquidation list': ['过渡期清算名单', 'قائمة التصفية الانتقالية'],
};
export const localizedFactLocale = locale => ['zh-Hans', 'zh-Hant', 'ar'].includes(locale);
export function licenseTypeLabel(type, locale) {
  const value = types[type];
  if (!value || !localizedFactLocale(locale)) return type;
  const label = value[locale === 'ar' ? 1 : 0];
  const traditional = { 授: '授', 权: '權', 资: '資', 产: '產', 务: '務', 运: '運', 营: '營', 记: '記', 过: '過', 渡: '渡', 经: '經', 许: '許', 机: '機', 构: '構', 虚: '虛', 拟: '擬', 实: '實', 报: '報', 仅: '僅', 融: '融', 纪: '紀', 证: '證', 券: '券', 设: '設', 认: '認', 数: '數', 处: '處', 罚: '罰', 执: '執', 单: '單', 册: '冊', 际: '際', 边: '邊', 贷: '貸', 治: '治', 标: '標', 转: '轉', 让: '讓' };
  return locale === 'zh-Hant' ? label.replace(/[权资产务运营记过经许机构虚拟实报仅纪证设认数处罚执单册际边贷标转让]/g, character => traditional[character] || character) : label;
}
export function licenseScopeNote(record, locale) {
  if (!localizedFactLocale(locale)) return record.statusNote || record.note || '';
  if (!(record.statusNote || record.note)) return '';
  // A concise local scope warning accompanies the unchanged legal entity, status and official source.
  return locale === 'ar'
    ? 'يخص هذا السجل الكيان والاختصاص المحددين فقط. التسجيل أو الإدراج لا يعني ترخيصاً شاملاً؛ راجع المصدر الرسمي للقيود ونطاق الخدمات.'
    : locale === 'zh-Hant' ? '本記錄僅適用於所列實體及司法管轄區。登記或列名不等於全面授權；服務範圍和限制請查閱官方來源。' : '本记录仅适用于所列实体及司法辖区。登记或列名不等于全面授权；服务范围和限制请查阅官方来源。';
}
export function moreFactsLabel(locale) {
  return locale === 'ar' ? 'عرض جميع السجلات' : locale === 'zh-Hant' ? '查看全部記錄' : locale === 'zh-Hans' ? '查看全部记录' : 'View all records';
}
export function publicFactValue(value) {
  return value != null && !/^(?:N\/?A|—|–|-|尚未核验|尚未核驗|待官方核验|待官方核驗|待核验|待核驗|Pending(?: official-source)? verification|Unverified)$/i.test(String(value).trim()) && String(value).trim() !== '';
}
