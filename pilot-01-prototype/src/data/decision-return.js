import { venueDatabase } from './venue-database.js';
import { localizedHref, LOCALE_PREFIX_BY_CODE } from './locale-routing.js';
import { sanitizeMarket, sanitizeProduct } from './growth-context.js';

const FEE_VENUES = new Set(['binance','okx','bybit','bitget','gate-io','kucoin','mexc']);
const FEE_VOLUMES = new Set([5000,20000,50000,100000,300000,500000,1000000]);
const STATE_KEYS = ['scenario','venue','instrument','volume','order','market','product'];

function normalizeScenario(input) {
  if (!['fees','cost'].includes(input.kind) || !['spot','futures'].includes(input.instrument)) return null;
  if (typeof input.volume !== 'number' && !/^\d+(?:\.\d{1,2})?$/.test(String(input.volume ?? ''))) return null;
  const volume=Number(input.volume);
  if (!Number.isFinite(volume) || volume < 0 || volume > 1e10) return null;
  const context={kind:input.kind,market:sanitizeMarket(input.market)||'unknown',product:input.instrument==='spot'?'spot':'perpetuals'};
  if (input.kind==='fees') {
    if (!FEE_VENUES.has(input.venue) || !FEE_VOLUMES.has(volume)) return null;
    return {...context,venue:input.venue,instrument:input.instrument,volume};
  }
  if (!['maker','taker'].includes(input.order)) return null;
  return {...context,instrument:input.instrument,order:input.order,volume:Math.round(volume*100)/100};
}

// Deliberately build fresh parameters: never reuse the current URL's identity,
// campaign, referral or computed-result fields in a shareable scenario.
export function buildDecisionReturnHref(input={}) {
  const locale=Object.hasOwn(LOCALE_PREFIX_BY_CODE,input.locale)?input.locale:'en';
  const market=sanitizeMarket(input.market);
  if (input.kind==='compare') {
    const slugs=input.slugs;
    if (!Array.isArray(slugs) || slugs.length<2 || slugs.length>3 || new Set(slugs).size!==slugs.length || !slugs.every(s=>Object.hasOwn(venueDatabase,s))) return null;
    const product=sanitizeProduct(input.product);
    return localizedHref(`/compare/${slugs.join('-vs-')}`,{locale,...(market&&market!=='unknown'?{market}:{}),...(product&&product!=='unknown'?{product}:{})});
  }
  const state=normalizeScenario(input);
  if (!state) return null;
  const {kind,...fields}=state;
  if(fields.market==='unknown') delete fields.market;
  return localizedHref(kind==='fees'?'/embed/calculator':'/rates#cost-scenario',{locale,scenario:kind,...fields});
}

export function readDecisionReturnState(search='') {
  const params=new URLSearchParams(search);
  if(STATE_KEYS.some(key=>params.getAll(key).length>1)) return null;
  return normalizeScenario({kind:params.get('scenario'),venue:params.get('venue'),instrument:params.get('instrument'),volume:params.get('volume'),order:params.get('order'),market:params.get('market')});
}

const COPY = {
  en:{copy:'Copy link to continue later',copied:'Link copied',failed:'Copy failed. Select and copy the link below.',linkLabel:'Link with current selections',botFeeOpen:'Open fee query in Telegram'},
  'zh-Hans':{copy:'复制链接，稍后继续',copied:'链接已复制',failed:'未能自动复制，请选中并复制下方链接。',linkLabel:'包含当前选择的链接',botFeeOpen:'在 Telegram 打开费用查询'},
  'zh-Hant':{copy:'複製連結，稍後繼續',copied:'連結已複製',failed:'未能自動複製，請選取並複製下方連結。',linkLabel:'包含目前選擇的連結',botFeeOpen:'在 Telegram 開啟費用查詢'},
  ja:{copy:'リンクをコピーして後で続ける',copied:'リンクをコピーしました',failed:'コピーできませんでした。下のリンクを選択してコピーしてください。',linkLabel:'現在の選択を含むリンク',botFeeOpen:'Telegramで手数料の問い合わせを開く'},
  ko:{copy:'나중에 이어볼 링크 복사',copied:'링크를 복사했습니다',failed:'복사하지 못했습니다. 아래 링크를 선택해 복사하세요.',linkLabel:'현재 선택이 포함된 링크',botFeeOpen:'Telegram에서 수수료 조회 열기'},
  tr:{copy:'Daha sonra devam etmek için bağlantıyı kopyala',copied:'Bağlantı kopyalandı',failed:'Kopyalanamadı. Aşağıdaki bağlantıyı seçip kopyalayın.',linkLabel:'Mevcut seçimleri içeren bağlantı',botFeeOpen:'Telegram’da ücret sorgusunu aç'},
  'pt-BR':{copy:'Copiar link para continuar depois',copied:'Link copiado',failed:'Não foi possível copiar. Selecione e copie o link abaixo.',linkLabel:'Link com as seleções atuais',botFeeOpen:'Abrir consulta de taxas no Telegram'},
  es:{copy:'Copiar enlace para continuar después',copied:'Enlace copiado',failed:'No se pudo copiar. Selecciona y copia el enlace de abajo.',linkLabel:'Enlace con las selecciones actuales',botFeeOpen:'Abrir consulta de comisiones en Telegram'},
  fr:{copy:'Copier le lien pour continuer plus tard',copied:'Lien copié',failed:'Copie impossible. Sélectionnez et copiez le lien ci-dessous.',linkLabel:'Lien avec les sélections actuelles',botFeeOpen:'Ouvrir la recherche de frais sur Telegram'},
  de:{copy:'Link zum späteren Fortsetzen kopieren',copied:'Link kopiert',failed:'Kopieren fehlgeschlagen. Wählen und kopieren Sie den Link unten.',linkLabel:'Link mit der aktuellen Auswahl',botFeeOpen:'Gebührenabfrage in Telegram öffnen'},
  ar:{copy:'نسخ الرابط للمتابعة لاحقًا',copied:'تم نسخ الرابط',failed:'تعذّر النسخ. حدّد الرابط أدناه وانسخه.',linkLabel:'رابط يتضمن الخيارات الحالية',botFeeOpen:'فتح استعلام الرسوم في Telegram'},
  ru:{copy:'Скопировать ссылку, чтобы продолжить позже',copied:'Ссылка скопирована',failed:'Не удалось скопировать. Выделите и скопируйте ссылку ниже.',linkLabel:'Ссылка с текущими настройками',botFeeOpen:'Открыть запрос комиссий в Telegram'},
  id:{copy:'Salin tautan untuk dilanjutkan nanti',copied:'Tautan disalin',failed:'Gagal menyalin. Pilih dan salin tautan di bawah.',linkLabel:'Tautan dengan pilihan saat ini',botFeeOpen:'Buka pemeriksaan biaya di Telegram'},
  vi:{copy:'Sao chép liên kết để tiếp tục sau',copied:'Đã sao chép liên kết',failed:'Không thể sao chép. Chọn và sao chép liên kết bên dưới.',linkLabel:'Liên kết chứa lựa chọn hiện tại',botFeeOpen:'Mở truy vấn phí trên Telegram'},
  it:{copy:'Copia il link per continuare più tardi',copied:'Link copiato',failed:'Copia non riuscita. Seleziona e copia il link qui sotto.',linkLabel:'Link con le selezioni attuali',botFeeOpen:'Apri la ricerca delle commissioni su Telegram'},
};

export function decisionReturnCopy(locale='en') {
  return COPY[locale] || COPY[locale==='zh-CN'?'zh-Hans':locale==='zh-TW'?'zh-Hant':String(locale).split('-')[0]] || COPY.en;
}
