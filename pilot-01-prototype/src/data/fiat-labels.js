// Small labels shared by the exchange directory filter, the venue profile block and the home row (2026-10-15).
// Mirrors the matching keys of deposit-copy.js (tests/deposit-hub.test.mjs checks parity); kept apart so those pages do
// not load the hub copy.
export const FIAT_LABELS = Object.freeze({
 "en": {
  "method": {
   "card": "Card",
   "bank": "Local bank",
   "p2p": "P2P",
   "cryptoCard": "Crypto card"
  },
  "filterLabel": "Deposit method",
  "filterAll": "All",
  "venueTitle": "Deposits and withdrawals",
  "venueRails": "Local bank rails",
  "venueCard": "Card purchase",
  "venueCountries": "Official routes in {n} countries",
  "venueCards": "Crypto card",
  "venueAll": "All countries",
  "homeTitle": "Deposit & withdraw",
  "homeLead": "How to get money in and out in your country, exchange by exchange.",
  "homeItems": {
   "card": "Buy with a Visa card",
   "bank": "Local bank deposits",
   "cryptoCard": "Crypto cards"
  }
 },
 "zh-Hans": {
  "method": {
   "card": "刷卡",
   "bank": "本地银行",
   "p2p": "P2P",
   "cryptoCard": "加密卡"
  },
  "filterLabel": "出入金方式",
  "filterAll": "全部",
  "venueTitle": "出入金",
  "venueRails": "本地银行通道",
  "venueCard": "刷卡买币",
  "venueCountries": "{n} 个国家有官方通道",
  "venueCards": "加密卡",
  "venueAll": "全部国家",
  "homeTitle": "出入金",
  "homeLead": "你所在的国家怎么把钱充进交易所、再提回来，逐家列清楚。",
  "homeItems": {
   "card": "刷 Visa 卡买币",
   "bank": "本地银行入金",
   "cryptoCard": "加密卡"
  }
 },
 "zh-Hant": {
  "method": {
   "card": "刷卡",
   "bank": "本地銀行",
   "p2p": "P2P",
   "cryptoCard": "加密卡"
  },
  "filterLabel": "出入金方式",
  "filterAll": "全部",
  "venueTitle": "出入金",
  "venueRails": "本地銀行通道",
  "venueCard": "刷卡買幣",
  "venueCountries": "{n} 個國家有官方通道",
  "venueCards": "加密卡",
  "venueAll": "全部國家",
  "homeTitle": "出入金",
  "homeLead": "你所在的國家怎麼把錢存進交易所、再提回來，逐家列清楚。",
  "homeItems": {
   "card": "刷 Visa 卡買幣",
   "bank": "本地銀行入金",
   "cryptoCard": "加密卡"
  }
 },
 "es": {
  "method": {
   "card": "Tarjeta",
   "bank": "Banco local",
   "p2p": "P2P",
   "cryptoCard": "Tarjeta cripto"
  },
  "filterLabel": "Método de depósito",
  "filterAll": "Todos",
  "venueTitle": "Depósitos y retiros",
  "venueRails": "Redes bancarias locales",
  "venueCard": "Compra con tarjeta",
  "venueCountries": "Rutas oficiales en {n} países",
  "venueCards": "Tarjeta cripto",
  "venueAll": "Todos los países",
  "homeTitle": "Depositar y retirar",
  "homeLead": "Cómo meter y sacar dinero en tu país, exchange por exchange.",
  "homeItems": {
   "card": "Compra con tarjeta Visa",
   "bank": "Depósito por banco local",
   "cryptoCard": "Tarjetas cripto"
  }
 },
 "pt-BR": {
  "method": {
   "card": "Cartão",
   "bank": "Banco local",
   "p2p": "P2P",
   "cryptoCard": "Cartão cripto"
  },
  "filterLabel": "Forma de depósito",
  "filterAll": "Todas",
  "venueTitle": "Depósitos e saques",
  "venueRails": "Meios bancários locais",
  "venueCard": "Compra com cartão",
  "venueCountries": "Rotas oficiais em {n} países",
  "venueCards": "Cartão cripto",
  "venueAll": "Todos os países",
  "homeTitle": "Depositar e sacar",
  "homeLead": "Como colocar e tirar dinheiro no seu país, corretora por corretora.",
  "homeItems": {
   "card": "Compre com cartão Visa",
   "bank": "Depósito por banco local",
   "cryptoCard": "Cartões cripto"
  }
 },
 "fr": {
  "method": {
   "card": "Carte",
   "bank": "Banque locale",
   "p2p": "P2P",
   "cryptoCard": "Carte crypto"
  },
  "filterLabel": "Méthode de dépôt",
  "filterAll": "Toutes",
  "venueTitle": "Dépôts et retraits",
  "venueRails": "Réseaux bancaires locaux",
  "venueCard": "Achat par carte",
  "venueCountries": "Voies officielles dans {n} pays",
  "venueCards": "Carte crypto",
  "venueAll": "Tous les pays",
  "homeTitle": "Dépôt et retrait",
  "homeLead": "Comment faire entrer et sortir votre argent dans votre pays, plateforme par plateforme.",
  "homeItems": {
   "card": "Acheter par carte Visa",
   "bank": "Dépôt par banque locale",
   "cryptoCard": "Cartes crypto"
  }
 },
 "de": {
  "method": {
   "card": "Karte",
   "bank": "Lokale Bank",
   "p2p": "P2P",
   "cryptoCard": "Kryptokarte"
  },
  "filterLabel": "Einzahlungsmethode",
  "filterAll": "Alle",
  "venueTitle": "Ein- und Auszahlungen",
  "venueRails": "Lokale Bankverfahren",
  "venueCard": "Kartenkauf",
  "venueCountries": "Offizielle Wege in {n} Ländern",
  "venueCards": "Kryptokarte",
  "venueAll": "Alle Länder",
  "homeTitle": "Ein- und Auszahlen",
  "homeLead": "Wie Geld in Ihrem Land rein- und wieder rauskommt, Börse für Börse.",
  "homeItems": {
   "card": "Mit Visa-Karte kaufen",
   "bank": "Einzahlung per lokaler Bank",
   "cryptoCard": "Kryptokarten"
  }
 },
 "it": {
  "method": {
   "card": "Carta",
   "bank": "Banca locale",
   "p2p": "P2P",
   "cryptoCard": "Carta cripto"
  },
  "filterLabel": "Metodo di deposito",
  "filterAll": "Tutti",
  "venueTitle": "Depositi e prelievi",
  "venueRails": "Circuiti bancari locali",
  "venueCard": "Acquisto con carta",
  "venueCountries": "Vie ufficiali in {n} paesi",
  "venueCards": "Carta cripto",
  "venueAll": "Tutti i paesi",
  "homeTitle": "Depositi e prelievi",
  "homeLead": "Come far entrare e uscire i soldi nel tuo paese, exchange per exchange.",
  "homeItems": {
   "card": "Compra con carta Visa",
   "bank": "Deposito con banca locale",
   "cryptoCard": "Carte cripto"
  }
 },
 "ja": {
  "method": {
   "card": "カード",
   "bank": "現地銀行",
   "p2p": "P2P",
   "cryptoCard": "暗号資産カード"
  },
  "filterLabel": "入金方法",
  "filterAll": "すべて",
  "venueTitle": "入出金",
  "venueRails": "現地の銀行送金網",
  "venueCard": "カード購入",
  "venueCountries": "{n} か国に公式な入出金方法",
  "venueCards": "暗号資産カード",
  "venueAll": "すべての国",
  "homeTitle": "入出金",
  "homeLead": "あなたの国で、お金を入れて引き出す方法を取引所ごとに。",
  "homeItems": {
   "card": "Visa カードで購入",
   "bank": "現地銀行で入金",
   "cryptoCard": "暗号資産カード"
  }
 },
 "ko": {
  "method": {
   "card": "카드",
   "bank": "현지 은행",
   "p2p": "P2P",
   "cryptoCard": "암호화폐 카드"
  },
  "filterLabel": "입금 방법",
  "filterAll": "전체",
  "venueTitle": "입출금",
  "venueRails": "현지 은행 이체망",
  "venueCard": "카드 구매",
  "venueCountries": "{n}개국 공식 입출금 경로",
  "venueCards": "암호화폐 카드",
  "venueAll": "전체 국가",
  "homeTitle": "입출금",
  "homeLead": "내 나라에서 돈을 넣고 빼는 방법, 거래소별로.",
  "homeItems": {
   "card": "Visa 카드로 구매",
   "bank": "현지 은행 입금",
   "cryptoCard": "암호화폐 카드"
  }
 },
 "ar": {
  "method": {
   "card": "بطاقة",
   "bank": "بنك محلي",
   "p2p": "P2P",
   "cryptoCard": "بطاقة مشفرة"
  },
  "filterLabel": "طريقة الإيداع",
  "filterAll": "الكل",
  "venueTitle": "الإيداع والسحب",
  "venueRails": "شبكات البنوك المحلية",
  "venueCard": "الشراء بالبطاقة",
  "venueCountries": "طرق رسمية في {n} دولة",
  "venueCards": "بطاقة مشفرة",
  "venueAll": "كل الدول",
  "homeTitle": "الإيداع والسحب",
  "homeLead": "كيف تُدخل أموالك وتُخرجها في بلدك، منصة بمنصة.",
  "homeItems": {
   "card": "اشترِ ببطاقة Visa",
   "bank": "إيداع عبر بنك محلي",
   "cryptoCard": "بطاقات مشفرة"
  }
 },
 "tr": {
  "method": {
   "card": "Kart",
   "bank": "Yerel banka",
   "p2p": "P2P",
   "cryptoCard": "Kripto kart"
  },
  "filterLabel": "Yatırma yöntemi",
  "filterAll": "Tümü",
  "venueTitle": "Para yatırma ve çekme",
  "venueRails": "Yerel banka ağları",
  "venueCard": "Kartla alım",
  "venueCountries": "{n} ülkede resmi yol",
  "venueCards": "Kripto kart",
  "venueAll": "Tüm ülkeler",
  "homeTitle": "Para yatırma ve çekme",
  "homeLead": "Ülkenizde paranızı borsaya yatırıp geri çekmenin yolları, borsa borsa.",
  "homeItems": {
   "card": "Visa kartla al",
   "bank": "Yerel bankayla yatır",
   "cryptoCard": "Kripto kartlar"
  }
 },
 "ru": {
  "method": {
   "card": "Карта",
   "bank": "Местный банк",
   "p2p": "P2P",
   "cryptoCard": "Криптокарта"
  },
  "filterLabel": "Способ пополнения",
  "filterAll": "Все",
  "venueTitle": "Ввод и вывод",
  "venueRails": "Местные банковские системы",
  "venueCard": "Покупка картой",
  "venueCountries": "Официальные способы в {n} странах",
  "venueCards": "Криптокарта",
  "venueAll": "Все страны",
  "homeTitle": "Ввод и вывод",
  "homeLead": "Как завести и вывести деньги в вашей стране — по каждой бирже.",
  "homeItems": {
   "card": "Покупка картой Visa",
   "bank": "Пополнение через местный банк",
   "cryptoCard": "Криптокарты"
  }
 },
 "id": {
  "method": {
   "card": "Kartu",
   "bank": "Bank lokal",
   "p2p": "P2P",
   "cryptoCard": "Kartu kripto"
  },
  "filterLabel": "Metode setor",
  "filterAll": "Semua",
  "venueTitle": "Setor dan tarik",
  "venueRails": "Jalur bank lokal",
  "venueCard": "Beli dengan kartu",
  "venueCountries": "Jalur resmi di {n} negara",
  "venueCards": "Kartu kripto",
  "venueAll": "Semua negara",
  "homeTitle": "Setor & tarik",
  "homeLead": "Cara memasukkan dan menarik uang di negaramu, bursa demi bursa.",
  "homeItems": {
   "card": "Beli dengan kartu Visa",
   "bank": "Setor lewat bank lokal",
   "cryptoCard": "Kartu kripto"
  }
 },
 "vi": {
  "method": {
   "card": "Thẻ",
   "bank": "Ngân hàng nội địa",
   "p2p": "P2P",
   "cryptoCard": "Thẻ tiền mã hóa"
  },
  "filterLabel": "Phương thức nạp",
  "filterAll": "Tất cả",
  "venueTitle": "Nạp và rút",
  "venueRails": "Kênh ngân hàng nội địa",
  "venueCard": "Mua bằng thẻ",
  "venueCountries": "Kênh chính thức tại {n} quốc gia",
  "venueCards": "Thẻ tiền mã hóa",
  "venueAll": "Tất cả quốc gia",
  "homeTitle": "Nạp & rút",
  "homeLead": "Cách đưa tiền vào và rút ra ở quốc gia của bạn, theo từng sàn.",
  "homeItems": {
   "card": "Mua bằng thẻ Visa",
   "bank": "Nạp qua ngân hàng nội địa",
   "cryptoCard": "Thẻ tiền mã hóa"
  }
 },
 "ur": {
  "method": {
   "card": "کارڈ",
   "bank": "مقامی بینک",
   "p2p": "P2P",
   "cryptoCard": "کرپٹو کارڈ"
  },
  "filterLabel": "جمع کا طریقہ",
  "filterAll": "سب",
  "venueTitle": "جمع اور نکاسی",
  "venueRails": "مقامی بینک نظام",
  "venueCard": "کارڈ سے خریداری",
  "venueCountries": "{n} ممالک میں سرکاری راستے",
  "venueCards": "کرپٹو کارڈ",
  "venueAll": "تمام ممالک",
  "homeTitle": "جمع اور نکاسی",
  "homeLead": "آپ کے ملک میں رقم ڈالنے اور نکالنے کے طریقے، ہر ایکسچینج کے لیے۔",
  "homeItems": {
   "card": "Visa کارڈ سے خریدیں",
   "bank": "مقامی بینک سے جمع",
   "cryptoCard": "کرپٹو کارڈ"
  }
 },
 "uk": {
  "method": {
   "card": "Картка",
   "bank": "Місцевий банк",
   "p2p": "P2P",
   "cryptoCard": "Криптокартка"
  },
  "filterLabel": "Спосіб поповнення",
  "filterAll": "Усі",
  "venueTitle": "Поповнення і виведення",
  "venueRails": "Місцеві банківські системи",
  "venueCard": "Купівля карткою",
  "venueCountries": "Офіційні способи в {n} країнах",
  "venueCards": "Криптокартка",
  "venueAll": "Усі країни",
  "homeTitle": "Поповнення і виведення",
  "homeLead": "Як завести й вивести гроші у вашій країні — для кожної біржі.",
  "homeItems": {
   "card": "Купівля карткою Visa",
   "bank": "Поповнення через місцевий банк",
   "cryptoCard": "Криптокартки"
  }
 }
});
export const fiatLabels = (locale) => FIAT_LABELS[locale] || (String(locale || "").startsWith("zh") ? FIAT_LABELS["zh-Hans"] : FIAT_LABELS.en);
