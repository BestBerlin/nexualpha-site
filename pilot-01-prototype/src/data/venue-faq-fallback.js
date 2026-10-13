const localeKey = (locale) => {
  const value = String(locale || "en");
  if (value.toLowerCase() === "pt-br") return "pt-BR";
  return value.split("-")[0];
};

const COPY = Object.freeze({
  en: {
    domainQ: (name) => `What official ${name} domain is recorded?`,
    domainA: ({ name, officialDomain }) => `${name}'s recorded official domain is ${officialDomain}.`,
  },
  "zh-Hans": {
    domainQ: (name) => `${name} 当前记录的官方域名是什么？`,
    domainA: ({ name, officialDomain }) => `${name} 当前记录的官方域名为 ${officialDomain}。`,
  },
  "zh-Hant": {
    domainQ: (name) => `${name} 目前記錄的官方網域是什麼？`,
    domainA: ({ name, officialDomain }) => `${name} 目前記錄的官方網域為 ${officialDomain}。`,
  },
  es: {
    domainQ: (name) => `¿Qué dominio oficial registra ${name}?`,
    domainA: ({ name, officialDomain }) => `El dominio oficial registrado de ${name} es ${officialDomain}.`,
  },
  "pt-BR": {
    domainQ: (name) => `Qual domínio oficial está registrado para ${name}?`,
    domainA: ({ name, officialDomain }) => `O domínio oficial registrado de ${name} é ${officialDomain}.`,
  },
  fr: {
    domainQ: (name) => `Quel domaine officiel est enregistré pour ${name} ?`,
    domainA: ({ name, officialDomain }) => `Le domaine officiel enregistré pour ${name} est ${officialDomain}.`,
  },
  de: {
    domainQ: (name) => `Welche offizielle Domain ist für ${name} erfasst?`,
    domainA: ({ name, officialDomain }) => `Die erfasste offizielle Domain von ${name} ist ${officialDomain}.`,
  },
  it: {
    domainQ: (name) => `Quale dominio ufficiale è registrato per ${name}?`,
    domainA: ({ name, officialDomain }) => `Il dominio ufficiale registrato di ${name} è ${officialDomain}.`,
  },
  ja: {
    domainQ: (name) => `${name} の記録済み公式ドメインは？`,
    domainA: ({ name, officialDomain }) => `${name} の記録済み公式ドメインは ${officialDomain} です。`,
  },
  ko: {
    domainQ: (name) => `${name}에 기록된 공식 도메인은 무엇인가요?`,
    domainA: ({ name, officialDomain }) => `${name}에 기록된 공식 도메인은 ${officialDomain}입니다.`,
  },
  ru: {
    domainQ: (name) => `Какой официальный домен указан для ${name}?`,
    domainA: ({ name, officialDomain }) => `Указанный официальный домен ${name}: ${officialDomain}.`,
  },
  tr: {
    domainQ: (name) => `${name} için kayıtlı resmi alan adı nedir?`,
    domainA: ({ name, officialDomain }) => `${name} için kayıtlı resmi alan adı ${officialDomain}.`,
  },
  id: {
    domainQ: (name) => `Domain resmi apa yang tercatat untuk ${name}?`,
    domainA: ({ name, officialDomain }) => `Domain resmi tercatat untuk ${name} adalah ${officialDomain}.`,
  },
  vi: {
    domainQ: (name) => `${name} đang ghi nhận tên miền chính thức nào?`,
    domainA: ({ name, officialDomain }) => `Tên miền chính thức đã ghi nhận của ${name} là ${officialDomain}.`,
  },
  ar: {
    domainQ: (name) => `ما النطاق الرسمي المسجل لـ ${name}؟`,
    domainA: ({ name, officialDomain }) => `النطاق الرسمي المسجل لـ ${name} هو ${officialDomain}.`,
  },
  ur: {
    domainQ: (name) => `${name} کے لیے کون سا سرکاری ڈومین درج ہے؟`,
    domainA: ({ name, officialDomain }) => `${name} کے لیے درج سرکاری ڈومین ${officialDomain} ہے۔`,
  },
  uk: {
    domainQ: (name) => `Який офіційний домен записано для ${name}?`,
    domainA: ({ name, officialDomain }) => `Записаний офіційний домен ${name}: ${officialDomain}.`,
  },
});

function copyFor(locale) {
  const key = locale === "zh-Hant" ? "zh-Hant" : String(locale || "").startsWith("zh") ? "zh-Hans" : localeKey(locale);
  return COPY[key] || COPY.en;
}

function cleanDomain(value) {
  const domain = String(value || "").replace(/^https?:\/\//, "").split("/")[0].trim();
  return domain || null;
}

export function venueFallbackFaqEntries({ venue = {}, name, locale = "en", officialDomain } = {}) {
  const resolvedName = name || venue.name || venue.slug || null;
  const resolvedDomain = cleanDomain(officialDomain || venue.officialDomain);
  if (!resolvedName || !resolvedDomain) return [];
  const copy = copyFor(locale);
  return [{
    question: copy.domainQ(resolvedName),
    answer: copy.domainA({ name: resolvedName, officialDomain: resolvedDomain }),
    citations: [`https://${resolvedDomain}`],
  }];
}

export function venueFallbackFaqSchema(venue, locale = "en", overrides = {}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: venueFallbackFaqEntries({ venue, locale, ...overrides }).map((entry) => ({
      "@type": "Question",
      name: entry.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.answer,
        ...(entry.citations?.length ? { citation: entry.citations } : {}),
      },
    })),
  };
}
