export default {
  query(name) {
    return `${name} 推薦碼`;
  },
  labels: {
    code: "代碼",
    benefit: "權益",
    entry: "輸入位置",
    later: "事後補填",
    payout: "發放",
    verified: "已驗證",
    check: "檢查",
    source: "來源",
    log: "紀錄",
    calculator: "計算器",
  },
  verifiedTitle(name, code, benefit, date) {
    return `${this.query(name)}：${code} — ${benefit}（已於 ${new Intl.DateTimeFormat("zh-Hant", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(date))} 驗證）`;
  },
  share(percent) {
    return `最多可返還 ${percent}% 的手續費；不代表一定會發放。`;
  },
  noBenefit: "未驗證使用者權益",
  pending: "尚未驗證",
  cadence: {
    hourly: "每小時",
    daily: "每日",
  },
  entryText: "完成註冊前，先查看一般推薦碼欄位，並確認代碼輸入正確。",
  laterUnknown: "官方說明未確認註冊後可補填代碼；不要假設一定可以補填。",
  laterBinance:
    "Binance 支援有條件的合作夥伴重新綁定，並非任意更換代碼。主帳戶需已完成身分驗證、沒有既有推薦人，最近 90 天交易量低於 5,000 美元，並通過地區與風險檢查。合作夥伴申請需在 30 天內達到 150,000 美元合資格交易量；零手續費交易對與子帳戶不計入。無交易紀錄的自助重新綁定是另一個流程。本頁未確認此代碼符合資格；不要只為了重新綁定而交易。",
  laterBybit:
    "僅限主帳戶；若沒有既有合作夥伴或推薦人關聯，且註冊未超過 14 天，可加入合作夥伴代碼；一般推薦碼不支援補填。需符合地區資格，做市商與機構帳戶不適用。代碼加入後不能更改或取消。",
  faqEntry(name) {
    return `${name} 推薦碼要在哪裡輸入？`;
  },
  faqLater(name) {
    return `${name} 推薦碼註冊後還能補填嗎？`;
  },
  faqPayout(name) {
    return `${name} 推薦發放何時處理？`;
  },
  payoutText(name, cadence) {
    return `合作夥伴資料顯示，${name} 會${cadence}發放；仍需符合資格條件。`;
  },
  noPayout: "沒有已驗證的發放時間表",
};
