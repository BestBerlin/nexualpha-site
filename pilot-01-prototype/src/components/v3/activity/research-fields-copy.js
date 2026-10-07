const keys = ['regions', 'eligibility', 'kyc', 'deposit', 'trading', 'rewardType', 'maximumConditions', 'limitations', 'publishedDate', 'datePrecision', 'gaps'];
const rows = {
  en: ['Regions', 'Who qualifies', 'Identity verification', 'Deposit requirements', 'Trading requirements', 'Reward type', 'Maximum reward conditions', 'Limitations', 'Published date', 'Date precision', 'Unresolved evidence'],
  'zh-Hans': ['适用地区', '用户资格', '身份验证', '入金要求', '交易要求', '奖励类型', '最高奖励条件', '限制', '发布日期', '日期精度', '待核实信息'],
  'zh-Hant': ['適用地區', '用戶資格', '身分驗證', '入金要求', '交易要求', '獎勵類型', '最高獎勵條件', '限制', '發布日期', '日期精度', '待核實資訊'],
  es: ['Regiones', 'Elegibilidad', 'Verificación de identidad', 'Requisitos de depósito', 'Requisitos de negociación', 'Tipo de recompensa', 'Condiciones del máximo', 'Limitaciones', 'Fecha de publicación', 'Precisión de fechas', 'Información pendiente'],
  'pt-BR': ['Regiões', 'Elegibilidade', 'Verificação de identidade', 'Requisitos de depósito', 'Requisitos de negociação', 'Tipo de recompensa', 'Condições do valor máximo', 'Limitações', 'Data de publicação', 'Precisão das datas', 'Informações pendentes'],
  fr: ['Régions', 'Admissibilité', 'Vérification d’identité', 'Conditions de dépôt', 'Conditions de négociation', 'Type de récompense', 'Conditions du maximum', 'Restrictions', 'Date de publication', 'Précision des dates', 'Informations à confirmer'],
  de: ['Regionen', 'Teilnahmeberechtigung', 'Identitätsprüfung', 'Einzahlungsbedingungen', 'Handelsbedingungen', 'Prämienart', 'Bedingungen der Höchstprämie', 'Einschränkungen', 'Veröffentlichungsdatum', 'Datumsgenauigkeit', 'Offene Nachweise'],
  ja: ['対象地域', '対象ユーザー', '本人確認', '入金条件', '取引条件', '特典の種類', '最大特典の条件', '制限事項', '公開日', '日付の精度', '未確認事項'],
  ko: ['대상 지역', '참여 자격', '본인 인증', '입금 조건', '거래 조건', '보상 유형', '최대 보상 조건', '제한 사항', '게시일', '날짜 정확도', '미확인 정보'],
  ar: ['المناطق', 'الأهلية', 'التحقق من الهوية', 'متطلبات الإيداع', 'متطلبات التداول', 'نوع المكافأة', 'شروط الحد الأقصى', 'القيود', 'تاريخ النشر', 'دقة التواريخ', 'معلومات غير مؤكدة'],
  tr: ['Bölgeler', 'Katılım koşulları', 'Kimlik doğrulama', 'Yatırma koşulları', 'İşlem koşulları', 'Ödül türü', 'Azami ödül koşulları', 'Sınırlamalar', 'Yayın tarihi', 'Tarih kesinliği', 'Eksik kanıtlar'],
  ru: ['Регионы', 'Условия участия', 'Проверка личности', 'Условия пополнения', 'Условия торговли', 'Вид награды', 'Условия максимальной награды', 'Ограничения', 'Дата публикации', 'Точность дат', 'Неподтверждённые сведения'],
  id: ['Wilayah', 'Kelayakan', 'Verifikasi identitas', 'Syarat setoran', 'Syarat perdagangan', 'Jenis hadiah', 'Syarat hadiah maksimum', 'Batasan', 'Tanggal publikasi', 'Ketepatan tanggal', 'Bukti belum lengkap'],
  vi: ['Khu vực', 'Điều kiện tham gia', 'Xác minh danh tính', 'Yêu cầu nạp tiền', 'Yêu cầu giao dịch', 'Loại phần thưởng', 'Điều kiện thưởng tối đa', 'Giới hạn', 'Ngày công bố', 'Độ chính xác ngày', 'Thông tin chưa xác minh'],
  it: ['Regioni', 'Idoneità', 'Verifica dell’identità', 'Requisiti di deposito', 'Requisiti di negoziazione', 'Tipo di premio', 'Condizioni del premio massimo', 'Limitazioni', 'Data di pubblicazione', 'Precisione delle date', 'Informazioni da confermare'],
};
export const researchFieldsByLocale = Object.fromEntries(Object.entries(rows).map(([locale, values]) => [locale, Object.fromEntries(keys.map((key, index) => [key, values[index]]))]));
export const researchFieldsCopy = (locale) => researchFieldsByLocale[locale] ?? researchFieldsByLocale.en;

const unknown = { en: 'Not established by this source', 'zh-Hans': '该来源未确定', 'zh-Hant': '該來源未確定', es: 'No establecido por esta fuente', 'pt-BR': 'Não estabelecido por esta fonte', fr: 'Non établi par cette source', de: 'Durch diese Quelle nicht belegt', ja: 'この出典では未確認', ko: '이 출처에서 확인되지 않음', ar: 'غير مثبت في هذا المصدر', tr: 'Bu kaynakta belirtilmemiş', ru: 'Не установлено этим источником', id: 'Belum ditetapkan oleh sumber ini', vi: 'Nguồn này chưa xác nhận', it: 'Non stabilito da questa fonte' };
export const researchUnknown = (locale) => unknown[locale] ?? unknown.en;

const dateNotes = { en: 'Time or time zone not fully stated', 'zh-Hans': '原文时间或时区不完整', 'zh-Hant': '原文時間或時區不完整', es: 'Hora o zona horaria incompleta', 'pt-BR': 'Hora ou fuso horário incompleto', fr: 'Heure ou fuseau horaire non précisé', de: 'Uhrzeit oder Zeitzone nicht vollständig angegeben', ja: '時刻または時間帯の記載が不完全', ko: '시간 또는 시간대가 명확하지 않음', ar: 'الوقت أو المنطقة الزمنية غير مكتملين', tr: 'Saat veya saat dilimi tam belirtilmemiş', ru: 'Время или часовой пояс указаны не полностью', id: 'Waktu atau zona waktu belum lengkap', vi: 'Giờ hoặc múi giờ chưa đầy đủ', it: 'Ora o fuso orario non indicati completamente' };
export const researchDateNote = (locale) => dateNotes[locale] ?? dateNotes.en;
