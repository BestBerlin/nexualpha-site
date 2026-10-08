// R9 inner-page strings, all 15 supported locales. Sentence case. Names stay untranslated where the site keeps them in English.
// you: start node of the route diagram; signup: its destination; route: the diagram's accessible name;
// scale: caption under the fee ledger ({max} is the scale's upper bound, e.g. "0.10%");
// cost: caption of the /rates cost axis; page: link to a venue's official source page;
// checked / pending: group captions on /factbook ({n} is the row count).
const C = (you, signup, route, scale, cost, page, checked, pending) => ({ you, signup, route, scale, cost, page, checked, pending });

export const innerR9Copy = {
  en: C("You", "Official sign-up", "Route to the official sign-up", "Bars share one scale across every venue, 0 to {max}", "Monthly cost, USDT", "Official page", "Fees checked · {n}", "Not yet checked · {n}"),
  "zh-Hans": C("你", "官方注册", "前往官方注册的路线", "所有平台的条形图使用同一刻度：0 至 {max}", "每月费用(USDT)", "官方页面", "费率已核验 · {n}", "暂未核实 · {n}"),
  "zh-Hant": C("你", "官方註冊", "前往官方註冊的路線", "所有平台的長條使用同一刻度：0 至 {max}", "每月費用(USDT)", "官方頁面", "費率已核驗 · {n}", "尚未核實 · {n}"),
  es: C("Tú", "Registro oficial", "Ruta al registro oficial", "Las barras usan una sola escala para todas las plataformas, de 0 a {max}", "Coste mensual, USDT", "Página oficial", "Comisiones revisadas · {n}", "Aún sin verificar · {n}"),
  "pt-BR": C("Você", "Cadastro oficial", "Caminho até o cadastro oficial", "As barras usam uma única escala para todas as plataformas, de 0 a {max}", "Custo mensal, USDT", "Página oficial", "Taxas verificadas · {n}", "Ainda não verificado · {n}"),
  fr: C("Vous", "Inscription officielle", "Parcours vers l'inscription officielle", "Les barres partagent une seule échelle pour toutes les plateformes, de 0 à {max}", "Coût mensuel, USDT", "Page officielle", "Frais vérifiés · {n}", "Pas encore vérifié · {n}"),
  de: C("Sie", "Offizielle Registrierung", "Weg zur offiziellen Registrierung", "Alle Balken nutzen eine gemeinsame Skala für jede Plattform, 0 bis {max}", "Monatliche Kosten, USDT", "Offizielle Seite", "Gebühren geprüft · {n}", "Noch nicht geprüft · {n}"),
  ja: C("あなた", "公式登録", "公式登録までのルート", "バーはすべての取引所で同じ目盛り(0〜{max})です", "月額コスト(USDT)", "公式ページ", "手数料確認済み · {n}", "未確認 · {n}"),
  ko: C("나", "공식 가입", "공식 가입까지의 경로", "막대는 모든 거래소에서 같은 눈금(0~{max})을 씁니다", "월 비용(USDT)", "공식 페이지", "수수료 확인됨 · {n}", "아직 확인되지 않음 · {n}"),
  tr: C("Siz", "Resmî kayıt", "Resmî kayda giden yol", "Çubuklar tüm platformlarda tek bir ölçek kullanır: 0 ile {max} arası", "Aylık maliyet, USDT", "Resmî sayfa", "Ücretler kontrol edildi · {n}", "Henüz kontrol edilmedi · {n}"),
  ru: C("Вы", "Официальная регистрация", "Маршрут к официальной регистрации", "Полосы используют одну шкалу для всех площадок: от 0 до {max}", "Расход в месяц, USDT", "Официальная страница", "Комиссии проверены · {n}", "Ещё не проверено · {n}"),
  ar: C("أنت", "التسجيل الرسمي", "المسار إلى التسجيل الرسمي", "تستخدم الأشرطة مقياسًا واحدًا لكل المنصات، من 0 إلى {max}", "التكلفة الشهرية، USDT", "الصفحة الرسمية", "تم التحقق من الرسوم · {n}", "لم يتم التحقق بعد · {n}"),
  id: C("Anda", "Pendaftaran resmi", "Rute ke pendaftaran resmi", "Batang memakai satu skala untuk semua platform, 0 hingga {max}", "Biaya bulanan, USDT", "Halaman resmi", "Biaya dicek · {n}", "Belum dicek · {n}"),
  vi: C("Bạn", "Đăng ký chính thức", "Lộ trình đến trang đăng ký chính thức", "Các thanh dùng chung một thang đo cho mọi nền tảng, từ 0 đến {max}", "Chi phí hằng tháng, USDT", "Trang chính thức", "Phí đã kiểm tra · {n}", "Chưa kiểm tra · {n}"),
  it: C("Tu", "Registrazione ufficiale", "Percorso verso la registrazione ufficiale", "Le barre usano un'unica scala per tutte le piattaforme, da 0 a {max}", "Costo mensile, USDT", "Pagina ufficiale", "Commissioni verificate · {n}", "Non ancora verificato · {n}"),
};

export const r9Text = (locale) => {
  const l = String(locale || "en");
  if (innerR9Copy[l]) return innerR9Copy[l];
  if (/^zh-(hant|tw|hk|mo)/i.test(l)) return innerR9Copy["zh-Hant"];
  if (/^zh/i.test(l)) return innerR9Copy["zh-Hans"];
  if (/^pt/i.test(l)) return innerR9Copy["pt-BR"];
  return innerR9Copy[l.split("-")[0]] || innerR9Copy.en;
};
