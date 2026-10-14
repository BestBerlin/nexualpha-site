const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
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
  query: (name) => `${name}: điều kiện tài khoản`,
  labels: {
    code: "Mã",
    benefit: "Điều kiện",
    entry: "Khi đăng ký",
    later: "Sau khi đăng ký",
    payout: "Lịch thanh toán",
    verified: "Đã xác minh",
    check: "Kiểm tra",
    source: "Nguồn",
    log: "Nhật ký",
    calculator: "Máy tính",
  },
  verifiedTitle: (name, code, benefit, date) =>
    `${name}: điều kiện tài khoản: ${code} — ${benefit} (xác minh ngày ${formatDate(date)})`,
  share: (percent) => `Tối đa ${percent}% phí được hoàn lại theo điều kiện`,
  noBenefit: "Chưa có điều kiện người dùng được xác minh",
  pending: "Chưa xác minh",
  cadence: {
    hourly: "hằng giờ",
    daily: "hằng ngày",
  },
  entryText:
    "Kiểm tra trường giới thiệu trước khi hoàn tất đăng ký nếu quy trình chính thức yêu cầu.",
  laterUnknown:
    "Trợ giúp chính thức chưa xác nhận có thể thêm mã sau khi đăng ký; không giả định rằng có thể thêm.",
  laterBybit:
    "Bybit chỉ cho biết mã affiliate có thể được thêm cho tài khoản chính trong vòng 14 ngày nếu chưa có liên kết affiliate/referrer hiện tại. Mã giới thiệu thông thường không được hỗ trợ; điều kiện pháp lý áp dụng, tài khoản market-maker và tổ chức bị loại trừ, và mã không thể đổi hoặc hủy sau khi thêm.",
  laterBinance:
    "Binance mô tả việc liên kết lại affiliate có điều kiện, không phải thay mã tùy ý. Điều kiện gồm tài khoản chính đã hoàn tất KYC, chưa có referrer, khối lượng 90 ngày gần nhất dưới $5.000, cùng kiểm tra khu vực và rủi ro. Đơn affiliate cần $150.000 khối lượng đủ điều kiện trong 30 ngày; cặp miễn phí và tài khoản phụ bị loại trừ. Tự liên kết lại khi chưa có lịch sử giao dịch là quy trình riêng. Trang này không xác nhận mã này đủ điều kiện; không giao dịch chỉ để liên kết lại.",
  faqEntry: (name) => `Điều kiện tài khoản của ${name} được kiểm tra ở đâu?`,
  faqLater: (name) =>
    `${name} có cho phép cập nhật liên kết sau khi đăng ký không?`,
  faqPayout: (name) => `${name} công bố lịch thanh toán như thế nào?`,
  payoutText: (name, cadence) =>
    `Dữ liệu đối tác cho biết ${name} thanh toán ${cadence}; điều kiện đủ điều kiện vẫn áp dụng.`,
  noPayout: "Chưa có lịch thanh toán được xác minh",
};
