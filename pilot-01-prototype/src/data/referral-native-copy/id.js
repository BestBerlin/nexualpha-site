const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const formatDate = (date) => {
  if (!date) return "";
  const parsed = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return dateFormatter.format(parsed);
};

export default {
  query: (name) => `kode referral ${name}`,
  labels: {
    code: "Kode",
    benefit: "Manfaat",
    entry: "Saat daftar",
    later: "Setelah daftar",
    payout: "Jadwal pembayaran",
    verified: "Terverifikasi",
    check: "Periksa",
    source: "Sumber",
    log: "Log",
    calculator: "Kalkulator",
  },
  verifiedTitle: (name, code, benefit, date) =>
    `kode referral ${name}: ${code} — ${benefit} (diverifikasi ${formatDate(date)})`,
  share: (percent) => `Hingga ${percent}% biaya dikembalikan`,
  noBenefit: "Belum ada manfaat pengguna yang terverifikasi",
  pending: "Belum terverifikasi",
  cadence: {
    hourly: "setiap jam",
    daily: "harian",
  },
  entryText:
    "Masukkan kode referral di kolom referral sebelum menyelesaikan pendaftaran.",
  laterUnknown:
    "Bantuan resmi tidak mengonfirmasi penambahan kode setelah pendaftaran; jangan berasumsi kode bisa ditambahkan.",
  laterBybit:
    "Kode afiliasi hanya dapat ditambahkan untuk akun utama dalam 14 hari jika belum ada afiliasi/referrer saat ini. Kode referral biasa tidak didukung; kelayakan regulasi berlaku, akun market-maker dan institusional dikecualikan, dan kode tidak dapat diubah atau dibatalkan setelah ditambahkan.",
  laterBinance:
    "Binance mendukung pengaitan ulang afiliasi bersyarat, bukan penggantian kode bebas. Syaratnya akun utama sudah KYC, tanpa referrer, volume 90 hari terakhir di bawah $5.000, serta lolos pemeriksaan wilayah dan risiko. Pengajuan afiliasi membutuhkan volume memenuhi syarat $150.000 dalam 30 hari; pasangan zero-fee dan subakun dikecualikan. Rebind mandiri tanpa riwayat trading adalah proses terpisah. Halaman ini tidak mengonfirmasi kode ini memenuhi syarat; jangan trading hanya untuk rebind.",
  faqEntry: (name) => `Di mana memasukkan kode referral ${name}?`,
  faqLater: (name) => `Bisakah kode referral ${name} ditambahkan setelah daftar?`,
  faqPayout: (name) => `Kapan ${name} membayar rebate referral?`,
  payoutText: (name, cadence) =>
    `Data partner menyatakan ${name} membayar ${cadence}; syarat kelayakan berlaku.`,
  noPayout: "Belum ada jadwal pembayaran yang terverifikasi",
};

// Venue-specific entry steps from the reviewed official help records.
// These supplement the shared interface copy without changing locale policy.
export const entryByVenue = {
  "bitget": "Di formulir situs, isi kode referral opsional setelah email atau nomor ponsel, sebelum mengeklik Next.",
  "okx": "Periksa kode yang terisi sebelum menyelesaikan pendaftaran. Menurut OKX, tautan referral sebelumnya dapat terkait dengan perangkat selama 30 hari.",
  "binance": "Di aplikasi Binance, periksa kode pada langkah setelah akun dibuat, sebelum melanjutkan KYC. Kode yang sudah ditautkan tidak dapat diubah.",
  "bybit": "Isi kode referral atau afiliasi sebelum mengeklik Sign Up Now.",
  "coinw": "Masukkan kode referral saat pendaftaran untuk membentuk hubungan undangan.",
  "kraken": "Masukkan kode saat membuat akun di aplikasi Kraken. Ketentuan aplikasi tidak memverifikasi manfaat kode mitra ini."
};
