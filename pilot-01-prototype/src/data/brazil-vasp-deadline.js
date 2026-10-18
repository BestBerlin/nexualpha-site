// Brazil BCB 30-Oct-2026 deadline topic (owner plan 2026-10-12). Article in Portuguese (pt-BR edition) and English
// (every other locale); interface strings in 15 locales live in brazil-vasp-deadline-chrome.js, per-exchange statuses
// in brazil-vasp-status.js. One source for the page, the SSR head and the Worker head.
//
// Every rule below was read on the primary text on 2026-10-12: Resolutions BCB 519/520/521 (10 Nov 2025) and 589
// (23 Sep 2026) through the BCB normativos service, the BCB press note of 17 Nov 2025, the BCB open-data set
// "Processos de autorização" (data as of 30 Sep 2026), Law 14.478/2022 on planalto.gov.br and IN RFB 2.291/2025 on the
// Receita Federal norms site. 30 Oct 2026 is 270 days after 2 Feb 2026 (Res. 520 art. 88 I and art. 23); the
// "about 29 Nov 2026" stop date for non-filers is our own count of art. 88 §7 and is labelled as such.
import { BRAZIL_DEADLINE_PATH_EN, BRAZIL_DEADLINE_PATH_PT, brazilDeadlineContentLocale } from "./brazil-vasp-deadline-slugs.js";
import { BRAZIL_DEADLINE_REVIEWED_AT, BRAZIL_VASP_STATUS, brazilPromotable } from "./brazil-vasp-status.js";
import { brazilDeadlineChrome } from "./brazil-vasp-deadline-chrome.js";
import { localizedPath } from "./locale-routing.js";

export { brazilDeadlineChrome };

const normativo = (numero) => `https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?tipo=Resolu%C3%A7%C3%A3o%20BCB&numero=${numero}`;
export const BRAZIL_BCB_LIST_URL = "https://dadosabertos.bcb.gov.br/dataset/processos-de-autorizacao";

const SOURCES = [
  { url: normativo(520), date: "2025-11-10", label: { en: "Resolução BCB nº 520 (virtual-asset service providers; arts. 23, 52 and 88)", "pt-BR": "Resolução BCB nº 520 (prestadoras de serviços de ativos virtuais; arts. 23, 52 e 88)" } },
  { url: normativo(519), date: "2025-11-10", label: { en: "Resolução BCB nº 519 (authorization procedures)", "pt-BR": "Resolução BCB nº 519 (processos de autorização)" } },
  { url: normativo(521), date: "2025-11-10", label: { en: "Resolução BCB nº 521 (virtual assets in the foreign-exchange rules)", "pt-BR": "Resolução BCB nº 521 (ativos virtuais no mercado de câmbio)" } },
  { url: normativo(589), date: "2026-09-23", label: { en: "Resolução BCB nº 589 (amends Res. 520; art. 91 from 6 Nov 2026)", "pt-BR": "Resolução BCB nº 589 (altera a Res. 520; art. 91 a partir de 6/11/2026)" } },
  { url: "https://www.bcb.gov.br/en/pressdetail/2639/nota", date: "2025-11-17", label: { en: "Banco Central do Brasil: “BCB details rules on virtual assets”", "pt-BR": "Banco Central do Brasil: nota sobre as regras de ativos virtuais (em inglês)" } },
  { url: BRAZIL_BCB_LIST_URL, date: "2026-09-30", label: { en: "BCB open data: pending authorization requests (data as of 30 Sep 2026)", "pt-BR": "Dados abertos do BCB: processos de autorização em aberto (dados de 30/09/2026)" } },
  { url: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14478.htm", date: "2022-12-21", label: { en: "Law 14.478/2022 (Brazil's virtual-asset law)", "pt-BR": "Lei nº 14.478/2022 (marco legal dos ativos virtuais)" } },
  { url: "https://normasinternet2.receita.fazenda.gov.br/#/consulta/externa/147709", date: "2025-11-17", label: { en: "Receita Federal: IN RFB nº 2.291/2025 (DeCripto reporting)", "pt-BR": "Receita Federal: IN RFB nº 2.291/2025 (DeCripto)" } },
];

const ARTICLE = {
  en: {
    metaTitle: "Brazil BCB Crypto Deadline (30 Oct 2026): Exchange Status",
    metaDescription: "Brazil's Central Bank rules: exchanges serving Brazil must file for authorization by 30 Oct 2026 or move users to a local entity. What to check, with sources.",
    h1: "Brazil's 30 October 2026 deadline for crypto exchanges: what the Central Bank rules say",
    lead: "Since 2 February 2026, the Banco Central do Brasil (BCB) supervises crypto exchanges. Companies already serving Brazil have until 30 October 2026 to file for authorization, and foreign exchanges must move Brazilian users to an authorized local company. This page explains the rule, what to check on your own account, and what each exchange has officially said.",
    answerTitle: "The short answer",
    answer: "A crypto company already operating in Brazil must ask the BCB for authorization by 30 October 2026 (Resolution BCB 520, art. 88). If it files on time it may keep serving clients until the BCB decides; if it does not, it must stop within 30 days. A foreign exchange must transfer its Brazilian operations and clients to an authorized institution or a Brazilian virtual-asset company within the same 270 days, with the clients' informed consent, or stop operating in Brazil (art. 23). As of 12 October 2026, none of the eight exchanges below has published that it filed or was authorized.",
    sections: [
      {
        id: "rule", title: "What the rule says",
        paragraphs: [
          "Law 14.478/2022 says virtual-asset service providers may operate in Brazil only with prior authorization. The BCB set the details in Resolutions 519 (authorization process), 520 (how providers are set up and run) and 521 (virtual assets in the foreign-exchange rules), all dated 10 November 2025 and in force since 2 February 2026.",
          "Resolution 520 gives companies that were already operating 270 days from 2 February 2026 to request authorization, which ends on 30 October 2026. A company that files on time may keep providing services until its process is concluded. A company that does not file must stop providing virtual-asset services within 30 days after the deadline.",
          "A foreign entity that serves Brazil and wants to keep doing so must, within the same 270 days, transfer its operations and clients to an authorized institution or to a Brazilian virtual-asset company. The transfer must respect continuity, security, transparency and the clients' informed consent, and keep client assets segregated. If the transfer is not completed in time, the foreign entity must end its activities in Brazil.",
          "Resolution 589 (23 September 2026) adds that from 6 November 2026, banks, payment institutions and other BCB-authorized institutions may not carry out virtual-asset operations with providers that are not authorized to operate in Brazil, except in the forms the resolution expressly allows.",
        ],
      },
      {
        id: "dates", title: "Key dates",
        items: [
          "2 February 2026: Resolutions 519, 520 and 521 enter into force (some parts of Resolution 521 from 4 May 2026).",
          "30 October 2026: last day to file for authorization, and to transfer clients of a foreign entity (270 days).",
          "6 November 2026: BCB-authorized institutions may no longer deal with unauthorized providers (Resolution 589).",
          "About 29 November 2026 (our count of 30 days after the deadline): a company that did not file must have stopped its virtual-asset services.",
        ],
      },
      {
        id: "steps", title: "What to check on your own account",
        steps: [
          "Find the company behind your account: open the terms of use in the app or on the website and note the legal name and, for a Brazilian company, the CNPJ. Some exchanges already serve Brazil through a local company; others serve Brazil from abroad.",
          "Look for the authorization notice: Resolution 520 (art. 52) requires every provider to publish on its website and app the information on its authorization or on the authorization request under review at the BCB.",
          "Check the BCB's own data: the BCB publishes pending authorization requests as open data. The latest file (30 September 2026) does not yet show October filings, and a request may be filed under the local company's name.",
          "If your exchange announces a move to a local company, read the new terms before accepting: the rule requires your informed consent and segregation of your assets. Follow only instructions shown in the exchange's app or official website.",
          "Keep your own records of deposits, withdrawals and trades. For tax, Receita Federal's IN 2.291/2025 requires Brazilian residents who use a provider based abroad, a decentralized platform or no provider to file the monthly DeCripto report when monthly operations exceed R$ 35,000; it replaces IN 1.888/2019 from 1 July 2026. Receita Federal's service page still cites IN 1.888, so confirm on Receita Federal before filing.",
        ],
      },
    ],
    faqTitle: "Common questions",
    faq: [
      ["What is the deadline for crypto exchanges in Brazil?", "30 October 2026. Resolution BCB 520 gives companies already operating 270 days from its entry into force on 2 February 2026 to request authorization, and gives foreign entities the same 270 days to transfer Brazilian clients to an authorized local company."],
      ["What happens if an exchange does not file by 30 October?", "Under Resolution 520 (art. 88, §7) it must stop providing virtual-asset services within 30 days after the deadline. From 6 November 2026, banks and other BCB-authorized institutions may not deal with providers that are not authorized (Resolution 589)."],
      ["Will my foreign exchange account be closed?", "Not necessarily. A foreign exchange can keep serving Brazil by moving its operations and clients to an authorized institution or a Brazilian virtual-asset company, with the clients' informed consent (Resolution 520, art. 23). If it does not complete that move in time, it must end its activities in Brazil. Watch for notices in the exchange's app and official website."],
      ["How do I check whether my exchange asked for authorization?", "Look on the exchange's website and app, where Resolution 520 requires the authorization or pending-request information to be published, and check the BCB's open data on pending authorization requests. NexuAlpha's table on this page lists only what each exchange or the BCB has published."],
      ["Do I have to report crypto held on a foreign exchange to Receita Federal?", "Under IN RFB 2.291/2025, Brazilian residents who operate through a provider based abroad must file the monthly DeCripto report when their operations in the month exceed R$ 35,000. Check Receita Federal's own pages for the current form and deadlines; this page is not tax advice."],
    ],
  },
  "pt-BR": {
    metaTitle: "Prazo do Banco Central para corretoras cripto: 30/10/2026",
    metaDescription: "Corretoras cripto que atendem o Brasil precisam pedir autorização ao Banco Central até 30/10/2026 ou migrar clientes. Veja o que conferir e o status de cada uma.",
    h1: "Prazo de 30 de outubro de 2026 para corretoras cripto: o que diz o Banco Central",
    lead: "Desde 2 de fevereiro de 2026, o Banco Central do Brasil (BCB) supervisiona as corretoras de criptoativos. Quem já atende o Brasil tem até 30 de outubro de 2026 para pedir autorização, e as corretoras estrangeiras precisam transferir os clientes brasileiros para uma empresa local autorizada. Esta página explica a regra, o que conferir na sua conta e o que cada corretora já disse oficialmente.",
    answerTitle: "A resposta curta",
    answer: "Uma empresa de cripto que já opera no Brasil precisa pedir autorização ao BCB até 30 de outubro de 2026 (Resolução BCB nº 520, art. 88). Se pedir no prazo, pode continuar atendendo até a decisão do BCB; se não pedir, deve parar em até 30 dias. Uma corretora estrangeira precisa transferir as operações e os clientes brasileiros para uma instituição autorizada ou para uma prestadora brasileira de ativos virtuais nos mesmos 270 dias, com o consentimento informado dos clientes, ou encerrar as atividades no país (art. 23). Até 12 de outubro de 2026, nenhuma das oito corretoras abaixo publicou que pediu ou recebeu autorização.",
    sections: [
      {
        id: "regra", title: "O que a regra diz",
        paragraphs: [
          "A Lei nº 14.478/2022 determina que prestadoras de serviços de ativos virtuais só podem funcionar no Brasil com autorização prévia. O BCB detalhou as regras nas Resoluções 519 (processo de autorização), 520 (constituição e funcionamento das prestadoras) e 521 (ativos virtuais no mercado de câmbio), todas de 10 de novembro de 2025 e em vigor desde 2 de fevereiro de 2026.",
          "A Resolução 520 dá às empresas que já operavam 270 dias, contados de 2 de fevereiro de 2026, para pedir autorização: o prazo termina em 30 de outubro de 2026. Quem protocolar o pedido no prazo pode manter os serviços até a conclusão do processo. Quem não protocolar deve cessar a prestação de serviços de ativos virtuais em até 30 dias após o fim do prazo.",
          "Uma entidade constituída no exterior que atende o Brasil e quer continuar precisa, nos mesmos 270 dias, transferir as operações e os clientes para uma instituição autorizada ou para uma sociedade prestadora de serviços de ativos virtuais brasileira. A transferência deve respeitar continuidade, segurança, transparência e o consentimento informado dos clientes, com segregação patrimonial. Se não concluir a transferência no prazo, a entidade estrangeira deve encerrar as atividades no país.",
          "A Resolução 589 (23 de setembro de 2026) acrescenta que, a partir de 6 de novembro de 2026, bancos, instituições de pagamento e demais instituições autorizadas pelo BCB não podem realizar ou viabilizar operações com prestadoras de ativos virtuais que não estejam autorizadas a funcionar no país, exceto nas formas expressamente previstas.",
        ],
      },
      {
        id: "datas", title: "Datas importantes",
        items: [
          "2 de fevereiro de 2026: entram em vigor as Resoluções 519, 520 e 521 (partes da 521 a partir de 4 de maio de 2026).",
          "30 de outubro de 2026: último dia para pedir autorização e para a entidade estrangeira transferir os clientes (270 dias).",
          "6 de novembro de 2026: instituições autorizadas pelo BCB deixam de poder operar com prestadoras não autorizadas (Resolução 589).",
          "Por volta de 29 de novembro de 2026 (nossa contagem de 30 dias após o prazo): a empresa que não pediu autorização deve ter encerrado os serviços de ativos virtuais.",
        ],
      },
      {
        id: "passos", title: "O que conferir na sua conta",
        steps: [
          "Descubra qual empresa está por trás da sua conta: abra os termos de uso no app ou no site e anote a razão social e, se for empresa brasileira, o CNPJ. Algumas corretoras já atendem o Brasil por uma empresa local; outras atendem a partir do exterior.",
          "Procure o aviso de autorização: a Resolução 520 (art. 52) obriga toda prestadora a divulgar no site e no app as informações sobre a autorização ou o pedido de autorização em análise no Banco Central.",
          "Confira os dados do próprio BCB: o Banco Central publica os processos de autorização em aberto como dados abertos. O arquivo mais recente (30/09/2026) ainda não mostra pedidos de outubro, e o pedido pode estar no nome da empresa local.",
          "Se a sua corretora anunciar a migração para uma empresa local, leia os novos termos antes de aceitar: a regra exige o seu consentimento informado e a segregação dos seus ativos. Siga apenas instruções exibidas no app ou no site oficial da corretora.",
          "Guarde seus registros de depósitos, saques e operações. Na parte tributária, a IN RFB nº 2.291/2025 obriga residentes no Brasil que usam prestadora sediada no exterior, plataforma descentralizada ou nenhuma prestadora a entregar a declaração mensal DeCripto quando as operações do mês passarem de R$ 35.000; ela substitui a IN 1.888/2019 a partir de 1º de julho de 2026. A página de serviço da Receita ainda cita a IN 1.888, então confirme na Receita Federal antes de declarar.",
        ],
      },
    ],
    faqTitle: "Perguntas frequentes",
    faq: [
      ["Qual é o prazo do Banco Central para as corretoras de cripto?", "30 de outubro de 2026. A Resolução BCB nº 520 dá às empresas que já operavam 270 dias, a partir da entrada em vigor em 2 de fevereiro de 2026, para pedir autorização, e dá às entidades estrangeiras os mesmos 270 dias para transferir os clientes brasileiros para uma empresa local autorizada."],
      ["O que acontece se a corretora não pedir autorização até 30 de outubro?", "Pela Resolução 520 (art. 88, §7º), ela deve cessar os serviços de ativos virtuais em até 30 dias após o fim do prazo. E, a partir de 6 de novembro de 2026, bancos e demais instituições autorizadas pelo BCB não podem operar com prestadoras não autorizadas (Resolução 589)."],
      ["Minha conta em corretora estrangeira vai ser encerrada?", "Não necessariamente. A corretora estrangeira pode continuar atendendo o Brasil se transferir as operações e os clientes para uma instituição autorizada ou para uma prestadora brasileira, com o consentimento informado dos clientes (Resolução 520, art. 23). Se não concluir a transferência no prazo, deve encerrar as atividades no país. Acompanhe os avisos no app e no site oficial da corretora."],
      ["Como saber se a minha corretora pediu autorização ao Banco Central?", "Procure no site e no app da corretora, onde a Resolução 520 exige a divulgação da autorização ou do pedido em análise, e consulte os dados abertos do BCB sobre processos de autorização em aberto. A tabela desta página mostra só o que cada corretora ou o BCB publicou."],
      ["Binance, OKX e Bybit já estão autorizadas pelo Banco Central?", "Até 12 de outubro de 2026, nenhuma delas publicou que pediu ou recebeu a autorização de prestadora de serviços de ativos virtuais, e nenhuma aparece pelo próprio nome na lista do BCB com dados de 30/09/2026. A OKX informa que atende residentes no Brasil pela OKX Serviços Digitais Ltda.; a Binance informa que o BCB aprovou a compra da corretora Sim;paul, o que é outra licença. Veja a tabela para as fontes."],
      ["Preciso declarar cripto em corretora estrangeira à Receita Federal?", "Pela IN RFB nº 2.291/2025, residentes no Brasil que operam por prestadora sediada no exterior devem entregar a declaração mensal DeCripto quando as operações do mês passarem de R$ 35.000. Confira o formulário e os prazos atuais nas páginas da Receita Federal; esta página não é orientação tributária."],
      ["O que muda a partir de 6 de novembro de 2026?", "A Resolução BCB nº 589 proíbe que bancos, instituições de pagamento e demais instituições autorizadas pelo BCB realizem ou viabilizem operações com prestadoras de ativos virtuais não autorizadas a funcionar no país, salvo nas formas expressamente previstas. Na prática, isso afeta os canais em reais de quem não estiver autorizado ou em processo regular."],
    ],
  },
};

/** Title, description, body and FAQ for a locale (Portuguese for pt-BR, English for every other locale). */
export function brazilDeadlineContent(locale = "en") {
  const contentLocale = brazilDeadlineContentLocale(locale);
  const article = ARTICLE[contentLocale];
  return {
    ...article,
    contentLocale,
    sources: SOURCES.map((source) => ({ url: source.url, date: source.date, label: source.label[contentLocale] || source.label.en })),
  };
}

/** Status-table rows: one per exchange, in the fixed order of brazil-vasp-status.js. */
export function brazilDeadlineRows() {
  return BRAZIL_VASP_STATUS.map((row) => ({ ...row, promotable: brazilPromotable(row) }));
}

/** JSON-LD: breadcrumb, Article (dated, with its primary sources) and FAQPage. Shared by client SSR and Worker. */
export function brazilDeadlineSchemas(locale, canonicalUrl, origin = "https://nexualpha.com") {
  const content = brazilDeadlineContent(locale);
  const sources = [...content.sources.map((source) => source.url), ...BRAZIL_VASP_STATUS.map((row) => row.source).filter(Boolean)];
  return [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "NexuAlpha", item: `${origin}${localizedPath("/", content.contentLocale)}` },
        { "@type": "ListItem", position: 2, name: content.contentLocale === "pt-BR" ? "Temas" : "Topics", item: `${origin}/topics` },
        { "@type": "ListItem", position: 3, name: content.h1, item: canonicalUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: content.h1,
      description: content.metaDescription,
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      inLanguage: content.contentLocale,
      datePublished: "2026-10-12",
      dateModified: BRAZIL_DEADLINE_REVIEWED_AT,
      author: { "@type": "Organization", "@id": `${origin}/#organization`, name: "NexuAlpha", url: `${origin}/` },
      publisher: { "@type": "Organization", "@id": `${origin}/#organization`, name: "NexuAlpha", url: `${origin}/` },
      about: [{ "@type": "Thing", name: "Banco Central do Brasil" }, ...BRAZIL_VASP_STATUS.map((row) => ({ "@type": "Thing", name: row.name }))],
      isBasedOn: sources,
      citation: sources,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: content.contentLocale,
      mainEntity: content.faq.map(([question, answer]) => ({
        "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];
}

export const BRAZIL_DEADLINE_EDITION_PATHS = Object.freeze({ en: BRAZIL_DEADLINE_PATH_EN, "pt-BR": BRAZIL_DEADLINE_PATH_PT });
