import { useEffect, useState } from "react";
import { resolveMarketPolicy } from "../../../data/market-policy.js";
import { regionalDirectoryHref, regionalToolHref } from "../../../data/regional-directory.js";
import { marketEntryBrief } from "../../../data/market-entry-brief.js";
import { INTERNATIONAL_SOURCE_REVIEWED_AT, internationalSourcesFor } from "../../../data/international-source-registry.js";
import { aeoQuestionText, aeoQuestionsForMarket } from "../../../data/aeo-question-registry.js";
import { regionalAeoCoverageSummary, regionalPageBoundary, regionalQuestionNextSteps } from "../../../data/regional-preview-copy.js";
import { localizedHref } from "../../../data/locale-routing.js";
import { contextualHref } from "../../../data/contextual-href.js";
import { NextDecisionBridge } from "../NextDecisionBridge.jsx";
import { RegionalMarketDecisionDepth } from "./RegionalMarketDecisionDepth.jsx";
import { RegionalMobileDecisionDock } from "./RegionalMobileDecisionDock.jsx";
import {
  REGIONAL_FUNDING_MATRIX_PUBLIC_CSV,
  REGIONAL_FUNDING_MATRIX_PUBLIC_JSON,
  REGIONAL_FUNDING_MATRIX_REVIEWED_AT,
  regionalFundingRowsForMarkets,
} from "../../../data/regional-funding-verification-matrix.js";
import {
  REGIONAL_SHORTLIST_STATES,
  buildRegionalShortlist,
  regionalShortlistAccountStageOptions,
  regionalShortlistCopy,
  regionalShortlistMarketOptions,
  regionalShortlistProductOptions,
} from "../../../data/regional-shortlist.js";
import "./regional-market-preview.css";

const REGIONAL_AEO_QUESTION_COPY = {
  "zh-Hant": {
    "hk-residence-platform": "SFC 名單與官方帳戶中的服務主體是否一致？",
    "hk-hkd-funding": "目前帳戶是否顯示港幣銀行轉帳、FPS 或 eDDA？",
    "hk-account-stage": "完成身分與地址驗證後，目標產品和費用範圍是否可用？",
  },
};

function localizedAeoQuestionText(id, locale) {
  return REGIONAL_AEO_QUESTION_COPY[locale]?.[id] || aeoQuestionText(id);
}

const COPY = {
  MX: {
    title: "México: compara MXN, SPEI e identidad antes de abrir cuenta",
    summary: "Ruta local en español para separar SPEI, cuenta bancaria, verificación de identidad, alcance de producto y condiciones oficiales antes de registrarte.",
    directAnswer: {
      heading: "Qué revisar en México antes de elegir una plataforma cripto",
      text: "Empieza por entender SPEI desde Banco de México, revisa el marco CNBV sobre tecnología financiera y después confirma en la plataforma oficial si tu cuenta puede usar MXN, SPEI, verificación de identidad y el producto que buscas. La guía pública de Binance permite revisar una ruta MXN/SPEI/Medá documentada; OKX u otra plataforma global deben tratarse como comparación de cuenta oficial, no como prueba de fondeo local en México. Una fuente regulatoria o una guía de depósito no garantiza apertura de cuenta, disponibilidad de producto ni beneficio para el usuario.",
      bullets: ["SPEI y MXN como ruta de pago", "Ruta Binance MXN/SPEI/Medá como fuente documentada", "OKX y otros candidatos solo después del flujo oficial de cuenta", "Identidad, residencia, producto, comisiones y límites visibles en la cuenta"],
    },
    preSignupChecks: {
      heading: "Verificación de 4 pasos antes del registro",
      items: [
        ["1", "Ruta documentada", "Usa la guía oficial de Binance para revisar MXN, SPEI o la ruta Medá como punto de partida documentado."],
        ["2", "Flujo de cuenta", "Comprueba que esa ruta aparece en tu cuenta actual; no la traslades automáticamente a OKX u otro candidato global."],
        ["3", "Identidad y residencia", "Verifica documento, país de residencia, titularidad bancaria, límites, tiempos y nivel de cuenta requerido."],
        ["4", "Producto disponible", "Confirma que el producto spot o la función que buscas, sus comisiones y sus límites están disponibles para esa cuenta."],
      ],
      boundary: "Banco de México, CNBV y las guías oficiales son puntos de verificación; Binance tiene una guía pública para revisar MXN/SPEI/Medá, mientras OKX y otros candidatos globales requieren confirmación dentro de la cuenta oficial. Nada aquí promete aprobación de cuenta, fondeo MXN/SPEI, producto ni beneficio.",
    },
    sourceChecks: {
      heading: "Qué prueba y qué no prueba cada fuente",
      rows: [
        ["Banco de México", "Qué es SPEI como sistema de pagos", "No confirma que una plataforma acepte tu cuenta o depósito."],
        ["CNBV / marco Fintech", "Contexto regulatorio de tecnología financiera y activos virtuales", "No equivale a elegibilidad ni a beneficio de usuario."],
        ["Guía oficial de Binance", "Pasos MXN/SPEI/Medá documentados por la plataforma", "Debe coincidir con tu cuenta, banco, límites y pantalla actual."],
        ["OKX u otros candidatos", "Comparación de dominio, identidad, producto y costos en el flujo oficial", "No prueba por sí sola un carril local MXN/SPEI para México."],
        ["Flujo oficial de cuenta", "Identidad, residencia, producto y comisiones visibles", "Es la verificación final antes de registrarte o depositar."],
      ],
    },
    relatedLabel: "Rutas de investigación para México",
    relatedResearch: [
      ["directory", "Ver candidatos para México", "Empieza con la ruta documentada de Binance y compara otros candidatos solo con verificación oficial de cuenta."],
      ["rates", "Estimar costos antes del depósito", "Usa tasas base públicas y confirma la comisión final en la cuenta oficial."],
      ["compare", "Comparar dos plataformas antes de registrarte", "Revisa SPEI, identidad, producto y límites en paralelo."],
    ],
    questions: ["¿El flujo oficial muestra MXN/SPEI o Medá para tu cuenta?", "¿La cuenta bancaria y la identidad coinciden con los requisitos de la plataforma?", "¿El producto spot que buscas aparece disponible después de la verificación?"],
    answers: [
      "SPEI existe como sistema de pagos y Binance publica una ruta MXN/SPEI/Medá que sirve como fuente documentada. Cada plataforma decide qué muestra para tu cuenta, así que verifica el método, el banco, los límites y la pantalla actual antes de actuar.",
      "La identidad, residencia, titularidad bancaria y nivel de verificación pueden cambiar el resultado. Usa el flujo oficial como la confirmación final.",
      "La disponibilidad de spot, depósitos, retiros, comisiones y promociones puede variar por cuenta. No lo trates como garantizado por una fuente externa.",
    ],
    decisionLanes: [
      ["new_account", "Primera cuenta", "Compara SPEI, MXN, identidad, banco y producto antes de elegir plataforma.", "Comparar opciones"],
      ["another_platform", "Ya usas otra plataforma", "Contrasta comisiones, pasos de depósito y alcance de producto antes de abrir otra.", "Ver diferencias"],
      ["existing_account", "Ya tienes la cuenta objetivo", "Confirma las condiciones visibles en tu cuenta oficial antes de depositar.", "Revisar condiciones"],
    ],
    warning: "SPEI, MXN, identidad, producto y beneficios deben verificarse en el flujo oficial de la cuenta; esta página no promete registro, acceso ni bonificación.",
    sources: [],
  },
  TW: {
    title: "台灣：先核對金管會法規、登記邊界與新台幣入金",
    summary: "繁體中文研究路徑，分開確認金管會法規的公布與施行狀態、洗錢防制或 VASP 登記、新台幣入出金、本人銀行帳戶、身分驗證與商品條件。",
    directAnswer: {
      heading: "台灣用戶選擇加密貨幣平台前要先查什麼",
      text: "先核對金管會公布的現行規則、法律施行日期與服務主體。已公布的法律可能仍有部分條文尚未施行；洗錢防制或 VASP 登記只是監理脈絡，不是帳戶核准、平台背書、新台幣入出金或商品權限保證。最後仍要在官方帳戶流程核對身分、本人銀行帳戶、費用、限額與商品。",
      bullets: ["金管會法規的公布與施行狀態", "AML／VASP 登記不是帳戶或商品保證", "新台幣入出金與本人銀行帳戶", "身分驗證、費用限額與商品範圍"],
    },
    preSignupChecks: {
      heading: "開戶或入金前的 4 項核對",
      items: [
        ["1", "法規與施行日期", "分開閱讀法律公布日、施行日及尚未施行的條文，不把未生效規則寫成目前帳戶結果。"],
        ["2", "服務主體與登記", "確認法律實體、官方網域及 AML／VASP 登記狀態；登記不是金管會背書或帳戶核准。"],
        ["3", "身分與本人銀行帳戶", "在官方流程核對身分文件、居住地、帳戶等級與本人名義銀行帳戶驗證。"],
        ["4", "新台幣入出金與商品", "逐項確認入金、出金、費用、限額、處理時間與目標現貨商品是否顯示於目前帳戶。"],
      ],
      boundary: "公開法規與登記資料只界定研究範圍；帳戶核准、新台幣入出金、費用限額、商品權限與優惠均須由官方帳戶畫面確認。",
    },
    sourceChecks: {
      heading: "每個官方來源能證明什麼",
      rows: [
        ["金管會規則與法規庫", "現行規則、公布與施行日期及服務主體的研究脈絡", "已公布不等於所有條文已施行，也不等於特定平台或帳戶一定可用。"],
        ["AML／VASP 登記", "特定法律實體的洗錢防制登記脈絡", "不是平台背書、帳戶核准、資產安全或商品權限保證。"],
        ["官方入金教學", "新台幣入金、銀行帳戶與操作步驟", "仍要以你目前帳戶畫面為準。"],
        ["註冊與身份驗證教學", "開戶、身份文件與帳戶等級步驟", "不保證審核結果或商品權限。"],
        ["銀行帳號驗證教學", "本人銀行帳戶核對方式", "不代表所有銀行、額度或費用都適用。"],
      ],
    },
    relatedLabel: "台灣相關研究路徑",
    relatedResearch: [
      ["directory", "查看台灣可研究的平台候選", "保留 market=TW，先比較服務主體、官方域名與入金條件。"],
      ["rates", "入金前先估算交易成本", "用公開基礎費率建立假設，再到官方帳戶確認實際費用。"],
      ["compare", "開戶前並排比較兩個平台", "同時看新台幣入金、銀行驗證、身份條件與商品範圍。"],
    ],
    questions: ["官方流程是否顯示新台幣入金與本人銀行帳戶驗證？", "身份驗證、居住地與帳戶等級是否符合平台要求？", "想使用的現貨商品與費用是否出現在目前帳戶畫面？"],
    answers: [
      "先在官方帳戶流程確認新台幣入金方式、本人銀行帳戶、限額與費用；實際選項會依帳戶狀態變化。",
      "第一次開戶先比較身份驗證、服務主體與帳戶等級；已有目標帳戶則回到官方流程核對目前限制。",
      "現貨、入出金、費用和優惠可能按服務主體、居住地與帳戶層級不同，註冊或入金前要逐項確認。",
    ],
    decisionLanes: [
      ["new_account", "第一次開戶", "先核對金管會脈絡、銀行驗證、服務主體與產品條件。", "比較開戶條件"],
      ["another_platform", "已有其他平台", "比較費用、入金方式與產品差異，再決定是否新增帳戶。", "查看差異"],
      ["existing_account", "已有目標帳戶", "回到官方流程核對現有帳戶的新台幣入金、身份與商品條件。", "核對帳戶條件"],
    ],
    warning: "法規公布與施行、AML／VASP 登記、帳戶核准、新台幣入出金、本人銀行帳戶、身分驗證、費用限額、商品範圍與優惠必須分開核對；本頁不是開戶、商品或福利承諾。",
    sources: [],
  },
  ID: {
    title: "Indonesia: cek OJK/Bappebti, identitas, dan jalur IDR dulu",
    summary: "Rute riset Bahasa Indonesia untuk memisahkan konteks OJK/Bappebti, verifikasi identitas, VA bank, QRIS, wallet, dan cakupan produk sebelum membuka akun.",
    directAnswer: {
      heading: "Yang perlu dicek pengguna Indonesia sebelum memilih platform kripto",
      text: "Mulai dari konteks resmi OJK dan Bappebti, lalu cocokkan nama badan usaha, domain resmi, proses verifikasi identitas, jalur deposit IDR seperti VA bank atau QRIS, serta produk yang tersedia di akun resmi. Daftar regulator atau panduan platform adalah titik awal riset, bukan jaminan akun, produk, manfaat, atau hasil pendaftaran.",
      bullets: ["Konteks OJK dan Bappebti", "Nama badan usaha dan domain resmi", "Verifikasi identitas dan status akun", "Jalur IDR: VA bank, QRIS, wallet, dan biaya"],
    },
    preSignupChecks: {
      heading: "4 cek sebelum membuka akun",
      items: [
        ["1", "Badan usaha dan domain", "Cocokkan nama platform, badan usaha, domain resmi, dan konteks OJK/Bappebti sebelum membuka rute akun."],
        ["2", "Identitas dan wilayah", "Cek dokumen, negara tempat tinggal, nomor ponsel, dan status verifikasi yang diminta di alur resmi."],
        ["3", "Jalur IDR", "Pastikan VA bank, QRIS, wallet, biaya, batas, dan waktu proses benar-benar muncul untuk akun Anda."],
        ["4", "Produk dan ketentuan", "Konfirmasi spot, futures, promosi, fee tier, dan syarat referral di layar resmi sebelum deposit atau trading."],
      ],
      boundary: "Daftar resmi dan panduan deposit adalah titik verifikasi; bukan janji akun, IDR funding, produk, bonus, atau hasil referral.",
    },
    sourceChecks: {
      heading: "Apa yang dibuktikan tiap sumber resmi",
      rows: [
        ["OJK/Bappebti", "Konteks peralihan pengawasan aset kripto", "Tidak menjamin akun, produk, atau manfaat pengguna."],
        ["Daftar Bappebti", "Nama pedagang fisik aset kripto sebagai titik cek", "Bukan putusan kelayakan untuk pengguna tertentu."],
        ["Panduan deposit resmi", "VA bank, wallet, QRIS, batas dan langkah deposit", "Ketersediaan tetap bergantung pada akun saat ini."],
        ["Alur akun resmi", "Identitas, domain, produk, dan biaya yang tampil", "Harus dicek sebelum deposit atau trading."],
      ],
    },
    relatedLabel: "Rute riset Indonesia terkait",
    relatedResearch: [
      ["directory", "Lihat kandidat platform untuk Indonesia", "Pertahankan market=ID saat membandingkan domain, identitas, dan jalur IDR."],
      ["rates", "Hitung biaya sebelum deposit", "Gunakan asumsi biaya dasar publik, lalu cek biaya final di akun resmi."],
      ["compare", "Bandingkan dua platform sebelum daftar", "Pisahkan badan usaha, IDR funding, verifikasi identitas, dan produk."],
    ],
    questions: ["Apakah badan usaha dan domain resmi sudah cocok dengan sumber OJK/Bappebti?", "Metode IDR mana yang terlihat di akun: VA bank, QRIS, wallet, atau lainnya?", "Produk spot yang dicari benar-benar tersedia setelah verifikasi identitas?"],
    answers: [
      "Gunakan OJK dan Bappebti sebagai konteks resmi, lalu cek kembali nama badan usaha dan domain di layar platform resmi.",
      "VA bank, QRIS, wallet, batas deposit, biaya, dan waktu proses dapat berubah menurut akun. Jangan deposit sebelum memeriksa alur resmi saat ini.",
      "Nama platform atau daftar regulator tidak berarti semua produk aktif untuk akun Anda. Cek produk, biaya, dan batas akun satu per satu.",
    ],
    decisionLanes: [
      ["new_account", "Akun pertama", "Periksa OJK/Bappebti, domain resmi, identitas, jalur IDR, dan produk sebelum memilih platform.", "Bandingkan pilihan"],
      ["another_platform", "Sudah memakai platform lain", "Bandingkan biaya, badan usaha, dan jalur deposit sebelum membuka akun tambahan.", "Lihat perbedaan"],
      ["existing_account", "Sudah punya akun tujuan", "Verifikasi syarat akun, IDR funding, dan produk di alur resmi saat ini.", "Periksa syarat akun"],
    ],
    warning: "Konteks OJK/Bappebti, jalur IDR, produk, dan manfaat pengguna harus diverifikasi di akun resmi; halaman ini bukan janji pendaftaran atau bonus.",
    sources: [],
  },
  VN: {
    title: "Việt Nam: giữ ở chế độ nghiên cứu trước khi mở tài khoản",
    summary: "Lộ trình tiếng Việt để tách nơi cư trú, định danh, đường nạp VND/USDT, điều kiện sản phẩm và nguồn chính thức trước khi coi bất kỳ nền tảng nào là phù hợp.",
    directAnswer: {
      heading: "Người dùng Việt Nam cần kiểm tra gì trước khi chọn nền tảng crypto",
      text: "Trang Việt Nam hiện là bản nghiên cứu noindex. Hãy bắt đầu bằng việc xác định nơi cư trú, pháp nhân và tên miền chính thức, sau đó kiểm tra trong luồng tài khoản chính thức về định danh, đường nạp VND hoặc USDT, phí, giới hạn và sản phẩm khả dụng. NexuAlpha chưa có hàng ma trận nguồn chính thức đủ sâu cho Việt Nam, vì vậy trang này không được dùng như lời hứa mở tài khoản, nạp tiền, ưu đãi hoặc quy kết đăng ký.",
      bullets: ["Nơi cư trú và pháp nhân dịch vụ", "Tên miền chính thức và luồng tài khoản", "Định danh, nạp VND/USDT, phí và giới hạn", "Sản phẩm spot/perp/on-chain có thật sự hiển thị trong tài khoản hay không"],
    },
    preSignupChecks: {
      heading: "4 bước kiểm tra trước khi đăng ký",
      items: [
        ["1", "Nguồn chính thức", "Chỉ dùng đường dẫn chính thức của nền tảng và nguồn quản lý đã được rà soát; không dựa vào bài đăng xã hội."],
        ["2", "Định danh và cư trú", "Xác nhận tài liệu KYC, nơi cư trú, số điện thoại, email và cấp tài khoản trong luồng chính thức."],
        ["3", "Đường nạp", "Kiểm tra VND, chuyển khoản, ví điện tử, thẻ hoặc USDT on-chain có hiển thị trong tài khoản hiện tại không."],
        ["4", "Sản phẩm và điều kiện", "Xác nhận sản phẩm, phí, giới hạn, rút tiền và bất kỳ lợi ích nào trong màn hình tài khoản chính thức."],
      ],
      boundary: "Việt Nam chưa có ma trận nguồn đã xuất bản cho funding; trang này chỉ là checklist nghiên cứu và không hứa đăng ký, nạp tiền, sản phẩm hoặc lợi ích.",
    },
    sourceChecks: {
      heading: "Ranh giới nguồn cho Việt Nam",
      rows: [
        ["Nguồn quản lý", "Cần dùng để hiểu bối cảnh và phạm vi dịch vụ", "Chưa đủ để hứa tài khoản hoặc sản phẩm cho người dùng cụ thể."],
        ["Tên miền chính thức", "Giúp tránh nhầm trang và nhầm pháp nhân", "Không tự động chứng minh đủ điều kiện hoặc ưu đãi."],
        ["Luồng tài khoản", "Nơi kiểm tra KYC, phương thức nạp, phí, giới hạn và sản phẩm", "Là bước xác nhận cuối trước khi hành động."],
        ["NexuAlpha", "Chỉ tổ chức checklist và đường dẫn nghiên cứu nội bộ", "Không thay đổi hoặc tạo mới link đăng ký đối tác."],
      ],
    },
    relatedLabel: "Lộ trình nghiên cứu Việt Nam",
    relatedResearch: [
      ["directory", "Xem danh sách nền tảng với ngữ cảnh Việt Nam", "Giữ market=VN để kiểm tra domain, pháp nhân và điều kiện tài khoản trước."],
      ["rates", "Ước tính chi phí trước khi nạp", "Tách phí giao dịch, phí nạp/rút, mạng lưới và spread; kết quả cuối nằm trong tài khoản chính thức."],
      ["compare", "So sánh hai nền tảng trước khi đăng ký", "Đặt KYC, funding, phí, giới hạn và phạm vi sản phẩm cạnh nhau."],
    ],
    questions: ["Nguồn chính thức nào chứng minh pháp nhân và phạm vi dịch vụ?", "Đường nạp VND, ví, thẻ hoặc USDT có xuất hiện trong tài khoản hiện tại không?", "Sản phẩm cần dùng có được phép cho nơi cư trú và cấp tài khoản này không?"],
    answers: [
      "Chưa coi Việt Nam là thị trường CTA trực tiếp. Cần có nguồn chính thức, pháp nhân và domain được rà soát trước khi dùng cho quyết định mở tài khoản.",
      "Đường nạp VND hoặc USDT phải được kiểm tra trong tài khoản đăng nhập hiện tại; nguồn bên ngoài không chứng minh khả dụng cho người dùng cụ thể.",
      "Sản phẩm, phí, giới hạn, rút tiền và lợi ích có thể thay đổi theo tài khoản. Chỉ màn hình chính thức mới là điểm xác nhận cuối.",
    ],
    decisionLanes: [
      ["new_account", "Tài khoản đầu tiên", "Trước tiên kiểm tra nguồn, domain, KYC, funding và sản phẩm; chưa dùng như CTA trực tiếp.", "Xem checklist"],
      ["another_platform", "Đã dùng nền tảng khác", "So sánh phí, funding, sản phẩm và rủi ro domain trước khi thêm tài khoản.", "Xem khác biệt"],
      ["existing_account", "Đã có tài khoản mục tiêu", "Quay lại màn hình chính thức để xác nhận funding, phí, giới hạn và sản phẩm.", "Kiểm tra tài khoản"],
    ],
    warning: "Việt Nam hiện là nghiên cứu noindex, không phải trang chuyển đổi trực tiếp; không hứa mở tài khoản, nạp tiền, ưu đãi, phí cố định hoặc quy kết đăng ký.",
    sources: [],
  },
  HK: {
    title: "香港：先核對 SFC 狀態、港幣入金與帳戶限制",
    summary: "繁體中文研究路徑，先核對 SFC 平台狀態、港幣銀行入金、身分驗證與產品範圍，再進入官方帳戶流程。",
    directAnswer: {
      heading: "香港用戶選擇加密資產平台前應先核對什麼",
      text: "先查看香港證監會的持牌虛擬資產交易平台名單，再到官方帳戶流程核對身分、地址、銀行帳戶驗證、FPS 或 eDDA 等港幣入金方式、費用、限額與確切產品範圍。持牌狀態或平台教學只可作為研究起點，不能保證開戶獲批、港幣入金、產品權限或任何用戶優惠。",
      bullets: ["SFC 持牌平台狀態", "身分、地址與銀行帳戶驗證", "港幣入金路徑：FPS、eDDA 或銀行轉帳", "產品範圍、費用、限額與帳戶條件"],
    },
    preSignupChecks: {
      heading: "開戶前的 4 項核對",
      items: [
        ["1", "SFC 與服務主體", "先核對平台、法律實體與官方域名，再判斷該路徑是否適合。"],
        ["2", "身分與地址", "在官方流程核對身分文件、地址、雙重驗證與銀行帳戶驗證要求。"],
        ["3", "港幣入金路徑", "確認目前帳戶是否顯示港幣銀行轉帳、FPS、eDDA 或加密資產轉帳。"],
        ["4", "產品與費用範圍", "在目前帳戶畫面確認目標產品、限額、處理時間、費用與優惠條件。"],
      ],
      boundary: "SFC 狀態與官方教學是研究核對點，不承諾開戶獲批、港幣入金、產品權限或用戶優惠。",
    },
    sourceChecks: {
      heading: "每項香港官方來源可以證明什麼",
      rows: [
        ["SFC 持牌平台名單", "已公布的平台狀態與牌照脈絡", "不保證平台表現、適合性或你的帳戶獲批。"],
        ["SFC 平台規定", "監管範圍與營運背景的核對起點", "不能取代平台帳戶條款。"],
        ["官方港幣入金教學", "支援貨幣、銀行路徑、費用、限額與處理說明", "必須與目前帳戶及銀行畫面相符。"],
        ["官方帳戶驗證教學", "身分、地址、雙重驗證與銀行驗證步驟", "不承諾審核結果或產品權限。"],
      ],
    },
    relatedLabel: "香港相關研究路徑",
    relatedResearch: [
      ["directory", "查看香港平台候選", "保留 market=HK，先核對 SFC 狀態、官方域名與帳戶路徑。"],
      ["rates", "入金前先估算費用", "先用公開基礎費率建立假設，再到官方帳戶確認最終費用。"],
      ["compare", "開戶前並排比較兩個平台", "同時核對 SFC 狀態、港幣入金路徑、身分步驟與產品範圍。"],
    ],
    questions: [localizedAeoQuestionText("hk-residence-platform", "zh-Hant"), localizedAeoQuestionText("hk-hkd-funding", "zh-Hant"), localizedAeoQuestionText("hk-account-stage", "zh-Hant")],
    answers: [
      "把 SFC 名單作為狀態核對點，再在平台流程確認同一法律實體、官方域名與帳戶路徑。",
      "港幣入金可能取決於 FPS、eDDA、銀行轉帳、帳戶姓名、身分資料、限額與銀行處理。匯款前必須核對目前官方畫面。",
      "持牌脈絡不代表所有代幣、產品、費率或用戶優惠都適用。完成身分與帳戶驗證後，再核對產品與費用範圍。",
    ],
    decisionLanes: [["new_account", "第一次開戶", "選擇前先核對 SFC 狀態、身分、地址、港幣入金與產品範圍。", "比較開戶路徑"], ["another_platform", "已有其他平台帳戶", "新增帳戶前比較牌照脈絡、港幣入金、費用與產品範圍。", "查看差異"], ["existing_account", "已有目標帳戶", "在官方流程確認目前帳戶、入金與產品條款。", "核對帳戶條件"]],
    warning: "SFC 狀態、港幣入金、身分、銀行驗證、產品範圍與用戶優惠都必須在官方帳戶流程核對；本頁不承諾開戶或優惠。",
    sources: [],
  },
  EU: {
    title: "European Union: compare account conditions by country",
    summary: "A research path for EUR, SEPA and country-specific compliance conditions across platform accounts.",
    directAnswer: {
      heading: "What EU users should verify before choosing a crypto platform",
      text: "Start with the ESMA MiCA register context, then confirm the exact service entity, country of residence, identity checks, EUR or SEPA funding route and product scope inside the official account flow. A European register entry or payment guide is a research starting point, not a promise that every EU account can use the same products, fees or benefits.",
      bullets: ["ESMA MiCA register context", "Country of residence and service entity", "EUR or SEPA funding route", "Identity checks, product scope and account terms"],
    },
    preSignupChecks: {
      heading: "4 checks before opening an EU account",
      items: [
        ["1", "Entity and member state", "Match the platform entity, official domain, residence country and MiCA or national context before treating the route as suitable."],
        ["2", "Identity and account stage", "Confirm identity documents, residence checks, bank-name matching and the current onboarding status in the official flow."],
        ["3", "EUR or SEPA route", "Check whether SEPA, card, bank transfer, stablecoin transfer, limits, fees and settlement timing appear for this account."],
        ["4", "Product scope", "Verify spot, derivatives, Earn, campaigns and fee tier separately because product access can vary by country and account stage."],
      ],
      boundary: "EU research is country-by-country. Register context does not promise account approval, SEPA funding, product access, fee outcome or user benefit.",
    },
    sourceChecks: {
      heading: "What each EU source proves",
      rows: [
        ["ESMA MiCA register", "Provider, service scope and host Member State context", "Does not decide your account approval, product access or benefit outcome."],
        ["MiCA register rulebook", "How competent-authority data enters the register", "Absence or presence needs current country and entity review."],
        ["Official EMEA payment guide", "Country-specific SEPA or payment-method steps", "Must match the current account, bank name, limits and processing screen."],
        ["Official identity guidance", "Document and account-safety checks before funding", "Does not replace final verification in the selected platform account."],
      ],
    },
    relatedLabel: "European Union research paths",
    relatedResearch: [
      ["directory", "Review EU platform candidates", "Keep market=EU while checking service entity, official domain and country conditions."],
      ["rates", "Estimate costs before SEPA funding", "Use public base-fee assumptions, then confirm final fees in the official account."],
      ["compare", "Compare two platforms before signup", "Check country, funding, identity and product scope side by side."],
    ],
    questions: [aeoQuestionText("eu-mica-register"), aeoQuestionText("eu-member-state"), aeoQuestionText("eu-sepa-funding")],
    answers: [
      "Use the current ESMA MiCA register to check the provider, service scope and Member State context, then match the service entity and official domain. A register entry does not decide account approval or product access.",
      "Product availability can change by platform entity, country, account tier and current terms. Do not assume one EU-facing page covers every member state.",
      "EUR, SEPA, card, identity checks, bank-name matching and product permissions need to match the current account screen before signup or funding.",
    ],
    decisionLanes: [["new_account", "First account", "Start with country, product and funding requirements.", "Compare account paths"], ["another_platform", "Another platform already", "Compare country-specific product and fee conditions.", "Review differences"], ["existing_account", "Target account exists", "Check the account stage and current product terms.", "Review account terms"]],
    warning: "EU access is not one universal promise; verify country, product and account terms.",
    sources: [],
  },
  UK: {
    title: "United Kingdom: verify residency and product scope",
    summary: "A research path for GBP funding, account checks and product availability under platform-specific terms.",
    directAnswer: {
      heading: "What UK users should verify before choosing a crypto platform",
      text: "Start with FCA cryptoasset registration guidance, then confirm the official platform account flow for UK residence, identity or appropriateness checks, GBP funding, bank-name matching, product scope and current marketing or onboarding terms. A public register or help article is not a guarantee that a specific account can register, fund or receive a benefit.",
      bullets: ["FCA cryptoasset registration context", "UK residence and account checks", "GBP funding and bank-name matching", "Product scope, fees and onboarding terms"],
    },
    preSignupChecks: {
      heading: "4 checks before opening a UK account",
      items: [
        ["1", "FCA and service entity", "Use FCA context to identify the firm, then match the official domain and current UK-facing account route."],
        ["2", "Residence and assessment", "Confirm UK residence, identity, appropriateness or risk checks, and whether onboarding is open for this account."],
        ["3", "GBP funding", "Verify bank-name matching, GBP funding method, limits, timing, fee and returned-payment conditions inside the official screen."],
        ["4", "Product and marketing scope", "Check spot, derivatives, campaigns, fee tier and benefit wording separately before treating a CTA as ready."],
      ],
      boundary: "FCA context and platform guides are checkpoints; they do not promise registration approval, GBP funding, product access, fee outcome or user benefit.",
    },
    sourceChecks: {
      heading: "What each UK source proves",
      rows: [
        ["FCA registration guidance", "Who needs UK cryptoasset registration and where to check firm context", "Does not approve a specific user account or product route."],
        ["FCA application process", "Regulatory registration context and scope", "Does not replace platform account terms or marketing rules."],
        ["Official UK account guide", "Account creation, identity and appropriateness checks", "Must match the current official account screen."],
        ["Official GBP funding guide", "Possible GBP funding path and matching-bank-name checks", "Availability, limits, timing and fees remain account-specific."],
      ],
    },
    relatedLabel: "United Kingdom research paths",
    relatedResearch: [
      ["directory", "Review UK platform candidates", "Keep market=UK while checking FCA context, official domain and account route."],
      ["rates", "Estimate fees before GBP funding", "Use public base-rate assumptions, then confirm final fees in the official account."],
      ["compare", "Compare two platforms before signup", "Check residence, GBP funding, identity and product scope side by side."],
    ],
    questions: [aeoQuestionText("uk-fca-register"), aeoQuestionText("uk-residence-route"), aeoQuestionText("uk-gbp-funding")],
    answers: [
      "Use the FCA cryptoasset register and registration guidance to check the firm and its service-entity context, then match the official domain. A register entry does not guarantee account approval or product access.",
      "Confirm UK residence, identity documents, account checks and the official service entity in the current platform flow before treating a registration route as suitable.",
      "GBP funding can depend on bank-name matching, supported payment method, limits, processing time and current account status. Verify the live official screen before sending funds.",
    ],
    decisionLanes: [["new_account", "First account", "Confirm residence, funding and product scope before choosing.", "Compare account paths"], ["another_platform", "Another platform already", "Compare the relevant UK product and fee conditions.", "Review differences"], ["existing_account", "Target account exists", "Verify the current account route with the official platform.", "Review account terms"]],
    warning: "Eligibility, product scope and user benefits must be checked in the official account flow.",
    sources: [],
  },
  JP: {
    title: "日本：本人確認と日本円入金を確認してから比較",
    summary: "金融庁の登録情報と公式プラットフォーム案内を起点に、本人確認、日本円入金、商品範囲を確認する調査経路です。",
    directAnswer: {
      heading: "日本で暗号資産プラットフォームを選ぶ前に確認すること",
      text: "日本の利用者は、まず金融庁の登録情報で事業者名を確認し、そのうえで公式プラットフォームの本人確認、日本円入金、本人名義口座、利用できる現物商品を確認してください。登録情報は出発点であり、口座開設可否や特典を保証するものではありません。",
      bullets: ["金融庁の登録情報", "本人確認と居住地条件", "日本円入金と本人名義口座", "対象アカウントの商品範囲"],
    },
    preSignupChecks: {
      heading: "登録前の4ステップ確認",
      items: [
        ["1", "公式登録情報", "金融庁の登録リストで事業者名とサービス主体を確認します。"],
        ["2", "本人確認", "公式案内で本人確認、居住地、本人名義口座の条件を確認します。"],
        ["3", "日本円入金", "日本円入金方法、銀行名義、限度額、手数料を現在の公式画面で確認します。"],
        ["4", "商品範囲", "利用したい現物商品、送付、取引制限が対象アカウントに表示されるか確認します。"],
      ],
      boundary: "金融庁リストと公式案内は確認起点であり、口座承認、商品利用、特典を保証しません。",
    },
    sourceChecks: {
      heading: "公式ソースごとの確認範囲",
      rows: [
        ["金融庁登録リスト", "登録事業者名と登録状況の確認起点", "口座開設、商品利用、特典を保証しません。"],
        ["公式の口座開設案内", "本人確認、居住地、アカウント開始手順", "最終可否は現在の公式画面で確認します。"],
        ["公式FAQ", "入出金、手数料、対象サービスの確認起点", "全ユーザーに同じ条件が出るとは限りません。"],
        ["NexuAlpha内の比較ページ", "手数料、商品範囲、登録前チェックの整理", "公式条件の代替ではありません。"],
      ],
    },
    relatedLabel: "日本向けの関連研究ルート",
    relatedResearch: [
      ["directory", "日本向け候補を一覧で確認", "market=JP を保持したまま、公式条件のある候補を比較します。"],
      ["rates", "口座開設前にコストを試算", "公開ベース手数料で仮説を作り、最終条件は公式画面で確認します。"],
      ["compare", "2つのプラットフォームを並べて確認", "本人確認、日本円入金、商品範囲を同じ画面で比較します。"],
    ],
    questions: [aeoQuestionText("jp-fsa-register"), aeoQuestionText("jp-identity"), aeoQuestionText("jp-jpy-funding")],
    answers: [
      "金融庁の登録情報は出発点です。実際の口座開設可否と本人確認条件は、利用するサービスの公式フローで確認してください。",
      "口座開設前に、本人確認書類、居住地、利用するサービスの法人名と現在の口座開設条件を公式案内とアカウント画面で確認してください。最終可否は公式フローで判断されます。",
      "日本円の入金方法、本人名義口座の要件、手数料はサービスとアカウント状態によって異なります。公式案内を確認してください。",
    ],
    decisionLanes: [["new_account", "初めて口座を作る", "本人確認、日本円入金、希望商品の条件を先に確認します。", "開設条件を比較"], ["another_platform", "別のサービスを利用中", "手数料、商品範囲、入金経路の違いを確認してから追加口座を判断します。", "違いを確認"], ["existing_account", "対象口座を保有中", "現在の口座に適用される本人確認と商品条件を公式画面で確認します。", "口座条件を確認"]],
    warning: "登録情報は研究の起点です。口座資格、商品範囲、特典は公式アカウントで確認してください。",
    sources: [],
  },
  KR: {
    title: "한국: 본인확인과 원화 입금 조건을 먼저 확인하세요",
    summary: "금융위원회 공식 규제 자료와 플랫폼 안내를 바탕으로 본인확인, 원화 입금, 상품 범위를 확인하는 리서치 경로입니다.",
    directAnswer: {
      heading: "한국에서 플랫폼 비교 전에 확인할 공식 항목",
      text: "한국 이용자는 금융위원회와 금융정보분석원 자료로 규제 맥락을 먼저 확인하고, 공식 플랫폼 화면에서 본인확인, 실명확인 계좌, 원화 입출금, 상품 범위와 혜택 조건을 따로 확인해야 합니다. 규제 맥락은 출발점이며 계정 승인, 거래 가능 상품이나 혜택을 보장하지 않습니다.",
      bullets: ["금융위원회와 금융정보분석원 공식 맥락", "본인확인과 거주지 조건", "실명확인 계좌와 원화 입출금", "대상 계정의 상품 범위와 혜택 조건"],
    },
    preSignupChecks: {
      heading: "가입 전 4단계 확인",
      items: [
        ["1", "공식 규제 맥락", "금융위원회와 금융정보분석원 자료로 신고와 이용자 보호 맥락을 먼저 확인합니다."],
        ["2", "본인확인", "공식 가입 안내에서 본인확인, 거주지, 실명확인 계좌 조건을 확인합니다."],
        ["3", "원화 입출금", "원화 입출금 가능 여부, 은행 계좌 명의, 한도와 처리 조건을 공식 화면에서 확인합니다."],
        ["4", "상품 범위", "현물, 입출금, 지역 제한과 혜택 조건이 대상 계정에 적용되는지 분리해서 봅니다."],
      ],
      boundary: "금융위원회, 금융정보분석원, 플랫폼 공식 안내는 조사 출발점이며 계정 승인, 상품 접근 또는 혜택을 보장하지 않습니다.",
    },
    sourceChecks: {
      heading: "공식 출처별로 확인할 범위",
      rows: [
        ["금융위원회 자료", "가상자산 이용자 보호와 규제 맥락의 출발점", "특정 계정 승인, 원화 입금, 상품 이용을 보장하지 않습니다."],
        ["금융정보분석원 안내", "가상자산사업자 신고와 AML/KYC 맥락", "개별 플랫폼 화면의 본인확인 조건을 대체하지 않습니다."],
        ["업비트 가입·고객확인 안내", "가입, 본인인증, 고객확인 흐름의 공식 확인 경로", "모든 이용자에게 동일한 상품이나 혜택이 적용된다는 뜻은 아닙니다."],
        ["업비트 원화 입출금 안내", "실명확인 계좌, 원화 입출금, 인증 절차 확인 경로", "현재 계정의 한도, 수수료, 처리 결과는 공식 화면에서 다시 확인해야 합니다."],
      ],
    },
    onchainDecision: {
      heading: "온체인 경로를 볼 때 원화 계정 조건과 지갑 비용을 분리하세요",
      answer: "한국어 온체인 검색 의도는 원화 입출금 가능성, 실명확인 계좌, 공식 앱 경로, 지갑 서명, 네트워크, 토큰 계약, 가스와 수수료를 한 번에 묻는 경우가 많습니다. 먼저 한국 계정 조건을 확인하고, 그 다음 DEX 경로와 지갑 비용을 별도 화면에서 검증해야 합니다.",
      checklist: [
        "원화 입출금은 공식 플랫폼 계정에서 실명확인 계좌, 본인확인 상태, 한도와 처리 시간을 확인합니다.",
        "온체인 경로는 공식 앱 도메인, 지갑 서명 화면, 네트워크, 토큰 계약 주소, gas, slippage와 approval을 따로 확인합니다.",
        "수수료 비교는 원화 입출금 비용, 거래 수수료, 네트워크 비용, 브리지 비용을 섞지 않고 각각 기록합니다.",
      ],
      boundary: "이 모듈은 계정 승인, 원화 입출금 가능성, 지갑 안전성, 수익, 에어드롭, 수수료 혜택 또는 가입 혜택을 보장하지 않습니다. 최종 조건은 금융위원회·금융정보분석원 맥락과 공식 플랫폼 화면에서 확인해야 합니다.",
      links: [
        ["directory", "한국 조건으로 플랫폼 후보 보기", "market=KR을 유지한 채 계정 조건과 공식 출처를 먼저 비교합니다."],
        ["rates", "원화·지갑 비용을 분리해 계산", "입출금, 거래 수수료, 네트워크 비용을 하나의 할인 약속으로 합치지 않습니다."],
        ["uniswap", "Uniswap 공식 경로 확인", "지갑, 네트워크, 토큰 계약과 approval을 별도로 확인합니다."],
        ["jupiter", "Jupiter 공식 경로 확인", "Solana 네트워크, 라우팅, 토큰 주소와 지갑 서명을 분리해서 봅니다."],
      ],
    },
    relatedLabel: "한국 관련 리서치 경로",
    relatedResearch: [
      ["directory", "한국 조건으로 플랫폼 후보 보기", "market=KR을 유지한 채 공식 출처와 계정 조건을 먼저 비교합니다."],
      ["rates", "가입 전 비용 가정 확인", "원화 입출금, 거래 수수료, 네트워크 비용을 따로 기록합니다."],
      ["compare", "두 플랫폼을 나란히 비교", "본인확인, 원화 경로, 상품 범위를 같은 기준으로 확인합니다."],
    ],
    questions: [aeoQuestionText("kr-regulatory-context"), aeoQuestionText("kr-identity"), aeoQuestionText("kr-krw-funding")],
    answers: [
      "금융위원회 자료는 규제 맥락을 확인하는 출발점입니다. 실제 계정 개설과 본인확인 조건은 이용할 서비스의 공식 절차에서 확인하세요.",
      "계정 개설 전에 거주지, 본인확인 서류, 서비스 법인과 현재 가입 조건을 공식 안내와 계정 화면에서 확인하세요. 최종 이용 가능 여부는 공식 절차에서 판단됩니다.",
      "원화 입금, 본인 명의 계좌, 실명 확인 요건은 서비스와 계정 상태에 따라 달라질 수 있습니다. 공식 안내를 우선 확인하세요.",
    ],
    decisionLanes: [["new_account", "처음 계정 만들기", "본인확인, 원화 입금, 원하는 상품 조건을 먼저 확인합니다.", "개설 조건 비교"], ["another_platform", "다른 플랫폼 이용 중", "수수료, 상품 범위, 입금 경로 차이를 확인한 뒤 추가 계정을 판단합니다.", "차이 확인"], ["existing_account", "대상 계정 보유", "현재 계정에 적용되는 본인확인과 상품 조건을 공식 화면에서 확인합니다.", "계정 조건 확인"]],
    warning: "규제 자료는 조사 출발점입니다. 계정 자격, 상품 범위, 혜택은 공식 계정에서 확인하세요.",
    sources: [],
  },
  SG: {
    title: "Singapore: verify the licensed entity and SGD route first",
    summary: "A research path for MAS directory checks, SGD funding, identity verification and platform-specific product scope.",
    directAnswer: {
      heading: "What Singapore users should verify before choosing a crypto platform",
      text: "Start with the current MAS Financial Institutions Directory for Digital Payment Token Service context, then confirm the official platform account flow, identity checks, SGD funding method, service entity and product scope. A regulator listing or Singapore landing page is a research starting point, not a promise that your account can use every product or benefit.",
      bullets: ["MAS DPT service context", "Identity and residence checks", "SGD funding route", "Target account product scope"],
    },
    preSignupChecks: {
      heading: "4 checks before signup",
      items: [
        ["1", "MAS and service entity", "Use MAS context to identify the service entity, then match it with the official platform flow."],
        ["2", "Identity and residence", "Confirm residence, identity checks and account stage before comparing platforms."],
        ["3", "SGD funding route", "Check whether SGD, PayNow, FAST, card or crypto transfer appears in your current account flow."],
        ["4", "Product and benefits", "Verify product scope, limits, fees and any user-benefit conditions in the official account screen."],
      ],
      boundary: "MAS context and platform pages are research starting points; they do not promise account approval, SGD funding, product access or user benefits.",
    },
    sourceChecks: {
      heading: "What each official source proves",
      rows: [
        ["MAS directory", "Digital Payment Token service context", "Does not approve your account, product or benefit."],
        ["MAS payment-service definitions", "What the regulated activity category means", "Does not replace platform account terms."],
        ["Official Singapore platform page", "Current signup, identity and service-entity flow", "Must still be checked in your account screen."],
        ["Official SGD funding page", "Possible PayNow, FAST or SGD funding route", "Availability, limits, fees and timing remain account-specific."],
      ],
    },
    relatedResearch: [
      ["directory", "Compare Singapore-capable platform profiles", "Start with the directory and keep market=SG attached."],
      ["rates", "Estimate cost before opening the account", "Use public base-rate assumptions, then confirm official account fees."],
      ["compare", "Compare two venues before signup", "Check service entity, funding and product scope side by side."],
    ],
    questions: [aeoQuestionText("sg-mas-dpt-directory"), aeoQuestionText("sg-sgd-funding"), aeoQuestionText("sg-product-scope")],
    answers: [
      "Use MAS and official platform pages as a starting point, then confirm the exact service entity shown in the account flow.",
      "SGD funding, PayNow or FAST visibility, cards and crypto funding can vary by platform and account state. Verify the current official path before depositing.",
      "A Singapore-facing page or register entry does not prove every asset, feature or benefit applies. Check the final product scope in the official account.",
    ],
    decisionLanes: [["new_account", "First account", "Check service entity, identity, SGD funding and spot scope before choosing.", "Compare account paths"], ["another_platform", "Another platform already", "Compare funding, product scope and account checks before adding another account.", "Review differences"], ["existing_account", "Target account exists", "Confirm current funding and product terms in the official flow.", "Review account terms"]],
    warning: "Singapore access, product scope and benefits must be verified in the official account flow.",
    sources: [],
  },
  TR: {
    title: "Türkiye: SPK listesini, TRY yolunu ve hesap kapsamını ayırın",
    summary: "SPK geçici listesi, tasfiye listesi, Paribu hesap doğrulaması ve TRY yatırma rehberiyle Türkiye araştırmasını kaynaklara bağlayan karar yolu.",
    directAnswer: {
      heading: "Türkiye'de platform seçmeden önce kontrol edilecekler",
      text: "Türkiye araştırmasında önce SPK'nın geçici faaliyet listesini ve tasfiye listesini ayırın. SPK'nın güncel tasfiye listesinde görünen bir ad, Bitget Teknoloji AŞ dahil, NexuAlpha üzerinde kullanılabilir Türkiye kayıt veya TRY fonlama yolu sayılmaz; kimlik, TRY yatırma ve ürün kapsamı yine resmi hesap akışında doğrulanmalıdır.",
      bullets: ["SPK geçici faaliyet listesi", "SPK tasfiye listesi ve Bitget Teknoloji AŞ kontrolü", "Kimlik, yüz, yatırımcı profili ve adres doğrulaması", "TRY yatırma ve ürün kapsamı"],
    },
    preSignupChecks: {
      heading: "Kayıt öncesi 4 adımlı kontrol",
      items: [
        ["1", "SPK bağlamı", "SPK geçici faaliyet ve tasfiye listelerini ayrı ayrı kontrol edin."],
        ["2", "kimlik doğrulama", "Resmi rehberde kimlik, yüz, yatırımcı profili ve adres adımlarını doğrulayın."],
        ["3", "TRY yatırma", "Banka hesabı eşleşmesi, TRY transfer koşulları, limit ve ücret bilgisini resmi ekranda kontrol edin."],
        ["4", "ürün kapsamı", "Spot ürün, çekim, bölge erişimi ve hesap durumunu tek tek resmi akışta doğrulayın."],
      ],
      boundary: "SPK listeleri ve resmi rehber araştırma sınırını çizer; hesap onayı, TRY yolu, ürün erişimi veya kullanıcı faydası vaadi değildir.",
    },
    sourceChecks: {
      heading: "Her resmi kaynağın kanıtladığı sınır",
      rows: [
        ["SPK geçici faaliyet listesi", "Platform adının yayımlanan Türkiye bağlamını kontrol etmek için başlangıç", "Tek başına yetki, hesap uygunluğu, TRY yolu veya ürün erişimi sonucu değildir."],
        ["SPK tasfiye listesi", "Tasfiye sürecindeki adları ayrıca durdur-ve-incele sinyali olarak ayırır", "NexuAlpha üzerinde Türkiye kaydı, fonlama ya da avantaj izni vermez."],
        ["Paribu hesap doğrulama rehberi", "Kimlik, yüz, yatırımcı profili ve adres adımlarını resmi akışta gösterir", "Sonuç kullanıcıya ve hesabın güncel durumuna bağlıdır."],
        ["Paribu TRY yatırma rehberi", "Banka hesabı eşleşmesi ve TRY transfer koşulları için kontrol noktası", "Limit, ücret, süre ve ürün kapsamı canlı hesap ekranında yeniden doğrulanmalıdır."],
      ],
    },
    relatedLabel: "Türkiye için sonraki araştırma yolları",
    relatedResearch: [
      ["directory", "Türkiye koşullarıyla adayları görüntüle", "market=TR bilgisini koruyarak resmi kaynak ve hesap kapsamını önce karşılaştırır."],
      ["rates", "Kayıttan önce ücret varsayımını kontrol et", "TRY transferi, işlem ücreti, çekim ve ürün maliyetlerini tek bir fayda vaadine dönüştürmez."],
      ["compare", "İki platformu yan yana karşılaştır", "SPK bağlamı, kimlik doğrulama, TRY yolu ve ürün kapsamını aynı ekranda ayırır."],
    ],
    questions: [aeoQuestionText("tr-spk-register"), aeoQuestionText("tr-account-verification"), aeoQuestionText("tr-try-funding")],
    answers: [
      "SPK geçici faaliyet listesi güncel bağlam sağlar, fakat tek başına yetki veya hesap uygunluğu sonucu değildir; tasfiye listesi ayrıca kontrol edilmelidir ve Bitget Teknoloji AŞ listede kaldığı sürece stop-and-review sinyali olarak ele alınır.",
      "Paribu rehberi kimlik, yüz doğrulama, yatırımcı profili ve adres adımlarını uygulama içinde tamamlamayı açıklar; sonuç yine kullanıcıya ve hesaba bağlıdır.",
      "TRY yatırma yolu, banka hesabı eşleşmesi, ürün kapsamı ve fayda koşulları resmi hesap akışında doğrulanmalıdır.",
    ],
    decisionLanes: [["new_account", "İlk hesap", "SPK bağlamı, kimlik doğrulama, TRY yatırma ve ürün kapsamını önce ayırın.", "Koşulları karşılaştır"], ["another_platform", "Başka platform kullanıyorsunuz", "Platform adı, tasfiye durumu, TRY yolu ve ürün kapsamı farklarını kontrol edin.", "Farkları incele"], ["existing_account", "Hedef hesap mevcut", "Güncel hesap doğrulaması, TRY yolu ve ürün erişimini resmi ekranda doğrulayın.", "Hesap koşullarını incele"]],
    warning: "SPK listesi, tasfiye listesi, hesap doğrulaması, TRY yatırma ve kullanıcı faydası ayrı doğrulanır; bu sayfa kayıt veya avantaj vaadi değildir.",
    sources: [],
  },
  US: {
    title: "United States: verify state, USD funding and product scope before choosing a crypto platform",
    summary: "Research-only U.S. path for separating FinCEN MSB context, NMLS or NYDFS state checks, identity, residence, USD rails, account holds and spot product scope before opening or using an account.",
    directAnswer: {
      heading: "What U.S. users should verify before choosing a crypto platform",
      text: "Start with FinCEN MSB context, SEC and CFTC risk context, then check NMLS or NYDFS state records where relevant. Before acting, confirm your state, identity status, legal-name bank account, ACH, wire, debit-card, cash-out, crypto-transfer permissions, holds, fees, limits and product scope inside the official account flow. Public sources do not prove account approval, endorsement, USD funding availability, product access, user benefits or registration attribution.",
      bullets: ["FinCEN MSB is context, not endorsement", "State checks can differ through NMLS, NYDFS and platform support pages", "USD rails are account-screen checks: ACH, wire, debit card, cash-out and holds", "Spot, derivatives, staking, rewards and assets need separate product-scope verification"],
    },
    preSignupChecks: {
      heading: "4 checks before relying on a U.S. account route",
      items: [
        ["1", "State and service entity", "Match your residence state, official platform entity, NMLS/NYDFS context and any platform state exclusions before continuing."],
        ["2", "Identity and bank-name match", "Confirm KYC, SSN or other identity steps, phone, address and that the linked bank account is legally yours."],
        ["3", "USD funding rails", "Check ACH, wire, debit card, cash-out, crypto deposit, crypto withdrawal and withdrawal holds as separate account-screen outcomes."],
        ["4", "Product scope", "Keep spot, margin, futures, staking, rewards and each asset separate; one U.S. account route does not prove every product is available."],
      ],
      boundary: "This page is a verification checklist. It does not promise U.S. account approval, USD funding, product access, fee/timing outcome, user benefit or partner attribution.",
    },
    sourceChecks: {
      heading: "What each U.S. source can and cannot prove",
      rows: [
        ["FinCEN MSB", "BSA registration and virtual-currency regulatory context", "Not approval, endorsement, safety certification or account eligibility."],
        ["SEC / CFTC", "Securities-law and commodity or derivatives risk context", "Not a platform recommendation or product access decision."],
        ["NMLS / NYDFS", "State money-transmitter or New York virtual-currency context", "Not a nationwide availability promise for every user or product."],
        ["Official account flow", "Identity, state support, USD rails, holds, fees, limits and product scope shown to this account", "The final checkpoint before depositing, trading or relying on any benefit."],
      ],
    },
    relatedLabel: "United States research paths",
    relatedResearch: [
      ["directory", "View U.S.-scoped platform candidates", "Keep market=US when comparing official domains, account checks, state support and USD rails."],
      ["rates", "Estimate cost before funding", "Use published base fees only as assumptions; final fees, holds and limits live in the official account."],
      ["compare", "Compare two platforms before signup", "Put state exclusions, identity, USD rails and product scope side by side."],
    ],
    questions: [aeoQuestionText("us-fincen-msb-non-endorsement"), aeoQuestionText("us-state-license-boundary"), aeoQuestionText("us-usd-account-funding")],
    answers: [
      "No. FinCEN MSB registration is BSA context and does not prove endorsement, account acceptance, safety, product suitability or a user benefit.",
      "Use NMLS Consumer Access, NYDFS context and official platform support pages as state-check inputs, then verify the logged-in account screen.",
      "USD rails such as ACH, wire, debit card, cash-out and crypto transfers can differ by state, identity level, bank-name match, holds and product. Confirm them one by one before acting.",
    ],
    decisionLanes: [["new_account", "First account", "Check state, identity, bank-name match, USD rails and spot scope before choosing a platform.", "Compare U.S. account paths"], ["another_platform", "Already use another platform", "Compare state support, holds, funding rails, fees and product scope before adding another account.", "Review differences"], ["existing_account", "Target account exists", "Return to the official account screen to confirm current USD rails, holds, products and benefits.", "Check account terms"]],
    warning: "State support, identity, USD rails, holds, product scope, fees and user benefits must be verified in the official account flow; this page is not a signup, funding, product or benefit promise.",
    sources: [],
  },
  OTHER: {
    title: "International market path: set your country before choosing a platform",
    summary: "A neutral starting point for users whose country-specific research path has not been published yet.",
    questions: ["Where do you reside and which identity document will you use?", "Which product and funding route do you need?", "Does the official platform accept your country and account stage?"],
    decisionLanes: [["new_account", "First account", "Set country, product and funding needs before choosing.", "Compare account paths"], ["another_platform", "Another platform already", "Compare the reason and conditions before adding an account.", "Review differences"], ["existing_account", "Target account exists", "Return to the official flow to verify your account terms.", "Review account terms"]],
    warning: "Set an explicit market before treating any registration route as eligible.",
    sources: [],
  },
};

const MX_EN_COPY = {
  title: "Mexico: compare MXN, SPEI and identity before opening an account",
  summary: "A Mexico-specific research path that separates SPEI, bank-account ownership, identity checks, product scope and official account conditions before registration.",
  directAnswer: {
    heading: "What to check in Mexico before choosing a crypto platform",
    text: "Start with Banco de Mexico to understand SPEI, then review CNBV context for financial technology and virtual assets. After that, use the official platform account flow to confirm whether MXN, SPEI, identity checks and the product you need are actually visible for your account. Binance has a public guide for reviewing an MXN/SPEI/Meda route; OKX and other global candidates should be treated as official-account comparisons, not as proof that the same local funding route is available in Mexico. A regulator page or deposit guide does not guarantee account approval, product access or user benefits.",
    bullets: ["SPEI and MXN as the payment-route context", "Binance MXN/SPEI/Meda as the documented source path", "OKX and other candidates only after official account-flow checks", "Identity, residence, product, fees and limits shown in the account"],
  },
  preSignupChecks: {
    heading: "4 checks before registration",
    items: [
      ["1", "Documented route", "Use the official Binance guide to review MXN, SPEI or the Meda route as a documented starting point."],
      ["2", "Account flow", "Check that the route appears in your current account; do not automatically transfer that evidence to OKX or another global candidate."],
      ["3", "Identity and residence", "Verify document type, country of residence, bank-account ownership, limits, timing and required account level."],
      ["4", "Available product", "Confirm that the spot product or function you need, its fees and its limits are available for this account."],
    ],
    boundary: "Banco de Mexico, CNBV and official platform guides are verification points. Binance has a public guide for reviewing MXN/SPEI/Meda, while OKX and other global candidates require confirmation inside the official account flow. Nothing here promises account approval, MXN/SPEI funding, product access or benefits.",
  },
  sourceChecks: {
    heading: "What each source proves and does not prove",
    rows: [
      ["Banco de Mexico", "What SPEI is as a payment system", "It does not confirm that a platform accepts your account or deposit."],
      ["CNBV / Fintech context", "Regulatory context for financial technology and virtual assets", "It is not user eligibility, account approval or a benefit confirmation."],
      ["Official Binance guide", "MXN/SPEI/Meda steps documented by the platform", "It must match your account, bank, limits and current screen."],
      ["OKX or other candidates", "Domain, identity, product and cost comparison in the official flow", "It does not by itself prove a local MXN/SPEI rail for Mexico."],
      ["Official account flow", "Identity, residence, product and visible fees", "This is the final verification point before registration or deposit."],
    ],
  },
  relatedLabel: "Mexico research paths",
  relatedResearch: [
    ["directory", "Review Mexico candidates", "Start with the documented Binance route and compare other candidates only through official account-flow verification."],
    ["rates", "Estimate costs before deposit", "Use published base fees, then confirm the final fee in the official account."],
    ["compare", "Compare two platforms before registering", "Check SPEI, identity, product and limits side by side."],
  ],
  questions: ["Does the official flow show MXN/SPEI or Meda for your account?", "Do the bank account and identity details match platform requirements?", "Is the spot product you need available after verification?"],
  answers: [
    "SPEI exists as a payment system, and Binance publishes an MXN/SPEI/Meda path that can be used as a documented source. Each platform decides what appears for your account, so verify the method, bank, limits and current screen before acting.",
    "Identity, residence, bank-account ownership and verification level can change the result. Use the official flow as the final confirmation point.",
    "Spot access, deposits, withdrawals, fees and promotions can vary by account. Do not treat them as guaranteed by an external source.",
  ],
  decisionLanes: [
    ["new_account", "First account", "Compare SPEI, MXN, identity, bank-account requirements and product scope before choosing a platform.", "Compare options"],
    ["another_platform", "Already use another platform", "Compare fees, deposit steps and product scope before opening another account.", "Review differences"],
    ["existing_account", "Target account already exists", "Confirm the conditions visible in your official account before depositing.", "Check conditions"],
  ],
  warning: "SPEI, MXN, identity, product access and benefits must be verified in the official account flow; this page does not promise registration, access or a bonus.",
  sources: [],
};

const MX_DECISION_PAGE_COPY = {
  comparar: {
    title: "México: comparar Binance, OKX y otros candidatos antes del registro",
    summary: "Página de comparación para México: separa ruta MXN/SPEI documentada, dominio oficial, identidad, producto y condiciones de cuenta antes de tocar cualquier CTA.",
    directAnswer: {
      heading: "Cómo comparar plataformas cripto para México sin asumir acceso MXN",
      text: "Para México, la comparación útil no empieza por elegir una marca. Empieza por separar tres pruebas: si existe una fuente pública para MXN o SPEI, si el dominio oficial muestra esa ruta para tu cuenta y si el producto que buscas aparece después de identidad y residencia. Binance tiene guía documentada para revisar MXN/SPEI/Medá; OKX u otros candidatos deben compararse por dominio, producto, coste y flujo oficial, no como prueba automática de fondeo local.",
      bullets: ["Primero: fuente pública y fecha de revisión", "Segundo: dominio oficial y pantalla de cuenta", "Tercero: producto, límites, comisiones y método de fondeo", "Cuarto: abrir solo la ruta oficial cuando la cuenta lo confirme"],
    },
    preSignupChecks: {
      heading: "Comparación de 4 pruebas antes del CTA",
      items: [
        ["1", "Ruta MXN/SPEI", "Usa Banxico para entender SPEI y la guía pública de Binance como ejemplo documentado; no traslades esa prueba a otra plataforma sin cuenta oficial."],
        ["2", "Dominio y entidad", "Abre solo el dominio oficial de cada candidato y verifica que el flujo corresponde a México, no a una página global genérica."],
        ["3", "Producto objetivo", "Confirma spot, stablecoin, retiro, depósito o el producto que necesitas dentro de la cuenta; no compares solo el logo."],
        ["4", "Siguiente paso interno", "Si todavía dudas, vuelve a costes o cuenta antes de abrir el registro; si ya tienes la cuenta, confirma condiciones visibles antes de depositar."],
      ],
      boundary: "La comparación reduce candidatos; no garantiza MXN/SPEI, aprobación, producto, comisión final, beneficio ni atribución de registro.",
    },
    relatedLabel: "Siguientes pasos de comparación para México",
    relatedResearch: [
      ["rates", "Calcular coste del candidato", "Después de comparar la ruta, estima comisión spot, spread, retiro y método de entrada antes de depositar."],
      ["directory", "Revisar cuenta y CTA", "Antes de salir hacia una plataforma, distingue enlace, código, KYC, beneficio y aprobación de cuenta."],
      ["compare-global", "Abrir comparación global Binance vs OKX", "Úsala solo como marco de producto y fuentes; México se confirma en la cuenta oficial."],
    ],
    questions: ["¿Qué plataforma tiene una ruta MXN/SPEI documentada?", "¿Qué candidato debe tratarse solo como comparación de cuenta oficial?", "¿Cuándo tiene sentido abrir el enlace de registro?"],
    answers: [
      "La fuente documentada actual permite revisar Binance MXN/SPEI/Medá; cualquier otro candidato necesita confirmación propia dentro del flujo oficial.",
      "OKX u otros candidatos globales pueden compararse por dominio, producto, coste y cuenta, pero la página pública no prueba que ofrezcan el mismo fondeo local en México.",
      "Tiene sentido abrir la ruta oficial solo después de entender método de fondeo, identidad, producto y coste. La salida del sitio no debe ser el primer paso.",
    ],
    decisionLanes: [
      ["new_account", "Primera cuenta", "Empieza por candidato con ruta local documentada y compara dominio, identidad y producto.", "Ver candidatos"],
      ["another_platform", "Ya usas otra plataforma", "Compara qué ruta cambia: fondeo, producto, coste o KYC antes de añadir otra cuenta.", "Comparar diferencias"],
      ["existing_account", "Ya tienes cuenta objetivo", "Vuelve a la pantalla oficial y confirma si MXN/SPEI aparece para tu cuenta.", "Confirmar cuenta"],
    ],
    warning: "Comparar no equivale a prometer acceso. México requiere comprobar fuente, dominio, cuenta, producto y coste antes del registro.",
  },
  costos: {
    title: "México: separar coste spot, MXN/SPEI, spread, retiro y cuenta",
    summary: "Página de costes para México: transforma una decisión de registro en una hipótesis editable de coste, con límites claros entre tarifa publicada y coste final de cuenta.",
    directAnswer: {
      heading: "Qué costes debe separar un usuario mexicano antes de depositar",
      text: "El coste real para México no es solo la comisión maker o taker. Antes del registro, separa comisión spot publicada, coste o disponibilidad del método MXN/SPEI, spread de conversión, retiro, límite, tiempo de proceso, nivel de cuenta y producto. La calculadora sirve para ordenar escenarios; la tarifa aplicable la decide la pantalla oficial de tu cuenta.",
      bullets: ["Comisión maker/taker publicada", "Coste de entrada MXN/SPEI o ruta alternativa", "Spread, retiro, límite y tiempo de proceso", "Nivel de cuenta, producto y beneficio visible en pantalla oficial"],
    },
    preSignupChecks: {
      heading: "Cálculo de 4 capas antes del depósito",
      items: [
        ["1", "Trading", "Anota maker/taker para spot o el producto elegido; no mezcles spot, futuros, Earn o Web3 como si fueran la misma tarifa."],
        ["2", "Fondeo", "Comprueba si MXN, SPEI o Medá aparecen en tu cuenta, con banco, importe, límite, comisión y tiempo visibles."],
        ["3", "Salida", "Incluye retiro, red, conversión, spread y límites porque el coste total puede cambiar al mover fondos fuera de la plataforma."],
        ["4", "Cuenta", "Revisa nivel, KYC, residencia, campaña y producto antes de tratar cualquier coste como aplicable a ti."],
      ],
      boundary: "Una estimación no sustituye la tarifa oficial ni la pantalla de cuenta. No promete ahorro, descuento, reembolso, disponibilidad de fondeo ni resultado de registro.",
    },
    relatedLabel: "Siguientes pasos de costes para México",
    relatedResearch: [
      ["directory", "Revisar candidatos con coste en mente", "Usa el shortlist después de separar trading, fondeo, retiro y cuenta."],
      ["compare", "Comparar Binance vs OKX con contexto México", "Pon la diferencia de producto junto al coste, sin asumir misma ruta MXN."],
      ["rates", "Abrir la calculadora global", "Edita el escenario, volumen y producto; confirma después la tarifa oficial."],
    ],
    questions: ["¿Qué coste se puede estimar antes del registro?", "¿Qué coste solo puede confirmar la cuenta oficial?", "¿Por qué MXN/SPEI no basta para decidir?"],
    answers: [
      "Puedes estimar comisiones publicadas y comparar hipótesis, siempre separando producto, volumen, maker/taker y método de fondeo.",
      "La cuenta oficial confirma método disponible, límite, comisión final, tiempo de proceso, retiro, campaña y cualquier beneficio aplicable.",
      "Porque SPEI es un sistema de pagos y MXN es una moneda de cuenta; ninguno demuestra por sí solo que tu plataforma, banco, cuenta y producto estén habilitados.",
    ],
    decisionLanes: [
      ["new_account", "Antes de abrir cuenta", "Calcula un escenario conservador y confirma método de entrada antes de elegir plataforma.", "Ver cálculo"],
      ["another_platform", "Comparando otra cuenta", "Compara coste total, no solo fee spot: fondeo, spread, retiro y límites.", "Comparar coste"],
      ["existing_account", "Cuenta ya creada", "Usa la pantalla oficial para confirmar tarifa real antes de depositar o operar.", "Revisar tarifa"],
    ],
    warning: "La página de costes ordena hipótesis; la cuenta oficial decide tarifa, método, límite, producto y beneficio.",
  },
  conta: {
    title: "México: cuenta, partner, código, KYC y beneficio antes del registro",
    summary: "Página de cuenta para México: distingue enlace de partner, código visible, beneficio, KYC, residencia, producto y aprobación antes de continuar al registro oficial.",
    directAnswer: {
      heading: "Qué significa una ruta de partner para una cuenta mexicana",
      text: "Un enlace de partner puede llevar al registro oficial, pero no demuestra por sí solo que el código aparezca, que un beneficio aplique, que la cuenta sea aprobada o que MXN/SPEI esté disponible. Para México, revisa dominio oficial, código cuando la plataforma lo muestre, KYC, residencia, producto, campaña, tareas, plazo y condiciones visibles antes de depositar o asumir cualquier resultado.",
      bullets: ["Partner link: ruta de registro, no promesa", "Código o beneficio: solo cuenta si la plataforma lo muestra", "KYC y residencia: filtros de aprobación", "Producto, fondeo y campaña: condiciones separadas"],
    },
    preSignupChecks: {
      heading: "Checklist de cuenta antes de salir de NexuAlpha",
      items: [
        ["1", "Dominio oficial", "Abre solo el dominio o ruta oficial registrada para el candidato; evita tratar una página de inicio genérica como atribución confirmada."],
        ["2", "Código y tareas", "Si la plataforma muestra código, tareas, campaña, plazo o requisito de depósito, guárdalo y compáralo con las condiciones visibles."],
        ["3", "KYC y residencia", "La aprobación depende de identidad, país, teléfono, banco, producto y revisión de riesgo de la plataforma."],
        ["4", "Beneficio real", "Solo considera beneficio, descuento o comisión final cuando aparece en el flujo oficial de tu cuenta."],
      ],
      boundary: "NexuAlpha no publica comisión privada ni promete que un usuario reciba beneficio. La plataforma decide aprobación, atribución, producto, fondeo y condiciones finales.",
    },
    relatedLabel: "Siguientes pasos de cuenta para México",
    relatedResearch: [
      ["compare", "Comparar antes de abrir cuenta", "Si no sabes qué plataforma conviene, vuelve a comparar MXN/SPEI, producto y dominio."],
      ["rates", "Separar coste antes de depositar", "Calcula el coste total antes de tratar una ruta de registro como decisión final."],
      ["directory", "Ver plataformas candidatas", "Abre el perfil solo cuando sepas qué condición quieres verificar."],
    ],
    questions: ["¿Un enlace de partner garantiza beneficio?", "¿Qué debe aparecer en la cuenta oficial?", "¿Qué no debe prometer NexuAlpha?"],
    answers: [
      "No. El enlace puede ser una ruta de registro, pero beneficio, código, aprobación, campaña y atribución dependen de la plataforma y de la cuenta.",
      "Debe aparecer dominio correcto, código cuando aplique, KYC, producto, método de fondeo, tareas, plazo, límite, comisión y condiciones vigentes.",
      "No debe prometer aprobación, descuento, comisión final, fondeo MXN/SPEI, producto disponible ni atribución de registro antes de la confirmación oficial.",
    ],
    decisionLanes: [
      ["new_account", "Voy a registrarme", "Antes de salir, confirma dominio, código visible, KYC, producto, fondeo y condiciones.", "Abrir checklist"],
      ["another_platform", "Estoy comparando cuentas", "Distingue cuenta nueva, cuenta existente y plataforma alternativa antes del CTA.", "Comparar cuenta"],
      ["existing_account", "Ya tengo la cuenta", "Vuelve a tu pantalla oficial para verificar beneficio, método, tarifa y producto actual.", "Verificar cuenta"],
    ],
    warning: "Cuenta, partner, código, beneficio y aprobación son cosas diferentes. La conversión sana ocurre cuando el usuario entiende esa diferencia antes de salir.",
  },
};

const MX_DECISION_PAGE_COPY_EN = {
  comparar: {
    title: "Mexico: compare Binance, OKX and other candidates before registration",
    summary: "A Mexico comparison page that separates the documented MXN/SPEI route, official domain, identity checks, product scope and account conditions before any CTA.",
    directAnswer: {
      heading: "How to compare crypto platforms for Mexico without assuming MXN access",
      text: "The useful Mexico comparison does not start with a brand. It starts with three proofs: whether there is a public source for MXN or SPEI, whether the official domain shows that route for your account, and whether the product you need appears after identity and residence checks. Binance has documented guidance for reviewing MXN/SPEI/Meda; OKX and other candidates should be compared by domain, product, cost and official flow, not treated as automatic proof of local funding.",
      bullets: ["First: public source and review date", "Second: official domain and account screen", "Third: product, limits, fees and funding method", "Fourth: open only the official route once the account confirms it"],
    },
    preSignupChecks: {
      heading: "4 comparison checks before the CTA",
      items: [
        ["1", "MXN/SPEI route", "Use Banxico to understand SPEI and the public Binance guide as the documented example; do not apply that evidence to another platform without its own official account flow."],
        ["2", "Domain and entity", "Open only each candidate's official domain and verify that the flow corresponds to Mexico, not a generic global page."],
        ["3", "Target product", "Confirm spot, stablecoin, withdrawal, deposit or the product you need inside the account; do not compare only the logo."],
        ["4", "Internal next step", "If you are still unsure, return to costs or account checks before registration; if you already have the account, confirm visible terms before deposit."],
      ],
      boundary: "Comparison narrows candidates; it does not guarantee MXN/SPEI, approval, product access, final fee, benefits or registration attribution.",
    },
    relatedLabel: "Next Mexico comparison steps",
    relatedResearch: [
      ["rates", "Calculate candidate cost", "After comparing the route, estimate spot fee, spread, withdrawal and entry method before depositing."],
      ["directory", "Review account and CTA conditions", "Before leaving for a platform, separate link, code, KYC, benefit and account approval."],
      ["compare-global", "Open the global Binance vs OKX comparison", "Use it only as a product and source framework; Mexico must be confirmed in the official account."],
    ],
    questions: ["Which platform has a documented MXN/SPEI route?", "Which candidate should be treated only as an official-account comparison?", "When does it make sense to open the registration link?"],
    answers: [
      "The current documented source lets you review Binance MXN/SPEI/Meda; any other candidate needs its own confirmation inside the official flow.",
      "OKX and other global candidates can be compared by domain, product, cost and account flow, but the public page does not prove that they offer the same local funding route in Mexico.",
      "It makes sense to open the official route only after you understand funding method, identity, product and cost. Leaving the site should not be the first step.",
    ],
    decisionLanes: [
      ["new_account", "First account", "Start with the candidate that has a documented local route, then compare domain, identity and product scope.", "View candidates"],
      ["another_platform", "Already use another platform", "Compare what changes: funding, product, cost or KYC before adding another account.", "Compare differences"],
      ["existing_account", "Target account already exists", "Return to the official screen and confirm whether MXN/SPEI appears for your account.", "Confirm account"],
    ],
    warning: "Comparison is not an access promise. Mexico requires checking source, domain, account, product and cost before registration.",
  },
  costos: {
    title: "Mexico: separate spot fee, MXN/SPEI, spread, withdrawal and account conditions",
    summary: "A Mexico cost page that turns a registration decision into an editable cost hypothesis, with clear limits between published fees and final account costs.",
    directAnswer: {
      heading: "Which costs a Mexico user should separate before depositing",
      text: "The real Mexico cost is not only the maker or taker fee. Before registration, separate published spot fee, cost or availability of the MXN/SPEI method, conversion spread, withdrawal, limits, processing time, account level and product. The calculator helps organize scenarios; the applicable fee is decided by the official account screen.",
      bullets: ["Published maker/taker fee", "MXN/SPEI entry cost or alternative route", "Spread, withdrawal, limits and processing time", "Account level, product and benefit visible in the official screen"],
    },
    preSignupChecks: {
      heading: "4 cost layers before deposit",
      items: [
        ["1", "Trading", "Record maker/taker for spot or the chosen product; do not mix spot, futures, Earn or Web3 as if they were one fee."],
        ["2", "Funding", "Check whether MXN, SPEI or Meda appears in your account, with bank, amount, limit, fee and timing visible."],
        ["3", "Exit", "Include withdrawal, network, conversion, spread and limits because total cost can change when funds leave the platform."],
        ["4", "Account", "Review level, KYC, residence, campaign and product before treating any cost as applicable to you."],
      ],
      boundary: "An estimate does not replace the official fee or account screen. It does not promise savings, discounts, rebates, funding availability or registration outcome.",
    },
    relatedLabel: "Next Mexico cost steps",
    relatedResearch: [
      ["directory", "Review candidates with cost in mind", "Use the shortlist after separating trading, funding, withdrawal and account conditions."],
      ["compare", "Compare Binance vs OKX with Mexico context", "Place product differences next to cost without assuming the same MXN route."],
      ["rates", "Open the global calculator", "Edit scenario, volume and product; confirm the official fee afterward."],
    ],
    questions: ["Which cost can be estimated before registration?", "Which cost can only be confirmed by the official account?", "Why is MXN/SPEI not enough to decide?"],
    answers: [
      "You can estimate published fees and compare hypotheses while separating product, volume, maker/taker role and funding method.",
      "The official account confirms available method, limit, final fee, processing time, withdrawal, campaign and any applicable benefit.",
      "Because SPEI is a payment system and MXN is an account currency; neither proves that your platform, bank, account and product are enabled.",
    ],
    decisionLanes: [
      ["new_account", "Before opening an account", "Calculate a conservative scenario and confirm the entry method before choosing a platform.", "View calculation"],
      ["another_platform", "Comparing another account", "Compare total cost, not only spot fee: funding, spread, withdrawal and limits.", "Compare cost"],
      ["existing_account", "Account already created", "Use the official screen to confirm the real fee before depositing or trading.", "Review fee"],
    ],
    warning: "The cost page organizes hypotheses; the official account decides fee, method, limit, product and benefit.",
  },
  conta: {
    title: "Mexico: account, partner route, code, KYC and benefit before registration",
    summary: "A Mexico account page that separates partner link, visible code, benefit, KYC, residence, product and approval before continuing to official registration.",
    directAnswer: {
      heading: "What a partner route means for a Mexico account",
      text: "A partner link can lead to official registration, but by itself it does not prove that a code appears, that a benefit applies, that the account is approved or that MXN/SPEI is available. For Mexico, review the official domain, the code when the platform displays one, KYC, residence, product, campaign, tasks, deadline and visible conditions before depositing or assuming any outcome.",
      bullets: ["Partner link: registration route, not a promise", "Code or benefit: count it only when the platform displays it", "KYC and residence: approval filters", "Product, funding and campaign: separate conditions"],
    },
    preSignupChecks: {
      heading: "Account checklist before leaving NexuAlpha",
      items: [
        ["1", "Official domain", "Open only the official domain or registered route for the candidate; do not treat a generic homepage as attribution confirmation."],
        ["2", "Code and tasks", "If the platform displays code, tasks, campaign, deadline or deposit requirement, keep that evidence and compare it with visible conditions."],
        ["3", "KYC and residence", "Approval depends on identity, country, phone, bank, product and the platform's risk review."],
        ["4", "Real benefit", "Treat benefit, discount or final fee as real only when it appears in the official account flow."],
      ],
      boundary: "NexuAlpha does not publish its commercial terms and does not promise that a user will receive a benefit. The platform decides approval, attribution, product, funding and final conditions.",
    },
    relatedLabel: "Next Mexico account steps",
    relatedResearch: [
      ["compare", "Compare before opening an account", "If you do not know which platform fits, return to MXN/SPEI, product and domain comparison."],
      ["rates", "Separate cost before deposit", "Calculate total cost before treating a registration route as the final decision."],
      ["directory", "View candidate platforms", "Open a profile only when you know which condition you want to verify."],
    ],
    questions: ["Does a partner link guarantee a benefit?", "What should appear in the official account?", "What should NexuAlpha not promise?"],
    answers: [
      "No. The link can be a registration route, but benefit, code, approval, campaign and attribution depend on the platform and the account.",
      "The correct domain, code when applicable, KYC, product, funding method, tasks, deadline, limit, fee and current conditions should appear.",
      "It should not promise approval, discount, final fee, MXN/SPEI funding, available product or registration attribution before official confirmation.",
    ],
    decisionLanes: [
      ["new_account", "I plan to register", "Before leaving, confirm domain, visible code, KYC, product, funding and conditions.", "Open checklist"],
      ["another_platform", "I am comparing accounts", "Separate new account, existing account and alternative platform before the CTA.", "Compare account"],
      ["existing_account", "I already have the account", "Return to your official screen to verify current benefit, method, fee and product.", "Verify account"],
    ],
    warning: "Account, partner route, code, benefit and approval are different things. Healthy conversion happens when the user understands that difference before leaving.",
  },
};

const UI_COPY = {
  en: { payment: "Payment path", accountCurrency: "Account currency", kyc: "KYC", offer: "Offer state", conditional: "Conditional", researchBoundary: "Research prompt; verify the outcome in the official account flow.", openDirectory: "Open global directory", questions: "What this research path covers", viewQuestions: "View the three research questions", hideQuestions: "Hide research questions", accountStage: "Choose your account stage", viewAccountStages: "View other account stages", hideAccountStages: "Hide other account stages", sourceStatus: "Source status", sourcePending: "Source pack pending", pendingNote: "When the source pack is pending, this page remains a research guide and does not promise eligibility or benefits.", officialSources: "Official sources" },
  id: { payment: "Jalur pembayaran", accountCurrency: "Mata uang akun", kyc: "KYC", offer: "Status penawaran", conditional: "Bersyarat", researchBoundary: "Pertanyaan riset; verifikasi hasilnya di alur akun resmi.", openDirectory: "Buka direktori global", questions: "Apa yang dicakup jalur riset ini", viewQuestions: "Lihat tiga pertanyaan riset", hideQuestions: "Sembunyikan pertanyaan riset", accountStage: "Pilih tahap akun", viewAccountStages: "Lihat tahap akun lain", hideAccountStages: "Sembunyikan tahap akun lain", sourceStatus: "Status sumber", sourcePending: "Paket sumber tertunda", pendingNote: "Saat paket sumber tertunda, halaman ini hanya panduan riset dan tidak menjanjikan kelayakan atau manfaat.", officialSources: "Sumber resmi" },
  "zh-Hans": { payment: "入金路径", accountCurrency: "账户货币", kyc: "KYC", offer: "优惠状态", conditional: "条件式", researchBoundary: "研究提示；请在官方账户流程中确认结果。", openDirectory: "打开全球平台目录", questions: "这条研究路径覆盖什么", viewQuestions: "查看三条研究问题", hideQuestions: "收起研究问题", accountStage: "选择账户阶段", viewAccountStages: "查看其他账户阶段", hideAccountStages: "收起其他账户阶段", sourceStatus: "来源状态", sourcePending: "来源包待补充", pendingNote: "来源包待补充时，本页面只提供研究指引，不承诺资格或优惠。", officialSources: "官方来源" },
  "zh-Hant": { payment: "入金路徑", accountCurrency: "帳戶貨幣", kyc: "KYC", offer: "優惠狀態", conditional: "條件式", researchBoundary: "研究提示；請在官方帳戶流程中確認結果。", openDirectory: "開啟全球平台目錄", questions: "這條研究路徑涵蓋什麼", viewQuestions: "查看三條研究問題", hideQuestions: "收起研究問題", accountStage: "選擇帳戶階段", viewAccountStages: "查看其他帳戶階段", hideAccountStages: "收起其他帳戶階段", sourceStatus: "來源狀態", sourcePending: "來源包待補充", pendingNote: "來源包待補充時，本頁面只提供研究指引，不承諾資格或優惠。", officialSources: "官方來源" },
  es: { payment: "Ruta de pago", accountCurrency: "Moneda de la cuenta", kyc: "KYC", offer: "Estado de la oferta", conditional: "Condicional", researchBoundary: "Pregunta de investigación; confirma el resultado en el flujo oficial de la cuenta.", openDirectory: "Abrir el directorio global", questions: "Qué cubre esta ruta de investigación", viewQuestions: "Ver las tres preguntas de investigación", hideQuestions: "Ocultar preguntas de investigación", accountStage: "Elige la etapa de tu cuenta", viewAccountStages: "Ver otras etapas de cuenta", hideAccountStages: "Ocultar otras etapas de cuenta", sourceStatus: "Estado de las fuentes", sourcePending: "Paquete de fuentes pendiente", pendingNote: "Mientras el paquete de fuentes esté pendiente, esta página es solo una guía de investigación y no promete elegibilidad ni beneficios.", officialSources: "Fuentes oficiales" },
  "pt-BR": { payment: "Rota de pagamento", accountCurrency: "Moeda da conta", kyc: "KYC", offer: "Status da oferta", conditional: "Condicional", researchBoundary: "Pergunta de pesquisa; confirme o resultado no fluxo oficial da conta.", openDirectory: "Abrir diretório global", questions: "O que esta rota de pesquisa cobre", viewQuestions: "Ver as três perguntas de pesquisa", hideQuestions: "Ocultar perguntas de pesquisa", accountStage: "Escolha a etapa da sua conta", sourceStatus: "Status das fontes", sourcePending: "Pacote de fontes pendente", pendingNote: "Enquanto o pacote de fontes estiver pendente, esta página é apenas um guia de pesquisa e não promete elegibilidade ou benefícios.", officialSources: "Fontes oficiais" },
  fr: { payment: "Parcours de paiement", accountCurrency: "Devise du compte", kyc: "KYC", offer: "État de l'offre", conditional: "Conditionnel", researchBoundary: "Question de recherche ; vérifiez le résultat dans le parcours officiel du compte.", openDirectory: "Ouvrir l'annuaire mondial", questions: "Ce que couvre ce parcours", viewQuestions: "Voir les trois questions", hideQuestions: "Masquer les questions", accountStage: "Choisissez l'étape de votre compte", sourceStatus: "État des sources", sourcePending: "Sources en attente", pendingNote: "Tant que les sources sont en attente, cette page reste un guide de recherche et ne promet ni éligibilité ni avantage.", officialSources: "Sources officielles" },
  de: { payment: "Zahlungsweg", accountCurrency: "Kontowährung", kyc: "KYC", offer: "Angebotsstatus", conditional: "Bedingt", researchBoundary: "Recherchehinweis; prüfen Sie das Ergebnis im offiziellen Kontoprozess.", openDirectory: "Globales Verzeichnis öffnen", questions: "Was dieser Recherchepfad abdeckt", viewQuestions: "Drei Recherchefragen anzeigen", hideQuestions: "Recherchefragen ausblenden", accountStage: "Wählen Sie Ihre Kontophase", sourceStatus: "Quellenstatus", sourcePending: "Quellenpaket ausstehend", pendingNote: "Solange Quellen fehlen, ist diese Seite nur ein Rechercheleitfaden und verspricht keine Eignung oder Vorteile.", officialSources: "Offizielle Quellen" },
  ja: { payment: "入金経路", accountCurrency: "口座通貨", kyc: "KYC", offer: "オファー状態", conditional: "条件付き", researchBoundary: "調査案内。最終結果は公式アカウントの手続きで確認してください。", openDirectory: "グローバル一覧を開く", questions: "この調査経路で確認できること", viewQuestions: "3つの調査質問を見る", hideQuestions: "調査質問を閉じる", accountStage: "アカウント段階を選択", viewAccountStages: "他の口座段階を見る", hideAccountStages: "他の口座段階を閉じる", sourceStatus: "情報源の状態", sourcePending: "情報源パック保留中", pendingNote: "情報源パックが保留中の間、このページは調査案内のみで、利用資格や特典を保証しません。", officialSources: "公式情報源" },
  ko: { payment: "결제 경로", accountCurrency: "계정 통화", kyc: "KYC", offer: "오퍼 상태", conditional: "조건부", researchBoundary: "리서치 안내입니다. 최종 결과는 공식 계정 절차에서 확인하세요.", openDirectory: "글로벌 디렉터리 열기", questions: "이 리서치 경로에서 확인하는 내용", viewQuestions: "세 가지 리서치 질문 보기", hideQuestions: "리서치 질문 숨기기", accountStage: "계정 단계를 선택하세요", viewAccountStages: "다른 계정 단계 보기", hideAccountStages: "다른 계정 단계 숨기기", sourceStatus: "출처 상태", sourcePending: "출처 패키지 보류", pendingNote: "출처 패키지가 보류 중인 동안 이 페이지는 리서치 안내만 제공하며 자격이나 혜택을 보장하지 않습니다.", officialSources: "공식 출처" },
  ru: { payment: "Способ пополнения", accountCurrency: "Валюта счёта", kyc: "KYC", offer: "Статус предложения", conditional: "Условно", researchBoundary: "Исследовательская подсказка; проверьте результат в официальном процессе аккаунта.", openDirectory: "Открыть глобальный каталог", questions: "Что покрывает этот путь исследования", viewQuestions: "Показать три вопроса", hideQuestions: "Скрыть вопросы", accountStage: "Выберите этап аккаунта", sourceStatus: "Статус источников", sourcePending: "Пакет источников ожидает проверки", pendingNote: "Пока пакет источников ожидает проверки, страница остаётся исследовательским справочником и не обещает доступ или преимущества.", officialSources: "Официальные источники" },
  tr: { payment: "Ödeme yolu", accountCurrency: "Hesap para birimi", kyc: "KYC", offer: "Teklif durumu", conditional: "Koşullu", researchBoundary: "Araştırma notu; sonucu resmi hesap akışında doğrulayın.", openDirectory: "Global dizini aç", questions: "Bu araştırma yolu neleri kapsıyor", viewQuestions: "Üç araştırma sorusunu göster", hideQuestions: "Araştırma sorularını gizle", accountStage: "Hesap aşamanızı seçin", viewAccountStages: "Diğer hesap aşamalarını göster", hideAccountStages: "Diğer hesap aşamalarını gizle", sourceStatus: "Kaynak durumu", sourcePending: "Kaynak paketi beklemede", pendingNote: "Kaynak paketi beklemedeyken bu sayfa yalnızca araştırma rehberidir; uygunluk veya avantaj garantisi vermez.", officialSources: "Resmi kaynaklar" },
  vi: { payment: "Phương thức nạp tiền", accountCurrency: "Đơn vị tiền tệ tài khoản", kyc: "KYC", offer: "Trạng thái ưu đãi", conditional: "Có điều kiện", researchBoundary: "Gợi ý nghiên cứu; hãy xác minh kết quả trong quy trình tài khoản chính thức.", openDirectory: "Mở danh mục toàn cầu", questions: "Lộ trình nghiên cứu này bao quát gì", viewQuestions: "Xem ba câu hỏi nghiên cứu", hideQuestions: "Ẩn câu hỏi nghiên cứu", accountStage: "Chọn giai đoạn tài khoản", sourceStatus: "Trạng thái nguồn", sourcePending: "Gói nguồn đang chờ", pendingNote: "Khi gói nguồn đang chờ, trang này chỉ là hướng dẫn nghiên cứu và không cam kết đủ điều kiện hay lợi ích.", officialSources: "Nguồn chính thức" },
  it: { payment: "Percorso di pagamento", accountCurrency: "Valuta del conto", kyc: "KYC", offer: "Stato dell'offerta", conditional: "Condizionale", researchBoundary: "Nota di ricerca; verifica il risultato nel flusso ufficiale dell'account.", openDirectory: "Apri la directory globale", questions: "Cosa copre questo percorso di ricerca", viewQuestions: "Vedi le tre domande", hideQuestions: "Nascondi le domande", accountStage: "Scegli la fase del tuo account", sourceStatus: "Stato delle fonti", sourcePending: "Pacchetto fonti in attesa", pendingNote: "Finché il pacchetto fonti è in attesa, questa pagina resta una guida di ricerca e non promette idoneità o vantaggi.", officialSources: "Fonti ufficiali" },
  ar: { payment: "مسار الإيداع", accountCurrency: "عملة الحساب", kyc: "اعرف عميلك", offer: "حالة العرض", conditional: "مشروط", researchBoundary: "إرشاد بحثي؛ تحقق من النتيجة في مسار الحساب الرسمي.", openDirectory: "فتح الدليل العالمي", questions: "ما الذي يغطيه مسار البحث هذا", viewQuestions: "عرض أسئلة البحث الثلاثة", hideQuestions: "إخفاء أسئلة البحث", accountStage: "اختر مرحلة حسابك", sourceStatus: "حالة المصادر", sourcePending: "حزمة المصادر قيد الانتظار", pendingNote: "ما دامت حزمة المصادر قيد الانتظار، تظل هذه الصفحة دليلاً بحثياً ولا تضمن الأهلية أو المزايا.", officialSources: "المصادر الرسمية" },
};

const REGIONAL_LABELS = {
  es: { path: "ruta de investigación", recorded: "Registrado en la política; la cuenta manda", verify: "Verificar en la cuenta oficial", required: "Requerido", unset: "No configurado", residence: "La residencia y la elegibilidad deben coincidir", rules: "Consultar las reglas de la plataforma", conditional: "Condicional", noBenefit: "No se promete un beneficio fijo", continue: "Continuar la investigación", rates: "Comparar tarifas", compare: "Comparar dos plataformas", telegram: "Continuar en Telegram" },
  "pt-BR": { path: "rota de pesquisa", recorded: "Registrado na política; a conta é definitiva", verify: "Verifique na conta oficial", required: "Obrigatório", unset: "Não configurado", residence: "Residência e elegibilidade da conta devem coincidir", rules: "Consulte as regras da plataforma", conditional: "Condicional", noBenefit: "Nenhum benefício fixo é prometido", continue: "Continuar pesquisa", rates: "Comparar taxas", compare: "Comparar duas plataformas", telegram: "Continuar no Telegram" },
  fr: { path: "parcours de recherche", recorded: "Enregistré dans la politique ; le compte fait foi", verify: "Vérifier dans le compte officiel", required: "Requis", unset: "Non défini", residence: "La résidence et l’éligibilité doivent correspondre", rules: "Vérifier les règles de la plateforme", conditional: "Conditionnel", noBenefit: "Aucun avantage fixe promis", continue: "Poursuivre la recherche", rates: "Comparer les frais", compare: "Comparer deux plateformes", telegram: "Continuer sur Telegram" },
  de: { path: "Recherchepfad", recorded: "In der Richtlinie erfasst; das Konto ist maßgeblich", verify: "Im offiziellen Konto prüfen", required: "Erforderlich", unset: "Nicht festgelegt", residence: "Wohnsitz und Kontoberechtigung müssen übereinstimmen", rules: "Plattformregeln prüfen", conditional: "Bedingt", noBenefit: "Kein fester Vorteil versprochen", continue: "Recherche fortsetzen", rates: "Gebühren vergleichen", compare: "Zwei Plattformen vergleichen", telegram: "Auf Telegram fortsetzen" },
  ru: { path: "исследовательский маршрут", recorded: "Указано в правилах; окончательно проверяйте аккаунт", verify: "Проверить в официальном аккаунте", required: "Требуется", unset: "Не задано", residence: "Резиденция и доступ аккаунта должны совпадать", rules: "Проверить правила площадки", conditional: "Условно", noBenefit: "Фиксированное преимущество не обещается", continue: "Продолжить исследование", rates: "Сравнить комиссии", compare: "Сравнить две площадки", telegram: "Продолжить в Telegram" },
  ja: { path: "調査経路", recorded: "記録済み。最終確認はアカウント内で行ってください", verify: "公式アカウントで確認", required: "必須", unset: "未設定", residence: "居住地とアカウント資格を照合してください", rules: "公式ルールを確認", conditional: "条件付き", noBenefit: "固定特典は保証しません", continue: "調査を続ける", rates: "手数料を比較", compare: "2つのサービスを比較", telegram: "Telegramで続ける" },
  ko: { path: "리서치 경로", recorded: "정책에 기록됨; 최종 확인은 계정에서", verify: "공식 계정에서 확인", required: "필수", unset: "미설정", residence: "거주지와 계정 자격을 확인하세요", rules: "플랫폼 규칙 확인", conditional: "조건부", noBenefit: "고정 혜택을 보장하지 않습니다", continue: "리서치 계속", rates: "수수료 비교", compare: "두 플랫폼 비교", telegram: "Telegram에서 계속" },
  tr: { path: "araştırma yolu", recorded: "Politikada kayıtlı; son karar hesapta", verify: "Resmî hesapta doğrula", required: "Gerekli", unset: "Ayarlanmadı", residence: "İkamet ve hesap uygunluğu eşleşmeli", rules: "Platform kurallarını kontrol edin", conditional: "Koşullu", noBenefit: "Sabit avantaj vaat edilmez", continue: "Araştırmaya devam et", rates: "Ücretleri karşılaştır", compare: "İki platformu karşılaştır", telegram: "Telegram'da devam et" },
  id: { path: "jalur riset", recorded: "Tercatat dalam kebijakan; akun resmi menjadi acuan akhir", verify: "Verifikasi di akun resmi", required: "Wajib", unset: "Belum diatur", residence: "Domisili harus sesuai dengan kelayakan akun", rules: "Periksa aturan platform", conditional: "Bersyarat", noBenefit: "Tidak ada manfaat tetap yang dijanjikan", continue: "Lanjutkan riset", rates: "Bandingkan biaya", compare: "Bandingkan dua platform", telegram: "Lanjut di Telegram" },
  ar: { path: "مسار بحث", recorded: "مسجل في السياسة؛ الحساب الرسمي هو المرجع النهائي", verify: "تحقق في الحساب الرسمي", required: "مطلوب", unset: "غير محدد", residence: "يجب أن تتطابق الإقامة مع أهلية الحساب", rules: "تحقق من قواعد المنصة", conditional: "مشروط", noBenefit: "لا يوجد وعد بميزة ثابتة", continue: "متابعة البحث", rates: "مقارنة الرسوم", compare: "مقارنة منصتين", telegram: "المتابعة في Telegram" },
  vi: { path: "lộ trình nghiên cứu", recorded: "Đã ghi trong chính sách; tài khoản chính thức là quyết định cuối", verify: "Xác minh trong tài khoản chính thức", required: "Bắt buộc", unset: "Chưa thiết lập", residence: "Nơi cư trú phải phù hợp với điều kiện tài khoản", rules: "Kiểm tra quy định nền tảng", conditional: "Có điều kiện", noBenefit: "Không cam kết lợi ích cố định", continue: "Tiếp tục nghiên cứu", rates: "So sánh phí", compare: "So sánh hai nền tảng", telegram: "Tiếp tục trên Telegram" },
  it: { path: "percorso di ricerca", recorded: "Registrato nella policy; fa fede il conto ufficiale", verify: "Verifica nell’account ufficiale", required: "Richiesto", unset: "Non impostato", residence: "La residenza deve corrispondere ai requisiti dell’account", rules: "Controlla le regole della piattaforma", conditional: "Condizionale", noBenefit: "Nessun vantaggio fisso garantito", continue: "Continua la ricerca", rates: "Confronta le commissioni", compare: "Confronta due piattaforme", telegram: "Continua su Telegram" },
};

const INTERNATIONAL_ROUTE_CARDS = [
  {
    id: "sg",
    title: "Singapore",
    label: "Source-backed MAS and SGD route",
    description: "Use the Singapore page when the account, service entity, SGD funding and product scope need a local official-source check.",
    href: "/sg",
  },
  {
    id: "hk",
    title: "Hong Kong",
    label: "Source-backed SFC and HKD route",
    description: "Use the Hong Kong page to check SFC platform status, HKD bank funding, identity, address and product scope before opening an account route.",
    href: "/hk",
    locale: "en",
  },
  {
    id: "jp",
    title: "Japan",
    label: "Indexed FSA and JPY route",
    description: "Use the Japan page when identity checks, JPY funding and registered-provider context are part of the decision.",
    href: "/jp?locale=ja",
  },
  {
    id: "kr",
    title: "대한민국",
    label: "금융위원회·원화 계정 확인 경로",
    description: "본인확인, 실명확인 계좌, 원화 입출금과 상품 범위를 공식 자료와 계정 화면에서 나누어 확인합니다.",
    href: "/kr",
    locale: "ko",
  },
  {
    id: "uk",
    title: "United Kingdom",
    label: "FCA and GBP research path",
    description: "Use the UK research path when residency, GBP funding and product scope need to be checked in the official account flow.",
    href: "/uk",
  },
  {
    id: "eu",
    title: "European Union",
    label: "MiCA, EUR and SEPA research path",
    description: "Use the EU path when country, service entity, EUR or SEPA funding and product availability must be separated.",
    href: "/eu",
  },
  {
    id: "br",
    title: "Brazil",
    label: "Deep BRL and Pix checklist",
    description: "Use the Brazil guide for Portuguese Pix, BRL, CPF, KYC and cost checks before opening a spot account.",
    href: "/br",
  },
  {
    id: "tr",
    title: "Türkiye",
    label: "Source-backed SPK and TRY route",
    description: "Use the Türkiye page when SPK list context, TRY funding, identity checks and account product scope need a Turkish-source review.",
    href: "/markets/turkiye",
    locale: "tr",
  },
];

const INTERNATIONAL_ROUTE_CARD_COPY = {
  ja: {
    heading: "最も近い確認済みルートを選ぶ",
    intro: "現地の情報源がある国や入金ルートから確認を始めます。対象国がない場合は市場を未設定のままにし、公式アカウント条件が明確になるまでグローバル一覧を使ってください。",
    fallbackLabel: "米国または未掲載の国",
    fallbackTitle: "まずグローバル一覧を使う",
    fallbackDescription: "居住地、商品、口座段階を決めてから比較します。国別の質問を根拠のない登録約束に変えないためです。",
    cards: {
      sg: ["MAS と SGD の情報源付きルート", "シンガポールの口座、サービス主体、SGD 入金、商品範囲を公式情報源で確認する時に使います。"],
      hk: ["SFC と HKD の情報源付きルート", "香港で SFC 状態、HKD 銀行入金、本人確認、住所、商品範囲を開設前に確認します。"],
      jp: ["FSA と JPY の公開ルート", "本人確認、JPY 入金、登録業者の文脈が判断材料になる場合に日本ページを使います。"],
      kr: ["FSC と KRW 口座の確認ルート", "本人確認、実名口座、KRW 入出金、商品範囲を公式情報源と口座画面で分けて確認します。"],
      uk: ["FCA と GBP の調査ルート", "英国居住、GBP 入金、商品範囲を公式アカウント手続きで確認する時に使います。"],
      eu: ["MiCA、EUR、SEPA の調査ルート", "国、サービス主体、EUR/SEPA 入金、商品可否を分けて確認する時に使います。"],
      br: ["BRL と Pix の深い確認リスト", "ブラジルの Pix、BRL、CPF、本人確認、費用を現物口座開設前に確認します。"],
      tr: ["SPK と TRY の情報源付きルート", "SPK リスト、TRY 入金、本人確認、商品範囲をトルコの情報源で確認する時に使います。"],
    },
  },
  ko: {
    heading: "가장 가까운 검증 경로 선택",
    intro: "현지 출처가 있는 국가나 입금 경로부터 확인하세요. 국가가 없으면 시장을 미설정으로 두고 공식 계정 조건이 확인될 때까지 글로벌 디렉터리를 사용합니다.",
    fallbackLabel: "미국 또는 목록에 없는 국가",
    fallbackTitle: "먼저 글로벌 디렉터리 사용",
    fallbackDescription: "거주지, 상품, 계정 단계를 정한 뒤 비교합니다. 국가 질문이 근거 없는 가입 약속으로 바뀌지 않게 하기 위해서입니다.",
    cards: {
      sg: ["MAS 및 SGD 출처 기반 경로", "싱가포르 계정, 서비스 법인, SGD 입금, 상품 범위를 공식 출처로 확인할 때 사용합니다."],
      hk: ["SFC 및 HKD 출처 기반 경로", "홍콩 SFC 상태, HKD 은행 입금, 본인확인, 주소, 상품 범위를 계정 개설 전에 확인합니다."],
      jp: ["FSA 및 JPY 공개 경로", "본인확인, JPY 입금, 등록 사업자 맥락이 결정에 필요한 경우 일본 페이지를 사용합니다."],
      kr: ["FSC 및 KRW 계정 확인 경로", "본인확인, 실명계좌, KRW 입출금, 상품 범위를 공식 출처와 계정 화면에서 나누어 확인합니다."],
      uk: ["FCA 및 GBP 리서치 경로", "영국 거주, GBP 입금, 상품 범위를 공식 계정 절차에서 확인할 때 사용합니다."],
      eu: ["MiCA, EUR, SEPA 리서치 경로", "국가, 서비스 법인, EUR 또는 SEPA 입금, 상품 이용 가능 여부를 분리해 확인합니다."],
      br: ["BRL 및 Pix 심층 체크리스트", "브라질 Pix, BRL, CPF, 본인확인, 비용을 현물 계정 개설 전에 확인합니다."],
      tr: ["SPK 및 TRY 출처 기반 경로", "SPK 목록, TRY 입금, 본인확인, 계정 상품 범위를 터키 출처로 검토할 때 사용합니다."],
    },
  },
  tr: {
    heading: "En yakın doğrulanmış yolu seçin",
    intro: "Yerel kaynak bağlamı olan ülke veya fonlama yolundan başlayın. Ülkeniz listede yoksa pazarı boş bırakın ve resmi hesap koşulları netleşene kadar global dizini kullanın.",
    fallbackLabel: "ABD veya listede olmayan ülke",
    fallbackTitle: "Önce global dizini kullanın",
    fallbackDescription: "Platformları karşılaştırmadan önce ikamet, ürün ve hesap aşamasını belirleyin. Bu, ülke sorusunu desteksiz bir kayıt vaadine dönüştürmez.",
    cards: {
      sg: ["MAS ve SGD kaynaklı rota", "Singapur hesabı, hizmet tüzel kişisi, SGD fonlama ve ürün kapsamı için yerel resmi kaynak kontrolü gerektiğinde kullanın."],
      hk: ["SFC ve HKD kaynaklı rota", "Hesap açmadan önce SFC platform durumu, HKD banka fonlaması, kimlik, adres ve ürün kapsamını kontrol edin."],
      jp: ["FSA ve JPY indeksli rota", "Kimlik kontrolleri, JPY fonlama ve kayıtlı sağlayıcı bağlamı kararın parçası olduğunda Japonya sayfasını kullanın."],
      kr: ["FSC ve KRW hesap rotası", "Kimlik, gerçek isimli banka hesabı, KRW yatırma/çekme ve ürün kapsamını resmi kaynaklar ve hesap ekranıyla ayırın."],
      uk: ["FCA ve GBP araştırma yolu", "İkamet, GBP fonlama ve ürün kapsamı resmi hesap akışında kontrol edilecekse kullanın."],
      eu: ["MiCA, EUR ve SEPA araştırma yolu", "Ülke, hizmet tüzel kişisi, EUR veya SEPA fonlama ve ürün erişimi ayrıştırılacaksa kullanın."],
      br: ["BRL ve Pix derin kontrol listesi", "Brezilya rehberini Pix, BRL, CPF, KYC ve maliyet kontrolleri için kullanın."],
      tr: ["SPK ve TRY kaynaklı rota", "SPK liste bağlamı, TRY fonlama, kimlik kontrolleri ve hesap ürün kapsamı Türkçe kaynaklarla incelenecekse kullanın."],
    },
  },
  ar: {
    heading: "اختر أقرب مسار موثق",
    intro: "ابدأ من بلد أو مسار تمويل لديه سياق مصادر محلية. إذا لم يكن بلدك مدرجاً، أبق السوق غير محدد واستخدم الدليل العالمي حتى تتضح شروط الحساب الرسمية.",
    fallbackLabel: "الولايات المتحدة أو بلد غير مدرج",
    fallbackTitle: "استخدم الدليل العالمي أولاً",
    fallbackDescription: "حدد الإقامة والمنتج ومرحلة الحساب قبل مقارنة المنصات. هذا يمنع تحويل سؤال البلد إلى وعد تسجيل غير مدعوم.",
    cards: {
      sg: ["مسار MAS وSGD موثق بالمصادر", "استخدم صفحة سنغافورة عندما تحتاج إلى فحص محلي لمصدر رسمي حول الحساب والكيان الخدمي وتمويل SGD ونطاق المنتج."],
      hk: ["مسار SFC وHKD موثق بالمصادر", "استخدم صفحة هونغ كونغ لفحص حالة المنصة لدى SFC وتمويل HKD البنكي والهوية والعنوان ونطاق المنتج قبل فتح مسار الحساب."],
      jp: ["مسار FSA وJPY مفهرس", "استخدم صفحة اليابان عندما تكون الهوية وتمويل JPY وسياق مزود الخدمة المسجل جزءاً من القرار."],
      kr: ["مسار FSC وحساب KRW", "افصل بين التحقق من الهوية والحساب البنكي بالاسم الحقيقي وإيداع/سحب KRW ونطاق المنتج عبر المصادر الرسمية وشاشة الحساب."],
      uk: ["مسار FCA وGBP البحثي", "استخدم مسار المملكة المتحدة عندما يجب فحص الإقامة وتمويل GBP ونطاق المنتج داخل مسار الحساب الرسمي."],
      eu: ["مسار MiCA وEUR وSEPA البحثي", "استخدم مسار الاتحاد الأوروبي عندما يجب فصل الدولة والكيان الخدمي وتمويل EUR أو SEPA وتوفر المنتج."],
      br: ["قائمة تحقق BRL وPix معمقة", "استخدم دليل البرازيل باللغة البرتغالية لفحص Pix وBRL وCPF وKYC والتكلفة قبل فتح حساب spot."],
      tr: ["مسار SPK وTRY موثق بالمصادر", "استخدم صفحة تركيا عندما تحتاج إلى مراجعة مصادر تركية لسياق قائمة SPK وتمويل TRY وفحوص الهوية ونطاق المنتج."],
    },
  },
};

const REGIONAL_SOURCE_ITEM_COPY = {
  BR: { "pt-BR": {
    "Banco Central do Brasil Pix FAQ": ["Perguntas frequentes sobre Pix do Banco Central do Brasil", ""],
    "Binance Brasil BRL deposit guidance": ["Guia oficial de depósito em BRL da Binance Brasil", ""],
  } },
  JP: {
    ja: {
      "Japan FSA registered crypto-asset exchange providers": ["金融庁 登録暗号資産交換業者一覧", "登録業者の確認起点として使います。登録は特定ユーザーの口座承認、商品利用、適合性を保証しません。"],
      "bitFlyer Japan how to start": ["bitFlyer Japan 開始手順", "本人確認、口座、JPY 入金の現在の公式手順を確認します。条件はアカウントごとに変わります。"],
      "bitFlyer Japan official FAQ": ["bitFlyer Japan 公式FAQ", "口座、入出金、商品条件を現在の公式情報で確認します。外部導線だけでは可否を判断しません。"],
    },
  },
  KR: {
    ko: {
      "FSC Korea Virtual Asset User Protection Act overview": ["금융위원회 가상자산 이용자 보호법 개요", "규제 맥락을 확인하는 출처입니다. 특정 사용자의 계정 승인이나 상품 이용 가능성을 보장하지 않습니다."],
      "Korea Financial Intelligence Unit virtual-asset business guidance": ["금융정보분석원 가상자산사업자 안내", "공식 안내와 사업자 맥락을 확인하는 출처입니다. 실제 계정 조건은 플랫폼 화면에서 확인해야 합니다."],
      "Upbit Korea account registration and customer verification": ["Upbit 회원가입 및 고객확인 안내", "현재 한국어 회원가입과 고객확인 절차를 확인합니다. 계정 승인과 상품 이용은 사용자별로 달라집니다."],
      "Upbit Korea KRW deposit and withdrawal guidance": ["Upbit 원화 입출금 안내", "KRW 입출금과 실명계좌 조건을 확인하는 출처입니다. NexuAlpha의 자격 또는 혜택 보장이 아닙니다."],
    },
  },
  TR: {
    tr: {
      "SPK crypto-asset service providers in operation": ["SPK faaliyette bulunan kripto varlık hizmet sağlayıcıları", "Güncel SPK geçici listesindeki hizmet sağlayıcı bağlamını kontrol etmek için kullanılır; liste kaydı hesap uygunluğu veya ürün elverişliliği anlamına gelmez."],
      "SPK crypto-asset service providers in liquidation": ["SPK tasfiye sürecindeki kripto varlık hizmet sağlayıcıları", "Bir Türkiye platform adını kullanılabilir rota saymadan önce tasfiye durumunu kontrol edin; liste kaydı NexuAlpha CTA yetkisi değildir."],
      "Paribu account verification guidance": ["Paribu hesap doğrulama rehberi", "Kimlik, yüz doğrulama, yatırımcı profili ve adres adımlarını resmi akışta kontrol etmek için kullanılır; sonuç kullanıcıya özeldir."],
      "Paribu Turkish lira deposit guidance": ["Paribu Türk lirası yatırma rehberi", "TRY banka transferi ve hesap eşleşmesi koşullarını kontrol etmek için kullanılır; garantili fonlama veya işlem rotası değildir."],
    },
  },
  MX: {
    es: {
      "Banco de México SPEI information": [
        "Información SPEI del Banco de México",
        "Usa Banxico para entender SPEI como sistema de pagos interbancarios; esto no prueba que una plataforma cripto o una cuenta concreta pueda usar una ruta MXN específica.",
      ],
      "Binance MXN and SPEI deposit guidance": [
        "Guía oficial de depósito MXN y SPEI de Binance",
        "Usa el flujo actual de la plataforma para comprobar SPEI, identidad y requisitos de cuenta; esto no autoriza una CTA de NexuAlpha.",
      ],
      "Binance Mexico account guidance": [
        "Guía de cuenta de Binance México",
        "El paso de cuenta puede variar según el estado del usuario; confirma el flujo oficial vigente antes de actuar.",
      ],
      "CNBV fintech and virtual-asset framework": [
        "Marco CNBV de fintech y activos virtuales",
        "Usa el marco del regulador mexicano para separar contexto de investigación de conclusiones de cuenta o elegibilidad específicas de una plataforma.",
      ],
    },
  },
  HK: {
    "zh-Hant": {
      "SFC licensed virtual asset trading platforms": ["SFC 持牌虛擬資產交易平台名單", "用來核對平台已公布的 SFC 狀態；不保證平台表現、信用、開戶審批、產品權限或適合性。"],
      "SFC virtual asset platform requirements": ["SFC 虛擬資產平台規定", "開戶前先核對監管範圍與牌照背景，再以官方帳戶條件為準。"],
      "HashKey Exchange fiat currency deposit guidelines": ["HashKey Exchange 法幣入金指南", "核對支援貨幣、銀行處理、費用、帳戶姓名與拒絕渠道規則；實際可用性仍以當前帳戶為準。"],
      "HashKey Exchange eDDA deposit guide": ["HashKey Exchange eDDA 入金指南", "核對港幣銀行授權、帳戶同名、身分資料、最低金額與銀行處理；不是全市場的資格承諾。"],
      "OSL Hong Kong account opening and 2FA guide": ["OSL 香港開戶與雙重驗證指南", "以當前官方開戶、KYC 與地址證明清單作為平台特定的研究來源，不是市場通用結論。"],
      "OSL Hong Kong account verification process": ["OSL 香港帳戶驗證流程", "在判斷路徑是否適合特定用戶前，核對當前身分、地址與銀行驗證步驟。"],
    },
  },
  ID: {
    id: {
      "OJK and Bappebti transition announcement for crypto assets": [
        "Pengumuman transisi OJK dan Bappebti untuk aset kripto",
        "Gunakan konteks transisi OJK/Bappebti untuk memisahkan pengawasan regulator dari hasil akun, produk, dan manfaat di platform tertentu.",
      ],
      "Bappebti prospective physical crypto-asset trader list": [
        "Daftar calon pedagang fisik aset kripto Bappebti",
        "Gunakan daftar pedagang yang dipublikasikan sebagai titik awal verifikasi; daftar ini tidak membuktikan pengguna tertentu dapat membuka, mendanai, atau memakai akun.",
      ],
      "Tokocrypto IDR deposit guidance": [
        "Panduan deposit IDR Tokocrypto",
        "Ketersediaan VA bank, wallet, dan QRIS harus dicek di alur akun saat ini.",
      ],
      "Tokocrypto referral-code guidance": [
        "Panduan kode referral Tokocrypto",
        "Penjelasan kode referral platform bukan bukti bahwa NexuAlpha memiliki kode aktif atau manfaat pengguna.",
      ],
    },
  },
};

function localizedInternationalRouteCard(item, locale) {
  const localeKey = locale === "pt-BR" ? "pt-BR" : String(locale || "").split("-")[0];
  const localized = INTERNATIONAL_ROUTE_CARD_COPY[locale]?.cards?.[item.id] || INTERNATIONAL_ROUTE_CARD_COPY[localeKey]?.cards?.[item.id];
  if (!localized) return item;
  return { ...item, label: localized[0], description: localized[1] };
}

function localizedRegionalSourceItem(item, market, locale) {
  const localized = REGIONAL_SOURCE_ITEM_COPY[market]?.[locale]?.[item.label];
  if (!localized) return item;
  return { ...item, label: localized[0], note: localized[1] };
}

function localizedRegionalSourceLabel(label, market, locale) {
  return localizedRegionalSourceItem({ label, href: "", note: "", role: "" }, market, locale).label;
}

const FUNDING_OPTION_COPY = {
  BR: { "pt-BR": { "BRL bank transfer": "Transferência bancária em BRL" } },
  JP: {
    ja: {
      "JPY deposit": "JPY 入金",
      "registered bank account in user's name": "本人名義の登録銀行口座",
      "crypto transfer route pending account confirmation": "口座確認が必要な暗号資産転送",
    },
  },
  KR: {
    ko: {
      "KRW deposit and withdrawal": "KRW 입출금",
      "real-name bank account where shown": "표시되는 경우 실명 은행계좌",
      "crypto transfer route pending account confirmation": "계정 확인이 필요한 암호화폐 전송",
    },
  },
  TR: {
    tr: {
      "TRY bank transfer": "TRY banka transferi",
      "matching bank account where shown": "gösterildiğinde eşleşen banka hesabı",
      "crypto transfer route pending account confirmation": "hesap onayı gereken kripto transfer rotası",
    },
  },
  MX: {
    es: {
      "SPEI": "SPEI",
      "MXN bank transfer": "Transferencia bancaria MXN",
      "Medá account route": "Ruta de cuenta Medá",
    },
  },
  HK: {
    "zh-Hant": {
      "HKD bank transfer": "港幣銀行轉帳",
      "eDDA where shown": "顯示 eDDA 時使用",
      "crypto transfer route pending account confirmation": "加密資產轉帳，仍需帳戶確認",
    },
  },
  ID: {
    id: {
      "IDR bank virtual account": "Virtual account bank IDR",
      "QRIS where shown": "QRIS jika ditampilkan",
      "wallet route where shown": "Jalur wallet jika ditampilkan",
      "on-chain crypto transfer where shown": "Transfer kripto on-chain jika ditampilkan",
    },
  },
};

const AUTHORITY_COPY = {
  MX: {
    en: "Banco de México, CNBV and official platform help centers",
  },
  JP: {
    ja: "日本の金融庁と公式プラットフォーム資料",
  },
  KR: {
    ko: "한국 금융위원회, 금융정보분석원 및 공식 플랫폼 자료",
  },
  TR: {
    tr: "Türkiye Sermaye Piyasası Kurulu (SPK) ve resmi platform kaynakları",
  },
  ID: {
    id: "Referensi OJK, Bappebti, dan platform resmi Indonesia",
  },
};

const FUNDING_MATRIX_COPY = {
  es: {
    marketNames: { MX: "México", BR: "Brasil" },
    title: (row, count) => count > 1 ? "Matriz regional de verificación de depósitos" : `Matriz de verificación de depósitos: ${row.market === "MX" ? "México" : row.marketName}`,
    summary: (rows) => `${rows.length} mercados · ${rows.map((entry) => `${entry.market}/${entry.fiatCurrency}`).join(" · ")} · revisión ${REGIONAL_FUNDING_MATRIX_REVIEWED_AT}`,
    boundary: "Esta matriz es un recurso público de investigación para verificar moneda local y métodos de depósito. No demuestra aprobación de cuenta, disponibilidad de depósitos, acceso a productos, comisiones, beneficios ni resultados de registro.",
    json: "Abrir recurso JSON", csv: "Abrir recurso CSV",
    sourceLinks: (name) => `Fuentes sobre depósitos: ${name}`,
  },
  "pt-BR": {
    marketNames: { BR: "Brasil", MX: "México" },
    title: (row, count) => count > 1 ? "Matriz regional de verificação de depósitos" : `Matriz de verificação de depósitos: ${row.market === "BR" ? "Brasil" : row.marketName}`,
    summary: (rows) => `${rows.length} mercados · ${rows.map((entry) => `${entry.market}/${entry.fiatCurrency}`).join(" · ")} · revisão ${REGIONAL_FUNDING_MATRIX_REVIEWED_AT}`,
    boundary: "Esta matriz é um recurso público de pesquisa para verificar moeda local e formas de depósito. Não comprova aprovação de conta, disponibilidade de depósitos, acesso a produtos, taxas, benefícios ou resultados de cadastro.",
    json: "Abrir recurso JSON", csv: "Abrir recurso CSV",
    sourceLinks: (name) => `Fontes sobre depósitos: ${name}`,
  },

  ja: {
    title: (row, count) => count > 1 ? "地域別入金確認マトリクス" : `${row.marketName} 入金確認マトリクス`,
    summary: (rows) => `${rows.length}市場 · ${rows.map((entry) => `${entry.market}/${entry.fiatCurrency}`).join(" · ")} · 確認日 ${REGIONAL_FUNDING_MATRIX_REVIEWED_AT}`,
    boundary: "この簡易マトリクスは、現地通貨と支払い経路を確認するための公開調査資料です。口座承認、入金可否、商品アクセス、手数料、特典、登録結果を証明するものではありません。",
    json: "JSON資料を開く",
    csv: "CSV資料を開く",
    sourceLinks: (marketName) => `${marketName} 入金情報源リンク`,
  },
  ko: {
    title: (row, count) => count > 1 ? "지역별 입금 확인 매트릭스" : `${row.marketName} 입금 확인 매트릭스`,
    summary: (rows) => `${rows.length}개 시장 · ${rows.map((entry) => `${entry.market}/${entry.fiatCurrency}`).join(" · ")} · 검토일 ${REGIONAL_FUNDING_MATRIX_REVIEWED_AT}`,
    boundary: "이 요약 매트릭스는 현지 법정화폐와 결제 경로 확인을 위한 공개 리서치 자료입니다. 계정 승인, 입금 가능 여부, 상품 접근, 수수료, 혜택 또는 가입 결과를 증명하지 않습니다.",
    json: "JSON 자료 열기",
    csv: "CSV 자료 열기",
    sourceLinks: (marketName) => `${marketName} 입금 출처 링크`,
  },
  tr: {
    title: (row, count) => count > 1 ? "Bölgesel fonlama doğrulama matrisi" : `${row.marketName} fonlama doğrulama matrisi`,
    summary: (rows) => `${rows.length} pazar · ${rows.map((entry) => `${entry.market}/${entry.fiatCurrency}`).join(" · ")} · inceleme ${REGIONAL_FUNDING_MATRIX_REVIEWED_AT}`,
    boundary: "Bu kompakt matris yerel fiat ve ödeme yolu kontrolleri için kamuya açık bir araştırma varlığıdır. Hesap onayı, fonlama kullanılabilirliği, ürün erişimi, ücretler, avantajlar veya kayıt sonucunu kanıtlamaz.",
    json: "JSON varlığını aç",
    csv: "CSV varlığını aç",
    sourceLinks: (marketName) => `${marketName} fonlama kaynak bağlantıları`,
  },
  id: {
    title: (row, count) => count > 1 ? "Matriks verifikasi pendanaan regional" : `Matriks verifikasi pendanaan ${row.marketName}`,
    summary: (rows) => `${rows.length} pasar · ${rows.map((entry) => `${entry.market}/${entry.fiatCurrency}`).join(" · ")} · ditinjau ${REGIONAL_FUNDING_MATRIX_REVIEWED_AT}`,
    boundary: "Matriks ringkas ini adalah aset riset publik untuk pemeriksaan fiat lokal dan jalur pembayaran. Ini tidak membuktikan persetujuan akun, ketersediaan pendanaan, akses produk, biaya, manfaat, atau hasil pendaftaran.",
    json: "Buka aset JSON",
    csv: "Buka aset CSV",
    sourceLinks: (marketName) => `Tautan sumber pendanaan ${marketName}`,
  },
};

const FUNDING_MATRIX_VALUE_COPY = {
  BR: {
  "pt-BR": {
    "accountScreenChecks": {
      "Confirm BRL and Pix or bank-transfer visibility inside the logged-in official account.": "Confirme se BRL e Pix ou transferência bancária aparecem na conta oficial após entrar.",
      "Match CPF or CNPJ, account holder name, bank account ownership and order status before sending funds.": "Confira CPF ou CNPJ, nome do titular, titularidade da conta bancária e situação da ordem antes de enviar recursos."
    },
    "feeOrTimingChecks": {
      "Read the current account screen for minimum and maximum amount, fee, processing time and returned-payment conditions.": "Consulte a tela atual da conta para verificar valores mínimo e máximo, taxa, prazo de processamento e condições de devolução."
    },
    "cannotPromise": {
      "Does not prove that a specific user can open an account, deposit or withdraw BRL, receive a benefit, or get a fixed fee result.": "Não comprova que um usuário específico possa abrir conta, depositar ou sacar BRL, receber benefícios ou obter uma taxa fixa."
    }
  }
},
  MX: {
  "es": {
    "accountScreenChecks": {
      "Confirm MXN and SPEI visibility inside the current official account flow before treating a platform route as usable.": "Confirma que MXN y SPEI aparecen en el flujo oficial actual de la cuenta antes de considerar utilizable una ruta de plataforma.",
      "Check CURP, identity status, Medá or platform account status, beneficiary details and bank-account ownership before sending funds.": "Revisa CURP, estado de identidad, estado de la cuenta Medá o de plataforma, datos del beneficiario y titularidad bancaria antes de enviar fondos."
    },
    "feeOrTimingChecks": {
      "Read the live order screen for minimum and maximum amount, fee, processing time and returned-payment conditions before funding.": "Consulta la pantalla actual de la orden para verificar importes mínimo y máximo, comisión, tiempo de procesamiento y condiciones de devolución antes de depositar."
    },
    "cannotPromise": {
      "Does not prove that a specific user can open a Mexico account, use SPEI or MXN, pass identity checks, receive a benefit, or get a fixed fee or timing result.": "No demuestra que un usuario específico pueda abrir una cuenta en México, usar SPEI o MXN, superar la verificación de identidad, recibir beneficios u obtener una comisión o plazo fijo."
    }
  }
},

  JP: {
    ja: {
      accountScreenChecks: {
        "Confirm the provider appears in the current FSA registered crypto-asset exchange provider context before comparing signup routes.": "登録ルートを比較する前に、対象事業者が現在の金融庁登録暗号資産交換業者の文脈に含まれるか確認します。",
        "Check identity verification, registered personal information and a bank account in the user's own name before JPY funding.": "JPY 入金前に、本人確認、登録済み個人情報、本人名義の銀行口座を確認します。",
        "Verify JPY deposit visibility, crypto transfer availability and product scope inside the current official account flow.": "現在の公式アカウント手続きで、JPY 入金表示、暗号資産転送、商品範囲を確認します。",
      },
      feeOrTimingChecks: {
        "Read the official account or fee page for current JPY deposit, withdrawal, trading fee, reflection timing and rejection conditions.": "現在の JPY 入出金、取引手数料、反映時間、拒否条件は、公式アカウントまたは手数料ページで確認します。",
        "Keep fees, account approval timing, supported products and benefit eligibility pending until shown by the official account flow.": "手数料、口座承認時期、対応商品、特典資格は、公式アカウント手続きに表示されるまで未確定として扱います。",
      },
      unknowns: {
        "Whether the specific user passes Japan identity, residence and registered-bank-account checks.": "特定ユーザーが日本の本人確認、居住地、登録銀行口座の確認を通過できるか。",
        "Whether JPY deposit or withdrawal, crypto transfer, timing, fees, product scope or benefits appear in the current official account flow.": "JPY 入出金、暗号資産転送、処理時間、手数料、商品範囲、特典が現在の公式アカウント手続きに表示されるか。",
      },
      cannotPromise: {
        "Does not prove registration approval, JPY funding availability, bank-account approval, crypto transfer availability, product access, fee outcome or benefit eligibility for a specific user.": "特定ユーザーの登録承認、JPY 入金可否、銀行口座承認、暗号資産転送可否、商品アクセス、手数料結果、特典資格を証明するものではありません。",
      },
    },
  },
  KR: {
    ko: {
      accountScreenChecks: {
        "Confirm the official FSC or KOFIU regulatory context before comparing a Korean account route.": "한국 계정 경로를 비교하기 전에 금융위원회 또는 금융정보분석원의 공식 규제 맥락을 확인합니다.",
        "Check signup, customer verification, real-name bank account, two-channel authentication and account level inside the official platform flow.": "공식 플랫폼 절차에서 가입, 고객확인, 실명 은행계좌, 2채널 인증, 계정 등급을 확인합니다.",
        "Verify KRW deposit or withdrawal, crypto transfer and intended product scope separately for the current account.": "현재 계정에서 KRW 입출금, 암호화폐 전송, 이용하려는 상품 범위를 각각 확인합니다.",
      },
      feeOrTimingChecks: {
        "Read the official account screen or platform support page for KRW amount limits, fees, processing time, rejection conditions and authentication requirements.": "KRW 금액 한도, 수수료, 처리 시간, 거절 조건, 인증 요건은 공식 계정 화면 또는 지원 페이지에서 확인합니다.",
        "Keep KRW funding availability, product scope, fees, timing and user benefits pending until the official account flow shows them.": "KRW 입출금 가능 여부, 상품 범위, 수수료, 처리 시간, 사용자 혜택은 공식 계정 절차에 표시될 때까지 미확정으로 둡니다.",
      },
      unknowns: {
        "Whether the specific user can complete customer verification, real-name bank-account checks or two-channel authentication.": "특정 사용자가 고객확인, 실명계좌 확인 또는 2채널 인증을 완료할 수 있는지.",
        "Whether KRW funding, crypto transfer, fees, timing, product scope or benefits appear in the current official account screen.": "KRW 입출금, 암호화폐 전송, 수수료, 처리 시간, 상품 범위 또는 혜택이 현재 공식 계정 화면에 표시되는지.",
      },
      cannotPromise: {
        "Does not prove account approval, KRW funding availability, real-name bank-account approval, crypto transfer availability, product access, fee outcome or benefit eligibility for a specific user.": "특정 사용자의 계정 승인, KRW 입출금 가능 여부, 실명계좌 승인, 암호화폐 전송, 상품 이용, 수수료 결과 또는 혜택 자격을 증명하지 않습니다.",
      },
    },
  },
  TR: {
    tr: {
      accountScreenChecks: {
        "Confirm the current SPK operation and liquidation lists before treating a Turkish platform route as available.": "Bir Türkiye platform rotasını kullanılabilir saymadan önce güncel SPK faaliyet ve tasfiye listelerini kontrol edin.",
        "Treat a name on the SPK liquidation list, including Bitget Teknoloji AŞ while it appears there, as a stop-and-review signal rather than a usable Türkiye funding route.": "SPK tasfiye listesinde görünen bir adı, Bitget Teknoloji AŞ dahil, kullanılabilir Türkiye fonlama rotası yerine durup inceleme sinyali olarak ele alın.",
        "Check identity, face, investor-profile, address and account-verification steps inside the official platform flow.": "Kimlik, yüz doğrulama, yatırımcı profili, adres ve hesap doğrulama adımlarını resmi platform akışında kontrol edin.",
        "Verify whether TRY deposit, crypto transfer and the intended product are visible for the current account before acting.": "İşlemden önce TRY yatırma, kripto transferi ve hedef ürünün mevcut hesapta görünüp görünmediğini doğrulayın.",
      },
      feeOrTimingChecks: {
        "Use the official account screen or platform support page for bank-transfer conditions, fees, limits, timing and rejected-payment conditions.": "Banka transferi koşulları, ücretler, limitler, süreler ve reddedilen ödeme koşulları için resmi hesap ekranını veya destek sayfasını kullanın.",
        "Keep TRY funding availability, product scope, fees, timing and user benefits pending until the official account flow shows them.": "TRY fonlama, ürün kapsamı, ücretler, süreler ve kullanıcı avantajları resmi hesap akışında görünene kadar beklemede kalır.",
      },
      unknowns: {
        "Whether the specific user can pass identity, face, investor-profile, address or account-verification steps.": "Belirli kullanıcının kimlik, yüz, yatırımcı profili, adres veya hesap doğrulama adımlarını geçip geçemeyeceği.",
        "Whether TRY funding, bank-account matching, crypto transfer, fees, timing, product scope or benefits appear in the current official account screen.": "TRY fonlama, banka hesabı eşleşmesi, kripto transferi, ücretler, süreler, ürün kapsamı veya avantajların mevcut resmi hesap ekranında görünüp görünmediği.",
        "Whether a named provider has moved between the SPK operation list and liquidation list since this review.": "Bu incelemeden sonra ilgili sağlayıcının SPK faaliyet listesi ile tasfiye listesi arasında yer değiştirip değiştirmediği.",
      },
      cannotPromise: {
        "Does not prove account approval, TRY funding availability, bank-account approval, crypto transfer availability, product access, provider status, fee outcome or benefit eligibility for a specific user.": "Belirli kullanıcı için hesap onayı, TRY fonlama, banka hesabı onayı, kripto transferi, ürün erişimi, sağlayıcı durumu, ücret sonucu veya avantaj uygunluğunu kanıtlamaz.",
      },
    },
  },
};

function localizedFundingMatrixValue(market, locale, group, value) {
  const localeKey = locale === "pt-BR" ? "pt-BR" : String(locale || "").split("-")[0];
  return FUNDING_MATRIX_VALUE_COPY[market]?.[locale]?.[group]?.[value]
    || FUNDING_MATRIX_VALUE_COPY[market]?.[localeKey]?.[group]?.[value]
    || value;
}

const RELATED_RESEARCH_COPY = {
  HK: {
    "zh-Hant": {
      directory: ["查看香港平台候選", "保留 market=HK，先核對 SFC 狀態、官方域名與帳戶路徑。"],
      rates: ["入金前先估算費用", "先用公開基礎費率建立假設，再到官方帳戶確認最終費用。"],
      compare: ["開戶前並排比較兩個平台", "同時核對 SFC 狀態、港幣入金路徑、身分步驟與產品範圍。"],
    },
  },
};

function localizedFundingOptionLabel(market, locale, value) {
  const localeKey = locale === "pt-BR" ? "pt-BR" : String(locale || "").split("-")[0];
  return FUNDING_OPTION_COPY[market]?.[locale]?.[value]
    || FUNDING_OPTION_COPY[market]?.[localeKey]?.[value]
    || value;
}

function localizedRelatedResearch(research, market, locale) {
  const localeKey = locale === "pt-BR" ? "pt-BR" : String(locale || "").split("-")[0];
  const copy = RELATED_RESEARCH_COPY[market]?.[locale] || RELATED_RESEARCH_COPY[market]?.[localeKey];
  if (!copy) return research;
  return research.map(([type, label, note]) => {
    const localized = copy[type];
    return localized ? [type, localized[0], localized[1]] : [type, label, note];
  });
}

function InternationalRouteCards({ locale, fallbackHref }) {
  const localeKey = locale === "pt-BR" ? "pt-BR" : String(locale || "").split("-")[0];
  const copy = INTERNATIONAL_ROUTE_CARD_COPY[locale] || INTERNATIONAL_ROUTE_CARD_COPY[localeKey];
  return (
    <section className="regional-market-preview__route-cards" aria-labelledby="international-route-cards-title" data-international-route-cards>
      <div className="regional-market-preview__questions-heading">
        <h2 id="international-route-cards-title">{copy?.heading || "Choose the closest verified path"}</h2>
        <p>{copy?.intro || "Start from a country or funding route that already has local source context. If your country is not listed, keep the market unset and use the global directory until official account conditions are clear."}</p>
      </div>
      <div className="regional-market-preview__route-grid">
        {INTERNATIONAL_ROUTE_CARDS.map((rawItem) => {
          const item = localizedInternationalRouteCard(rawItem, locale);
          return (
          <a key={item.id} href={localizedHref(item.href, { locale: item.locale || locale })} className="v3-card" data-international-route-card={item.id} data-cta-kind="research" data-cta-placement="international-route-card">
            <small>{item.label}</small>
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </a>
          );
        })}
        <a href={fallbackHref} className="v3-card regional-market-preview__route-card--fallback" data-international-route-card="unlisted" data-cta-kind="research" data-cta-placement="international-route-card">
          <small>{copy?.fallbackLabel || "United States or unlisted country"}</small>
          <strong>{copy?.fallbackTitle || "Use the global directory first"}</strong>
          <span>{copy?.fallbackDescription || "Set residence, product and account stage before comparing platforms. This avoids turning a country query into an unsupported signup promise."}</span>
        </a>
      </div>
    </section>
  );
}

function FundingVerificationMatrix({ market, locale = "en" }) {
  const selectedMarkets = market === "OTHER" ? ["BR", "MX", "EU", "UK", "JP"] : [market];
  const rows = regionalFundingRowsForMarkets(selectedMarkets);
  if (!rows.length) return null;

  const localeKey = locale === "pt-BR" ? "pt-BR" : String(locale || "").split("-")[0];
  const copy = FUNDING_MATRIX_COPY[locale] || FUNDING_MATRIX_COPY[localeKey];
  const title = copy
    ? copy.title(rows[0], rows.length)
    : (market === "OTHER" ? "Regional funding verification matrix" : `${rows[0].marketName} funding verification matrix`);
  const summary = copy
    ? copy.summary(rows)
    : `${rows.length} market${rows.length > 1 ? "s" : ""} · ${rows.map((entry) => `${entry.market}/${entry.fiatCurrency}`).join(" · ")} · reviewed ${REGIONAL_FUNDING_MATRIX_REVIEWED_AT}`;
  const boundary = copy?.boundary || "This compact matrix is a public research asset for local fiat and payment-route checks. It does not prove account approval, funding availability, product access, fees, benefits or signup outcome.";

  return (
    <section className="regional-market-preview__funding-matrix" data-regional-funding-matrix={rows.map((entry) => entry.market).join(",")}>
      <details>
        <summary>
          <span>
            <strong>{title}</strong>
            <small>{summary}</small>
          </span>
          <b aria-hidden="true">＋</b>
        </summary>
        <div className="regional-market-preview__funding-body">
          <p>{boundary}</p>
          <div className="regional-market-preview__funding-grid">
            {rows.map((entry) => (
              <article key={entry.id} className="v3-card" data-funding-market={entry.market}>
                <header>
                  <strong>{copy?.marketNames?.[entry.market] || entry.marketName}</strong>
                  <span>{entry.fiatCurrency} · {entry.paymentRails.map((rail) => localizedFundingOptionLabel(entry.market, locale, rail)).join(" / ")}</span>
                </header>
                <ul>
                  {entry.accountScreenChecks.slice(0, 2).map((check) => <li key={check}>{localizedFundingMatrixValue(entry.market, locale, "accountScreenChecks", check)}</li>)}
                  <li>{localizedFundingMatrixValue(entry.market, locale, "feeOrTimingChecks", entry.feeOrTimingChecks[0])}</li>
                </ul>
                <small>{localizedFundingMatrixValue(entry.market, locale, "cannotPromise", entry.cannotPromise)}</small>
                <nav aria-label={copy?.sourceLinks?.(copy?.marketNames?.[entry.market] || entry.marketName) || `${entry.marketName} funding source links`}>
                  {entry.officialSources.slice(0, 2).map((item) => (
                    <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="regional-funding-matrix-source">{localizedRegionalSourceItem({ label: item.label, href: item.url, note: "", role: item.role }, entry.market, locale).label}</a>
                  ))}
                </nav>
              </article>
            ))}
          </div>
          <div className="regional-market-preview__funding-downloads">
            <a href={REGIONAL_FUNDING_MATRIX_PUBLIC_JSON} data-cta-kind="research" data-cta-placement="regional-funding-matrix-json">{copy?.json || "Open JSON asset"}</a>
            <a href={REGIONAL_FUNDING_MATRIX_PUBLIC_CSV} data-cta-kind="research" data-cta-placement="regional-funding-matrix-csv">{copy?.csv || "Open CSV asset"}</a>
          </div>
        </div>
      </details>
    </section>
  );
}

function RegionalAeoCompactAnswer({ summary, questionsOpen }) {
  if (!summary?.count) return null;

  return (
    <section className="regional-market-preview__aeo-compact" data-regional-aeo-compact={summary.statusTone}>
      <details>
        <summary>
          <span>
            <strong>{summary.title}</strong>
            <small>{summary.publicationStatus} {summary.sourceLine}</small>
          </span>
          <b aria-hidden="true">＋</b>
        </summary>
        <div className="regional-market-preview__aeo-body">
          <p data-aeo-extractable-answer>{summary.directAnswer}</p>
          <div className="regional-market-preview__aeo-columns">
            <article>
              <strong>{summary.knownLabel}</strong>
              <ul>
                {summary.knownItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
            <article>
              <strong>{summary.unknownLabel}</strong>
              <ul>
                {summary.unknownItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>
          <div className="regional-market-preview__aeo-sequence" aria-label={summary.sequenceLabel}>
            <strong>{summary.sequenceLabel}</strong>
            <ol>
              {summary.verificationSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </div>
          {!questionsOpen && <small className="regional-market-preview__aeo-hint">{summary.closeLabel}</small>}
        </div>
      </details>
    </section>
  );
}

function RegionalProofPack({ copy, policy }) {
  if (!copy.preSignupChecks && !copy.sourceChecks) return null;

  return (
    <section className="regional-market-preview__proof-pack" data-regional-proof-pack={policy.targetMarket}>
      <details>
        <summary>
          <span>
            <strong>{copy.preSignupChecks?.heading || copy.sourceChecks?.heading || "Official-source checks"}</strong>
            <small>{copy.preSignupChecks?.boundary || "Keep source limits visible before treating a route as available."}</small>
          </span>
          <b aria-hidden="true">＋</b>
        </summary>
        <div className="regional-market-preview__proof-body">
          {copy.preSignupChecks && <section className="regional-market-preview__pre-signup" data-regional-pre-signup-check={policy.targetMarket} aria-labelledby="regional-pre-signup-title">
            <div className="regional-market-preview__pre-signup-heading">
              <h2 id="regional-pre-signup-title">{copy.preSignupChecks.heading}</h2>
              <p>{copy.preSignupChecks.boundary}</p>
            </div>
            <div className="regional-market-preview__pre-signup-grid">
              {copy.preSignupChecks.items.map(([step, label, note]) => <article key={label} className="v3-card">
                <span>{step}</span>
                <strong>{label}</strong>
                <p>{note}</p>
              </article>)}
            </div>
          </section>}
          {copy.sourceChecks && <section className="regional-market-preview__source-map" aria-labelledby="regional-source-map-title" data-regional-source-map={policy.targetMarket}>
            <h2 id="regional-source-map-title">{copy.sourceChecks.heading}</h2>
            <div className="regional-market-preview__source-map-grid">
              {copy.sourceChecks.rows.map(([label, proves, limit]) => <article key={label} className="v3-card">
                <strong>{label}</strong>
                <span>{proves}</span>
                <small>{limit}</small>
              </article>)}
            </div>
          </section>}
        </div>
      </details>
    </section>
  );
}

const REGIONAL_QUICK_ACTION_COPY = Object.freeze({
  en: {
    aria: "Regional decision next steps",
    directoryEyebrow: "Choose candidates first",
    directoryTitle: "Review platform candidates",
    directoryBody: "Keep market, product and account stage attached before any signup route.",
    compareEyebrow: "If you are unsure",
    compareTitle: "Compare before choosing",
    compareBody: "Put fees, identity, funding and product scope on one screen.",
    selectEyebrow: "No reviewed pair yet",
    selectTitle: "Choose two candidates first",
    selectBody: "Open the regional directory and choose candidates before opening a comparison.",
    telegramEyebrow: "Need guided help",
    telegramTitle: "Continue with context",
    telegramBody: "Save the market and product context onsite before continuing in Telegram.",
  },
  "zh-Hans": {
    aria: "区域决策下一步", directoryEyebrow: "先选候选", directoryTitle: "查看可用平台", directoryBody: "保留市场、产品与账户阶段，进入站内候选清单。",
    compareEyebrow: "不确定时", compareTitle: "先并排比较", compareBody: "把费用、身份、入金与产品条件放到同一画面。",
    selectEyebrow: "暂无已核验组合", selectTitle: "先选择两个候选", selectBody: "进入区域候选清单，选定平台后再打开比较。",
    telegramEyebrow: "需要引导", telegramTitle: "带着上下文继续", telegramBody: "先在站内保存市场与产品上下文，再进入 Telegram。",
  },
  "zh-Hant": {
    aria: "區域決策下一步", directoryEyebrow: "先選候選", directoryTitle: "查看可用平台", directoryBody: "保留市場、產品與帳戶階段，進入站內候選清單。",
    compareEyebrow: "不確定時", compareTitle: "先並排比較", compareBody: "把費用、身分、入金與產品條件放到同一畫面。",
    selectEyebrow: "暫無已核驗組合", selectTitle: "先選擇兩個候選", selectBody: "進入區域候選清單，選定平台後再開啟比較。",
    telegramEyebrow: "需要引導", telegramTitle: "帶著上下文繼續", telegramBody: "先在站內保存市場與產品上下文，再進入 Telegram。",
  },
  ja: {
    aria: "地域別の次のステップ", directoryEyebrow: "候補を先に絞る", directoryTitle: "利用候補を確認", directoryBody: "登録前に地域、商品、口座段階を保ったまま候補を確認します。",
    compareEyebrow: "迷っている場合", compareTitle: "選ぶ前に比較", compareBody: "手数料、本人確認、入金、商品条件を同じ画面で確認します。",
    selectEyebrow: "確認済みの組み合わせは未設定", selectTitle: "先に2つの候補を選ぶ", selectBody: "地域別候補を開き、比較するプラットフォームを選択します。",
    telegramEyebrow: "案内が必要", telegramTitle: "条件を引き継いで続ける", telegramBody: "地域と商品の条件をサイト内で保存してから Telegram に進みます。",
  },
  ko: {
    aria: "지역별 다음 결정", directoryEyebrow: "후보부터 좁히기", directoryTitle: "이용 후보 확인", directoryBody: "가입 전에 지역, 상품, 계정 단계를 유지한 채 후보를 확인합니다.",
    compareEyebrow: "선택이 어렵다면", compareTitle: "선택 전에 비교", compareBody: "수수료, 본인확인, 입금, 상품 조건을 한 화면에서 확인합니다.",
    selectEyebrow: "검토된 비교 조합 없음", selectTitle: "먼저 후보 두 개 선택", selectBody: "지역 후보 목록에서 비교할 플랫폼을 먼저 선택합니다.",
    telegramEyebrow: "안내가 필요하다면", telegramTitle: "조건을 이어서 진행", telegramBody: "지역과 상품 조건을 사이트에 저장한 뒤 Telegram에서 계속합니다.",
  },
  tr: {
    aria: "Bölgesel karar adımları", directoryEyebrow: "Önce adayları daraltın", directoryTitle: "Uygun platformları inceleyin", directoryBody: "Kayıttan önce pazar, ürün ve hesap aşaması bağlamını koruyun.",
    compareEyebrow: "Kararsızsanız", compareTitle: "Seçmeden önce karşılaştırın", compareBody: "Ücret, kimlik, fonlama ve ürün koşullarını tek ekranda görün.",
    selectEyebrow: "İncelenmiş bir eşleşme yok", selectTitle: "Önce iki aday seçin", selectBody: "Bölgesel aday listesini açın ve karşılaştırılacak platformları seçin.",
    telegramEyebrow: "Yönlendirme gerekirse", telegramTitle: "Bağlamla devam edin", telegramBody: "Telegram'a geçmeden önce pazar ve ürün bağlamını sitede kaydedin.",
  },
  es: {
    aria: "Siguientes pasos regionales", directoryEyebrow: "Primero reduce candidatos", directoryTitle: "Revisar plataformas candidatas", directoryBody: "Conserva mercado, producto y etapa de cuenta antes de cualquier registro.",
    compareEyebrow: "Si aún dudas", compareTitle: "Comparar antes de elegir", compareBody: "Revisa comisiones, identidad, fondeo y producto en una sola pantalla.",
    selectEyebrow: "Aún no hay una pareja revisada", selectTitle: "Elige primero dos candidatos", selectBody: "Abre la lista regional y selecciona las plataformas que quieres comparar.",
    telegramEyebrow: "Si necesitas orientación", telegramTitle: "Continuar con el contexto", telegramBody: "Guarda mercado y producto en el sitio antes de seguir en Telegram.",
  },
  id: {
    aria: "Langkah keputusan regional", directoryEyebrow: "Saring kandidat dahulu", directoryTitle: "Tinjau kandidat platform", directoryBody: "Pertahankan konteks pasar, produk, dan tahap akun sebelum pendaftaran.",
    compareEyebrow: "Jika masih ragu", compareTitle: "Bandingkan sebelum memilih", compareBody: "Lihat biaya, identitas, pendanaan, dan cakupan produk dalam satu layar.",
    selectEyebrow: "Belum ada pasangan yang ditinjau", selectTitle: "Pilih dua kandidat dahulu", selectBody: "Buka daftar regional dan pilih platform yang ingin dibandingkan.",
    telegramEyebrow: "Perlu panduan", telegramTitle: "Lanjutkan dengan konteks", telegramBody: "Simpan konteks pasar dan produk di situs sebelum melanjutkan ke Telegram.",
  },
});

export function RegionalMarketPreview({ market = "MX", locale = "en", decisionPath = null, decisionPassport = {} }) {
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [accountStagesOpen, setAccountStagesOpen] = useState(false);
  const policy = resolveMarketPolicy({ market });
  const passportMarket = decisionPassport?.market && decisionPassport.market === policy.targetMarket ? decisionPassport.market : policy.targetMarket;
  const initialProduct = decisionPassport?.product || (policy.product === "unknown" ? "spot" : policy.product);
  const [selectedMarket, setSelectedMarket] = useState(passportMarket);
  const [selectedProduct, setSelectedProduct] = useState(initialProduct);
  const [selectedFunding, setSelectedFunding] = useState(decisionPassport?.funding || "");
  const [selectedAccountStage, setSelectedAccountStage] = useState(decisionPassport?.accountStage || "new_account");
  const [shortlistFiltersOpen, setShortlistFiltersOpen] = useState(true);
  const [researchEvidenceOpen, setResearchEvidenceOpen] = useState(true);
  const shortlist = buildRegionalShortlist({
    market: selectedMarket,
    locale,
    product: selectedProduct,
    funding: selectedFunding,
    accountStage: selectedAccountStage,
  });
  const shortlistCopy = regionalShortlistCopy(locale);
  const shortlistProductOptions = regionalShortlistProductOptions(locale);
  const shortlistAccountStageOptions = regionalShortlistAccountStageOptions(locale);
  const reviewedMarketOptions = regionalShortlistMarketOptions(locale);
  const marketOptions = reviewedMarketOptions.some((option) => option.value === policy.targetMarket)
    ? reviewedMarketOptions
    : [{ value: policy.targetMarket, label: policy.targetMarket === "VN" ? "Việt Nam · VND" : policy.targetMarket }, ...reviewedMarketOptions];
  const fundingOptions = shortlist.row?.paymentRails || [];
  const gate = marketEntryBrief({ market: policy.targetMarket, product: policy.product, locale });
  const isTraditionalChinese = locale === "zh-Hant" || locale === "zh-TW";
  const localeKey = locale === "pt-BR" ? "pt-BR" : String(locale || "").split("-")[0];
  const ui = UI_COPY[locale] || UI_COPY[localeKey] || UI_COPY.en;
  const labels = REGIONAL_LABELS[locale] || REGIONAL_LABELS[localeKey] || REGIONAL_LABELS.en || {};
  const mxMobileCompressionEnabled = policy.targetMarket === "MX" && (localeKey === "en" || localeKey === "es");
  useEffect(() => {
    if (!mxMobileCompressionEnabled || typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    // Viewport sets the initial default only; subsequent choices belong to the reader.
    const initialOpen = !window.matchMedia("(max-width: 720px)").matches;
    setShortlistFiltersOpen(initialOpen);
    setResearchEvidenceOpen(initialOpen);
    return undefined;
  }, [mxMobileCompressionEnabled]);
  const directoryProduct = selectedProduct;
  const directoryHref = regionalDirectoryHref({ market: selectedMarket, locale, product: selectedProduct, stage: selectedAccountStage, funding: shortlist.funding });
  const ratesHref = regionalToolHref({ path: "/rates", market: selectedMarket, locale, product: selectedProduct, accountStage: selectedAccountStage, funding: shortlist.funding });
  const compareHref = shortlist.compareHref;
  const telegramHref = shortlist.telegramHref;
  const rawRegistry = internationalSourcesFor(policy.targetMarket);
  const localizedAuthorityCopy = AUTHORITY_COPY[policy.targetMarket]?.[locale] || AUTHORITY_COPY[policy.targetMarket]?.[localeKey];
  const localizedAuthority = policy.targetMarket === "HK" && isTraditionalChinese
    ? "香港證券及期貨事務監察委員會與平台官方資料"
    : localizedAuthorityCopy
    ? localizedAuthorityCopy
    : rawRegistry.authority;
  const registry = { ...rawRegistry, authority: localizedAuthority };
  const campaign = `${selectedMarket.toLowerCase()}-research-preview`;
  const marketOwnedCopy = policy.targetMarket === "MX" && localeKey === "en" ? MX_EN_COPY : COPY[policy.targetMarket];
  const baseCopy = marketOwnedCopy || {
    title: "International market path",
    summary: "This regional path is being validated. Use the global directory while local conditions are checked.",
    questions: ["Where do you reside?", "Which product do you need?", "Do you already have an account?"],
    decisionLanes: [["new_account", "First account", "Set your country and product before comparing.", "Compare account paths"], ["another_platform", "Another platform already", "Review the reason and conditions before adding an account.", "Review differences"], ["existing_account", "Target account exists", "Verify the current account terms in the official flow.", "Review account terms"]],
    warning: "Conditions and offers must be checked for your account.",
    sources: [],
  };
  const mxDecisionCopy = policy.targetMarket === "MX"
    ? (localeKey === "en" ? MX_DECISION_PAGE_COPY_EN[decisionPath] : localeKey === "es" ? MX_DECISION_PAGE_COPY[decisionPath] : null)
    : null;
  const copy = mxDecisionCopy ? {
    ...baseCopy,
    ...mxDecisionCopy,
    sources: baseCopy.sources || [],
    sourceChecks: mxDecisionCopy.sourceChecks || baseCopy.sourceChecks,
  } : baseCopy;
  const localizedRegionalTitles = {
    HK: {
      "zh-Hant": "香港：先核對帳戶與產品資格",
      ja: "香港：口座と商品の利用条件を先に確認",
      ko: "홍콩: 계정 및 상품 이용 자격을 먼저 확인하세요",
      de: "Hongkong: Konto- und Produktberechtigung zuerst prüfen",
      fr: "Hong Kong : vérifiez d’abord le compte et les produits disponibles",
      es: "Hong Kong: verifica primero la cuenta y los productos disponibles",
      tr: "Hong Kong: hesap ve ürün uygunluğunu önce doğrulayın",
      ar: "هونغ كونغ: تحقق أولاً من أهلية الحساب والمنتج",
      ru: "Гонконг: сначала проверьте доступность аккаунта и продукта",
      id: "Hong Kong: periksa kelayakan akun dan produk terlebih dahulu",
      vi: "Hong Kong: hãy kiểm tra điều kiện tài khoản và sản phẩm trước",
      it: "Hong Kong: verifica prima l’idoneità dell’account e del prodotto",
    },
    EU: {
      de: "Europäische Union: Kontobedingungen nach Land vergleichen",
      "zh-Hant": "歐盟：按國家比較帳戶條件",
      ja: "EU：国ごとの口座条件を比較",
      ko: "유럽연합: 국가별 계정 조건을 비교하세요",
      fr: "Union européenne : comparez les conditions de compte par pays",
      es: "Unión Europea: compara las condiciones de cuenta por país",
      tr: "Avrupa Birliği: hesap koşullarını ülkeye göre karşılaştırın",
      ar: "الاتحاد الأوروبي: قارن شروط الحساب حسب الدولة",
      ru: "Европейский союз: сравните условия аккаунта по странам",
      id: "Uni Eropa: bandingkan ketentuan akun berdasarkan negara",
      vi: "Liên minh châu Âu: so sánh điều kiện tài khoản theo quốc gia",
      it: "Unione europea: confronta le condizioni dell’account per paese",
    },
    TR: {
      tr: "Türkiye: SPK, TRY ve hesap kapsamını birlikte kontrol edin",
    },
    UK: {
      ar: "المملكة المتحدة: تحقق من الإقامة ونطاق المنتج",
      ru: "Великобритания: проверьте резидентство и доступность продукта",
      id: "Inggris Raya: verifikasi domisili dan cakupan produk",
      vi: "Vương quốc Anh: xác minh nơi cư trú và phạm vi sản phẩm",
      it: "Regno Unito: verifica residenza e disponibilità dei prodotti",
    },
    OTHER: {
      ar: "مسار السوق الدولي: حدد بلدك قبل اختيار منصة",
    },
  };
  const localizedTitle = localizedRegionalTitles[policy.targetMarket]?.[locale]
    || localizedRegionalTitles[policy.targetMarket]?.[localeKey]
    || copy.title;
  const localizedRegionalSummaries = {
    HK: { "zh-Hans": "用于核对港币入金、身份验证和平台产品可用性的研究路径。", "zh-Hant": "用於核對港幣入金、身分驗證與平台產品可用性的研究路徑。", es: "Ruta de investigación para depósitos en HKD, identidad y acceso a productos según la plataforma.", fr: "Parcours de recherche sur les dépôts en HKD, l’identité et l’accès aux produits selon la plateforme.", de: "Recherchepfad für HKD-Einzahlungen, Identität und plattformabhängigen Produktzugang.", "pt-BR": "Rota de pesquisa para depósitos em HKD, identidade e acesso a produtos por plataforma.", ja: "HKD入金経路、本人確認、プラットフォームごとの商品利用可否を確認する調査経路です。", ko: "HKD 입금 경로, 본인확인 및 플랫폼별 상품 이용 가능 여부를 확인하는 리서치 경로입니다.", tr: "HKD fonlama yollarını, kimlik kontrollerini ve platforma göre ürün erişimini inceleyen araştırma yoludur.", ar: "مسار بحث للتحقق من طرق تمويل HKD والهوية وإتاحة المنتجات حسب المنصة.", ru: "Исследовательский путь для проверки пополнения в HKD, личности и доступа к продуктам по конкретной площадке.", id: "Jalur riset untuk rute pendanaan HKD, pemeriksaan identitas, dan akses produk sesuai platform.", vi: "Lộ trình nghiên cứu về nạp HKD, xác minh danh tính và quyền truy cập sản phẩm theo từng nền tảng.", it: "Percorso di ricerca per verificare finanziamento in HKD, identità e accesso ai prodotti secondo la piattaforma." },
    EU: { ja: "EUR、SEPA、各国のコンプライアンス条件を確認するための調査経路です。", ko: "플랫폼 계정의 EUR, SEPA 및 국가별 규제 조건을 확인하는 리서치 경로입니다.", tr: "Platform hesaplarında EUR, SEPA ve ülkeye göre uyum koşullarını inceleyen araştırma yoludur.", "pt-BR": "Rota de pesquisa para EUR, SEPA e condições de conformidade específicas de cada país.", ar: "مسار بحث لليورو وSEPA وشروط الامتثال الخاصة بكل دولة لحسابات المنصات.", ru: "Исследовательский путь для EUR, SEPA и страновых требований к соответствию для аккаунтов площадок.", id: "Jalur riset untuk EUR, SEPA, dan persyaratan kepatuhan per negara pada akun platform.", vi: "Lộ trình nghiên cứu về EUR, SEPA và điều kiện tuân thủ theo từng quốc gia trên tài khoản nền tảng.", it: "Percorso di ricerca per EUR, SEPA e condizioni di conformità specifiche per paese sui conti delle piattaforme.", es: "Ruta de investigación sobre EUR, SEPA y las condiciones de cumplimiento de cada país para las cuentas de las plataformas.", fr: "Parcours de recherche sur l’EUR, SEPA et les conditions de conformité propres à chaque pays.", de: "Recherchepfad für EUR, SEPA und länderspezifische Compliance-Bedingungen.", pt: "Rota de pesquisa para EUR, SEPA e condições de conformidade específicas de cada país." },
    UK: { "zh-Hans": "用于核对英镑入金、账户检查和平台产品可用性的研究路径。", "zh-Hant": "用於核對英鎊入金、帳戶檢查與平台產品可用性的研究路徑。", es: "Ruta de investigación sobre depósitos en GBP, controles de cuenta y disponibilidad de productos.", fr: "Parcours de recherche sur les dépôts en GBP, les contrôles du compte et la disponibilité des produits.", de: "Recherchepfad für GBP-Einzahlungen, Kontoprüfungen und Produktverfügbarkeit.", "pt-BR": "Rota de pesquisa para depósitos em GBP, verificações da conta e disponibilidade de produtos.", ja: "GBP入金、口座確認、プラットフォームごとの商品利用可否を確認する調査経路です。", ko: "GBP 입금, 계정 확인 및 플랫폼별 상품 이용 가능 여부를 확인하는 리서치 경로입니다.", tr: "GBP fonlamasını, hesap kontrollerini ve platform koşullarına göre ürün erişimini inceleyen araştırma yoludur.", ar: "مسار بحث للتحقق من تمويل GBP وفحوص الحساب وإتاحة المنتجات وفق شروط المنصة.", ru: "Исследовательский путь для проверки пополнения в GBP, требований к аккаунту и доступности продуктов.", id: "Jalur riset untuk pendanaan GBP, pemeriksaan akun, dan ketersediaan produk sesuai ketentuan platform.", vi: "Lộ trình nghiên cứu về nạp GBP, kiểm tra tài khoản và khả năng sử dụng sản phẩm theo điều kiện nền tảng.", it: "Percorso di ricerca per finanziamento in GBP, controlli dell’account e disponibilità dei prodotti secondo la piattaforma." }
    ,TR: { tr: "SPK geçici listesi, tasfiye listesi, Paribu hesap doğrulaması ve TRY yatırma rehberini ayrı kaynaklar olarak kontrol eden Türkiye araştırma yolu." },
    OTHER: { ar: "نقطة بداية محايدة للمستخدمين الذين لم يتم نشر مسار بحث خاص ببلدهم بعد." },
  };
  const localizedRegionalWarnings = {
    EU: {
      ar: "الوصول إلى الاتحاد الأوروبي ليس وعداً موحداً؛ تحقق من الدولة والمنتج وشروط الحساب.",
      es: "El acceso en la UE no es una promesa universal; confirma país, producto y condiciones de la cuenta.",
      fr: "L’accès dans l’UE n’est pas une promesse universelle : vérifiez le pays, le produit et les conditions du compte.",
      de: "Der Zugang in der EU ist kein einheitliches Versprechen; prüfen Sie Land, Produkt und Kontobedingungen.",
      ru: "Доступ в ЕС не является универсальным обещанием: проверьте страну, продукт и условия аккаунта.",
      vi: "Khả năng sử dụng tại EU không phải một cam kết chung; hãy xác minh quốc gia, sản phẩm và điều kiện tài khoản.",
      it: "L’accesso nell’UE non è una promessa universale: verifica paese, prodotto e condizioni dell’account.",
      ja: "EUでの利用は一律に保証されません。国、商品、口座条件を確認してください。",
      ko: "EU 이용 가능 여부는 일괄적으로 보장되지 않습니다. 국가, 상품 및 계정 조건을 확인하세요.",
      tr: "AB erişimi herkes için geçerli bir vaat değildir; ülke, ürün ve hesap koşullarını doğrulayın.",
      "pt-BR": "O acesso na UE não é uma promessa universal; confirme país, produto e condições da conta.",
      id: "Akses di UE bukan janji yang berlaku untuk semua; verifikasi negara, produk, dan ketentuan akun.",
    },
    UK: {
      "zh-Hans": "资格、产品范围和用户条件必须在官方账户流程中确认。",
      "zh-Hant": "資格、產品範圍與用戶條件必須在官方帳戶流程中確認。",
      es: "La elegibilidad, el alcance del producto y las condiciones deben confirmarse en el flujo oficial.",
      fr: "L’éligibilité, le périmètre des produits et les conditions doivent être vérifiés dans le parcours officiel.",
      de: "Berechtigung, Produktumfang und Bedingungen müssen im offiziellen Kontoprozess geprüft werden.",
      "pt-BR": "Elegibilidade, escopo do produto e condições devem ser verificados no fluxo oficial.",
      ja: "利用資格、商品範囲、ユーザー向け条件は公式アカウント手続きで確認してください。",
      ko: "자격, 상품 범위 및 사용자 혜택은 공식 계정 절차에서 확인해야 합니다.",
      tr: "Uygunluk, ürün kapsamı ve kullanıcı koşulları resmi hesap akışında doğrulanmalıdır.",
      id: "Kelayakan, cakupan produk, dan manfaat pengguna harus diperiksa melalui proses akun resmi.",
    },
    HK: {
      "zh-Hans": "地区访问和账户条件必须在官方平台中确认。",
      "zh-Hant": "地區存取與帳戶條件必須在官方平台中確認。",
      es: "El acceso regional y las condiciones de la cuenta deben verificarse en la plataforma oficial.",
      fr: "L’accès régional et les conditions du compte doivent être vérifiés sur la plateforme officielle.",
      de: "Regionaler Zugang und Kontobedingungen müssen auf der offiziellen Plattform geprüft werden.",
      "pt-BR": "O acesso regional e as condições da conta devem ser verificados na plataforma oficial.",
      ja: "地域アクセスと口座条件は公式プラットフォームで確認してください。",
      ko: "지역 접근성과 계정 조건은 공식 플랫폼에서 확인해야 합니다.",
      tr: "Bölgesel erişim ve hesap koşulları resmi platformda doğrulanmalıdır.",
      id: "Akses regional dan ketentuan akun harus diverifikasi di platform resmi.",
    },
    TR: {
      tr: "SPK listesi ve tasfiye durumu hesap uygunluğu değildir; kimlik, TRY fonlama, ürün kapsamı ve fayda koşulları resmi hesap akışında doğrulanmalıdır.",
    },
    OTHER: {
      ar: "حدد سوقاً واضحاً قبل اعتبار أي مسار تسجيل مؤهلاً.",
    },
  };
  const localizedRegionalQuestions = {
    EU: {
      ar: ["في أي دولة يقيم حسابك؟", "هل تدعم المنصة المنتج الذي تريده في تلك الدولة؟", "ما متطلبات التمويل والتحقق من الهوية لحسابك؟"],
      es: ["¿En qué país reside tu cuenta?", "¿La plataforma admite el producto que buscas en ese país?", "¿Qué controles de financiación e identidad se aplican a tu cuenta?"],
      fr: ["Dans quel pays votre compte est-il domicilié ?", "La plateforme prend-elle en charge le produit souhaité dans ce pays ?", "Quels contrôles de financement et d’identité s’appliquent à votre compte ?"],
      de: ["In welchem Land ist Ihr Konto ansässig?", "Unterstützt die Plattform Ihr gewünschtes Produkt in diesem Land?", "Welche Finanzierungs- und Identitätsprüfungen gelten für Ihr Konto?"],
      ru: ["В какой стране зарегистрирован ваш аккаунт?", "Поддерживает ли площадка нужный продукт в этой стране?", "Какие проверки пополнения и личности применяются к аккаунту?"],
      vi: ["Tài khoản của bạn cư trú ở quốc gia nào?", "Nền tảng có hỗ trợ sản phẩm bạn cần tại quốc gia đó không?", "Tài khoản của bạn cần những bước nạp tiền và xác minh danh tính nào?"],
      it: ["In quale paese risiede il tuo account?", "La piattaforma supporta il prodotto desiderato in quel paese?", "Quali controlli di finanziamento e identità valgono per il tuo account?"],
    },
  };
  const localizedRegionalAnswers = {
    EU: {
      ar: ["تحقق من دولة إقامة الحساب قبل مقارنة المنصات.", "قد يختلف توفر المنتج حسب الدولة والكيان الذي يقدم الخدمة.", "راجع متطلبات الإيداع والتحقق في المسار الرسمي للحساب."],
      es: ["Confirma el país de residencia de la cuenta antes de comparar plataformas.", "La disponibilidad del producto puede variar según el país y la entidad que presta el servicio.", "Revisa los requisitos de financiación e identidad en el flujo oficial de la cuenta."],
      fr: ["Vérifiez le pays de résidence du compte avant de comparer les plateformes.", "La disponibilité du produit peut varier selon le pays et l’entité qui fournit le service.", "Vérifiez les exigences de financement et d’identité dans le parcours officiel du compte."],
      de: ["Prüfen Sie das Wohnsitzland des Kontos, bevor Sie Plattformen vergleichen.", "Die Produktverfügbarkeit kann je nach Land und Anbieter variieren.", "Prüfen Sie Finanzierungs- und Identitätsanforderungen im offiziellen Kontoprozess."],
      ru: ["Проверьте страну резидентства аккаунта до сравнения площадок.", "Доступность продукта может зависеть от страны и обслуживающей организации.", "Проверьте требования к пополнению и личности в официальном процессе аккаунта."],
      vi: ["Hãy xác minh quốc gia cư trú của tài khoản trước khi so sánh nền tảng.", "Khả năng dùng sản phẩm có thể khác theo quốc gia và pháp nhân cung cấp dịch vụ.", "Kiểm tra yêu cầu nạp tiền và xác minh trong quy trình tài khoản chính thức."],
      it: ["Verifica il paese di residenza dell’account prima di confrontare le piattaforme.", "La disponibilità del prodotto può cambiare in base al paese e all’entità che lo offre.", "Controlla i requisiti di finanziamento e verifica nel percorso ufficiale dell’account."],
    },
  };
  const genericRegionalQuestions = {
    ja: ["居住地と本人確認書類はこの口座で受け付けられますか？", "利用できる入金方法と通貨は何ですか？", "必要な商品はこの口座で利用できますか？"],
    ko: ["거주 국가와 신분증이 이 계정에서 허용되나요?", "사용할 수 있는 입금 방법과 통화는 무엇인가요?", "필요한 상품을 이 계정에서 이용할 수 있나요?"],
    tr: ["İkamet ülkeniz ve kimliğiniz bu hesap için kabul ediliyor mu?", "Hangi para yatırma yöntemi ve para birimi kullanılabilir?", "İhtiyacınız olan ürün bu hesapta kullanılabilir mi?"],
    ar: ["هل تُقبل دولة إقامتك ووثيقة هويتك لهذا الحساب؟", "ما طريقة الإيداع والعملة المتاحة؟", "هل المنتج الذي تحتاجه متاح في هذا الحساب؟"],
    es: ["¿Se aceptan tu país de residencia y tu documento de identidad?", "¿Qué método y moneda de depósito están disponibles?", "¿El producto que necesitas está disponible en esta cuenta?"],
    fr: ["Votre pays de résidence et votre pièce d’identité sont-ils acceptés ?", "Quelle méthode et quelle devise de dépôt sont disponibles ?", "Le produit souhaité est-il disponible sur ce compte ?"],
    de: ["Werden Ihr Wohnsitzland und Ihr Ausweis akzeptiert?", "Welche Einzahlungsart und Währung sind verfügbar?", "Ist das gewünschte Produkt für dieses Konto verfügbar?"],
    ru: ["Принимаются ли ваша страна проживания и документ для этого аккаунта?", "Какой способ и какая валюта пополнения доступны?", "Доступен ли нужный продукт для этого аккаунта?"],
    "pt-BR": ["Seu país de residência e documento são aceitos?", "Qual método e moeda de depósito estão disponíveis?", "O produto que você precisa está disponível nesta conta?"],
    vi: ["Quốc gia cư trú và giấy tờ của bạn có được chấp nhận không?", "Phương thức và loại tiền nạp nào khả dụng?", "Sản phẩm bạn cần có được hỗ trợ trên tài khoản này không?"],
    it: ["Il tuo paese di residenza e il documento sono accettati?", "Quale metodo e valuta di deposito sono disponibili?", "Il prodotto che ti serve è disponibile su questo account?"],
    id: ["Apakah negara domisili dan dokumen identitas Anda diterima?", "Metode dan mata uang deposit apa yang tersedia?", "Apakah produk yang Anda perlukan tersedia di akun ini?"],
    "zh-Hans": ["你的居住国家和身份证件是否被接受？", "可以使用哪些入金方式和货币？", "你需要的产品是否在此账户中可用？"],
    "zh-Hant": ["你的居住國家與身分文件是否被接受？", "可以使用哪些入金方式與貨幣？", "你需要的產品是否可在此帳戶使用？"],
  };
  const genericAnswerTerminator = (key) => key === "ja" || key === "zh-Hans" || key === "zh-Hant" ? "。" : ".";
  const genericRegionalAnswers = Object.fromEntries(Object.entries(genericRegionalQuestions).map(([key, questions]) => [key, questions.map((question) => question.replace(/[？?]$/, genericAnswerTerminator(key)))]));
  const marketOwnedQuestionLocale = { JP: "ja", KR: "ko", TR: "tr", ID: "id" }[policy.targetMarket];
  const useMarketOwnedQuestionSet = marketOwnedQuestionLocale === locale;
  const localizedSummary = localizedRegionalSummaries[policy.targetMarket]?.[locale]
    || localizedRegionalSummaries[policy.targetMarket]?.[localeKey]
    || copy.summary;
  const localizedWarning = localizedRegionalWarnings[policy.targetMarket]?.[locale]
    || localizedRegionalWarnings[policy.targetMarket]?.[localeKey]
    || copy.warning;
  const localizedQuestions = localizedRegionalQuestions[policy.targetMarket]?.[locale]
    || localizedRegionalQuestions[policy.targetMarket]?.[localeKey]
    || (useMarketOwnedQuestionSet ? copy.questions : null)
    || (locale !== "en" ? genericRegionalQuestions[locale] || genericRegionalQuestions[localeKey] : null)
    || copy.questions;
  const localizedAnswers = localizedRegionalAnswers[policy.targetMarket]?.[locale]
    || localizedRegionalAnswers[policy.targetMarket]?.[localeKey]
    || (useMarketOwnedQuestionSet ? copy.answers : null)
    || (locale !== "en" ? genericRegionalAnswers[locale] || genericRegionalAnswers[localeKey] : null)
    || copy.answers;
  const localizedDecisionLanes = {
    "zh-Hans": [["new_account", "第一次开户", "先确认国家、产品和入金方式，再选择平台。", "比较开户选项"], ["another_platform", "已经在使用其他平台", "新增账户前先比较条件和差异。", "查看差异"], ["existing_account", "已有目标账户", "在官方流程中确认当前账户条件。", "核对账户条件"]],
    "zh-Hant": [["new_account", "第一次開戶", "先確認國家、產品與入金方式，再選擇平台。", "比較開戶選項"], ["another_platform", "已在使用其他平台", "新增帳戶前先比較條件與差異。", "查看差異"], ["existing_account", "已有目標帳戶", "在官方流程中確認目前帳戶條件。", "核對帳戶條件"]],
    es: [["new_account", "Primera cuenta", "Confirma país, producto y financiación antes de elegir.", "Comparar opciones"], ["another_platform", "Ya usas otra plataforma", "Compara las condiciones antes de añadir otra cuenta.", "Ver diferencias"], ["existing_account", "Ya tienes la cuenta objetivo", "Verifica las condiciones actuales en el flujo oficial.", "Revisar condiciones"]],
    "pt-BR": [["new_account", "Primeira conta", "Confirme país, produto e forma de pagamento antes de escolher.", "Comparar opções"], ["another_platform", "Já usa outra plataforma", "Compare as condições antes de adicionar outra conta.", "Ver diferenças"], ["existing_account", "Já tem a conta desejada", "Confirme as condições atuais no fluxo oficial.", "Revisar condições"]],
    fr: [["new_account", "Premier compte", "Vérifiez pays, produit et financement avant de choisir.", "Comparer les options"], ["another_platform", "Une autre plateforme déjà utilisée", "Comparez les conditions avant d’ajouter un compte.", "Voir les différences"], ["existing_account", "Compte cible déjà ouvert", "Vérifiez les conditions actuelles dans le parcours officiel.", "Vérifier les conditions"]],
    de: [["new_account", "Erstes Konto", "Land, Produkt und Zahlungsweg vor der Auswahl prüfen.", "Optionen vergleichen"], ["another_platform", "Andere Plattform bereits vorhanden", "Bedingungen vergleichen, bevor ein weiteres Konto eröffnet wird.", "Unterschiede prüfen"], ["existing_account", "Zielkonto bereits vorhanden", "Aktuelle Bedingungen im offiziellen Ablauf prüfen.", "Kontobedingungen prüfen"]],
    ja: [["new_account", "初めて口座を作る", "国、商品、入金経路を確認してから選びます。", "候補を比較"], ["another_platform", "別のサービスを利用中", "追加口座を作る前に条件を比較します。", "違いを確認"], ["existing_account", "対象口座を保有中", "公式手続きで現在の条件を確認します。", "口座条件を確認"]],
    ko: [["new_account", "처음 계정 만들기", "국가, 상품, 입금 경로를 먼저 확인하세요.", "후보 비교"], ["another_platform", "다른 플랫폼 이용 중", "추가 계정 전에 조건을 비교하세요.", "차이 확인"], ["existing_account", "대상 계정 보유", "공식 절차에서 현재 조건을 확인하세요.", "계정 조건 확인"]],
    ar: [["new_account", "الحساب الأول", "تحقق من الدولة والمنتج ومسار التمويل قبل الاختيار.", "مقارنة الخيارات"], ["another_platform", "تستخدم منصة أخرى", "قارن الشروط قبل إضافة حساب آخر.", "عرض الفروقات"], ["existing_account", "لديك الحساب المستهدف", "تحقق من الشروط الحالية في المسار الرسمي.", "مراجعة الشروط"]],
    tr: [["new_account", "İlk hesap", "Seçimden önce ülke, ürün ve fonlama yolunu kontrol edin.", "Seçenekleri karşılaştır"], ["another_platform", "Başka platform kullanıyorsunuz", "Yeni hesap eklemeden önce koşulları karşılaştırın.", "Farkları incele"], ["existing_account", "Hedef hesap mevcut", "Güncel koşulları resmî akışta doğrulayın.", "Hesap koşullarını incele"]],
    ru: [["new_account", "Первый аккаунт", "Проверьте страну, продукт и пополнение до выбора.", "Сравнить варианты"], ["another_platform", "Уже есть другая площадка", "Сравните условия до добавления нового аккаунта.", "Посмотреть различия"], ["existing_account", "Целевой аккаунт уже есть", "Проверьте текущие условия в официальном процессе.", "Проверить условия"]],
    id: [["new_account", "Akun pertama", "Periksa negara, produk, dan jalur dana sebelum memilih.", "Bandingkan pilihan"], ["another_platform", "Sudah memakai platform lain", "Bandingkan syarat sebelum menambah akun.", "Lihat perbedaan"], ["existing_account", "Akun tujuan sudah ada", "Verifikasi syarat saat ini melalui alur resmi.", "Periksa syarat"]],
    vi: [["new_account", "Tài khoản đầu tiên", "Kiểm tra quốc gia, sản phẩm và cách nạp trước khi chọn.", "So sánh lựa chọn"], ["another_platform", "Đang dùng nền tảng khác", "So sánh điều kiện trước khi mở thêm tài khoản.", "Xem khác biệt"], ["existing_account", "Đã có tài khoản mục tiêu", "Xác minh điều kiện hiện tại trong quy trình chính thức.", "Kiểm tra điều kiện"]],
    it: [["new_account", "Primo account", "Verifica paese, prodotto e finanziamento prima di scegliere.", "Confronta le opzioni"], ["another_platform", "Usi già un’altra piattaforma", "Confronta le condizioni prima di aggiungere un account.", "Vedi le differenze"], ["existing_account", "Account obiettivo già presente", "Verifica le condizioni attuali nel percorso ufficiale.", "Verifica le condizioni"]],
  };
  const decisionLanes = ["HK", "EU", "UK", "OTHER"].includes(policy.targetMarket)
    ? (localizedDecisionLanes[locale] || localizedDecisionLanes[localeKey] || copy.decisionLanes)
    : copy.decisionLanes;
  const sourceMeta = registry.sources.length
    ? `${registry.authority} · ${INTERNATIONAL_SOURCE_REVIEWED_AT}`
    : (locale === "zh-Hant" ? "來源包待補充" : locale.startsWith("zh") ? "来源包待补充" : ui.sourcePending);
  const pageBoundary = regionalPageBoundary({ registry, locale, reviewedAt: INTERNATIONAL_SOURCE_REVIEWED_AT });
  const questionNextSteps = regionalQuestionNextSteps({ gate, registry, locale, product: directoryProduct });
  const aeoQuestions = aeoQuestionsForMarket(policy.targetMarket);
  const aeoCoverageSummary = regionalAeoCoverageSummary({ market: policy.targetMarket, questions: aeoQuestions, registry, locale });
  const accountStageToggle = accountStagesOpen
    ? (locale === "zh-Hant" ? "收起其他帳戶階段" : locale.startsWith("zh") ? "收起其他账户阶段" : ui.hideAccountStages || "Hide other account stages")
    : (locale === "zh-Hant" ? "查看其他帳戶階段" : locale.startsWith("zh") ? "查看其他账户阶段" : ui.viewAccountStages || "View other account stages");
  const globalCompareHref = contextualHref("/compare/binance-vs-okx", { market: selectedMarket, locale, product: selectedProduct, account_stage: selectedAccountStage, funding: shortlist.funding });
  const hasReviewedComparePair = Boolean(shortlist.pair && String(compareHref || "").includes("/compare/"));
  const firstScreenCompareHref = hasReviewedComparePair ? compareHref : directoryHref;
  const onsiteTelegramHref = contextualHref("/telegram", { market: selectedMarket, locale, product: selectedProduct, account_stage: selectedAccountStage, funding: shortlist.funding, return: telegramHref });
  const relatedHref = (type) => type === "rates" ? ratesHref : type === "compare" ? compareHref : type === "compare-global" ? globalCompareHref : directoryHref;
  const relatedResearch = copy.relatedResearch ? localizedRelatedResearch(copy.relatedResearch, policy.targetMarket, locale) : null;
  const bridgeCandidate = shortlist.candidates.find((candidate) => candidate.slug && candidate.directHref) || shortlist.candidates.find((candidate) => candidate.slug);
  const quickActionCopy = REGIONAL_QUICK_ACTION_COPY[locale] || REGIONAL_QUICK_ACTION_COPY[localeKey] || REGIONAL_QUICK_ACTION_COPY.en;
  const shortlistPrimaryCandidate = shortlist.candidates[0] || null;
  const shortlistSecondaryCandidates = shortlist.candidates.slice(1);
  const shortlistMoreCopy = {
    title: locale === "zh-Hant" ? "查看更多候選平台" : locale.startsWith("zh") ? "查看更多候选平台" : localeKey === "ja" ? "ほかの候補を見る" : localeKey === "ko" ? "다른 후보 보기" : localeKey === "tr" ? "Diğer adayları gör" : localeKey === "es" ? "Ver más candidatos" : localeKey === "id" ? "Lihat kandidat lain" : "View more candidates",
    note: locale === "zh-Hant" ? `${shortlistSecondaryCandidates.length} 個候選保留在同一研究清單中。` : locale.startsWith("zh") ? `${shortlistSecondaryCandidates.length} 个候选保留在同一研究清单中。` : localeKey === "ja" ? `${shortlistSecondaryCandidates.length} 件の候補を同じ調査リストに残しています。` : localeKey === "ko" ? `${shortlistSecondaryCandidates.length}개 후보를 같은 리서치 목록에 유지합니다.` : localeKey === "tr" ? `${shortlistSecondaryCandidates.length} aday aynı araştırma listesinde kalır.` : localeKey === "es" ? `${shortlistSecondaryCandidates.length} candidatos quedan en la misma lista de investigación.` : localeKey === "id" ? `${shortlistSecondaryCandidates.length} kandidat tetap dalam daftar riset yang sama.` : `${shortlistSecondaryCandidates.length} candidates remain in the same research list.`,
  };
  const mxMobileDisclosureCopy = localeKey === "es"
    ? { filters: "Cambiar filtros", research: "Evidencia y fuentes de investigación" }
    : { filters: "Change filters", research: "Research evidence and sources" };
  const selectedProductLabel = shortlistProductOptions.find((option) => option.value === selectedProduct)?.label || selectedProduct;
  const selectedFundingLabel = shortlist.funding ? localizedFundingOptionLabel(selectedMarket, locale, shortlist.funding) : (shortlistCopy.allFunding || "All funding");
  const selectedAccountStageLabel = shortlistAccountStageOptions.find((option) => option.value === selectedAccountStage)?.label || selectedAccountStage.replace(/_/g, " ");
  const shortlistFilterSummary = [selectedMarket, selectedProductLabel, selectedFundingLabel, selectedAccountStageLabel].filter(Boolean).join(" · ");
  const researchDisclosureSummary = [copy.directAnswer?.heading, sourceMeta].filter(Boolean).join(" · ");
  const shortlistControls = <div className="regional-market-preview__shortlist-controls" aria-label={shortlistCopy.controls}>
    <label>{shortlistCopy.residence}<select value={selectedMarket} onChange={(event) => { setSelectedMarket(event.target.value); setSelectedFunding(""); }}>
      {marketOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select></label>
    <label>{shortlistCopy.product}<select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>
      {shortlistProductOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select></label>
    <label>{shortlistCopy.funding}<select value={shortlist.funding} onChange={(event) => setSelectedFunding(event.target.value)}>
      {fundingOptions.map((option) => <option key={option} value={option}>{localizedFundingOptionLabel(selectedMarket, locale, option)}</option>)}
    </select></label>
    <label>{shortlistCopy.accountStage}<select value={selectedAccountStage} onChange={(event) => setSelectedAccountStage(event.target.value)}>
      {shortlistAccountStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select></label>
  </div>;
  const renderShortlistCandidate = (candidate) => <article key={candidate.id} className="v3-card" data-shortlist-state={candidate.status} data-shortlist-platform={candidate.slug || candidate.name}>
    <span>{shortlistCopy[candidate.status]}</span>
    <strong>{candidate.name}</strong>
    <p>{candidate.note}</p>
    <small>{localizedRegionalSourceLabel(candidate.sourceLabel, shortlist.market, locale)}</small>
    {candidate.directHref
      ? <a href={candidate.directHref} data-regional-funding={shortlist.funding} data-cta-kind="research" data-cta-placement="regional-shortlist-profile" data-growth-decision={`regional_shortlist_${candidate.slug}`} data-growth-placement="regional-shortlist-profile" data-growth-market={shortlist.market} data-growth-product={shortlist.product} data-growth-campaign={campaign}>{shortlistCopy.openProfile}</a>
      : <em>{candidate.status === REGIONAL_SHORTLIST_STATES.PAUSED ? shortlistCopy.noDirectCta : shortlistCopy.account_confirm}</em>}
  </article>;
  const firstScreenCompareCopy = hasReviewedComparePair
    ? { eyebrow: quickActionCopy.compareEyebrow, title: quickActionCopy.compareTitle, body: quickActionCopy.compareBody }
    : { eyebrow: quickActionCopy.selectEyebrow, title: quickActionCopy.selectTitle, body: quickActionCopy.selectBody };
  const onchainHref = (type) => {
    if (type === "uniswap" || type === "jupiter") return localizedHref(`/exchanges/${type}?market=${policy.targetMarket}&product=${directoryProduct}`, { locale });
    return relatedHref(type);
  };
  const researchSections = <>
      {copy.directAnswer && <section className="regional-market-preview__direct-answer v3-card" data-aeo-direct-answer data-growth-market={policy.targetMarket} data-growth-product={directoryProduct}>
        <details className="regional-market-preview__direct-answer-disclosure">
          <summary>
            <span>
              <strong>{copy.directAnswer.heading}</strong>
              <small>{copy.directAnswer.bullets.slice(0, 2).join(" · ")}</small>
            </span>
            <b aria-hidden="true">＋</b>
          </summary>
          <div className="regional-market-preview__direct-answer-body">
            <p>{copy.directAnswer.text}</p>
            <ul>
              {copy.directAnswer.bullets.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </details>
      </section>}
      <RegionalMarketDecisionDepth market={policy.targetMarket} />
      <RegionalProofPack copy={copy} policy={policy} />
      <RegionalAeoCompactAnswer summary={aeoCoverageSummary} questionsOpen={questionsOpen} />
      {copy.onchainDecision && <section className="regional-market-preview__onchain v3-card" data-regional-onchain-decision={policy.targetMarket}>
        <div className="regional-market-preview__onchain-copy">
          <h2>{copy.onchainDecision.heading}</h2>
          <p>{copy.onchainDecision.answer}</p>
          <small>{copy.onchainDecision.boundary}</small>
        </div>
        <div className="regional-market-preview__onchain-checklist">
          <ul>
            {copy.onchainDecision.checklist.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <nav aria-label={`${policy.targetMarket} on-chain and funding research links`}>
            {copy.onchainDecision.links.map(([type, label, note]) => <a key={type} href={onchainHref(type)} data-regional-funding={shortlist.funding} data-cta-kind="research" data-cta-placement={`regional-onchain-${type}`} data-growth-decision={`regional_onchain_${type}`} data-growth-placement={`regional-onchain-${type}`} data-growth-market={policy.targetMarket} data-growth-product={directoryProduct} data-growth-campaign={campaign}>
              <strong>{label}</strong>
              <span>{note}</span>
            </a>)}
          </nav>
        </div>
      </section>}
      {relatedResearch && <section className="regional-market-preview__related" aria-label={copy.relatedLabel || "Related regional research paths"} data-regional-related={policy.targetMarket}>
        <details className="regional-market-preview__related-disclosure">
          <summary>
            <span>
              <strong>{copy.relatedLabel || "Related regional research paths"}</strong>
              <small>{relatedResearch.map(([, label]) => label).slice(0, 2).join(" · ")}</small>
            </span>
            <b aria-hidden="true">＋</b>
          </summary>
          <div className="regional-market-preview__related-grid">
            {relatedResearch.map(([type, label, note]) => <a key={type} href={relatedHref(type)} data-regional-funding={shortlist.funding} data-cta-kind="research" data-cta-placement={`regional-related-${type}`} data-growth-decision={`regional_related_${type}`} data-growth-placement={`regional-related-${type}`} data-growth-market={selectedMarket} data-growth-product={directoryProduct} data-growth-campaign={campaign}>
              <strong>{label}</strong>
              <span>{note}</span>
            </a>)}
          </div>
        </details>
      </section>}
      {policy.targetMarket === "OTHER" && <InternationalRouteCards locale={locale} fallbackHref={directoryHref} />}
      <FundingVerificationMatrix market={policy.targetMarket} locale={locale} />
      <section className="regional-market-preview__questions" aria-labelledby="regional-questions-title">
        <div className="regional-market-preview__questions-heading">
          <h2 id="regional-questions-title">{locale === "zh-Hant" ? "這條研究路徑回答什麼" : locale.startsWith("zh") ? "这条研究路径回答什么" : ui.questions}</h2>
          <button type="button" className="regional-market-preview__questions-toggle" aria-expanded={questionsOpen} aria-controls="regional-question-list" onClick={() => setQuestionsOpen((open) => !open)}>
            {questionsOpen
              ? (locale === "zh-Hant" ? "收起研究問題" : locale.startsWith("zh") ? "收起研究问题" : ui.hideQuestions)
              : (locale === "zh-Hant" ? "查看三條研究問題" : locale.startsWith("zh") ? "查看三条研究问题" : ui.viewQuestions)}
            <span aria-hidden="true">{questionsOpen ? " ↑" : " ↓"}</span>
          </button>
        </div>
        <div id="regional-question-list" className={`regional-market-preview__question-grid${questionsOpen ? " is-open" : ""}`}>
          {localizedQuestions.map((question, index) => <article key={question} className="v3-card" data-aeo-question={question} data-aeo-answer={localizedAnswers?.[index] || pageBoundary}><strong>{question}</strong><p>{localizedAnswers?.[index] || pageBoundary}</p><small>{questionNextSteps[index] || pageBoundary}</small></article>)}
        </div>
      </section>
      <section className="regional-market-preview__decision-lanes" aria-labelledby="regional-decision-lanes-title">
        <div className="regional-market-preview__questions-heading">
          <h2 id="regional-decision-lanes-title">{locale === "zh-Hant" ? "選擇你的帳戶階段" : locale.startsWith("zh") ? "选择你的账户阶段" : ui.accountStage}</h2>
        </div>
        <div id="regional-account-stages" className={`regional-market-preview__decision-grid${accountStagesOpen ? " is-open" : ""}`}>
          {(decisionLanes || []).map(([id, title, description, action], index) => <article key={id} className={`v3-card${index > 0 ? " regional-market-preview__decision-card--secondary" : ""}`} data-decision-stage={id}>
            <strong>{title}</strong><p>{description}</p>
            <a href={regionalDirectoryHref({ market: selectedMarket, locale, stage: id, product: selectedProduct, funding: shortlist.funding })} data-regional-funding={shortlist.funding} data-cta-kind="research" data-cta-placement="regional-account-stage" data-growth-decision={id} data-growth-placement="regional-account-stage" data-growth-market={selectedMarket} data-growth-product={directoryProduct} data-growth-campaign={campaign}>{action}</a>
          </article>)}
        </div>
        {(decisionLanes || []).length > 1 && <button type="button" className="regional-market-preview__decision-toggle" aria-expanded={accountStagesOpen} aria-controls="regional-account-stages" onClick={() => setAccountStagesOpen((open) => !open)}>
          {accountStageToggle}
          <span aria-hidden="true">{accountStagesOpen ? " ↑" : " ↓"}</span>
        </button>}
      </section>
      <aside className="regional-market-preview__source-status" data-source-reviewed-at={registry.sources.length ? INTERNATIONAL_SOURCE_REVIEWED_AT : "pending"}>
        <div>
          <strong>{locale === "zh-Hant" ? "來源狀態" : locale.startsWith("zh") ? "来源状态" : ui.sourceStatus}</strong>
          <span>{sourceMeta}</span>
        </div>
        <p>{pageBoundary}</p>
      </aside>
      {(copy.sources.length > 0 || registry.sources.length > 0) && <div className="regional-market-preview__sources"><details className="regional-market-preview__sources-disclosure"><summary><strong>{locale === "zh-Hant" ? "官方來源" : locale.startsWith("zh") ? "官方来源" : ui.officialSources}</strong><span>{sourceMeta}</span><b aria-hidden="true">＋</b></summary><div className="regional-market-preview__sources-body"><p className="regional-market-preview__source-meta" data-source-reviewed-at={INTERNATIONAL_SOURCE_REVIEWED_AT}>{sourceMeta}</p>{[...copy.sources.map(([label, href]) => ({ label, href, note: "", role: "editorial-source" })), ...registry.sources.map((item) => localizedRegionalSourceItem({ label: item.label, href: item.url, note: item.note, role: item.role }, policy.targetMarket, locale))].map((item) => <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" data-cta-kind="source" data-cta-placement="regional-official-source" data-growth-decision={`regional_source_${policy.targetMarket}`} data-growth-placement="regional-official-source" data-growth-market={policy.targetMarket} data-growth-product={directoryProduct} data-growth-campaign={campaign}><strong>{item.label}</strong>{item.note && <small>{item.note}</small>}</a>)}</div></details></div>}
  </>;
  return <main className="v2-page v3-page regional-market-preview" id="top" dir={locale === "ar" ? "rtl" : "ltr"} data-mobile-compression={mxMobileCompressionEnabled ? "mx" : undefined}>
    <section className="v2-shell v2-section">
      <span className="v3-independent-badge">{policy.targetMarket} · {policy.product === "unknown" ? (labels.path || "research path") : policy.product}</span>
      <h1>{localizedTitle}</h1>
      <p>{localizedSummary}</p>
      <p className="v3-muted">{localizedWarning}</p>
      <nav className="regional-market-preview__quick-actions" aria-label={quickActionCopy.aria} data-regional-quick-actions={selectedMarket}>
        <a className="regional-market-preview__quick-action regional-market-preview__quick-action--primary" href={directoryHref} data-regional-funding={shortlist.funding} data-cta-kind="research" data-cta-placement="regional-first-screen-directory" data-growth-decision={`regional_first_screen_${selectedMarket}`} data-growth-placement="regional-first-screen-directory" data-growth-market={selectedMarket} data-growth-product={directoryProduct} data-growth-campaign={campaign}>
          <small>{quickActionCopy.directoryEyebrow}</small>
          <strong>{quickActionCopy.directoryTitle}</strong>
          <span>{quickActionCopy.directoryBody}</span>
        </a>
        <a className="regional-market-preview__quick-action" href={firstScreenCompareHref} data-regional-funding={shortlist.funding} data-regional-compare-mode={hasReviewedComparePair ? "reviewed-pair" : "select-candidates"} data-cta-kind="research" data-cta-placement="regional-first-screen-compare" data-growth-decision={hasReviewedComparePair ? `regional_first_screen_compare_${selectedMarket}` : `regional_first_screen_select_${selectedMarket}`} data-growth-placement="regional-first-screen-compare" data-growth-market={selectedMarket} data-growth-product={directoryProduct} data-growth-campaign={campaign}>
          <small>{firstScreenCompareCopy.eyebrow}</small>
          <strong>{firstScreenCompareCopy.title}</strong>
          <span>{firstScreenCompareCopy.body}</span>
        </a>
        <a className="regional-market-preview__quick-action" href={onsiteTelegramHref} data-regional-funding={shortlist.funding} data-cta-kind="research" data-cta-placement="regional-first-screen-telegram" data-growth-decision={`regional_first_screen_telegram_${selectedMarket}`} data-growth-placement="regional-first-screen-telegram" data-growth-market={selectedMarket} data-growth-product={directoryProduct} data-growth-campaign={campaign}>
          <small>{quickActionCopy.telegramEyebrow}</small>
          <strong>{quickActionCopy.telegramTitle}</strong>
          <span>{quickActionCopy.telegramBody}</span>
        </a>
      </nav>
      <div className="regional-market-preview__gate" data-market-gate={gate.market}>
        <article><strong>{ui.payment}</strong><span>{gate.paymentModes.join(" · ")}</span><small>{gate.paymentKnown ? (isTraditionalChinese ? "政策已記錄，仍以帳戶顯示為準" : locale.startsWith("zh") ? "政策已记录，仍以账户显示为准" : (labels.recorded || "Recorded in policy; account display is final")) : (isTraditionalChinese ? "需在官方帳戶內核驗" : locale.startsWith("zh") ? "需在官方账户内核验" : (labels.verify || "Verify in the official account"))}</small><small>{ui.accountCurrency}: {gate.accountCurrency.join(" · ") || "—"}</small></article>
        <article><strong>{ui.kyc}</strong><span>{gate.requiresKyc ? (isTraditionalChinese ? "需要身份驗證" : locale.startsWith("zh") ? "需要身份验证" : (labels.required || "Required")) : (isTraditionalChinese ? "未設定" : locale.startsWith("zh") ? "未设定" : (labels.unset || "Not set"))}</span><small>{gate.residenceMatchRequired ? (isTraditionalChinese ? "居住地與帳戶資格需匹配" : locale.startsWith("zh") ? "居住地与账户资格需匹配" : (labels.residence || "Residence and account eligibility must match")) : (isTraditionalChinese ? "按平台規則核驗" : locale.startsWith("zh") ? "按平台规则核验" : (labels.rules || "Check venue rules"))}</small></article>
        <article><strong>{ui.offer}</strong><span>{isTraditionalChinese ? "條件式" : locale.startsWith("zh") ? "条件式" : (labels.conditional || ui.conditional)}</span><small>{isTraditionalChinese ? "不把優惠寫成固定承諾" : locale.startsWith("zh") ? "不把优惠写成固定承诺" : (labels.noBenefit || "No fixed benefit promise")}</small></article>
      </div>
      <RegionalMobileDecisionDock
        locale={locale}
        market={selectedMarket}
        product={selectedProduct}
        accountStage={selectedAccountStage}
        funding={shortlist.funding}
        shortlist={shortlist}
      />
      <section className="regional-market-preview__shortlist" aria-labelledby="regional-shortlist-title" data-regional-shortlist={shortlist.market} data-regional-shortlist-product={shortlist.product} data-regional-shortlist-account-stage={shortlist.accountStage}>
        <div className="regional-market-preview__questions-heading">
          <div>
            <h2 id="regional-shortlist-title">{shortlistCopy.heading}</h2>
            <p>{shortlistCopy.note}</p>
          </div>
        </div>
        {mxMobileCompressionEnabled ? <details className="regional-market-preview__shortlist-filter-disclosure" open={shortlistFiltersOpen} onToggle={(event) => setShortlistFiltersOpen(event.currentTarget.open)}>
          <summary>
            <span>
              <strong>{mxMobileDisclosureCopy.filters}</strong>
              <small>{shortlistFilterSummary}</small>
            </span>
            <b aria-hidden="true">＋</b>
          </summary>
          {shortlistControls}
        </details> : shortlistControls}
        <div className="regional-market-preview__shortlist-grid">
          {shortlistPrimaryCandidate && renderShortlistCandidate(shortlistPrimaryCandidate)}
        </div>
        {shortlistSecondaryCandidates.length > 0 && <details className="regional-market-preview__shortlist-more">
          <summary>
            <span>
              <strong>{shortlistMoreCopy.title}</strong>
              <small>{shortlistMoreCopy.note}</small>
            </span>
            <b aria-hidden="true">＋</b>
          </summary>
          <div className="regional-market-preview__shortlist-more-grid">
            {shortlistSecondaryCandidates.map(renderShortlistCandidate)}
          </div>
        </details>}
      </section>
      <NextDecisionBridge
        className="regional-market-preview__cta-slot regional-market-preview__next-decision-bridge"
        locale={locale}
        market={selectedMarket}
        product={directoryProduct}
        profileSlug={bridgeCandidate?.slug}
        profileHref={bridgeCandidate?.directHref}
        profileLabel={bridgeCandidate?.name}
        compareHref={compareHref}
        telegramHref={onsiteTelegramHref}
        accountStage={selectedAccountStage}
        funding={shortlist.funding}
        placement="regional-preview-next-decision-bridge"
        decision={`regional_${selectedMarket}`}
      />
      {mxMobileCompressionEnabled ? <details className="regional-market-preview__mobile-research-disclosure" open={researchEvidenceOpen} onToggle={(event) => setResearchEvidenceOpen(event.currentTarget.open)}>
        <summary>
          <span>
            <strong>{mxMobileDisclosureCopy.research}</strong>
            <small>{researchDisclosureSummary}</small>
          </span>
          <b aria-hidden="true">＋</b>
        </summary>
        <div className="regional-market-preview__research-stack">
          {researchSections}
        </div>
      </details> : researchSections}
    </section>
  </main>;
}
