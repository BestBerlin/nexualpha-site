/** Existing site data licence; individual datasets may retain a more specific licence. */
export const NEXUALPHA_DATA_LICENSE_URL = 'https://nexualpha.com/methodology#data-license';

/** Preserve compliant copy. Supply factual page copy when the original is only a label. */
export function finalizeDataset(node, { descriptionParts = [] } = {}) {
  let description = typeof node.description === 'string' ? node.description : '';
  if (description.length < 50) {
    description = [description, ...descriptionParts].filter(Boolean).join(' ').trim();
  }
  if (description.length > 5000) description = description.slice(0, 5000).trimEnd();
  if (description.length < 50) throw new Error(`Dataset description needs factual page copy: ${node.name}`);
  return { ...node, description, license: node.license || NEXUALPHA_DATA_LICENSE_URL };
}

// Scope and sources match the three whale-page tabs. Updates follow incoming public snapshots;
// no fixed collection frequency is promised by the page.
const WHALE_DESCRIPTIONS = {
  en: 'Whale accumulation signals, Hyperliquid positions and large public-chain transfers, updated as new public data snapshots arrive.',
  'zh-Hans': '汇总巨鲸增持信号、Hyperliquid 钱包持仓和公链大额转账，数据来自公开持仓与链上记录，并随新的公开数据快照更新。',
  'zh-Hant': '彙整巨鯨增持訊號、Hyperliquid 錢包持倉和公鏈大額轉帳，資料來自公開持倉與鏈上紀錄，並隨新的公開資料快照更新。',
  es: 'Señales de acumulación de grandes carteras, posiciones de Hyperliquid y grandes transferencias en cadenas públicas; se actualizan con cada nueva instantánea pública.',
  'pt-BR': 'Sinais de acumulação de baleias, posições na Hyperliquid e grandes transferências em redes públicas, atualizados quando chegam novos registros públicos.',
  fr: 'Signaux d’accumulation des grandes adresses, positions Hyperliquid et transferts importants sur les chaînes publiques, actualisés à chaque nouvel instantané public.',
  de: 'Akkumulationssignale großer Wallets, Hyperliquid-Positionen und große Transfers auf öffentlichen Blockchains; Aktualisierung mit neuen öffentlichen Datenständen.',
  it: 'Segnali di accumulo delle grandi wallet, posizioni Hyperliquid e grandi trasferimenti su blockchain pubbliche, aggiornati quando arrivano nuove istantanee pubbliche.',
  ja: '大口ウォレットの買い増しシグナル、Hyperliquid の保有ポジション、公開チェーンの大口送金を集計。公開ポジションとオンチェーン記録を基に、新しい公開データの取得に合わせて更新します。',
  ko: '대형 지갑의 매집 신호, Hyperliquid 포지션과 공개 블록체인의 대규모 이체를 집계합니다. 공개 포지션과 온체인 기록을 바탕으로 새 데이터 스냅샷이 들어올 때 갱신합니다.',
  ru: 'Сигналы накопления крупных кошельков, позиции Hyperliquid и крупные переводы в публичных сетях; обновление по мере поступления новых снимков открытых данных.',
  tr: 'Büyük cüzdanların birikim sinyalleri, Hyperliquid pozisyonları ve açık zincirlerdeki büyük transferler, yeni kamuya açık veri görüntüleri geldikçe güncellenir.',
  id: 'Sinyal akumulasi dompet besar, posisi Hyperliquid dan transfer besar di blockchain publik, diperbarui saat cuplikan data publik baru tersedia.',
  vi: 'Tín hiệu tích lũy của ví lớn, vị thế Hyperliquid và giao dịch chuyển tiền lớn trên chuỗi công khai, cập nhật khi có bản chụp dữ liệu công khai mới.',
  ar: 'إشارات تجميع المحافظ الكبيرة ومراكز Hyperliquid والتحويلات الكبيرة على الشبكات العامة، من سجلات المراكز وبيانات السلاسل العامة، وتُحدّث عند وصول لقطات بيانات جديدة.',
  ur: 'بڑے والٹس کی جمع آوری کے اشارے، Hyperliquid پوزیشنز اور عوامی بلاک چین پر بڑی منتقلیاں، عوامی پوزیشن اور چین ریکارڈ سے؛ نئے ڈیٹا اسنیپ شاٹس آنے پر تازہ ہوتی ہیں۔',
  uk: 'Сигнали накопичення великих гаманців, позиції Hyperliquid і великі перекази в публічних мережах; оновлення з надходженням нових знімків відкритих даних.',
};
export function whaleDatasetDescription(locale, coin) {
  return `${coin ? `${coin}: ` : ''}${WHALE_DESCRIPTIONS[locale] || WHALE_DESCRIPTIONS.en}`;
}
