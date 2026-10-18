import { licenseCopy } from '../../data/licenses.js';

// Profile UI copy supplements locales not yet covered by the directory copy.
// Legal names, licence types and regulator quotations remain source wording.
const supplements = {
  'zh-Hant': {
    title: '交易所牌照目錄', exchange: '交易所', country: '國家／地區', entity: '實體', regulator: '監管機構', type: '牌照或登記類型', status: '狀態', source: '官方來源', lastChecked: '核驗日期', all: '全部', open: '開戶註冊', empty: '沒有符合篩選條件的官方來源紀錄。',
    statuses: { licensed: '持牌', registered: '已登記', applied: '已申請／列名，非授權', restricted: '受限', banned: '禁止', 'liquidation list': '清算名單', authorised: '獲授權', warning: '警示', withdrawn: '已撤回', revoked: '已撤銷' },
  },
  ru: {
    title: 'Лицензии бирж', exchange: 'Биржа', country: 'Страна', entity: 'Юридическое лицо', regulator: 'Регулятор', type: 'Тип лицензии или регистрации', status: 'Статус', source: 'Официальный источник', lastChecked: 'Дата проверки', all: 'Все', open: 'Открыть счёт', empty: 'Официальные записи по выбранным условиям не найдены.',
    statuses: { licensed: 'Лицензирована', registered: 'Зарегистрирована', applied: 'Заявка или включение в список, без разрешения', restricted: 'Ограничена', banned: 'Запрещена', 'liquidation list': 'Список ликвидации', authorised: 'Разрешена', warning: 'Предупреждение', withdrawn: 'Отозвана заявителем', revoked: 'Аннулирована' },
  },
  it: {
    title: 'Licenze degli exchange', exchange: 'Exchange', country: 'Paese', entity: 'Entità giuridica', regulator: 'Autorità di vigilanza', type: 'Tipo di licenza o registrazione', status: 'Stato', source: 'Fonte ufficiale', lastChecked: 'Ultima verifica', all: 'Tutti', open: 'Apri un conto', empty: 'Nessun registro ufficiale corrispondente ai filtri.',
    statuses: { licensed: 'Con licenza', registered: 'Registrato', applied: 'Domanda o iscrizione in elenco, senza autorizzazione', restricted: 'Soggetto a restrizioni', banned: 'Vietato', 'liquidation list': 'Elenco di liquidazione', authorised: 'Autorizzato', warning: 'Avvertenza', withdrawn: 'Ritirato', revoked: 'Revocato' },
  },
  es: { statuses: { authorised: 'Autorizado' } },
  'pt-BR': { statuses: { authorised: 'Autorizada' } },
  fr: { statuses: { authorised: 'Autorisé' } },
  de: { statuses: { authorised: 'Zugelassen' } },
  ja: { statuses: { authorised: '認可済み' } },
  ko: { statuses: { authorised: '인가됨' } },
  tr: { statuses: { authorised: 'Yetkilendirilmiş' } },
  id: { statuses: { authorised: 'Diotorisasi' } },
  vi: { statuses: { authorised: 'Được chấp thuận' } },
  ar: { open: 'فتح حساب', statuses: { authorised: 'مصرح له' } },
  ur: { open: 'اکاؤنٹ کھولیں', statuses: { authorised: 'اجازت یافتہ' } },
  uk: { open: 'Відкрити рахунок', statuses: { authorised: 'Авторизовано' } },
};

export function licenseProfileCopy(locale = 'en') {
  const key = locale === 'zh-CN' ? 'zh-Hans' : locale === 'zh-TW' ? 'zh-Hant' : locale;
  const base = licenseCopy(key);
  const supplement = supplements[key];
  return { ...base, ...supplement, statuses: { ...base.statuses, ...supplement?.statuses } };
}

// Omit missing source fields rather than presenting data-entry placeholders.
export function publicFactValue(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).trim();
  return /(?:\bN\s*\/\s*A\b|尚未核[验驗]|待核[验驗]|未核[验驗])/i.test(text) || /^(?:unknown|null|undefined|[-–—])$/i.test(text) ? '' : text;
}
