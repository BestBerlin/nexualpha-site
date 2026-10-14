// Local market briefs for the Turkish, Vietnamese and Indonesian home pages (links-l10n lane 2026-10-11; scorecard M5).
//
// Every factual line carries the source it comes from, and every source URL is either already in the repository's
// source-bound registers (src/data/international-source-registry.js, src/data/regional-funding-verification-matrix.js;
// tests/local-market-brief.test.mjs pins this) or the regulator's own official site. What the registers do not hold is
// left out instead of written from memory:
//   - partner-exchange availability for residents: REGIONAL_ELIGIBILITY_EVIDENCE has no row for TR, VN or ID, so no
//     partner exchange is presented as available; the brief says so and points to the official registers;
//   - Vietnam: the register marks the official-source package as pending, so only the authorities' official sites are
//     named (no payment rail, no licensing claim).
// Each brief is shown on its own locale's home page, in that language (ru/id/vi/ar/tr strings: native review pending).
import { internationalSourceRegistry, INTERNATIONAL_SOURCE_REVIEWED_AT } from "./international-source-registry.js";

const registerUrl = (market, label) => {
  const url = internationalSourceRegistry[market]?.sources.find((source) => source.label === label)?.url;
  if (!url) throw new Error(`local-market-brief: ${market} source "${label}" is not in the register`);
  return url;
};

export const LOCAL_MARKET_BRIEF_REVIEWED_AT = INTERNATIONAL_SOURCE_REVIEWED_AT;

// l10n: needs native review (tr, vi, id)
export const LOCAL_MARKET_BRIEFS = Object.freeze({
  tr: {
    market: "TR",
    marketPath: "/markets/turkiye",
    title: "Türkiye'de işlem yapmadan önce",
    lead: "Türkiye'de yaşayanlar için önemli olan üç şey: düzenleyici kurumun listeleri, Türk lirası ile para yatırma yolu ve bir borsanın sizin hesabınız için gerçekten açık olup olmadığı.",
    sections: [
      {
        heading: "Düzenleyici: Sermaye Piyasası Kurulu (SPK)",
        regulator: { name: "Sermaye Piyasası Kurulu (SPK / CMB)", url: "https://spk.gov.tr" },
        items: [
          { text: "SPK, faaliyette bulunan kripto varlık hizmet sağlayıcılarının listesini yayımlar.", source: { label: "SPK — faaliyette bulunanlar listesi", url: registerUrl("TR", "SPK crypto-asset service providers in operation") } },
          { text: "SPK ayrıca tasfiye sürecindeki kripto varlık hizmet sağlayıcılarının listesini yayımlar; bir platformu kullanmadan önce iki listeyi de kontrol edin.", source: { label: "SPK — tasfiye sürecinde olanlar listesi", url: registerUrl("TR", "SPK crypto-asset service providers in liquidation") } },
        ],
      },
      {
        heading: "Ortak borsalar ve Türkiye'de yaşayanlar",
        items: [
          { text: `NexuAlpha'nın ortak borsalardan herhangi birinin Türkiye'de yaşayanlara açık olduğuna dair kaynaklı bir uygunluk kaydı yok; bu yüzden burada hiçbir borsa "uygun" olarak gösterilmez.`, source: null },
        ],
      },
      {
        heading: "Türk lirası ile para yatırma",
        items: [
          { text: "Yerel bir platformun resmî rehberi, TL yatırma işlemini hesap sahibiyle eşleşen banka hesabından havale/EFT ile anlatır. Limit, ücret ve süreyi hesabınızdaki resmî ekranda doğrulayın.", source: { label: "Paribu — TL yatırma rehberi", url: registerUrl("TR", "Paribu Turkish lira deposit guidance") } },
          { text: "Kimlik, yüz doğrulama, yatırımcı profili ve adres adımları platformun kendi hesap akışında yapılır.", source: { label: "Paribu — hesap doğrulama", url: registerUrl("TR", "Paribu account verification guidance") } },
        ],
      },
    ],
    marketLink: "Türkiye pazar sayfası",
    sourcesLabel: "Kaynak",
    reviewed: (date) => `Kaynaklar ${date} tarihinde incelendi.`,
  },
  id: {
    market: "ID",
    marketPath: "/id",
    title: "Sebelum trading kripto di Indonesia",
    lead: "Bagi penduduk Indonesia, ada tiga hal yang penting: regulator yang berwenang, jalur deposit rupiah, dan apakah sebuah bursa benar-benar terbuka untuk akun Anda.",
    sections: [
      {
        heading: "Regulator: Otoritas Jasa Keuangan (OJK), sebelumnya Bappebti",
        regulator: { name: "Otoritas Jasa Keuangan (OJK)", url: "https://ojk.go.id" },
        items: [
          { text: "Tugas pengawasan aset keuangan digital, termasuk aset kripto, dialihkan dari Bappebti (Kementerian Perdagangan) ke OJK.", source: { label: "OJK — siaran pers pengalihan tugas dari Bappebti", url: registerUrl("ID", "OJK and Bappebti transition announcement for crypto assets") } },
          { text: "Daftar calon pedagang fisik aset kripto yang diterbitkan Bappebti adalah titik awal verifikasi, bukan bukti bahwa akun tertentu dapat dibuka.", source: { label: "Bappebti — daftar calon pedagang aset kripto", url: registerUrl("ID", "Bappebti prospective physical crypto-asset trader list") } },
        ],
      },
      {
        heading: "Bursa mitra dan penduduk Indonesia",
        items: [
          { text: `NexuAlpha belum memiliki catatan kelayakan bersumber yang menunjukkan bursa mitra mana pun terbuka untuk penduduk Indonesia; karena itu tidak ada bursa yang ditampilkan sebagai "tersedia" di sini.`, source: null },
        ],
      },
      {
        heading: "Deposit rupiah (IDR)",
        items: [
          { text: "Panduan deposit resmi sebuah platform lokal menjelaskan deposit IDR melalui virtual account bank, serta QRIS dan dompet digital jika ditampilkan. Ketersediaan, biaya, dan batas harus dicek di alur akun resmi.", source: { label: "Tokocrypto — panduan deposit", url: registerUrl("ID", "Tokocrypto IDR deposit guidance") } },
        ],
      },
    ],
    marketLink: "Halaman pasar Indonesia",
    sourcesLabel: "Sumber",
    reviewed: (date) => `Sumber ditinjau pada ${date}.`,
  },
  vi: {
    market: "VN",
    marketPath: "/vn",
    title: "Trước khi giao dịch tiền mã hóa tại Việt Nam",
    lead: "NexuAlpha chưa hoàn tất việc rà soát bộ nguồn chính thức của Việt Nam, nên phần này chỉ nêu các cơ quan cần kiểm tra và những gì chúng tôi chưa thể xác nhận.",
    sections: [
      {
        heading: "Cơ quan cần kiểm tra",
        regulator: null,
        items: [
          { text: "Bộ Tài chính — trang thông tin chính thức.", source: { label: "mof.gov.vn", url: "https://mof.gov.vn" } },
          { text: "Ngân hàng Nhà nước Việt Nam (ngân hàng trung ương) — trang thông tin chính thức.", source: { label: "sbv.gov.vn", url: "https://www.sbv.gov.vn" } },
        ],
      },
      {
        heading: "Những gì chưa được xác nhận",
        items: [
          { text: "NexuAlpha chưa có hồ sơ đủ điều kiện có nguồn cho bất kỳ sàn đối tác nào đối với người cư trú tại Việt Nam, nên không sàn nào được hiển thị là \"khả dụng\" ở đây.", source: null },
          { text: "Kênh nạp tiền VND chưa được nêu vì chưa có nguồn chính thức đã rà soát; hãy kiểm tra trong luồng tài khoản chính thức của từng nền tảng.", source: null },
        ],
      },
    ],
    marketLink: "Trang thị trường Việt Nam",
    sourcesLabel: "Nguồn",
    reviewed: (date) => `Cập nhật ${date}.`,
  },
});

// Owner approved 2026-10-11 ("全部照实上线"): the briefs ship as written, including the TR line that a partner's
// Turkish entity is on the SPK liquidation list and that no partner is confirmed available to residents.
export const LOCAL_MARKET_BRIEF_ENABLED = true;

export function localMarketBrief(locale) {
  return LOCAL_MARKET_BRIEFS[locale] || null;
}
