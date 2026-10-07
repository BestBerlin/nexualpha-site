/**
 * Extensible, source-backed registry for venue brand assets. This is data only:
 * consumers select `preferredSquare` or `preferredWordmark` without inventing
 * paths, colors, or variants in UI code.
 */
export type BrandCategory = "cex" | "dex" | "perp-dex";
export type BrandStatus = "verified" | "unavailable";
export type BrandVariant =
  | "icon-square"
  | "app-icon"
  | "wordmark-horizontal"
  | "logo-mark"
  | "favicon-pwa";

export type BrandMime = "image/png" | "image/jpeg" | "image/svg+xml" | "image/vnd.microsoft.icon";

export interface BrandAsset {
  path: string;
  localPath: string;
  officialPage: string;
  directUrl: string;
  publisher: string;
  variant: BrandVariant;
  dimensions: `${number}x${number}`;
  mime: BrandMime;
  fetchedAt: "2026-09-02T00:00:00+08:00";
  originalSha256: string;
  outputSha256: string;
  transforms: string[];
  licenseUseNote: string;
}

export interface BrandRecord {
  slug: string;
  name: string;
  category: BrandCategory;
  status: BrandStatus;
  assets: BrandAsset[];
  preferredSquare?: string;
  preferredWordmark?: string;
  unavailableReason?: string;
  continuationChannel?: string;
}

type AssetSource = Omit<BrandAsset, "localPath" | "fetchedAt">;

const fetchedAt = "2026-09-02T00:00:00+08:00" as const;
const appStoreUseNote = "Official app-store artwork from the named publisher. App icon only; not a complete logo pack.";
const siteUseNote = "Official site, PWA, or repository asset. Variant is limited to the stored file and does not imply a full brand kit.";
const unretainedDirectUrl = (page: string) => `${page}#direct-resource-recorded-during-2026-09-02-acquisition`;

const asset = (source: AssetSource): BrandAsset => ({
  ...source,
  localPath: `pilot-01-prototype/public${source.path}`,
  fetchedAt,
});

const assetCatalog: Record<string, BrandAsset[]> = {
  aerodrome: [
    asset({ path: "/brands/aerodrome/official-logo.svg", officialPage: "https://aerodrome.finance/", directUrl: unretainedDirectUrl("https://aerodrome.finance/"), publisher: "Aerodrome Finance", variant: "logo-mark", dimensions: "27x30", mime: "image/svg+xml", originalSha256: "c3deafbd7d6328690a2c6a28c34c5215037469fe620536bc856d14c263bbdab0", outputSha256: "c3deafbd7d6328690a2c6a28c34c5215037469fe620536bc856d14c263bbdab0", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  aster: [
    asset({ path: "/brands/aster/official-icon.png", officialPage: "https://www.asterdex.com/", directUrl: unretainedDirectUrl("https://www.asterdex.com/"), publisher: "Aster", variant: "app-icon", dimensions: "512x512", mime: "image/png", originalSha256: "c2919b6c58540c8ee795796ed7f1674edb1665fae3d87dd4fd63a5b76196e231", outputSha256: "c2919b6c58540c8ee795796ed7f1674edb1665fae3d87dd4fd63a5b76196e231", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  backpack: [
    asset({ path: "/brands/backpack/icon-square.png", officialPage: "https://backpack.exchange/", directUrl: unretainedDirectUrl("https://backpack.exchange/"), publisher: "Backpack Exchange", variant: "icon-square", dimensions: "32x32", mime: "image/png", originalSha256: "f7f5e71d2e5cf375ea19b67666c6c3febb215bac3d793c13d09deb53bc8166ce", outputSha256: "f7f5e71d2e5cf375ea19b67666c6c3febb215bac3d793c13d09deb53bc8166ce", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  balancer: [
    asset({ path: "/brands/balancer/official-icon.png", officialPage: "https://balancer.fi/", directUrl: unretainedDirectUrl("https://balancer.fi/"), publisher: "Balancer", variant: "icon-square", dimensions: "512x512", mime: "image/png", originalSha256: "b85ebd14b1c3a435c32070a0ddb96e38dda68ebb05d6570d09efafd2c79cd4ad", outputSha256: "b85ebd14b1c3a435c32070a0ddb96e38dda68ebb05d6570d09efafd2c79cd4ad", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  binance: [
    asset({ path: "/brands/binance.png", officialPage: "https://apps.apple.com/ca/app/binance-buy-bitcoin-crypto/id1436799971", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/3d/f3/f5/3df3f54f-bfcd-60b0-bd00-41990ed41fa6/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg", publisher: "Binance Switzerland AG", variant: "app-icon", dimensions: "512x512", mime: "image/png", originalSha256: "d5c9e0a20f0108661865c50f7f353666bf97756f68448b6ec3889aec45a14d3b", outputSha256: "5a4182def8e1bb271e59678344bb4b9699475950ea85d86f82b8977b3d0af38c", transforms: ["sips -s format png"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/binance/google-play-icon.png", officialPage: "https://play.google.com/store/apps/details?id=com.binance.dev", directUrl: unretainedDirectUrl("https://play.google.com/store/apps/details?id=com.binance.dev"), publisher: "Binance", variant: "app-icon", dimensions: "512x512", mime: "image/png", originalSha256: "1c2835cfa0029e95e1edbd67588d943b724bb7b7b9fed0deda834b7be8816370", outputSha256: "1c2835cfa0029e95e1edbd67588d943b724bb7b7b9fed0deda834b7be8816370", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  bingx: [
    asset({ path: "/brands/bingx/icon-square.png", officialPage: "https://bingx.com/", directUrl: unretainedDirectUrl("https://bingx.com/"), publisher: "BingX", variant: "icon-square", dimensions: "120x120", mime: "image/png", originalSha256: "937415c7b83190445de8136ef62cc859bb56a90b02a4f34af7301d5847e1c509", outputSha256: "937415c7b83190445de8136ef62cc859bb56a90b02a4f34af7301d5847e1c509", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  bitfinex: [
    asset({ path: "/brands/bitfinex/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/bitfinex-trade-digital-assets/id1436383182?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/96/eb/3d/96eb3d17-8c16-1bf5-4ec4-bbeaab13aba8/AppIcon-0-0-1x_U007epad-0-1-85-220.png/512x512bb.jpg", publisher: "iFinex, Inc.", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "37cf2a0a53a950600da18d2fbf98aa21a737b2dcd9a1e75956d58473a6ebe676", outputSha256: "37cf2a0a53a950600da18d2fbf98aa21a737b2dcd9a1e75956d58473a6ebe676", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  bitget: [
    asset({ path: "/brands/bitget.png", officialPage: "https://www.bitget.com/", directUrl: "https://www.bitget.com/baseasset/favicon4.png", publisher: "Bitget", variant: "favicon-pwa", dimensions: "144x144", mime: "image/png", originalSha256: "96566dc4bc8606740f518de4126b24537e7d287ed7e8181eb9e641cfb80847a7", outputSha256: "96566dc4bc8606740f518de4126b24537e7d287ed7e8181eb9e641cfb80847a7", transforms: ["none"], licenseUseNote: siteUseNote }),
    asset({ path: "/brands/bitget.svg", officialPage: "https://www.bitget.com/", directUrl: "https://www.bitget.com/micro-runtime/images/logo-light.svg", publisher: "Bitget", variant: "wordmark-horizontal", dimensions: "103x32", mime: "image/svg+xml", originalSha256: "f7c6c9326765d5780fe86c939718293f0d41e85c4d9cb3ab9aef17d586911c48", outputSha256: "f7c6c9326765d5780fe86c939718293f0d41e85c4d9cb3ab9aef17d586911c48", transforms: ["none"], licenseUseNote: siteUseNote }),
    asset({ path: "/brands/bitget/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/bitget-trade-bitcoin-crypto/id1442778704?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/ef/76/79/ef767902-8fe3-0ca2-84a9-566987e2cc25/AppIcon-0-1x_U007epad-0-1-0-85-220-0.png/512x512bb.jpg", publisher: "BG LIMITED", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "c6bb987b8534efb9047ff8060b9ee5a1cec045338695f400a8ad76905530f80a", outputSha256: "c6bb987b8534efb9047ff8060b9ee5a1cec045338695f400a8ad76905530f80a", transforms: ["none"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/bitget/manifest-icon.png", officialPage: "https://www.bitget.com/", directUrl: unretainedDirectUrl("https://www.bitget.com/"), publisher: "Bitget", variant: "favicon-pwa", dimensions: "512x512", mime: "image/png", originalSha256: "cc5e6eb9f765e69ae4a3ffea226cbaadbce568e1f5c3cbd403d403b89a0f515d", outputSha256: "cc5e6eb9f765e69ae4a3ffea226cbaadbce568e1f5c3cbd403d403b89a0f515d", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  bithumb: [
    asset({ path: "/brands/bithumb/icon-square.png", officialPage: "https://www.bithumb.com/", directUrl: unretainedDirectUrl("https://www.bithumb.com/"), publisher: "Bithumb", variant: "icon-square", dimensions: "192x192", mime: "image/png", originalSha256: "a454b226af0d706f6c7d8075ffd0cc4dbdfb66bc1a66c567e80cb84d97eb3c40", outputSha256: "a454b226af0d706f6c7d8075ffd0cc4dbdfb66bc1a66c567e80cb84d97eb3c40", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  bitmart: [
    asset({ path: "/brands/bitmart/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/bitmart-buy-crypto-stocks/id1396382871?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/e6/82/6a/e6826a70-f39e-439e-128a-f4fe454f33f1/AppIcon-1x_U007emarketing-0-8-0-85-220-0.png/512x512bb.jpg", publisher: "GBM Foundation Company Ltd", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "f5d16281eac458bc396c2cee4a361cf9123175ab197a96d5bfb534f71922b27f", outputSha256: "f5d16281eac458bc396c2cee4a361cf9123175ab197a96d5bfb534f71922b27f", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  bitstamp: [
    asset({ path: "/brands/bitstamp/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/bitstamp-by-robinhood-buy-btc/id1406825640?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/c6/a6/cc/c6a6cc63-9e63-f446-608c-59af0760e7cd/AppIcon-0-0-1x_U007ephone-0-1-0-85-220.png/512x512bb.jpg", publisher: "Bitstamp LTD", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "f2159d39ef67ad62bf2a42173b3c0a9acf168cc431af0ab6634fada77dd88875", outputSha256: "f2159d39ef67ad62bf2a42173b3c0a9acf168cc431af0ab6634fada77dd88875", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  btse: [
    asset({ path: "/brands/btse/app-store-icon.jpg", officialPage: "https://apps.apple.com/sg/app/btse-buy-bitcoin-crypto/id1494556510?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/ce/6d/91/ce6d916e-1779-e76c-ac8c-8bf5a5fcd32f/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg", publisher: "BTSE HOLDINGS LTD", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "1c307da7d572ceeddf86a57a095de6b4bf14cbf25114b308e47bffd7d776832a", outputSha256: "1c307da7d572ceeddf86a57a095de6b4bf14cbf25114b308e47bffd7d776832a", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  bullish: [
    asset({ path: "/brands/bullish/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/bullish-buy-bitcoin-crypto/id6740187901?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/f9/64/52/f9645280-adc1-6866-5774-b68ff94a2f4b/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg", publisher: "Bullish Global", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "9ce6a29701b9d940ee89cee4c6468d0389438607547b35524ade2956b7716084", outputSha256: "9ce6a29701b9d940ee89cee4c6468d0389438607547b35524ade2956b7716084", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  bybit: [
    asset({ path: "/brands/bybit.png", officialPage: "https://apps.apple.com/us/app/bybit-buy-crypto-bitcoin/id1488296980", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/e3/8d/94/e38d949c-ec8b-0bbe-0609-b10befa83e3c/AppIcon-0-0-1x_U007epad-0-1-85-220.png/512x512bb.jpg", publisher: "Bybit Fintech Limited", variant: "app-icon", dimensions: "512x512", mime: "image/png", originalSha256: "8f2b733d53255b8c7c4fc1b5f63b488a8ccde3b94f7ea335a8a245dab8522e17", outputSha256: "f4eae7cea9ea4760455b54be0d09163577a839a8dff4e4a135022ed6c3bffd0d", transforms: ["sips -s format png"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/bybit/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/bybit-buy-crypto-bitcoin/id1488296980?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/e3/8d/94/e38d949c-ec8b-0bbe-0609-b10befa83e3c/AppIcon-0-0-1x_U007epad-0-1-85-220.png/512x512bb.jpg", publisher: "Bybit Fintech Limited", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "8f2b733d53255b8c7c4fc1b5f63b488a8ccde3b94f7ea335a8a245dab8522e17", outputSha256: "8f2b733d53255b8c7c4fc1b5f63b488a8ccde3b94f7ea335a8a245dab8522e17", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  camelot: [
    asset({ path: "/brands/camelot/official-icon.svg", officialPage: "https://camelot.exchange/", directUrl: unretainedDirectUrl("https://camelot.exchange/"), publisher: "Camelot", variant: "logo-mark", dimensions: "500x500", mime: "image/svg+xml", originalSha256: "55ad10ed6582d82eec0c77190acfc6116ec4519bb5bcbdb270c24f3190e0ebc9", outputSha256: "55ad10ed6582d82eec0c77190acfc6116ec4519bb5bcbdb270c24f3190e0ebc9", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  coinbase: [
    asset({ path: "/brands/coinbase/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/coinbase-buy-crypto-stocks/id886427730?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/25/fe/33/25fe33ee-2a95-586c-fe1f-9471e4d890c6/AppIcon-0-0-1x_U007ephone-0-1-0-85-220.png/512x512bb.jpg", publisher: "Coinbase, Inc.", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "bb3427a45565933aa713074b22ca30c2df49efe9b927ad69851136b90125b064", outputSha256: "bb3427a45565933aa713074b22ca30c2df49efe9b927ad69851136b90125b064", transforms: ["none"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/coinbase/apple-touch-icon.png", officialPage: "https://www.coinbase.com/", directUrl: unretainedDirectUrl("https://www.coinbase.com/"), publisher: "Coinbase", variant: "favicon-pwa", dimensions: "512x512", mime: "image/png", originalSha256: "4a579b939cf054112cf8321ff1076c58fa5654cd567003203810bd522f585f1d", outputSha256: "4a579b939cf054112cf8321ff1076c58fa5654cd567003203810bd522f585f1d", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  coinex: [
    asset({ path: "/brands/coinex/icon-square.svg", officialPage: "https://www.coinex.com/", directUrl: unretainedDirectUrl("https://www.coinex.com/"), publisher: "CoinEx", variant: "logo-mark", dimensions: "34x36", mime: "image/svg+xml", originalSha256: "863116f43596f783e5190423f3e19d1726ab43f9b4488056f3806a2fe3074d94", outputSha256: "863116f43596f783e5190423f3e19d1726ab43f9b4488056f3806a2fe3074d94", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  "crypto-com": [
    asset({ path: "/brands/crypto-com/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/crypto-com-trade-every-market/id1262148500?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/47/33/51/473351fc-7b95-49d2-2708-6862050c7812/AppIcon-0-0-1x_U007emarketing-0-6-0-sRGB-85-220.png/512x512bb.jpg", publisher: "CRYPTO Technology Holdings Limited", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "8364ddf904255573b8434ee5e6e88fd35ba365389975362426015e45eb367755", outputSha256: "8364ddf904255573b8434ee5e6e88fd35ba365389975362426015e45eb367755", transforms: ["none"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/crypto-com/icon.ico", officialPage: "https://crypto.com/exchange", directUrl: unretainedDirectUrl("https://crypto.com/exchange"), publisher: "Crypto.com", variant: "favicon-pwa", dimensions: "256x256", mime: "image/vnd.microsoft.icon", originalSha256: "d88ab80a018afdd384bda19e2dd8823628c2f84eee26f33b51c9938c0d086614", outputSha256: "d88ab80a018afdd384bda19e2dd8823628c2f84eee26f33b51c9938c0d086614", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  curve: [
    asset({ path: "/brands/curve/official-icon.png", officialPage: "https://curve.fi/", directUrl: unretainedDirectUrl("https://curve.fi/"), publisher: "Curve Finance", variant: "logo-mark", dimensions: "512x512", mime: "image/png", originalSha256: "66d3b3b182d28c0788598eb4b8622c8bc4cbb23ae5ef6d347551f01ae28edf50", outputSha256: "66d3b3b182d28c0788598eb4b8622c8bc4cbb23ae5ef6d347551f01ae28edf50", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  deepcoin: [
    asset({ path: "/brands/deepcoin/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/deepcoin-trade-crypto/id1610058833?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/67/1d/a5/671da556-69ad-3c7c-8c2f-32206725d352/deepcoin_logo-0-0-1x_U007ephone-0-1-sRGB-85-220.png/512x512bb.jpg", publisher: "DEEPCOIN PTE. LTD.", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "afeccca90d7e533c05de76574e3f6a6730747c1dd084be99856fd819d4461525", outputSha256: "afeccca90d7e533c05de76574e3f6a6730747c1dd084be99856fd819d4461525", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  deribit: [
    asset({ path: "/brands/deribit/app-store-icon.jpg", officialPage: "https://apps.apple.com/sg/app/deribit-btc-options-futures/id1293674041?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/1d/b4/db/1db4db12-8ad1-0f71-97a4-2b4e89504da5/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg", publisher: "Sentillia B.V.", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "441cf028a965c0550ccaf3f6e4db7f7028763d3b85ab18e73ed8bfbaba87f971", outputSha256: "441cf028a965c0550ccaf3f6e4db7f7028763d3b85ab18e73ed8bfbaba87f971", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  drift: [
    asset({ path: "/brands/drift/official-icon.png", officialPage: "https://www.drift.trade/", directUrl: unretainedDirectUrl("https://www.drift.trade/"), publisher: "Drift", variant: "icon-square", dimensions: "256x256", mime: "image/png", originalSha256: "f3a5a67bf293da6a12beab13243bf06054fc722d48dcba81f63d1cca61297839", outputSha256: "f3a5a67bf293da6a12beab13243bf06054fc722d48dcba81f63d1cca61297839", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  dydx: [
    asset({ path: "/brands/dydx.png", officialPage: "https://dydx.exchange/", directUrl: "https://cdn.prod.website-files.com/649ca755d082f1dfc4ed62a4/649ca755d082f1dfc4ed62e6_favicon-32x32.png", publisher: "dYdX", variant: "favicon-pwa", dimensions: "32x32", mime: "image/png", originalSha256: "48e408eeb56eb6db0ed2c51735adc08dead945d7b6073f503ee7a2c52e522cab", outputSha256: "48e408eeb56eb6db0ed2c51735adc08dead945d7b6073f503ee7a2c52e522cab", transforms: ["none"], licenseUseNote: siteUseNote }),
    asset({ path: "/brands/dydx/official-icon.svg", officialPage: "https://dydx.exchange/", directUrl: unretainedDirectUrl("https://dydx.exchange/"), publisher: "dYdX", variant: "logo-mark", dimensions: "183x183", mime: "image/svg+xml", originalSha256: "e96714c4d24e009426293820ab679079f802c681ae00d4585141d5d22c1ac314", outputSha256: "e96714c4d24e009426293820ab679079f802c681ae00d4585141d5d22c1ac314", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  "gate-io": [
    asset({ path: "/brands/gate-io/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/gate-trade-btc-eth/id1294998195?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/6c/d5/bf/6cd5bffc-1a28-97d1-6e57-f7c0f1e8e1cf/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg", publisher: "GATE GLOBAL UAB", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "82fc674eeaee658b5c1c384cd3daaad28c8ab368300cd7456669e0f489b7f8ff", outputSha256: "82fc674eeaee658b5c1c384cd3daaad28c8ab368300cd7456669e0f489b7f8ff", transforms: ["none"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/gate-io/icon.ico", officialPage: "https://www.gate.com/", directUrl: unretainedDirectUrl("https://www.gate.com/"), publisher: "Gate.io", variant: "favicon-pwa", dimensions: "32x32", mime: "image/vnd.microsoft.icon", originalSha256: "d8900cbf6d55a20ae77d5e83f224a10e051c06dc43a804960a86073c5c89d2a9", outputSha256: "d8900cbf6d55a20ae77d5e83f224a10e051c06dc43a804960a86073c5c89d2a9", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  gemini: [
    asset({ path: "/brands/gemini/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/gemini-markets-credit-card/id1408914447?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/f6/68/52/f6685233-4426-85c9-cf43-a96f7ee2c7b9/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg", publisher: "Gemini Trust Company, LLC", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "dabcbf15cdee916545600e751bf8fc631b124f95961bc9ae0ecb9356d54604bc", outputSha256: "dabcbf15cdee916545600e751bf8fc631b124f95961bc9ae0ecb9356d54604bc", transforms: ["none"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/gemini/apple-touch-icon.png", officialPage: "https://www.gemini.com/", directUrl: unretainedDirectUrl("https://www.gemini.com/"), publisher: "Gemini", variant: "favicon-pwa", dimensions: "192x192", mime: "image/png", originalSha256: "3e177b393c53ae976ff33c6929099f7f75aba0ae5262af124b50db5fd0530fe3", outputSha256: "3e177b393c53ae976ff33c6929099f7f75aba0ae5262af124b50db5fd0530fe3", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  gmx: [
    asset({ path: "/brands/gmx/official-icon.png", officialPage: "https://gmx.io/", directUrl: unretainedDirectUrl("https://gmx.io/"), publisher: "GMX", variant: "icon-square", dimensions: "192x192", mime: "image/png", originalSha256: "bd8605306c47174f3334882903d53a73ddb88acf6fb7a39a79a470976c57f492", outputSha256: "bd8605306c47174f3334882903d53a73ddb88acf6fb7a39a79a470976c57f492", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  hashkey: [
    asset({ path: "/brands/hashkey/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/hashkey-exchange/id6448627365?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/71/bb/c9/71bbc90c-6ce9-b31d-bec8-89a4b28d5559/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg", publisher: "HashKey Digital Asset Group Limited", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "fd8fa023fe9afb9489ed5f15361c4c4ab40886d982e98898fe61efaa6b83b1d7", outputSha256: "fd8fa023fe9afb9489ed5f15361c4c4ab40886d982e98898fe61efaa6b83b1d7", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  htx: [
    asset({ path: "/brands/htx/google-play-icon.png", officialPage: "https://play.google.com/store/apps/details?id=pro.huobi", directUrl: unretainedDirectUrl("https://play.google.com/store/apps/details?id=pro.huobi"), publisher: "HTX", variant: "app-icon", dimensions: "512x512", mime: "image/png", originalSha256: "13fcb542edcb702583678d882f005f176713a8f4c78fcda40b1e1ec10b715bed", outputSha256: "13fcb542edcb702583678d882f005f176713a8f4c78fcda40b1e1ec10b715bed", transforms: ["none"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/htx/icon.png", officialPage: "https://www.htx.com/", directUrl: unretainedDirectUrl("https://www.htx.com/"), publisher: "HTX", variant: "favicon-pwa", dimensions: "128x128", mime: "image/png", originalSha256: "aec4b6e302fdc38b0f93950fd50defe3f2a62af1e245c92654b281162171e9e6", outputSha256: "aec4b6e302fdc38b0f93950fd50defe3f2a62af1e245c92654b281162171e9e6", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  hyperliquid: [
    asset({ path: "/brands/hyperliquid.png", officialPage: "https://hyperliquid.xyz/", directUrl: "https://hyperliquid.xyz/apple-touch-icon.png", publisher: "Hyperliquid", variant: "favicon-pwa", dimensions: "180x180", mime: "image/png", originalSha256: "3afc37880910082a38dfa95411f9b8d8d8147f6d0ffabbcd356e907535510ed1", outputSha256: "3afc37880910082a38dfa95411f9b8d8d8147f6d0ffabbcd356e907535510ed1", transforms: ["none"], licenseUseNote: siteUseNote }),
    asset({ path: "/brands/hyperliquid/official-icon.png", officialPage: "https://hyperliquid.xyz/", directUrl: unretainedDirectUrl("https://hyperliquid.xyz/"), publisher: "Hyperliquid", variant: "icon-square", dimensions: "512x512", mime: "image/png", originalSha256: "3a07137655bb5465d6e40a05978076dfd843ad8f1c62d99af6c07ea86e395d98", outputSha256: "3a07137655bb5465d6e40a05978076dfd843ad8f1c62d99af6c07ea86e395d98", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  jupiter: [
    asset({ path: "/brands/jupiter/official-icon.png", officialPage: "https://jup.ag/", directUrl: unretainedDirectUrl("https://jup.ag/"), publisher: "Jupiter", variant: "app-icon", dimensions: "512x512", mime: "image/png", originalSha256: "4ab4d30942c625fcf5caa22c9e5f9a2565c606854495c1b2583e3dc98a84aad1", outputSha256: "4ab4d30942c625fcf5caa22c9e5f9a2565c606854495c1b2583e3dc98a84aad1", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  kraken: [
    asset({ path: "/brands/kraken.png", officialPage: "https://www.kraken.com/", directUrl: "https://www.kraken.com/_assets/icons/apple-touch-icon.png", publisher: "Kraken", variant: "favicon-pwa", dimensions: "180x180", mime: "image/png", originalSha256: "3aa58eccf2ec3a7fa82aacb34b538a23e11141d340d3d3eebc34eb1729b1c153", outputSha256: "3aa58eccf2ec3a7fa82aacb34b538a23e11141d340d3d3eebc34eb1729b1c153", transforms: ["none"], licenseUseNote: siteUseNote }),
    asset({ path: "/brands/kraken/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/kraken-buy-crypto-stocks/id1481947260?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/c9/2f/bc/c92fbc06-d511-c24e-8e7d-86792eb48228/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg", publisher: "Payward, Inc.", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "b97f42de2ce2d294cd145e8aa3a3df51823bf268435cd8ec0364a31558dfb07c", outputSha256: "b97f42de2ce2d294cd145e8aa3a3df51823bf268435cd8ec0364a31558dfb07c", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  kucoin: [
    asset({ path: "/brands/kucoin/google-play-icon.png", officialPage: "https://play.google.com/store/apps/details?id=com.kubi.kucoin", directUrl: unretainedDirectUrl("https://play.google.com/store/apps/details?id=com.kubi.kucoin"), publisher: "KuCoin", variant: "app-icon", dimensions: "512x512", mime: "image/png", originalSha256: "0a259ccde8ba3aa47c025f7f10e31024b4f7447e40398a423ab201456bbe79a4", outputSha256: "0a259ccde8ba3aa47c025f7f10e31024b4f7447e40398a423ab201456bbe79a4", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  lbank: [
    asset({ path: "/brands/lbank/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/lbank-buy-bitcoin-crypto/id1437346368?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/0b/cb/52/0bcb528f-bca8-07f4-d441-7682168b4b35/AppIcon-0-0-1x_U007ephone-0-11-0-85-220.png/512x512bb.jpg", publisher: "LBANK EXCHANGE UAB", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "10fcbae8677887152752312ca21aae4d2766957a9dc3274352860591738d21b4", outputSha256: "10fcbae8677887152752312ca21aae4d2766957a9dc3274352860591738d21b4", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  mexc: [
    asset({ path: "/brands/mexc/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/mexc-buy-bitcoin-crypto/id1605393003?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/84/c7/5c/84c75c17-035f-1d8d-3b59-7ac803baf55e/AppIcon-Blue-0-0-1x_U007epad-0-11-0-0-85-220.png/512x512bb.jpg", publisher: "Onechain Technology Ltd", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "232b4cf1cd18ea2b7bea0103ef1021168f30fe4db5dbf2b76da311346c58fcae", outputSha256: "232b4cf1cd18ea2b7bea0103ef1021168f30fe4db5dbf2b76da311346c58fcae", transforms: ["none"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/mexc/manifest-icon.png", officialPage: "https://www.mexc.com/", directUrl: unretainedDirectUrl("https://www.mexc.com/"), publisher: "MEXC", variant: "favicon-pwa", dimensions: "342x256", mime: "image/png", originalSha256: "50cdaa6d8150088ef3f6bdfbe97d72ddaa21cf0de1be19252b37aed34e64a706", outputSha256: "50cdaa6d8150088ef3f6bdfbe97d72ddaa21cf0de1be19252b37aed34e64a706", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  okx: [
    asset({ path: "/brands/okx.png", officialPage: "https://apps.apple.com/us/app/okx-buy-bitcoin-btc-crypto/id1327268470", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/c3/cd/72/c3cd7284-20f2-57ca-80ea-131406561906/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg", publisher: "OKX Inc.", variant: "app-icon", dimensions: "512x512", mime: "image/png", originalSha256: "9338fe40b44d24f55855e74debaa7a0df5ee398b2b730ee4d1e5af5d3a0049b3", outputSha256: "b9252fb8e7532533f5441fe100d01d9dedff6b6b4fb9120059ca431f6a4d1142", transforms: ["sips -s format png"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/okx/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/okx-buy-bitcoin-btc-crypto/id1327268470?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/c3/cd/72/c3cd7284-20f2-57ca-80ea-131406561906/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg", publisher: "OKX Inc.", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "9338fe40b44d24f55855e74debaa7a0df5ee398b2b730ee4d1e5af5d3a0049b3", outputSha256: "9338fe40b44d24f55855e74debaa7a0df5ee398b2b730ee4d1e5af5d3a0049b3", transforms: ["none"], licenseUseNote: appStoreUseNote }),
    asset({ path: "/brands/okx/apple-touch-icon.png", officialPage: "https://www.okx.com/", directUrl: unretainedDirectUrl("https://www.okx.com/"), publisher: "OKX", variant: "favicon-pwa", dimensions: "200x200", mime: "image/png", originalSha256: "2c13b2131e9568bf6946cf6e980440040a3dd09ec5a4ca750b7ec1c2310a7903", outputSha256: "2c13b2131e9568bf6946cf6e980440040a3dd09ec5a4ca750b7ec1c2310a7903", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  pancakeswap: [
    asset({ path: "/brands/pancakeswap/official-icon.png", officialPage: "https://pancakeswap.finance/", directUrl: unretainedDirectUrl("https://pancakeswap.finance/"), publisher: "PancakeSwap", variant: "logo-mark", dimensions: "512x512", mime: "image/png", originalSha256: "39c08d280e7f4636908c7648d8c779fa7b01a90ba04d869a94e461d4637de199", outputSha256: "39c08d280e7f4636908c7648d8c779fa7b01a90ba04d869a94e461d4637de199", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  phemex: [
    asset({ path: "/brands/phemex/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/phemex-buy-crypto-stocks/id1499601684?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/8a/5a/6c/8a5a6c3b-94b6-979a-1749-557e3e35836e/AppIcon-0-0-1x_U007emarketing-0-8-0-sRGB-85-220.png/512x512bb.jpg", publisher: "Leading Magic Limited", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "3df91b6ca768722418f09abf856ed6a3242385ef33cf44623bb5836b9751800b", outputSha256: "3df91b6ca768722418f09abf856ed6a3242385ef33cf44623bb5836b9751800b", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  raydium: [
    asset({ path: "/brands/raydium/official-icon.png", officialPage: "https://raydium.io/", directUrl: unretainedDirectUrl("https://raydium.io/"), publisher: "Raydium", variant: "logo-mark", dimensions: "360x360", mime: "image/png", originalSha256: "82846418e40a4a8fa8c5bb1ca9566b7de41079374d2771f13c86d1032d04a6ff", outputSha256: "82846418e40a4a8fa8c5bb1ca9566b7de41079374d2771f13c86d1032d04a6ff", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  sushi: [
    asset({ path: "/brands/sushi/official-icon.png", officialPage: "https://www.sushi.com/", directUrl: unretainedDirectUrl("https://www.sushi.com/"), publisher: "Sushi", variant: "logo-mark", dimensions: "512x512", mime: "image/png", originalSha256: "9b92f98991e666093af2de297cc98504c03f39d87b2cda62bcbc1aa040305cfa", outputSha256: "9b92f98991e666093af2de297cc98504c03f39d87b2cda62bcbc1aa040305cfa", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  uniswap: [
    asset({ path: "/brands/uniswap/official-icon.png", officialPage: "https://uniswap.org/", directUrl: unretainedDirectUrl("https://uniswap.org/"), publisher: "Uniswap Labs", variant: "logo-mark", dimensions: "192x192", mime: "image/png", originalSha256: "f2cac096ed0052736cbad1e4f4758d454ed52524ab94e42e76046b93380f738b", outputSha256: "f2cac096ed0052736cbad1e4f4758d454ed52524ab94e42e76046b93380f738b", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  upbit: [
    asset({ path: "/brands/upbit/icon-square.png", officialPage: "https://upbit.com/", directUrl: unretainedDirectUrl("https://upbit.com/"), publisher: "Upbit", variant: "icon-square", dimensions: "192x192", mime: "image/png", originalSha256: "c78a935371fdb8a5fe0cd277b9ddd5f4b846db81b6bf4002823a440d8925d4c2", outputSha256: "c78a935371fdb8a5fe0cd277b9ddd5f4b846db81b6bf4002823a440d8925d4c2", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  vertex: [
    asset({ path: "/brands/vertex/official-icon.png", officialPage: "https://vertexprotocol.com/", directUrl: unretainedDirectUrl("https://vertexprotocol.com/"), publisher: "Vertex Protocol", variant: "icon-square", dimensions: "180x180", mime: "image/png", originalSha256: "629722131c0d5d676482b9ea52fa93b3699acb6d4b95970ef1cb520650788a90", outputSha256: "629722131c0d5d676482b9ea52fa93b3699acb6d4b95970ef1cb520650788a90", transforms: ["none"], licenseUseNote: siteUseNote }),
  ],
  weex: [
    asset({ path: "/brands/weex/app-store-icon.jpg", officialPage: "https://apps.apple.com/us/app/weex-buy-bitcoin-crypto/id1609350789?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/fd/5b/cb/fd5bcb73-91d1-7bec-4280-b0e6ae35c38c/AppIcon-0-0-1x_U007ephone-0-1-0-sRGB-85-220.png/512x512bb.jpg", publisher: "Weex Virtual Currency Exchange LLC", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "9760601791aa0d94dc261fe8606f5c3c086bdcb2ed164f596ab9514bd63b0d67", outputSha256: "9760601791aa0d94dc261fe8606f5c3c086bdcb2ed164f596ab9514bd63b0d67", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
  whitebit: [
    asset({ path: "/brands/whitebit/app-store-icon.jpg", officialPage: "https://apps.apple.com/sg/app/whitebit-buy-sell-bitcoin/id1463405025?uo=4", directUrl: "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/eb/5c/ef/eb5cef6a-bdae-a37b-0ceb-168850fc5b0b/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/512x512bb.jpg", publisher: "UAB Clear White Technologies", variant: "app-icon", dimensions: "512x512", mime: "image/jpeg", originalSha256: "1e0762eb649326349358dd66110aeacecbca201d282bda70b8639328571be79b", outputSha256: "1e0762eb649326349358dd66110aeacecbca201d282bda70b8639328571be79b", transforms: ["none"], licenseUseNote: appStoreUseNote }),
  ],
};

const preferredSquare: Record<string, string> = {
  binance: "/brands/binance.png", coinbase: "/brands/coinbase/app-store-icon.jpg", kraken: "/brands/kraken.png", okx: "/brands/okx.png", bybit: "/brands/bybit.png", bitget: "/brands/bitget.png", "gate-io": "/brands/gate-io/icon.ico", kucoin: "/brands/kucoin/google-play-icon.png", mexc: "/brands/mexc/manifest-icon.png", htx: "/brands/htx/google-play-icon.png", "crypto-com": "/brands/crypto-com/app-store-icon.jpg", gemini: "/brands/gemini/apple-touch-icon.png", bitstamp: "/brands/bitstamp/app-store-icon.jpg",
  upbit: "/brands/upbit/icon-square.png", bithumb: "/brands/bithumb/icon-square.png", coinex: "/brands/coinex/icon-square.svg", bingx: "/brands/bingx/icon-square.png", whitebit: "/brands/whitebit/app-store-icon.jpg", lbank: "/brands/lbank/app-store-icon.jpg", bitmart: "/brands/bitmart/app-store-icon.jpg", backpack: "/brands/backpack/icon-square.png", bullish: "/brands/bullish/app-store-icon.jpg", deribit: "/brands/deribit/app-store-icon.jpg", phemex: "/brands/phemex/app-store-icon.jpg", weex: "/brands/weex/app-store-icon.jpg", deepcoin: "/brands/deepcoin/app-store-icon.jpg", btse: "/brands/btse/app-store-icon.jpg", hashkey: "/brands/hashkey/app-store-icon.jpg", bitfinex: "/brands/bitfinex/app-store-icon.jpg",
  uniswap: "/brands/uniswap/official-icon.png", pancakeswap: "/brands/pancakeswap/official-icon.png", hyperliquid: "/brands/hyperliquid/official-icon.png", dydx: "/brands/dydx/official-icon.svg", jupiter: "/brands/jupiter/official-icon.png", raydium: "/brands/raydium/official-icon.png", aerodrome: "/brands/aerodrome/official-logo.svg", curve: "/brands/curve/official-icon.png", sushi: "/brands/sushi/official-icon.png", gmx: "/brands/gmx/official-icon.png", drift: "/brands/drift/official-icon.png", aster: "/brands/aster/official-icon.png", vertex: "/brands/vertex/official-icon.png", camelot: "/brands/camelot/official-icon.svg", balancer: "/brands/balancer/official-icon.png",
};

const preferredWordmark: Record<string, string> = {
  bitget: "/brands/bitget.svg",
};

const pending = (slug: string, name: string, category: BrandCategory): BrandRecord => {
  const assets = assetCatalog[slug] ?? [];

  return assets.length ? {
    slug,
    name,
    category,
    status: "verified",
    assets,
    preferredSquare: preferredSquare[slug],
    preferredWordmark: preferredWordmark[slug],
  } : {
    slug,
    name,
    category,
    status: "unavailable",
    assets: [],
    unavailableReason: "Official asset discovery is in progress; no unverified substitute is exposed.",
    continuationChannel: "Official brand or media kit, official site static asset, PWA manifest, or verified publisher app-store listing.",
  };
};

/** Candidates reflect a time-sensitive market snapshot, not a claim of permanent ranking. */
export const brandManifest: BrandRecord[] = [
  ["binance", "Binance"], ["coinbase", "Coinbase"], ["kraken", "Kraken"], ["okx", "OKX"], ["bybit", "Bybit"], ["bitget", "Bitget"], ["gate-io", "Gate.io"], ["kucoin", "KuCoin"], ["mexc", "MEXC"], ["htx", "HTX"], ["crypto-com", "Crypto.com"], ["gemini", "Gemini"], ["bitstamp", "Bitstamp"], ["upbit", "Upbit"], ["bithumb", "Bithumb"], ["coinex", "CoinEx"], ["bingx", "BingX"], ["whitebit", "WhiteBIT"], ["lbank", "LBank"], ["bitmart", "BitMart"], ["backpack", "Backpack"], ["bullish", "Bullish"], ["deribit", "Deribit"], ["phemex", "Phemex"], ["weex", "WEEX"], ["deepcoin", "Deepcoin"], ["btse", "BTSE"], ["hashkey", "HashKey"], ["bitfinex", "Bitfinex"],
].map(([slug, name]) => pending(slug, name, "cex")).concat([
  ["uniswap", "Uniswap", "dex"], ["pancakeswap", "PancakeSwap", "dex"], ["hyperliquid", "Hyperliquid", "perp-dex"], ["dydx", "dYdX", "perp-dex"], ["jupiter", "Jupiter", "dex"], ["raydium", "Raydium", "dex"], ["aerodrome", "Aerodrome", "dex"], ["curve", "Curve", "dex"], ["sushi", "Sushi", "dex"], ["gmx", "GMX", "perp-dex"], ["drift", "Drift", "perp-dex"], ["aster", "Aster", "perp-dex"], ["vertex", "Vertex", "perp-dex"], ["kwenta", "Kwenta", "perp-dex"], ["camelot", "Camelot", "dex"], ["orca", "Orca", "dex"], ["balancer", "Balancer", "dex"],
].map(([slug, name, category]) => pending(slug, name, category as BrandCategory)));

const unavailableDetails: Record<string, Pick<BrandRecord, "unavailableReason" | "continuationChannel">> = {
  kwenta: {
    unavailableReason: "kwenta.io redirects to synthetix.io; no official Kwenta-owned PNG, SVG, or JPG primary logo was confirmed in the permitted channels.",
    continuationChannel: "Retry an official Kwenta brand repository or press kit if the project resumes a dedicated official domain.",
  },
  orca: {
    unavailableReason: "The official site could not be fetched from this environment, and the official GitHub organization exposed no clearly primary Orca brand asset.",
    continuationChannel: "Retry orca.so from an accessible network, then inspect the official PWA manifest or official brand repository.",
  },
};

for (const brand of brandManifest) Object.assign(brand, unavailableDetails[brand.slug]);

export const brandsBySlug = Object.fromEntries(brandManifest.map((brand) => [brand.slug, brand]));
