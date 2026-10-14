// Cost basis labels shared by the rates screen and the deferred calculator.
const basisKeys = ['group','base','rebate','perMonthBase','perMonthRebate','noShare','method'];
const basisRows = {
  // l10n: needs native review
  ur: ["لاگت کی بنیاد", "بنیادی فیس", "زیادہ سے زیادہ واپسی کے بعد", "ماہانہ · بنیادی فیس", "ماہانہ · زیادہ سے زیادہ واپسی کے بعد", "پارٹنر فیس واپسی کا ریکارڈ نہیں", "زیادہ سے زیادہ واپسی کے بعد = بنیادی لاگت × (1 − پارٹنر پروگرام کی سب سے زیادہ واپسی کا تناسب)، ہوم کیلکولیٹر کا یہی فارمولا سالانہ دکھایا جاتا ہے۔"],
  // l10n: needs native review
  uk: ["Основа розрахунку", "Базові комісії", "Після максимального повернення", "на місяць · базові комісії", "на місяць · після максимального повернення", "Партнерське повернення не зазначено", "Після максимального повернення = базова вартість × (1 − максимальна частка партнерського повернення); та сама формула, що й у калькуляторі головної сторінки, який показує рік."],

  en: ['Cost basis','Base fees','After max rebate','per month · base fees','per month · after max rebate','No partner rebate recorded','After max rebate = base cost × (1 − the partner programme’s top rebate share), the same formula as the home calculator (which shows a year).'],
  'zh-Hans': ['费用口径','基础费率','按最高返佣后','每月 · 基础费率','每月 · 按最高返佣后','无合作返佣记录','按最高返佣后 = 基础费用 × (1 − 合作计划最高返佣比例)，与首页计算器公式相同（首页按年显示）。'],
  'zh-Hant': ['費用口徑','基礎費率','按最高返傭後','每月 · 基礎費率','每月 · 按最高返傭後','無合作返傭紀錄','按最高返傭後 = 基礎費用 × (1 − 合作計畫最高返傭比例)，與首頁計算器公式相同（首頁按年顯示）。'],
  ja: ['費用の基準','基本手数料','最大還元後','月額 · 基本手数料','月額 · 最大還元後','パートナー還元の記録なし','最大還元後 = 基本コスト × (1 − パートナー制度の最大還元率)。ホームの計算機と同じ式です（ホームは年額表示）。'],
  ko: ['비용 기준','기본 수수료','최대 리베이트 후','월 · 기본 수수료','월 · 최대 리베이트 후','파트너 리베이트 기록 없음','최대 리베이트 후 = 기본 비용 × (1 − 파트너 프로그램 최대 리베이트 비율). 홈 계산기와 같은 공식입니다(홈은 연간 표시).'],
  tr: ['Maliyet esası','Temel ücretler','Azami iade sonrası','aylık · temel ücretler','aylık · azami iade sonrası','Kayıtlı ortaklık iadesi yok','Azami iade sonrası = temel maliyet × (1 − ortaklık programının en yüksek iade oranı); ana sayfa hesaplayıcısıyla aynı formül (ana sayfa yıllık gösterir).'],
  'pt-BR': ['Base de custo','Taxas base','Após o cashback máximo','por mês · taxas base','por mês · após o cashback máximo','Sem cashback de parceiro registrado','Após o cashback máximo = custo base × (1 − maior percentual do programa de parceria), a mesma fórmula da calculadora da página inicial (que mostra o ano).'],
  es: ['Base del coste','Comisiones base','Tras el reembolso máximo','al mes · comisiones base','al mes · tras el reembolso máximo','Sin reembolso de socio registrado','Tras el reembolso máximo = coste base × (1 − porcentaje máximo del programa de socios), la misma fórmula que la calculadora de inicio (que muestra el año).'],
  fr: ['Base de calcul','Frais de base','Après remboursement maximal','par mois · frais de base','par mois · après remboursement maximal','Aucun remboursement partenaire enregistré','Après remboursement maximal = coût de base × (1 − part maximale du programme partenaire), la même formule que le calculateur de l’accueil (qui affiche l’année).'],
  de: ['Kostenbasis','Basisgebühren','Nach maximaler Rückvergütung','pro Monat · Basisgebühren','pro Monat · nach maximaler Rückvergütung','Keine Partner-Rückvergütung erfasst','Nach maximaler Rückvergütung = Basiskosten × (1 − höchster Anteil des Partnerprogramms), dieselbe Formel wie der Rechner auf der Startseite (dort pro Jahr).'],
  ar: ['أساس التكلفة','الرسوم الأساسية','بعد أقصى استرداد','شهريًا · الرسوم الأساسية','شهريًا · بعد أقصى استرداد','لا يوجد استرداد شريك مسجل','بعد أقصى استرداد = التكلفة الأساسية × (1 − أعلى نسبة في برنامج الشراكة)، وهي المعادلة نفسها في حاسبة الصفحة الرئيسية (التي تعرض السنة).'],
  ru: ['Основа расчёта','Базовые комиссии','После максимального возврата','в месяц · базовые комиссии','в месяц · после максимального возврата','Партнёрский возврат не указан','После максимального возврата = базовая стоимость × (1 − максимальная доля партнёрской программы); та же формула, что в калькуляторе на главной (там за год).'],
  id: ['Dasar biaya','Biaya dasar','Setelah rabat maks.','per bulan · biaya dasar','per bulan · setelah rabat maks.','Tidak ada rabat mitra tercatat','Setelah rabat maks. = biaya dasar × (1 − porsi rabat tertinggi program mitra), rumus yang sama dengan kalkulator beranda (yang menampilkan per tahun).'],
  vi: ['Cơ sở chi phí','Phí cơ bản','Sau hoàn phí tối đa','mỗi tháng · phí cơ bản','mỗi tháng · sau hoàn phí tối đa','Chưa ghi nhận hoàn phí đối tác','Sau hoàn phí tối đa = chi phí cơ bản × (1 − tỷ lệ hoàn phí cao nhất của chương trình đối tác), cùng công thức với máy tính trang chủ (hiển thị theo năm).'],
  it: ['Base di costo','Commissioni base','Dopo il rimborso massimo','al mese · commissioni base','al mese · dopo il rimborso massimo','Nessun rimborso partner registrato','Dopo il rimborso massimo = costo base × (1 − quota massima del programma partner), la stessa formula del calcolatore in home (che mostra l’anno).'],
};

export function costBasisCopy(locale='en') {
  const normalized=locale==='zh-CN'?'zh-Hans':locale==='zh-TW'?'zh-Hant':locale;
  const values=basisRows[normalized] || basisRows[String(normalized).split('-')[0]] || basisRows.en;
  return Object.fromEntries(basisKeys.map((key,index)=>[key,values[index]]));
}
