// UI labels only; source records and their wording remain unchanged.
const labels = {
  en: ['Proof of reserves', 'KYC / eligibility', 'Deposit methods'],
  'zh-Hans': ['储备金证明', '身份验证 / 资格', '入金方式'],
  'zh-Hant': ['儲備金證明', '身分驗證 / 資格', '入金方式'],
  es: ['Prueba de reservas', 'Identidad / elegibilidad', 'Métodos de depósito'],
  'pt-BR': ['Prova de reservas', 'Identidade / elegibilidade', 'Métodos de depósito'],
  fr: ['Preuve de réserves', 'Identité / admissibilité', 'Méthodes de dépôt'],
  de: ['Reservennachweis', 'Identität / Berechtigung', 'Einzahlungsmethoden'],
  ja: ['準備金の証明', '本人確認 / 利用資格', '入金方法'],
  ko: ['준비금 증명', '신원 확인 / 이용 자격', '입금 방법'],
  tr: ['Rezerv kanıtı', 'Kimlik / uygunluk', 'Para yatırma yöntemleri'],
  ru: ['Подтверждение резервов', 'Идентификация / доступность', 'Способы пополнения'],
  ar: ['إثبات الاحتياطيات', 'الهوية / الأهلية', 'طرق الإيداع'],
  id: ['Bukti cadangan', 'Identitas / kelayakan', 'Metode deposit'],
  vi: ['Bằng chứng dự trữ', 'Danh tính / điều kiện', 'Phương thức nạp tiền'],
  it: ['Prova delle riserve', 'Identità / idoneità', 'Metodi di deposito'],
  ur: ['ذخائر کا ثبوت', 'شناخت / اہلیت', 'جمع کرانے کے طریقے'],
  uk: ['Підтвердження резервів', 'Ідентифікація / доступність', 'Способи поповнення'],
};
export function exchangeKeyFactLabels(locale = 'en') {
  const [reserves, identity, deposits] = labels[locale] || labels.en;
  return { 'proof-of-reserves': reserves, 'kyc-reference': identity, 'deposit-methods': deposits };
}
