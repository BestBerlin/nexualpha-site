export default {
  query(name) {
    return `${name} referans kodu`;
  },
  labels: {
    code: "Kod",
    benefit: "Avantaj",
    entry: "Kod girişi",
    later: "Sonradan ekleme",
    payout: "Ödeme",
    verified: "Doğrulandı",
    check: "Kontrol et",
    source: "Kaynak",
    log: "Kayıt",
    calculator: "Hesaplayıcı",
  },
  verifiedTitle(name, code, benefit, date) {
    return `${this.query(name)}: ${code} — ${benefit} (${new Intl.DateTimeFormat("tr-TR", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(date))} tarihinde doğrulandı)`;
  },
  share(percent) {
    return `En fazla %${percent} ücret iadesi`;
  },
  noBenefit: "Doğrulanmış kullanıcı avantajı yok",
  pending: "Doğrulanmadı",
  cadence: {
    hourly: "saatlik",
    daily: "günlük",
  },
  entryText:
    "Kaydı tamamlamadan önce genel referans kodu alanını kontrol edin ve kodun doğru yazıldığından emin olun.",
  laterUnknown:
    "Resmî yardım sayfaları, kayıt sonrası kod eklenebileceğini doğrulamıyor; eklenebileceğini varsaymayın.",
  laterBinance:
    "Binance koşullu ortaklık yeniden bağlamayı destekler; bu rastgele kod değiştirme değildir. Ana hesapta kimlik doğrulama tamamlanmış olmalı, mevcut yönlendiren olmamalı, son 90 günlük hacim 5.000 USD altında kalmalı ve bölge/risk kontrolleri geçilmelidir. Ortaklık başvurusu için 30 gün içinde 150.000 USD uygun hacim gerekir; sıfır ücretli işlem çiftleri ve alt hesaplar hariçtir. İşlem geçmişi olmayan kendi kendine yeniden bağlama ayrı bir süreçtir. Bu sayfa, bu kodun uygun olduğunu doğrulamaz; yalnızca yeniden bağlanmak için işlem yapmayın.",
  laterBybit:
    "Yalnızca ana hesaplar için, mevcut ortaklık/yönlendiren bağlantısı yoksa ve kayıt üzerinden 14 gün geçmediyse ortaklık kodu eklenebilir; sıradan referans kodu desteklenmez. Bölgesel uygunluk gerekir, piyasa yapıcı ve kurumsal hesaplar hariçtir. Kod eklendikten sonra değiştirilemez veya iptal edilemez.",
  faqEntry(name) {
    return `${name} referans kodu nereye girilir?`;
  },
  faqLater(name) {
    return `${name} referans kodu kayıt sonrası eklenebilir mi?`;
  },
  faqPayout(name) {
    return `${name} referans ödemesi ne zaman yapılır?`;
  },
  payoutText(name, cadence) {
    return `İş ortağı verisi, ${name} ödemesinin ${cadence} yapıldığını söyler; uygunluk koşulları geçerlidir.`;
  },
  noPayout: "Doğrulanmış ödeme takvimi yok",
};

// Venue-specific entry steps from the reviewed official help records.
// These supplement the shared interface copy without changing locale policy.
export const entryByVenue = {
  "okx": "Kaydı tamamlamadan önce önceden doldurulmuş kodu kontrol edin. OKX, önceki referans bağlantısının cihazla 30 gün ilişkilendirilebileceğini belirtir.",
  "binance": "Binance uygulamasında hesap oluşturulduktan sonraki adımda, KYC’ye geçmeden kodu kontrol edin. Bağlanmış kod değiştirilemez.",
  "bybit": "Sign Up Now düğmesine basmadan önce referans veya ortaklık kodunu girin."
};
