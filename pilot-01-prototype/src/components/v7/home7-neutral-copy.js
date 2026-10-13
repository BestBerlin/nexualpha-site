// Home v7 in a market where no exchange may be promoted (Vietnam, Resolution 05/2025/NQ-CP; owner 2026-10-13): the same
// fee data and tools, with no rebate ledger, no invite code, no sign-up button and no rebate wording. Overlays the
// locale's regular copy (home7-copy.js); Vietnamese has its own wording, every other UI locale on a VN market reads the
// English overlay for the replaced lines.
const NEUTRAL = {
  en: {
    kick: "NEXUALPHA · EXCHANGE FEES & MARKET DATA",
    h1a: "Exchange fees, side by side.", h1b: "Compare before you trade.",
    sub: "Official fee schedules, checked domains and market data for each exchange.\nInformation only: we compare, the exchanges publish.",
    heroGo: "Browse the exchange directory", calcLink: "Estimate fees for my volume",
    pw: (n) => `${n} exchanges`,
    cap: (n) => `${n} exchanges, each with its own fee profile and official domain.`,
    t2: "Fees from official sources", t2b: "Every fee links back to the schedule the exchange publishes.",
    t3b: "We only publish information; accounts and trading stay on each exchange's official site.",
    howH: "Compare in three steps",
    how: [["Pick an exchange", "See its official fees and checked domain."], ["Put two side by side", "Compare maker/taker fees, funding and regional conditions."], ["Check the source", "Every figure links to the exchange's official page."]],
    open: "View profile", pending: "Base fee", shH: "Compare fees first",
    lowest: (n, v) => `${n} has the lowest base fees: ${v} a year.`, most: () => "",
  },
  vi: {
    kick: "NEXUALPHA · PHÍ SÀN & DỮ LIỆU THỊ TRƯỜNG",
    h1a: "Phí sàn, đặt cạnh nhau.", h1b: "So sánh trước khi giao dịch.",
    sub: "Biểu phí chính thức, tên miền đã kiểm tra và dữ liệu thị trường của từng sàn.\nChỉ là thông tin: chúng tôi so sánh, các sàn công bố.",
    heroGo: "Xem danh bạ sàn", calcLink: "Ước tính phí theo khối lượng",
    pw: (n) => `${n} sàn giao dịch`,
    cap: (n) => `${n} sàn giao dịch, mỗi sàn có hồ sơ phí và tên miền chính thức riêng.`,
    t2: "Phí theo nguồn chính thức", t2b: "Mỗi mức phí dẫn về biểu phí do sàn công bố.",
    t3b: "Chúng tôi chỉ cung cấp thông tin; tài khoản và giao dịch diễn ra trên trang chính thức của từng sàn.",
    howH: "So sánh trong ba bước",
    how: [["Chọn một sàn", "Xem phí chính thức và tên miền đã kiểm tra."], ["Đặt hai sàn cạnh nhau", "So sánh phí maker/taker, funding và điều kiện theo khu vực."], ["Kiểm tra nguồn", "Mỗi con số đều dẫn về trang chính thức của sàn."]],
    open: "Xem hồ sơ", pending: "Phí cơ bản", shH: "So sánh phí trước",
    lowest: (n, v) => `${n} có phí cơ bản thấp nhất: ${v} mỗi năm.`, most: () => "",
  },
};

export function h7NeutralCopy(locale) {
  return NEUTRAL[locale] || NEUTRAL[String(locale || "").split("-")[0]] || NEUTRAL.en;
}
