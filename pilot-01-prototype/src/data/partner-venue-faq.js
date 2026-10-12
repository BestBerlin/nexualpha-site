import { isPartnerPromotableIn } from "./partner-geo-policy.js";
// Localized partner-exchange FAQ (owner growth plan 2026-10-10, MARKET-PLAN.md "Problems found" #1 and #5).
//
// One source for BOTH the visible FAQ on /<locale>/exchanges/<slug> and its FAQPage JSON-LD, used by the client SSR
// (src/data/seo-injection.js + VenueFaqSection.jsx) and by the Worker SSR (worker/index.js), so the two stay identical.
//
// Rules for this file:
// - Every answer restates only what the exchange's own help/support page says; each entry cites those pages.
//   Pages were read on 2026-10-10. A topic without a readable official page is left out instead of guessed.
// - Invite codes are never typed here: `{code}` is filled from the partner feed (referral-partners.generated.js).
//   Owner rule 2026-10-12: answers carry no commission disclosure; it lives in the site footer and legal pages only.
// - No bonus promises and no rebate percentages (the profile already shows the owner-confirmed share elsewhere).
// - pt-BR, es (neutral Latin American) and fr replace the generic English schema FAQ on those pages; en and zh-Hans
//   only gain the "exchange account vs Web3 wallet" answer for OKX and Bitget.
// - zh-Hant, ru and ar are intentionally absent (owner policy 2026-10-10: neutral locales).
// - tr, vi and id (owner exchange keyword plan 2026-10-11, docs/company/exchange-keyword-map-2026-10-11.md) carry the
//   referral long tail only for the owner's target exchanges (LOCAL_TARGETS below; tr is limited to exchanges whose
//   Turkish entity is on SPK's operating list). Answers restate the same official pages read 2026-10-10, plus SPK's
//   list (tr) and OJK's own notice (id) for the local-entity question. These strings need a native review.
// - hyperliquid (en) and backpack (en, fr) use the exchange's own docs / help pages read 2026-10-11.
import { REFERRAL_PARTNERS } from "./referral-partners.generated.js";
import { priorityVenueAnswerFor } from "./priority-venue-answers.js";

export const PARTNER_VENUE_FAQ_REVIEWED_AT = "2026-10-10";
export const PARTNER_VENUE_FAQ_SLUGS = Object.freeze(["okx", "bitget", "binance", "bybit", "gate-io", "mexc"]);
export const PARTNER_VENUE_FAQ_REPLACE_LOCALES = Object.freeze(["pt-BR", "es", "fr"]);
export const PARTNER_VENUE_FAQ_APPEND_LOCALES = Object.freeze(["en", "zh-Hans"]);
// Owner exchange keyword plan 2026-10-11: localized referral FAQ only for these exchanges per locale (replace mode).
export const PARTNER_VENUE_FAQ_LOCAL_TARGETS = Object.freeze({
  tr: Object.freeze(["okx", "binance", "bybit"]),
  vi: Object.freeze(["okx", "bitget", "bybit", "binance"]),
  id: Object.freeze(["bybit", "bitget", "okx"]),
});
// Partner exchanges whose FAQ covers only some locales (hyperliquid: en; backpack: en + fr).
export const PARTNER_VENUE_FAQ_EXTRA_SLUGS = Object.freeze(["hyperliquid", "backpack"]);

export function normalizePartnerFaqLocale(locale = "en") {
  const raw = String(locale || "en");
  const lower = raw.toLowerCase();
  if (lower === "pt-br" || lower === "pt") return "pt-BR";
  if (lower === "es" || lower.startsWith("es-")) return "es";
  if (lower === "fr" || lower.startsWith("fr-")) return "fr";
  if (lower === "en" || lower.startsWith("en-")) return "en";
  if (raw === "zh-Hans" || lower === "zh" || lower === "zh-cn" || lower === "zh-hans" || lower === "zh-sg") return "zh-Hans";
  if (lower === "tr" || lower.startsWith("tr-")) return "tr";
  if (lower === "vi" || lower.startsWith("vi-")) return "vi";
  if (lower === "id" || lower.startsWith("id-")) return "id";
  return null;
}

// Payout cadence from the partner feed ({cadence}); an entry using it is dropped when the feed has no cadence.
const CADENCE = {
  tr: { hourly: "saatlik", daily: "günlük" },
  vi: { hourly: "mỗi giờ", daily: "hằng ngày" },
  id: { hourly: "setiap jam", daily: "setiap hari" },
};

// [label, url] pairs. Labels are shown next to the visible answer; URLs feed the schema `citation` field.
const SRC = {
  okx: {
    refPt: ["OKX — Programa de indicação (FAQ)", "https://www.okx.com/pt-br/help/what-is-okx-referral-program"],
    refEs: ["OKX — Programa de referidos (FAQ)", "https://www.okx.com/es-la/help/what-is-okx-referral-program"],
    refFr: ["OKX — Programme de parrainage (FAQ)", "https://www.okx.com/fr/help/what-is-okx-referral-program"],
    refEn: ["OKX — Referral program FAQ", "https://www.okx.com/help/what-is-okx-referral-program"],
    pixDeposit: ["OKX — Como depositar BRL via Pix", "https://www.okx.com/pt-br/help/how-do-i-deposit-brl"],
    pixWithdraw: ["OKX — Como sacar BRL via Pix", "https://www.okx.com/pt-br/help/how-do-i-withdraw-brl"],
    kycPt: ["OKX — Guia de verificação de identidade", "https://www.okx.com/pt-br/help/a-beginner-guide-to-identity-verification"],
    kycEs: ["OKX — Guía de verificación de identidad", "https://www.okx.com/es-la/help/a-beginner-guide-to-identity-verification"],
    kycFr: ["OKX — Guide de vérification d’identité", "https://www.okx.com/fr/help/a-beginner-guide-to-identity-verification"],
    kycEn: ["OKX — Identity verification guide", "https://www.okx.com/help/a-beginner-guide-to-identity-verification"],
    walletPt: ["OKX — O que é a OKX Web3 Wallet", "https://www.okx.com/pt-br/help/what-is-okx-web3-wallet"],
    walletEs: ["OKX — Qué es OKX Web3 Wallet", "https://www.okx.com/es-la/help/what-is-okx-web3-wallet"],
    walletFr: ["OKX — Qu’est-ce qu’OKX Web3 Wallet", "https://www.okx.com/fr/help/what-is-okx-web3-wallet"],
    walletEn: ["OKX — What is OKX Web3 Wallet", "https://www.okx.com/help/what-is-okx-web3-wallet"],
    walletZh: ["OKX — 什么是 OKX Web3 钱包", "https://www.okx.com/zh-hans/help/what-is-okx-web3-wallet"],
    p2pDisputeEs: ["OKX — Disputas en P2P", "https://www.okx.com/es-la/help/how-do-i-raise-a-dispute-when-using-p2p-trading"],
    p2pDisputeFr: ["OKX — Litiges en P2P", "https://www.okx.com/fr/help/how-do-i-raise-a-dispute-when-using-p2p-trading"],
    p2pAfrica: ["OKX — P2P safety tips for Africa", "https://www.okx.com/help/what-p2p-trading-tips-every-trader-in-africa-should-do"],
  },
  bitget: {
    regPt: ["Bitget — Como criar uma conta (site)", "https://www.bitget.com/pt/support/articles/12560603808241"],
    regEs: ["Bitget — Cómo crear una cuenta (web)", "https://www.bitget.com/es/support/articles/12560603808241"],
    regFr: ["Bitget — Créer un compte (web)", "https://www.bitget.com/fr/support/articles/12560603808241"],
    regEn: ["Bitget — How to register an account", "https://www.bitget.com/support/articles/12560603808241"],
    referral: ["Bitget — Referral Program", "https://www.bitget.com/support/articles/12560603821820"],
    brlDeposit: ["Bitget — BRL deposit via PIX", "https://www.bitget.com/support/articles/12560603820691"],
    brlWithdraw: ["Bitget — BRL withdrawal via PIX", "https://www.bitget.com/support/articles/12560603809122"],
    latam: ["Bitget — MXN deposit (SPEI / OXXO Pay)", "https://www.bitget.com/support/articles/12560603822387"],
    kycPt: ["Bitget — Verificação de identidade (site)", "https://www.bitget.com/pt/support/articles/12560603808921"],
    kycEs: ["Bitget — Verificación de identidad (web)", "https://www.bitget.com/es/support/articles/12560603808921"],
    kycFr: ["Bitget — Effectuer le KYC (web)", "https://www.bitget.com/fr/support/articles/12560603808921"],
    kycEn: ["Bitget — How to complete KYC", "https://www.bitget.com/support/articles/12560603808921"],
    kycRejectPt: ["Bitget — Motivos de recusa do KYC", "https://www.bitget.com/pt/support/articles/12560603808909"],
    kycRejectEs: ["Bitget — Motivos de rechazo del KYC", "https://www.bitget.com/es/support/articles/12560603808909"],
    kycRejectFr: ["Bitget — Motifs de rejet du KYC", "https://www.bitget.com/fr/support/articles/12560603808909"],
    franceSignup: ["Bitget — Inscriptions en France et en Allemagne", "https://www.bitget.com/fr/support/articles/12560603848103"],
    africanFiat: ["Bitget — Monnaies africaines sur Bitget P2P", "https://www.bitget.com/fr/support/articles/12560603867954"],
    wallet: ["Bitget Wallet — Docs (About Bitget Wallet)", "https://web3.bitget.com/en/docs"],
    kycRejectEn: ["Bitget — Reasons a KYC submission is rejected", "https://www.bitget.com/support/articles/12560603808909"],
  },
  binance: {
    register: ["Binance — How to register on the Binance app", "https://www.binance.com/en/support/faq/detail/360042718372"],
    referralLite: ["Binance — Referral Lite mode FAQ", "https://www.binance.com/en/support/faq/detail/5e284447daa34a338a968d64f7023c73"],
    brl: ["Binance — FAQ transferência bancária em BRL", "https://www.binance.com/pt-BR/support/faq/detail/2604a5d35bd947d485dc30d865539e3e"],
    kyc: ["Binance — Identity verification (personal account)", "https://www.binance.com/en/support/faq/detail/360027287111"],
    p2p: ["Binance — Introduction to Binance P2P", "https://www.binance.com/en/support/faq/detail/360038038972"],
    wallet: ["Binance — What is Binance Wallet", "https://www.binance.com/en/support/faq/detail/048ee79532494c03918dc4004214ad11"],
  },
  bybit: {
    register: ["Bybit — How to register an account", "https://www.bybit.com/en/help-center/article/How-to-register-an-account"],
    affiliateCode: ["Bybit — Add and check a registered affiliate code", "https://www.bybit.com/en/help-center/article/How-to-Add-and-Check-Registered-Affiliate-Code"],
    referralFaq: ["Bybit — Referral Program FAQ", "https://www.bybit.com/en/help-center/article/Bybit-Referral-Program-General-FAQ"],
    fiatDeposit: ["Bybit — How to deposit fiat currencies", "https://www.bybit.com/en/help-center/article/How-to-Deposit-Fiat-Currencies-on-Bybit"],
    fiatDepositFaq: ["Bybit — Fiat deposit FAQ", "https://www.bybit.com/en/help-center/article/FAQ-Fiat-Deposit"],
    fiatWithdraw: ["Bybit — How to withdraw fiat currencies", "https://www.bybit.com/en/help-center/article/How-to-Withdraw-Fiat-Currencies-on-Bybit"],
    kycFaq: ["Bybit — Individual KYC FAQ", "https://www.bybit.com/en/help-center/article/Individual-KYC-FAQ"],
    kycFail: ["Bybit — KYC verification failures", "https://www.bybit.com/en/help-center/article/Common-Reasons-and-Solutions-for-KYC-Verification-Failures"],
    p2p: ["Bybit — Introduction to P2P trading", "https://www.bybit.com/en/help-center/article/Introduction-to-P2P-Trading"],
    wallet: ["Bybit — Seed phrase, keyless and cloud wallets", "https://www.bybit.com/en/help-center/article/Differences-Between-Seed-Phrase-Wallet-Keyless-Wallet-and-Cloud-Wallet"],
  },
  "gate-io": {
    faqPt: ["Gate — Perguntas frequentes para iniciantes", "https://www.gate.com/pt-br/help/guide/faq/16394"],
    faqEs: ["Gate — Preguntas frecuentes para principiantes", "https://www.gate.com/es/help/guide/faq/16394"],
    faqFr: ["Gate — FAQ pour les débutants", "https://www.gate.com/fr/help/guide/faq/16394"],
    kycPt: ["Gate — Perguntas frequentes sobre KYC", "https://www.gate.com/pt-br/help/guide/security-settings/17399"],
    kycEs: ["Gate — Preguntas frecuentes sobre KYC", "https://www.gate.com/es/help/guide/security-settings/17399"],
    kycFr: ["Gate — FAQ sur le KYC", "https://www.gate.com/fr/help/guide/security-settings/17399"],
    walletPt: ["Gate — O que é a Gate Web3 Wallet", "https://www.gate.com/pt-br/help/web3/web3wallet/30760"],
    walletEs: ["Gate — Qué es Gate Web3 Wallet", "https://www.gate.com/es/help/web3/web3wallet/30760"],
    walletFr: ["Gate — Qu’est-ce que Gate Web3 Wallet", "https://www.gate.com/fr/help/web3/web3wallet/30760"],
    restrictedEs: ["Gate — Regiones restringidas", "https://www.gate.com/es/help/guide/faq/40959"],
    restrictedFr: ["Gate — Régions restreintes", "https://www.gate.com/fr/help/guide/faq/40959"],
  },
  mexc: {
    invite: ["MEXC — Invite friends to sign up", "https://www.mexc.com/support/article/invite-friends-to-sign-up-on-mexc-17827791531472"],
    affiliateFaq: ["MEXC — Affiliate FAQ (invitation codes)", "https://www.mexc.com/support/article/mexc-affiliate-faq-331512531120991232"],
    kycFaq: ["MEXC — KYC FAQ", "https://www.mexc.com/support/article/mexc-kyc-faq-342632287349720064"],
    kycFail: ["MEXC — Why did my KYC verification fail", "https://www.mexc.com/support/article/why-did-my-kyc-verification-fail-17827791519720"],
    tn: ["MEXC — Fiat channels T+N policy", "https://www.mexc.com/support/article/fiat-channels-t-n-policy-overview-17827791529891"],
  },
};

// Local regulators, cited only for the "local entity" answers (tr: SPK lists read 2026-10-11; id: OJK notice).
const REG = {
  spkOperating: ["SPK — Faaliyette bulunanlar listesi (01.10.2026)", "https://spk.gov.tr/kurumlar/kripto-varlik-hizmet-saglayicilar/faaliyette-bulunanlar-listesi"],
  ojkTransition: ["OJK — Pengalihan tugas aset kripto dari Bappebti ke OJK", "https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/Bappebti-Kemendag-Alihkan-Tugas-Aset-Keuangan-Digital-termasuk-Aset-Kripto-serta-Derivatif-Keuangan-kepada-OJK-dan-BI.aspx"],
};

// Hyperliquid docs and Backpack help/learn pages, read 2026-10-11.
const SRC_EXTRA = {
  hyperliquid: {
    referrals: ["Hyperliquid Docs — Referrals", "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals"],
    fees: ["Hyperliquid Docs — Fees", "https://hyperliquid.gitbook.io/hyperliquid-docs/trading/fees"],
  },
  backpack: {
    about: ["Backpack — About", "https://learn.backpack.exchange/about"],
    margin: ["Backpack — Margin (technical docs)", "https://support.backpack.exchange/technical-docs/trading/margin"],
    kyc: ["Backpack — KYC required documents", "https://support.backpack.exchange/exchange/exchange-account/identity-verification/kyc-required-documents"],
    securities: ["Backpack Learn — What is Backpack Securities", "https://learn.backpack.exchange/articles/what-is-backpack-securities"],
    tokenized: ["Backpack Support — Tokenized securities", "https://support.backpack.exchange/backpack-securities/tokenized-securities"],
    home: ["Backpack — backpack.exchange", "https://backpack.exchange/"],
  },
};

const faq = (question, answer, sources) => ({ question, answer, sources });

// Entries per slug and locale. `{code}`, `{name}` and `` are filled from the partner feed at read time.
const ENTRIES = {
  okx: {
    "pt-BR": [
      faq("Onde coloco o código de convite da OKX no cadastro?",
        "O código de indicação entra antes de a conta ser criada: no formulário de cadastro, ou já preenchido quando você abre um link de convite. Se o link não abrir, a própria OKX orienta baixar o app e digitar o código na página de cadastro. O código de parceiro da NexuAlpha para a OKX é {code}.",
        [SRC.okx.refPt]),
      faq("Esqueci o código de convite da OKX. Dá para adicionar ou trocar depois?",
        "Não. Segundo a OKX, o código de indicação só pode ser vinculado no cadastro: depois que a conta é criada não é possível adicionar nem alterar o código, e o vínculo não muda após o cadastro ou a verificação de identidade. Para ver se a sua conta tem um indicador, abra no app Menu > Configurações da conta > Perfil > Recompensas de indicação; se a opção não aparece, nenhum vínculo foi criado.",
        [SRC.okx.refPt]),
      faq("Por que o código de convite da OKX não funciona?",
        "Os motivos que a OKX descreve são: a conta já foi criada (o código não entra depois); outro código ficou pré-preenchido porque você abriu um link de convite ou baixou o app com código nos últimos 30 dias — nesse caso a OKX recomenda fazer o cadastro numa janela anônima e conferir o código antes de concluir; e o recurso de indicação não está disponível para todos os usuários. A OKX também informa que convites entre regiões diferentes (por exemplo, um usuário do Brasil convidando alguém de fora) não geram recompensa para quem convidou.",
        [SRC.okx.refPt]),
      faq("Como depositar reais (BRL) na OKX com Pix?",
        "Em Depositar, escolha Real Brasileiro e siga as instruções: copie a chave Pix (CNPJ) e confira que o destinatário é OKX Servicos Digitais Ltda. A conta bancária precisa estar no mesmo nome e CPF da sua conta OKX, senão o depósito é devolvido. O Pix costuma cair em minutos e o mínimo é R$ 5. Depósitos por TED ou DOC são devolvidos e isso pode levar até 15 dias. O Pix em BRL está disponível apenas para clientes brasileiros.",
        [SRC.okx.pixDeposit]),
      faq("Como sacar BRL da OKX via Pix?",
        "Vá em Ativos > Sacar (no app, Transferência > Sacar), escolha Real Brasileiro, selecione a conta e confirme com seu código de autenticação, SMS ou chave de acesso. O saque mínimo é R$ 5 e o Pix costuma cair em minutos. A conta de destino precisa ter o mesmo nome e CPF da conta OKX; se não tiver, o saque é rejeitado e o valor volta para a OKX. Uma conta bancária que já fez um depósito Pix bem-sucedido é verificada automaticamente; se for adicionar à mão, use conta corrente.",
        [SRC.okx.pixWithdraw]),
      faq("Que verificação de identidade (KYC) a OKX pede?",
        "A OKX pede um documento oficial com foto aceito no seu país, uma selfie para comparar com o documento e o endereço residencial; se você mudou de endereço, pode precisar enviar um comprovante recente (conta de consumo ou extrato emitido nos últimos 3 meses). É preciso ter 18 anos ou mais. Concluir a verificação aumenta os limites de depósito e saque.",
        [SRC.okx.kycPt]),
      faq("Conta da OKX ou OKX Wallet: qual é a diferença?",
        "São produtos diferentes. A OKX Web3 Wallet é uma carteira não custodial: você guarda a frase-semente ou a chave privada, ela não pede verificação de identidade nem login, e quem perde a frase-semente perde o acesso aos ativos. A conta da exchange OKX é um cadastro próprio, com verificação de identidade. O código de convite é informado no cadastro dessa conta da exchange, antes de ela ser criada.",
        [SRC.okx.walletPt, SRC.okx.refPt, SRC.okx.kycPt]),
    ],
    es: [
      faq("¿Dónde pongo el código de referido de OKX al registrarme?",
        "El código de referido se agrega antes de crear la cuenta: en el formulario de registro, o ya viene cargado si abres un enlace de invitación. Si el enlace no abre, OKX indica descargar la app e ingresar el código en la página de registro. El código de socio de NexuAlpha para OKX es {code}.",
        [SRC.okx.refEs]),
      faq("¿Puedo agregar o cambiar el código de referido de OKX después de registrarme?",
        "No. OKX explica que el código de referido solo se vincula al registrarse: una vez creada la cuenta no se puede agregar ni cambiar, y el vínculo tampoco cambia después del registro o de la verificación de identidad. Para comprobar si tu cuenta tiene un referente, entra en la app a Menú > Configuración de la cuenta > Perfil > Recompensas por referidos; si esa opción no aparece, no hay vínculo.",
        [SRC.okx.refEs]),
      faq("¿Por qué no funciona mi código de referido de OKX?",
        "Según OKX, los casos más comunes son: la cuenta ya estaba creada; otro código quedó precargado porque abriste un enlace de invitación o descargaste la app con un código en los últimos 30 días (OKX recomienda registrarte en una ventana de incógnito y revisar el código antes de terminar); o la función de referidos no está disponible para tu usuario o región. Además, las invitaciones entre regiones distintas no generan recompensa para quien invita.",
        [SRC.okx.refEs]),
      faq("¿Qué pide OKX para la verificación de cuenta (KYC)?",
        "Un documento oficial con foto válido en tu país, una selfie que se compara con el documento y tu domicilio; si ya no vives en la dirección del documento, puede pedirte un comprobante reciente (recibo de servicios o estado de cuenta de los últimos 3 meses). Debes ser mayor de 18 años. Completar la verificación sube tus límites de depósito y retiro.",
        [SRC.okx.kycEs]),
      faq("Si compro o vendo USDT por P2P en OKX, ¿qué hago si el pago no se refleja?",
        "OKX recomienda no liberar las criptomonedas hasta ver el dinero en tu propia cuenta bancaria o billetera, porque algunos métodos tardan de 1 a 3 días hábiles. Si compraste y el vendedor no libera, o si vendiste y el comprador marcó la orden como pagada sin que llegue el dinero, puedes abrir una disputa desde la orden. Los métodos de pago disponibles son los que muestra cada anuncio P2P.",
        [SRC.okx.p2pDisputeEs]),
      faq("¿OKX y OKX Wallet son lo mismo?",
        "No. OKX Web3 Wallet es una billetera no custodial: tú guardas la frase semilla o la clave privada, no requiere verificación de identidad ni inicio de sesión, y si pierdes la frase semilla pierdes el acceso. La cuenta del exchange OKX es un registro aparte con verificación de identidad. El código de referido se ingresa al crear esa cuenta del exchange.",
        [SRC.okx.walletEs, SRC.okx.refEs, SRC.okx.kycEs]),
    ],
    fr: [
      faq("Où saisir le code de parrainage OKX à l’inscription ?",
        "Le code de parrainage doit être ajouté avant la création du compte : dans le formulaire d’inscription, ou il est prérempli si vous ouvrez un lien d’invitation. Si le lien ne s’ouvre pas, OKX conseille de télécharger l’application et de saisir le code sur la page d’inscription. Le code partenaire de NexuAlpha pour OKX est {code}.",
        [SRC.okx.refFr]),
      faq("Peut-on ajouter ou changer le code de parrainage OKX après l’inscription ?",
        "Non. OKX précise que le code ne peut être lié qu’au moment de l’inscription : une fois le compte créé, il n’est plus possible de l’ajouter ni de le modifier, et la relation ne change plus après l’inscription ou la vérification d’identité. Pour savoir si votre compte a un parrain, ouvrez dans l’application Menu > Paramètres du compte > Profil > Récompenses de parrainage ; si l’entrée n’apparaît pas, aucun lien n’existe.",
        [SRC.okx.refFr]),
      faq("Pourquoi mon code de parrainage OKX ne marche pas ?",
        "OKX cite plusieurs cas : le compte était déjà créé ; un autre code est resté prérempli parce que vous avez ouvert un lien d’invitation ou téléchargé l’application avec un code dans les 30 derniers jours (OKX recommande alors de s’inscrire en navigation privée et de vérifier le code avant de valider) ; ou la fonction de parrainage n’est pas proposée à tous les utilisateurs. Les invitations entre régions différentes ne donnent pas de récompense au parrain.",
        [SRC.okx.refFr]),
      faq("Quels documents OKX demande-t-il pour le KYC ?",
        "Une pièce d’identité officielle avec photo acceptée dans votre pays, un selfie comparé à la pièce et votre adresse de résidence ; si vous n’habitez plus à l’adresse du document, un justificatif récent peut être demandé (facture ou relevé bancaire de moins de 3 mois). Il faut avoir au moins 18 ans. La vérification relève vos plafonds de dépôt et de retrait.",
        [SRC.okx.kycFr]),
      faq("Payer en P2P avec le mobile money sur OKX : quelles précautions ?",
        "Dans son guide P2P pour l’Afrique, OKX insiste sur quelques réflexes : vérifier le solde réel dans votre propre application avant de libérer des cryptos (jamais sur une simple capture d’écran), garder toute la discussion dans l’application OKX, payer uniquement avec le moyen et les coordonnées affichés dans l’ordre, et partager la référence de transaction. Si le vendeur ne libère pas après paiement, ou si l’acheteur marque l’ordre payé sans que l’argent arrive, ouvrez un litige depuis l’ordre.",
        [SRC.okx.p2pAfrica, SRC.okx.p2pDisputeFr]),
      faq("Compte OKX ou OKX Wallet : quelle différence ?",
        "Ce sont deux produits distincts. OKX Web3 Wallet est un portefeuille non dépositaire : vous gardez la phrase de récupération ou la clé privée, il ne demande ni vérification d’identité ni connexion, et une phrase perdue ne peut pas être récupérée. Le compte de la plateforme OKX est une inscription à part, avec vérification d’identité. Le code de parrainage se saisit lors de la création de ce compte.",
        [SRC.okx.walletFr, SRC.okx.refFr, SRC.okx.kycFr]),
    ],
    en: [
      faq("Is an OKX exchange account the same as OKX Wallet?",
        "No. OKX describes OKX Web3 Wallet as a non-custodial, multi-chain wallet: you hold the seed phrase or private key, the wallet needs no identity verification or account login, and a lost seed phrase cannot be recovered. The OKX exchange account is a separate sign-up that uses identity verification to raise deposit and withdrawal limits. A referral code belongs to the exchange account and must be added before that account is created.",
        [SRC.okx.walletEn, SRC.okx.kycEn, SRC.okx.refEn]),
    ],
    "zh-Hans": [
      faq("欧易（OKX）交易所账户和 OKX Web3 钱包是一回事吗？",
        "不是。OKX 官方说明 Web3 钱包是非托管、去中心化的多链钱包：助记词和私钥由你自己保管，使用钱包无需身份验证、审核或登录，助记词丢失意味着资产永久丢失。OKX 交易所账户需要单独注册，并通过身份验证提高充值和提现额度。邀请码属于交易所账户，必须在创建账户之前填写，注册后无法补填或修改。",
        [SRC.okx.walletZh, SRC.okx.kycEn, SRC.okx.refEn]),
    ],
  },
  bitget: {
    "pt-BR": [
      faq("Onde informar o código de convite da Bitget no cadastro?",
        "No guia oficial de cadastro, depois de digitar e-mail ou celular, o passo 2 é “Insira um código de convite (caso tenha)”, antes de aceitar os termos e criar a conta. O código de parceiro da NexuAlpha para a Bitget é {code}.",
        [SRC.bitget.regPt]),
      faq("Esqueci o código de convite da Bitget. Posso incluir depois?",
        "Os guias de cadastro da Bitget mostram o campo do código apenas no formulário de criação da conta e não descrevem uma forma de incluí-lo depois. O programa de indicação da Bitget considera convidado quem se registra usando o link ou o código. Por isso, confira o código antes de concluir o cadastro.",
        [SRC.bitget.regPt, SRC.bitget.referral]),
      faq("Como depositar reais na Bitget com Pix?",
        "Antes, a conta precisa estar com a verificação de identidade completa e o CPF cadastrado e verificado. Depósitos em BRL são aceitos somente via Pix e não podem vir de terceiros. Crie a ordem em Comprar cripto > Depósito bancário e transfira exatamente o valor da ordem: depósito sem ordem ou com valor diferente falha, e o reembolso costuma levar até 2 dias úteis.",
        [SRC.bitget.brlDeposit]),
      faq("Como sacar BRL da Bitget via Pix?",
        "Em Ativos > Sacar > Fiat, escolha BRL e o método Pix. É preciso ter e-mail vinculado, celular brasileiro vinculado e identidade verificada. A chave Pix de destino deve ser do mesmo titular da conta Bitget. A taxa, se houver, aparece no resumo antes de confirmar. O Pix costuma ser instantâneo, mas pedidos feitos fora do horário bancário podem ficar para o próximo dia útil.",
        [SRC.bitget.brlWithdraw]),
      faq("Como funciona o KYC da Bitget e por que ele é recusado?",
        "Você escolhe país e tipo de documento, informa o nome exatamente como no documento, envia fotos do documento e faz o reconhecimento facial. A análise costuma levar 1 dia útil. As recusas mais comuns são dados diferentes dos do documento, fotos borradas, cortadas ou em preto e branco, documento vencido ou só um lado enviado, e problemas na selfie.",
        [SRC.bitget.kycPt, SRC.bitget.kycRejectPt]),
      faq("Bitget ou Bitget Wallet: qual é a diferença?",
        "A Bitget Wallet é uma carteira cripto não custodial, segundo a documentação oficial. A conta da exchange Bitget é outro cadastro, feito com e-mail ou celular e com verificação de identidade para liberar depósitos, saques e negociação. O código de convite deste perfil é o do cadastro da conta da exchange.",
        [SRC.bitget.wallet, SRC.bitget.regPt, SRC.bitget.kycPt]),
    ],
    es: [
      faq("¿Dónde ingreso el código de referido de Bitget al registrarme?",
        "En la guía oficial de registro, después de escribir tu correo o celular, el paso 2 es “Ingresa un código de referidos (opcional)”, antes de aceptar los términos y crear la cuenta. El código de socio de NexuAlpha para Bitget es {code}.",
        [SRC.bitget.regEs]),
      faq("¿Puedo poner o cambiar el código de referido de Bitget después?",
        "Las guías de registro de Bitget muestran el campo del código solo en el formulario de creación de la cuenta y no describen una forma de agregarlo después. El programa de referidos de Bitget cuenta como invitado a quien se registra con el enlace o el código. Revisa el código antes de terminar el registro.",
        [SRC.bitget.regEs, SRC.bitget.referral]),
      faq("¿Cómo deposito pesos mexicanos (MXN) en Bitget por SPEI?",
        "Primero completa la verificación de identidad; si no, el depósito puede fallar. En el menú de compra con fiat elige MXN y Depósito bancario, y selecciona SPEI u OXXO Pay. Ingresa el monto y sigue las instrucciones del proveedor de pago; si es la primera vez que usas ese proveedor, te pedirá abrir una cuenta con él antes de pagar.",
        [SRC.bitget.latam]),
      faq("¿Cómo es la verificación de cuenta (KYC) en Bitget y por qué la rechazan?",
        "Eliges país y tipo de documento, escribes tu nombre tal como aparece en él, subes fotos del documento y haces el reconocimiento facial. La revisión suele tardar 1 día hábil. Los rechazos más comunes: datos que no coinciden con el documento, fotos borrosas, recortadas o en blanco y negro, documento vencido o solo un lado, y problemas con la selfie.",
        [SRC.bitget.kycEs, SRC.bitget.kycRejectEs]),
      faq("¿Bitget y Bitget Wallet son lo mismo?",
        "No. Según su documentación oficial, Bitget Wallet es una billetera cripto no custodial. La cuenta del exchange Bitget es otro registro, con correo o celular y verificación de identidad para depositar, retirar y operar. El código de referido de este perfil es el del registro de la cuenta del exchange.",
        [SRC.bitget.wallet, SRC.bitget.regEs, SRC.bitget.kycEs]),
    ],
    fr: [
      faq("Où saisir le code de parrainage Bitget à l’inscription ?",
        "Dans le guide officiel, après l’e-mail ou le numéro de téléphone, l’étape 2 est « Saisissez un code de parrainage (facultatif) », avant d’accepter les conditions et de créer le compte. Le code partenaire de NexuAlpha pour Bitget est {code}.",
        [SRC.bitget.regFr]),
      faq("J’habite en France : puis-je ouvrir un compte Bitget ?",
        "Non. Bitget indique que les résidents de France (y compris les territoires d’outre-mer) et d’Allemagne ne peuvent plus ouvrir de compte depuis le 16 janvier 2026, et que tous les services sont arrêtés pour les résidents français depuis le 31 mars 2026, quelle que soit la date d’inscription. Cette mesure ne concerne pas les autres pays.",
        [SRC.bitget.franceSignup]),
      faq("Bitget P2P accepte-t-il le franc CFA (XOF, XAF) ?",
        "Oui. Dans sa mise à jour de mars 2026, Bitget liste le XOF et le XAF parmi les monnaies africaines disponibles sur son P2P, avec NGN, GHS, KES, ZAR, UGX et TZS. Les échanges se font avec des marchands, qui proposent les moyens de paiement locaux qu’ils peuvent encaisser et payer : vérifiez le moyen indiqué dans chaque annonce.",
        [SRC.bitget.africanFiat]),
      faq("Comment se passe le KYC Bitget et pourquoi est-il refusé ?",
        "Vous choisissez le pays et le type de pièce, saisissez votre nom exactement comme sur le document, photographiez la pièce puis passez la reconnaissance faciale. L’examen prend en général 1 jour ouvré. Refus les plus fréquents : informations différentes du document, photos floues, recadrées ou en noir et blanc, pièce expirée ou un seul côté envoyé, selfie non conforme.",
        [SRC.bitget.kycFr, SRC.bitget.kycRejectFr]),
      faq("Peut-on ajouter le code de parrainage Bitget après l’inscription ?",
        "Les guides d’inscription de Bitget ne prévoient le champ du code que dans le formulaire de création du compte et ne décrivent pas de moyen de l’ajouter ensuite. Le programme de parrainage considère comme filleul la personne qui s’inscrit avec le lien ou le code. Vérifiez donc le code avant de valider.",
        [SRC.bitget.regFr, SRC.bitget.referral]),
      faq("Bitget ou Bitget Wallet : quelle différence ?",
        "Selon sa documentation officielle, Bitget Wallet est un portefeuille crypto non dépositaire. Le compte de la plateforme Bitget est une inscription distincte, par e-mail ou téléphone, avec vérification d’identité pour déposer, retirer et trader. Le code de parrainage de ce profil s’applique à l’inscription du compte de la plateforme.",
        [SRC.bitget.wallet, SRC.bitget.regFr, SRC.bitget.kycFr]),
    ],
    en: [
      faq("Bitget vs Bitget Wallet: what is the difference?",
        "Bitget Wallet's official developer docs describe it as a non-custodial crypto wallet. The Bitget exchange account is a separate registration made with an email or mobile number, with an optional referral code field in the sign-up form, and identity verification is what unlocks deposits, withdrawals and trading. A referral code shown on this profile applies to that exchange-account registration.",
        [SRC.bitget.wallet, SRC.bitget.regEn, SRC.bitget.kycEn]),
    ],
    "zh-Hans": [
      faq("Bitget 交易所账户和 Bitget Wallet 有什么区别？",
        "Bitget Wallet 官方开发者文档说明，它是一款非托管加密钱包。Bitget 交易所账户是另一套注册：用邮箱或手机号注册，注册表单中可选填邀请码，完成身份认证后才能充值、提现和交易。本页显示的邀请码用于交易所账户注册。",
        [SRC.bitget.wallet, SRC.bitget.regEn, SRC.bitget.kycEn]),
    ],
  },
  binance: {
    "pt-BR": [
      faq("Onde coloco o código de convite (indicação) da Binance?",
        "No app, logo depois de criar a conta, aparece a etapa do código de indicação. Se você chegou por um link de indicação, o código já vem preenchido com um sinal verde e “Vinculado”; se o código for inválido, dá para editar ou digitar outro nessa mesma etapa. O código de parceiro da NexuAlpha para a Binance é {code}.",
        [SRC.binance.register]),
      faq("O código de convite da Binance não funciona. Dá para corrigir depois?",
        "Não. A Binance informa que, depois de vinculado, o código não pode ser modificado, e que nenhuma correção é possível depois que o novo usuário conclui o cadastro. Os motivos que ela lista para o vínculo falhar: outro código foi usado, o código não foi digitado no cadastro, ou a conta violou os termos.",
        [SRC.binance.register, SRC.binance.referralLite]),
      faq("Como depositar reais na Binance com Pix?",
        "Crie a ordem de depósito na Binance antes de transferir. O Pix funciona 24 horas por dia, 7 dias por semana, e costuma ser instantâneo; a ordem Pix precisa ser paga em até 24 horas, senão expira. A transferência pode sair de qualquer banco brasileiro, mas o titular e o CPF/CNPJ têm que ser os mesmos da verificação de identidade na Binance. Na tabela da Binance, o depósito em BRL para conta pessoal é gratuito.",
        [SRC.binance.brl]),
      faq("Como sacar BRL da Binance para minha conta?",
        "O saque só vai para conta bancária no mesmo nome da sua conta Binance; contas conjuntas e contas de MEI ou EIRELI não são aceitas. Pedidos feitos no horário bancário são processados na hora e podem levar até 2 dias úteis; fora desse horário, ficam para o próximo dia útil. Na tabela da Binance, o saque para conta pessoal custa R$ 3,50 (sujeito a mudança).",
        [SRC.binance.brl]),
      faq("Dá para criar conta PJ (CNPJ) na Binance?",
        "Sim, como conta de entidade (corporativa). Escolha o tipo com cuidado no cadastro: depois de registrada, a conta não muda de tipo. Para depositar com CNPJ é preciso usar a conta corporativa, e a Binance não aceita transferências entre conta PJ e conta pessoal, mesmo de empresa com um único sócio.",
        [SRC.binance.register, SRC.binance.brl]),
      faq("O que a Binance pede na verificação de identidade?",
        "Todo usuário novo precisa concluir o nível Verificado para depositar e negociar. Você escolhe residência, país emissor e tipo de documento, envia frente e verso, faz a prova de vida com a câmera e confirma os dados — que precisam bater com o documento e não podem ser alterados depois de confirmados.",
        [SRC.binance.kyc]),
      faq("Binance Wallet é a mesma coisa que a conta da Binance?",
        "Não. A Binance Wallet é uma carteira de autocustódia dentro do app, com chaves divididas em partes guardadas no seu dispositivo e na sua nuvem; é um produto opcional, prestado por outra empresa do grupo. A conta da exchange é o cadastro com verificação de identidade, e é nela que o código de indicação é vinculado.",
        [SRC.binance.wallet, SRC.binance.register]),
    ],
    es: [
      faq("¿Dónde ingreso el código de referido de Binance?",
        "En la app, justo después de crear la cuenta aparece el paso del código de referido. Si llegaste por un enlace de referido, el código ya viene cargado con un check verde y la etiqueta “Vinculado”; si el código no es válido, puedes editarlo o escribir otro en ese mismo paso. El código de socio de NexuAlpha para Binance es {code}.",
        [SRC.binance.register]),
      faq("Mi código de referido de Binance no quedó vinculado, ¿se puede corregir?",
        "No. Binance indica que una vez vinculado el código no se puede modificar y que no hay corrección posible después de que el usuario nuevo se registra. Las causas que menciona: se usó otro código, no se ingresó el código durante el registro o la cuenta incumplió los términos.",
        [SRC.binance.register, SRC.binance.referralLite]),
      faq("¿Puedo registrar una cuenta de empresa en Binance?",
        "Sí, como cuenta de entidad. Elige el tipo de cuenta con cuidado al registrarte, porque después ya no se puede cambiar.",
        [SRC.binance.register]),
      faq("¿Qué pide Binance para verificar la identidad?",
        "Todos los usuarios nuevos deben completar el nivel Verificado para depositar y operar. Seleccionas residencia, país emisor y tipo de documento, subes ambos lados, haces la prueba de vida con la cámara y confirmas tus datos, que deben coincidir con el documento y no se pueden cambiar después de confirmarlos.",
        [SRC.binance.kyc]),
      faq("¿Cómo funciona Binance P2P para comprar con moneda local?",
        "Binance P2P es un mercado entre usuarios: eliges moneda local, precio y método de pago, entre más de 800 opciones. Las ofertas las publican otros usuarios; los comerciantes verificados llevan una insignia amarilla. Mientras dura la orden, las criptomonedas quedan en custodia (escrow) de Binance. Para operar necesitas la verificación de identidad, SMS activado y al menos un segundo factor (2FA). Las comisiones P2P varían por mercado y tu proveedor de pagos puede cobrar aparte.",
        [SRC.binance.p2p]),
      faq("¿Binance Wallet es lo mismo que mi cuenta de Binance?",
        "No. Binance Wallet es una billetera de autocustodia dentro de la app, con la clave dividida en partes guardadas en tu dispositivo y en tu nube; es un producto opcional que presta otra empresa del grupo. La cuenta del exchange es el registro con verificación de identidad, y ahí es donde se vincula el código de referido.",
        [SRC.binance.wallet, SRC.binance.register]),
    ],
    fr: [
      faq("Où saisir le code de parrainage Binance ?",
        "Dans l’application, juste après la création du compte, une étape est consacrée au code de parrainage. Si vous arrivez par un lien de parrainage, le code est déjà rempli avec une coche verte et la mention « Lié » ; s’il est invalide, vous pouvez le modifier ou en saisir un autre à cette étape. Le code partenaire de NexuAlpha pour Binance est {code}.",
        [SRC.binance.register]),
      faq("Peut-on ajouter ou changer le code de parrainage Binance après l’inscription ?",
        "Non. Binance précise qu’un code lié ne peut plus être modifié et qu’aucune correction n’est possible une fois l’inscription terminée. Causes d’échec citées : un autre code a été utilisé, le code n’a pas été saisi à l’inscription, ou le compte a enfreint les conditions.",
        [SRC.binance.register, SRC.binance.referralLite]),
      faq("Quels documents Binance demande-t-il pour la vérification d’identité ?",
        "Tous les nouveaux utilisateurs doivent atteindre le niveau Vérifié pour déposer et trader. Vous indiquez votre pays de résidence, le pays d’émission et le type de pièce, envoyez le recto et le verso, passez la vérification du vivant (liveness) avec la caméra, puis confirmez vos informations : elles doivent correspondre à la pièce et ne peuvent plus être modifiées après confirmation.",
        [SRC.binance.kyc]),
      faq("Comment acheter des cryptos en monnaie locale avec Binance P2P ?",
        "Binance P2P met en relation des utilisateurs : vous choisissez la monnaie locale, le prix et le moyen de paiement parmi plus de 800 options proposées dans les annonces. Les cryptos sont bloquées en séquestre par Binance pendant l’ordre ; les marchands vérifiés portent un badge jaune. Il faut avoir validé son identité, activé le SMS et au moins une double authentification (2FA). Les frais P2P varient selon le marché et votre prestataire de paiement peut facturer en plus.",
        [SRC.binance.p2p]),
      faq("Peut-on ouvrir un compte entreprise sur Binance ?",
        "Oui, en tant que compte d’entité. Choisissez bien le type de compte à l’inscription : il ne peut plus être changé ensuite.",
        [SRC.binance.register]),
      faq("Binance Wallet, est-ce mon compte Binance ?",
        "Non. Binance Wallet est un portefeuille en auto-garde intégré à l’application, dont la clé est découpée en parts stockées sur votre appareil et dans votre cloud ; c’est un produit facultatif fourni par une autre société du groupe. Le compte de la plateforme est l’inscription avec vérification d’identité, et c’est à lui que le code de parrainage est lié.",
        [SRC.binance.wallet, SRC.binance.register]),
    ],
  },
  bybit: {
    "pt-BR": [
      faq("Onde coloco o código de convite (indicação) da Bybit?",
        "No cadastro, depois de escolher o país e informar e-mail ou celular, digite o código de indicação ou de afiliado antes de clicar em criar a conta (Sign Up Now). O código de parceiro da NexuAlpha para a Bybit é {code}.",
        [SRC.bybit.register]),
      faq("Esqueci o código de convite na Bybit. Dá para adicionar depois?",
        "Em regra, não: depois que a conta é criada, a Bybit não permite adicionar, alterar nem apagar o código de indicação ou de afiliado. A exceção é o código de afiliado: a conta principal pode adicioná-lo em até 14 dias após o cadastro, em Conta > “Join an Affiliate's Community”, se ainda não tiver nenhum código vinculado. Códigos do programa de indicação de usuários comuns não entram por esse caminho, e depois de adicionado o código não pode ser trocado.",
        [SRC.bybit.register, SRC.bybit.affiliateCode, SRC.bybit.referralFaq]),
      faq("A Bybit aceita depósito em reais por Pix?",
        "Sim: a Bybit lista o Pix como forma de depósito em BRL. A própria Bybit avisa que alguns usuários podem não ver todas as moedas e formas de pagamento por questões regulatórias ou manutenção; a lista válida para a sua conta fica na página de depósito em moeda fiduciária.",
        [SRC.bybit.fiatDeposit]),
      faq("Como sacar reais da Bybit via Pix?",
        "No saque em BRL por Pix, você vincula a conta de destino informando o tipo de chave Pix e o tipo de documento (CPF ou CNPJ). Os dados precisam bater com os informados na verificação de identidade da Bybit, e todas as chaves Pix devem estar no mesmo CPF/CNPJ.",
        [SRC.bybit.fiatWithdraw]),
      faq("A verificação de identidade (KYC) é obrigatória na Bybit?",
        "Sim. Pelo menos o nível Standard é obrigatório para todos os produtos e serviços da Bybit; algumas regiões ou produtos pedem nível superior. Documentos aceitos incluem passaporte, carteira de identidade e autorização de residência. O resultado chega por e-mail, e as recusas mais comuns envolvem nome ou data de nascimento ilegíveis, foto do rosto pouco nítida ou passaporte sem assinatura.",
        [SRC.bybit.kycFaq, SRC.bybit.kycFail]),
      faq("Bybit Wallet é a mesma coisa que a conta da Bybit?",
        "Não. A Bybit Wallet tem três tipos de carteira e nenhum exige verificação de identidade: na carteira com frase-semente você controla as chaves; na carteira keyless a chave é dividida entre a Bybit e a sua nuvem; na carteira em nuvem a Bybit administra as chaves. A conta da exchange é o cadastro com KYC, e é nela que o código de indicação entra.",
        [SRC.bybit.wallet, SRC.bybit.register]),
    ],
    es: [
      faq("¿Dónde pongo el código de referido de Bybit?",
        "Al registrarte, después de elegir tu país e ingresar correo o celular, escribe el código de referido o de afiliado antes de tocar crear cuenta (Sign Up Now). El código de socio de NexuAlpha para Bybit es {code}.",
        [SRC.bybit.register]),
      faq("Olvidé el código en Bybit, ¿puedo agregarlo después?",
        "Por regla general no: una vez creada la cuenta, Bybit no permite agregar, cambiar ni borrar el código de referido o de afiliado. La excepción es el código de afiliado: la cuenta principal puede agregarlo dentro de los 14 días posteriores al registro, en Cuenta > “Join an Affiliate's Community”, si todavía no tiene ningún código vinculado. Los códigos del programa de referidos entre usuarios no entran por esa vía, y una vez agregado ya no se puede cambiar.",
        [SRC.bybit.register, SRC.bybit.affiliateCode, SRC.bybit.referralFaq]),
      faq("¿Cómo deposito pesos mexicanos (MXN) en Bybit?",
        "Bybit acepta MXN por transferencia bancaria vía SPEI, con dos opciones: una CLABE fija asignada a tu cuenta, que no cambia, o datos de pago dinámicos que se generan para cada depósito y se usan una sola vez. Hay un límite especial de depósito de 10,000 MXN por día. Para retirar MXN por transferencia bancaria, primero tienes que haber hecho un depósito fiat con ese método.",
        [SRC.bybit.fiatDeposit, SRC.bybit.fiatDepositFaq, SRC.bybit.fiatWithdraw]),
      faq("¿Y en Colombia, se puede depositar pesos (COP) en Bybit?",
        "Sí: Bybit lista COP con transferencia bancaria procesada por PSE. Para retirar COP por transferencia, la cuenta bancaria debe estar a tu mismo nombre que en la verificación de identidad de Bybit. Bybit aclara que algunas monedas o métodos pueden no estar disponibles para ciertos usuarios por temas regulatorios o mantenimiento.",
        [SRC.bybit.fiatDeposit, SRC.bybit.fiatWithdraw]),
      faq("¿La verificación de identidad es obligatoria en Bybit?",
        "Sí. Al menos el nivel Standard es obligatorio para todos los productos y servicios; algunas regiones o productos piden un nivel más alto. Se aceptan pasaporte, documento nacional de identidad o permiso de residencia. El resultado llega por correo, y los rechazos más comunes son nombre o fecha de nacimiento ilegibles, foto del rostro poco clara o pasaporte sin firma.",
        [SRC.bybit.kycFaq, SRC.bybit.kycFail]),
      faq("¿Bybit Wallet es lo mismo que la cuenta de Bybit?",
        "No. Bybit Wallet ofrece tres tipos de billetera y ninguno pide verificación de identidad: con frase semilla controlas tus claves; en la keyless la clave se reparte entre Bybit y tu nube; en la billetera en la nube Bybit administra las claves. La cuenta del exchange es el registro con KYC, y ahí es donde va el código de referido.",
        [SRC.bybit.wallet, SRC.bybit.register]),
    ],
    fr: [
      faq("Où saisir le code de parrainage Bybit ?",
        "À l’inscription, après avoir choisi votre pays et saisi votre e-mail ou votre numéro, entrez le code de parrainage ou d’affilié avant de cliquer sur créer le compte (Sign Up Now). Le code partenaire de NexuAlpha pour Bybit est {code}.",
        [SRC.bybit.register]),
      faq("J’ai oublié le code sur Bybit : puis-je l’ajouter plus tard ?",
        "En règle générale, non : une fois le compte créé, Bybit ne permet ni d’ajouter, ni de modifier, ni de supprimer le code. Exception : un code d’affilié peut être ajouté par le compte principal dans les 14 jours suivant l’inscription, via Compte > « Join an Affiliate's Community », si aucun code n’est encore lié. Les codes du programme de parrainage entre utilisateurs ne passent pas par cette voie, et un code ajouté ne peut plus être changé.",
        [SRC.bybit.register, SRC.bybit.affiliateCode, SRC.bybit.referralFaq]),
      faq("La vérification d’identité est-elle obligatoire sur Bybit ?",
        "Oui. Le niveau Standard au minimum est obligatoire pour tous les produits et services ; certaines régions ou certains produits exigent davantage. Pièces acceptées : passeport, carte nationale d’identité, titre de séjour. Le résultat arrive par e-mail ; les refus les plus fréquents viennent d’un nom ou d’une date de naissance illisibles, d’une photo du visage floue ou d’un passeport non signé.",
        [SRC.bybit.kycFaq, SRC.bybit.kycFail]),
      faq("Peut-on payer en monnaie locale sur Bybit P2P ?",
        "Bybit P2P met en relation deux utilisateurs ; Bybit ne publie pas elle-même les offres. La plateforme annonce plus de 600 moyens de paiement et plus de 370 devises, avec un KYC exigé des acheteurs comme des annonceurs. Le moyen de paiement disponible dépend des annonces affichées pour votre devise.",
        [SRC.bybit.p2p]),
      faq("Bybit Wallet, est-ce le même compte que Bybit ?",
        "Non. Bybit Wallet propose trois types de portefeuille, sans vérification d’identité : avec phrase de récupération, vous contrôlez vos clés ; le portefeuille keyless partage la clé entre Bybit et votre cloud ; le portefeuille cloud laisse Bybit gérer les clés. Le compte de la plateforme est l’inscription avec KYC, et c’est là que se saisit le code de parrainage.",
        [SRC.bybit.wallet, SRC.bybit.register]),
    ],
  },
  "gate-io": {
    "pt-BR": [
      faq("Quais são as taxas da Gate?",
        "Pela FAQ da Gate, a taxa de negociação spot e de margem é volume × 0,1% × desconto do seu nível VIP. As negociações C2C (P2P) em moeda fiduciária hoje não têm taxa, e qualquer mudança é anunciada na plataforma. A taxa de saque de cripto é ajustada a cada hora conforme a rede e aparece na página de saque depois que você escolhe moeda e rede.",
        [SRC["gate-io"].faqPt]),
      faq("A Gate exige verificação de identidade (KYC)?",
        "Sim. A Gate pede KYC de todos os usuários antes de depósitos e saques. Use um documento oficial válido (passaporte, carteira de motorista ou identidade), com foto do documento físico — cópias, digitalizações e prints não são aceitos — e nome exatamente igual ao do documento. A análise leva normalmente de 10 minutos a 12 horas, e menores de 18 anos não podem verificar. O limite diário de saque depende do nível VIP e do KYC.",
        [SRC["gate-io"].kycPt, SRC["gate-io"].faqPt]),
      faq("Como comprar cripto com reais na Gate?",
        "A Gate indica o C2C (P2P) para depósito em moeda fiduciária: em Comprar Cripto > C2C você conclui a compra com um anunciante. Os anúncios aparecem por melhor preço e, no mesmo preço, pelo mais antigo. A cripto comprada via C2C fica bloqueada para saque por 24 horas.",
        [SRC["gate-io"].faqPt]),
      faq("Paguei no P2P da Gate e o vendedor não liberou. O que fazer?",
        "Confirme que você clicou em “Confirmar pagamento” e tente falar com o vendedor. Se ele não responder, abra uma apelação com o comprovante e acompanhe o status. Se você pagou por engano um anunciante antigo, localize o pedido em Pedidos concluídos e abra a apelação por lá.",
        [SRC["gate-io"].faqPt]),
      faq("Conta da Gate ou Gate Web3 Wallet: qual a diferença?",
        "A Gate Web3 Wallet é uma carteira não custodial: os ativos ficam sob seu controle e você é responsável pela frase mnemônica, pela chave privada e pela senha — a carteira não guarda a senha e, se você perder a frase, perde os ativos. A conta da exchange Gate é outro cadastro, com KYC obrigatório para depositar e sacar.",
        [SRC["gate-io"].walletPt, SRC["gate-io"].kycPt]),
    ],
    es: [
      faq("¿Desde qué países no se puede usar Gate?",
        "La lista de regiones restringidas de Gate incluye, entre otras, España, Argentina, Venezuela y Bolivia, además de Estados Unidos, Canadá, Francia, Reino Unido y Japón. Gate puede actualizar la lista sin aviso; revísala antes de registrarte.",
        [SRC["gate-io"].restrictedEs]),
      faq("¿Cuánto cobra Gate de comisión?",
        "Según la FAQ de Gate, la comisión de trading spot y margen es volumen × 0,1 % × el descuento de tu nivel VIP. Las operaciones C2C (P2P) en moneda fiat hoy no tienen comisión y cualquier cambio se anuncia en la plataforma. La comisión de retiro de cripto se ajusta cada hora según la red y la ves en la página de retiro al elegir moneda y red.",
        [SRC["gate-io"].faqEs]),
      faq("¿Gate pide verificación de identidad (KYC)?",
        "Sí. Gate exige KYC a todos los usuarios antes de depositar o retirar. Usa un documento oficial vigente (pasaporte, licencia de conducir o identificación), con foto del documento físico —no copias, escaneos ni capturas— y el nombre exactamente igual. La revisión suele tardar de 10 minutos a 12 horas y los menores de 18 años no pueden verificarse. El límite diario de retiro depende de tu nivel VIP y del KYC.",
        [SRC["gate-io"].kycEs, SRC["gate-io"].faqEs]),
      faq("¿Cómo compro cripto con moneda local en Gate?",
        "Gate indica usar C2C (P2P) para depositar con moneda fiat: en Comprar cripto > C2C completas la compra con un anunciante. Los anuncios se ordenan por mejor precio y, a igual precio, por antigüedad. Lo que compras por C2C queda bloqueado para retiro durante 24 horas.",
        [SRC["gate-io"].faqEs]),
      faq("Pagué en P2P de Gate y el vendedor no libera, ¿qué hago?",
        "Confirma que tocaste “Confirmar pago” e intenta contactar al vendedor. Si no responde, envía una apelación con el comprobante de pago y sigue su estado. Si le pagaste por error a un anunciante anterior, busca la orden en Órdenes completadas y apela desde ahí.",
        [SRC["gate-io"].faqEs]),
      faq("¿Gate Web3 Wallet es lo mismo que la cuenta de Gate?",
        "No. Gate Web3 Wallet es una billetera no custodial: los activos quedan bajo tu control y tú respondes por la frase mnemotécnica, la clave privada y la contraseña —la billetera no guarda tu contraseña y si pierdes la frase pierdes los activos—. La cuenta del exchange Gate es otro registro, con KYC obligatorio para depositar y retirar.",
        [SRC["gate-io"].walletEs, SRC["gate-io"].kycEs]),
    ],
    fr: [
      faq("Gate est-il accessible depuis la France ?",
        "Non. La France figure dans la liste des régions restreintes de Gate, avec notamment l’Allemagne, l’Espagne, les Pays-Bas, le Royaume-Uni, le Canada et les États-Unis. Gate peut modifier cette liste sans préavis : consultez-la avant de vous inscrire.",
        [SRC["gate-io"].restrictedFr]),
      faq("Quels sont les frais sur Gate ?",
        "D’après la FAQ de Gate, les frais de trading spot et sur marge valent volume × 0,1 % × la réduction de votre niveau VIP. Les échanges C2C (P2P) en monnaie fiat sont actuellement sans frais, tout changement étant annoncé sur la plateforme. Les frais de retrait crypto sont ajustés chaque heure selon le réseau et s’affichent sur la page de retrait une fois la crypto et le réseau choisis.",
        [SRC["gate-io"].faqFr]),
      faq("Le KYC est-il obligatoire sur Gate ?",
        "Oui. Gate impose le KYC à tous les utilisateurs avant tout dépôt ou retrait. Il faut une pièce officielle valide (passeport, permis de conduire ou carte d’identité), photographiée en original — pas de copie, de scan ni de capture d’écran — et un nom identique à celui de la pièce. L’examen prend en général de 10 minutes à 12 heures ; les moins de 18 ans ne peuvent pas être vérifiés. La limite de retrait quotidienne dépend du niveau VIP et du KYC.",
        [SRC["gate-io"].kycFr, SRC["gate-io"].faqFr]),
      faq("Comment acheter des cryptos en monnaie locale sur Gate ?",
        "Gate renvoie vers le C2C (P2P) pour les dépôts en monnaie fiat : dans Acheter des cryptos > C2C, vous concluez l’achat avec un annonceur. Les annonces sont classées par meilleur prix puis, à prix égal, par ancienneté. Les cryptos achetées en C2C sont bloquées au retrait pendant 24 heures.",
        [SRC["gate-io"].faqFr]),
      faq("J’ai payé en P2P sur Gate mais le vendeur ne libère pas : que faire ?",
        "Vérifiez que vous avez bien cliqué sur « Confirmer le paiement », puis contactez le vendeur. Sans réponse, déposez un recours avec la preuve de paiement et suivez son statut. Si vous avez payé par erreur un ancien partenaire P2P, retrouvez l’ordre dans Ordres terminés et déposez le recours depuis celui-ci.",
        [SRC["gate-io"].faqFr]),
      faq("Compte Gate ou Gate Web3 Wallet : quelle différence ?",
        "Gate Web3 Wallet est un portefeuille non dépositaire : vos actifs restent sous votre contrôle et vous êtes responsable de la phrase mnémonique, de la clé privée et du mot de passe — le portefeuille ne conserve pas le mot de passe et une phrase perdue signifie des actifs perdus. Le compte de la plateforme Gate est une inscription distincte, avec KYC obligatoire pour déposer et retirer.",
        [SRC["gate-io"].walletFr, SRC["gate-io"].kycFr]),
    ],
  },
  mexc: {
    "pt-BR": [
      faq("Onde coloco o código de indicação da MEXC?",
        "No cadastro, digite o código de indicação no campo correspondente; se você abrir um link de indicação, o código é aplicado automaticamente. O código de parceiro da NexuAlpha para a MEXC é {code}.",
        [SRC.mexc.invite]),
      faq("Esqueci o código de convite da MEXC. Dá para vincular depois?",
        "Sim, dentro de 30 dias após o cadastro: a MEXC permite vincular o código de convite pelo suporte ou pela função de autoatendimento de vínculo de convidante. Depois de vinculado, o código não pode ser trocado nem removido.",
        [SRC.mexc.affiliateFaq]),
      faq("Qual a diferença entre o KYC básico e o avançado na MEXC?",
        "Com o KYC básico (Primary) você já usa P2P, spot e futuros e saca até 80 BTC por dia; o avançado eleva o saque para 200 BTC por dia e libera negociação fiduciária até 20.000 USD por dia. A análise costuma levar 15 minutos, mas pode chegar a 8–24 horas. Cada pessoa pode verificar no máximo duas contas MEXC.",
        [SRC.mexc.kycFaq]),
      faq("Por que meu KYC na MEXC foi recusado?",
        "Os motivos mais comuns, segundo a MEXC: foto do documento borrada ou ilegível, dados cobertos (como nome ou número), documento vencido, documento que já atingiu o limite de contas vinculadas, envio de print ou cópia em vez de foto do original, e dados diferentes entre o KYC básico e o avançado. O motivo exato chega por e-mail e aparece na página de Identificação.",
        [SRC.mexc.kycFail]),
      faq("Por que não consigo sacar a cripto que comprei com reais na MEXC?",
        "É a política T+N da MEXC, que vale para o Brasil: cripto comprada por canais fiduciários fica retida por um período (24 horas por padrão, ajustável pela análise de risco). Nesse prazo ficam bloqueados saques, transferências internas, venda via fiat/P2P e envio de presentes, mas você pode negociar no spot. Cripto depositada diretamente não é afetada.",
        [SRC.mexc.tn]),
    ],
    es: [
      faq("¿Dónde pongo el código de referido de MEXC?",
        "Al registrarte, escribe el código de referido en el campo correspondiente; si abres un enlace de referido, el código se aplica solo. El código de socio de NexuAlpha para MEXC es {code}.",
        [SRC.mexc.invite]),
      faq("Olvidé el código de invitación de MEXC, ¿puedo vincularlo después?",
        "Sí, dentro de los 30 días posteriores al registro: MEXC permite vincular el código de invitación a través de soporte o de la función de autoservicio. Una vez vinculado, el código no se puede cambiar ni eliminar.",
        [SRC.mexc.affiliateFaq]),
      faq("¿Qué diferencia hay entre el KYC básico y el avanzado en MEXC?",
        "Con el KYC básico (Primary) ya puedes usar P2P, spot y futuros y retirar hasta 80 BTC al día; el avanzado sube el retiro a 200 BTC al día y habilita operaciones fiat de hasta 20,000 USD diarios. La revisión suele tomar 15 minutos, aunque puede tardar de 8 a 24 horas. Cada persona puede verificar como máximo dos cuentas de MEXC.",
        [SRC.mexc.kycFaq]),
      faq("¿Por qué rechazaron mi verificación en MEXC?",
        "Las causas más comunes según MEXC: foto del documento borrosa o ilegible, datos tapados (como el nombre o el número), documento vencido, documento que ya llegó al límite de cuentas, captura o copia en lugar de foto del original, y datos distintos entre el KYC básico y el avanzado. El motivo exacto te llega por correo y aparece en la página de Identificación.",
        [SRC.mexc.kycFail]),
      faq("¿Por qué no puedo retirar la cripto que compré con pesos en MEXC?",
        "Puede ser la política T+N de MEXC, que aplica en países como Colombia y España: la cripto comprada por canales fiat queda retenida un tiempo (24 horas por defecto, ajustable según el análisis de riesgo). Mientras tanto se bloquean retiros, transferencias internas, ventas por fiat/P2P y regalos, pero puedes operar en spot. México no figura en esa lista, y la cripto depositada directamente no se ve afectada.",
        [SRC.mexc.tn]),
    ],
    fr: [
      faq("Où saisir le code de parrainage MEXC ?",
        "À l’inscription, saisissez le code de parrainage dans le champ prévu ; si vous ouvrez un lien de parrainage, le code s’applique automatiquement. Le code partenaire de NexuAlpha pour MEXC est {code}.",
        [SRC.mexc.invite]),
      faq("J’ai oublié le code de parrainage MEXC : puis-je le lier plus tard ?",
        "Oui, dans les 30 jours qui suivent l’inscription : MEXC permet de lier le code d’invitation via le support ou la fonction en libre-service. Une fois lié, le code ne peut plus être changé ni supprimé.",
        [SRC.mexc.affiliateFaq]),
      faq("Quelle différence entre le KYC de base et le KYC avancé sur MEXC ?",
        "Le KYC de base (Primary) donne déjà accès au P2P, au spot et aux futures, avec des retraits jusqu’à 80 BTC par jour ; le KYC avancé porte les retraits à 200 BTC par jour et ouvre le trading fiat jusqu’à 20 000 USD par jour. L’examen prend en général 15 minutes, parfois 8 à 24 heures. Une même personne peut vérifier au plus deux comptes MEXC.",
        [SRC.mexc.kycFaq]),
      faq("Pourquoi mon KYC MEXC a-t-il été refusé ?",
        "Causes les plus fréquentes selon MEXC : photo floue ou illisible, informations masquées (nom ou numéro), pièce expirée, pièce ayant atteint le nombre maximal de comptes liés, capture d’écran ou copie au lieu d’une photo de l’original, et données différentes entre le KYC de base et le KYC avancé. Le motif exact est envoyé par e-mail et visible sur la page Identification.",
        [SRC.mexc.kycFail]),
      faq("Pourquoi ne puis-je pas retirer les cryptos achetées en monnaie fiat sur MEXC ?",
        "C’est la politique T+N de MEXC, appliquée notamment en France, en Belgique et au Nigeria : les cryptos achetées par un canal fiat sont retenues pendant un délai (24 heures par défaut, ajustable selon l’analyse de risque). Pendant ce temps, retraits, transferts internes, ventes fiat/P2P et cadeaux sont bloqués, mais le trading spot reste possible. Les cryptos déposées directement ne sont pas concernées.",
        [SRC.mexc.tn]),
    ],
  },
};

// Owner exchange keyword plan 2026-10-11: referral long-tail answers in tr / vi / id (questions follow the real
// autocomplete phrasing in docs/company/exchange-keyword-map-2026-10-11.md), plus hyperliquid (en) and backpack
// (en, fr). Same rules as ENTRIES: official pages only, `{code}` from the partner feed.
// l10n: needs native review (tr, vi, id blocks below)
const LOCAL_ENTRIES = {
  okx: {
    // l10n: needs native review
    tr: [
      faq("OKX referans kodu nereye yazılır?",
        "Referans kodu hesap oluşturulmadan önce girilir: kayıt formundaki alana yazılır ya da bir davet bağlantısını açtığınızda alan önceden dolu gelir. Bağlantı açılmazsa OKX, uygulamayı indirip kodu kayıt sayfasına yazmanızı önerir. NexuAlpha'nın OKX ortaklık kodu {code}.",
        [SRC.okx.refEn]),
      faq("OKX referans kodu sonradan eklenir mi, değiştirilebilir mi?",
        "Hayır. OKX'e göre referans kodu yalnızca kayıt sırasında bağlanabilir: hesap açıldıktan sonra kod eklenemez veya değiştirilemez, bağlantı kayıttan ya da kimlik doğrulamadan sonra da değişmez. Hesabınızın bir davet edeni olup olmadığını uygulamada Menü > Hesap ayarları > Profil > Referans ödülleri yolundan kontrol edebilirsiniz; bu seçenek görünmüyorsa bağlantı oluşmamıştır.",
        [SRC.okx.refEn]),
      faq("OKX referans kodu neden çalışmıyor?",
        "OKX'in saydığı nedenler: hesap zaten açılmıştır (kod sonradan girilemez); son 30 gün içinde bir davet bağlantısı açtığınız ya da uygulamayı kodlu bir bağlantıdan indirdiğiniz için başka bir kod önceden dolmuştur (OKX bu durumda gizli pencerede kayıt olmanızı ve tamamlamadan önce kodu kontrol etmenizi önerir); ya da referans özelliği her kullanıcıya açık değildir. OKX ayrıca farklı bölgeler arasındaki davetlerin davet edene ödül kazandırmadığını belirtir.",
        [SRC.okx.refEn]),
      faq("OKX komisyon iadesi nasıl yapılır, kim öder?",
        "NexuAlpha'nın ortaklık verilerine göre iade, ödediğiniz işlem ücretinden gelir ve OKX tarafından {cadence} olarak ödenir; güncel oran bu sayfadaki kayıt kartında gösterilir. İade, kaydı {code} koduyla ya da davet bağlantısıyla yapılan hesaplar içindir; kod sonradan eklenemez.",
        [SRC.okx.refEn]),
      faq("OKX TR mi, global OKX hesabı mı? Referans kodu hangisinde geçerli?",
        "SPK'nın faaliyette bulunanlar listesinde (01 Ekim 2026 tarihli geçici liste) OKX TR Kripto Varlık Alım Satım Platformu AŞ yer alır; SPK, listede bulunmanın yetkilendirme anlamına gelmediğini de belirtir. {code}, NexuAlpha'nın OKX referans programındaki ortaklık kodudur ve NexuAlpha bu kodun OKX TR hesaplarında geçerli olduğunu henüz doğrulamamıştır. OKX, farklı bölgeler arasındaki davetlerin davet edene ödül kazandırmadığını belirtir. Kayıt ekranında hangi kuruluşa kaydolduğunuzu kontrol edin.",
        [REG.spkOperating, SRC.okx.refEn]),
      faq("OKX hesabı ile OKX Wallet aynı şey mi?",
        "Hayır. OKX Web3 Wallet saklama hizmeti olmayan (non-custodial) bir cüzdandır: kurtarma ifadesini veya özel anahtarı siz saklarsınız, cüzdan kimlik doğrulama ya da giriş istemez ve kurtarma ifadesini kaybeden varlıklarına erişimini kaybeder. OKX borsa hesabı ise kimlik doğrulamalı ayrı bir kayıttır. Referans kodu bu borsa hesabı açılmadan önce girilir.",
        [SRC.okx.walletEn, SRC.okx.refEn, SRC.okx.kycEn]),
      faq("OKX kimlik doğrulaması (KYC) için ne istiyor?",
        "OKX, ülkenizde kabul edilen fotoğraflı resmî bir kimlik belgesi, belgeyle karşılaştırılan bir selfie ve ikamet adresinizi ister; adresiniz değiştiyse son 3 ay içinde düzenlenmiş bir fatura veya hesap özeti gibi güncel bir belge istenebilir. 18 yaşını doldurmuş olmanız gerekir. Doğrulamayı tamamlamak para yatırma ve çekme limitlerini yükseltir.",
        [SRC.okx.kycEn]),
    ],
    // l10n: needs native review
    vi: [
      faq("Nhập mã giới thiệu OKX ở đâu?",
        "Mã giới thiệu phải được nhập trước khi tạo tài khoản: trong ô của biểu mẫu đăng ký, hoặc mã được điền sẵn khi bạn mở một liên kết mời. Nếu liên kết không mở được, OKX hướng dẫn tải ứng dụng và nhập mã ở trang đăng ký (trên điện thoại hay trên máy tính đều là bước đăng ký này). Mã đối tác của NexuAlpha cho OKX là {code}.",
        [SRC.okx.refEn]),
      faq("Đã đăng ký OKX rồi có thêm hoặc đổi mã giới thiệu được không?",
        "Không. Theo OKX, mã giới thiệu chỉ được liên kết khi đăng ký: sau khi tài khoản đã tạo thì không thể thêm hay đổi mã, và liên kết không thay đổi sau khi đăng ký hoặc xác minh danh tính. Để xem tài khoản có người giới thiệu hay không, vào ứng dụng Menu > Cài đặt tài khoản > Hồ sơ > Phần thưởng giới thiệu; nếu không thấy mục này thì chưa có liên kết nào.",
        [SRC.okx.refEn]),
      faq("Vì sao mã giới thiệu OKX không dùng được?",
        "Các trường hợp OKX nêu: tài khoản đã được tạo trước đó (không nhập mã sau được); một mã khác đã được điền sẵn vì bạn mở liên kết mời hoặc tải ứng dụng qua liên kết có mã trong 30 ngày gần đây (OKX khuyên đăng ký trong cửa sổ ẩn danh và kiểm tra mã trước khi hoàn tất); hoặc tính năng giới thiệu không mở cho mọi người dùng. OKX cũng cho biết lời mời giữa các khu vực khác nhau không mang lại phần thưởng cho người mời.",
        [SRC.okx.refEn]),
      faq("Tài khoản sàn OKX và ví OKX Wallet có phải là một?",
        "Không. OKX Web3 Wallet là ví không lưu ký: bạn tự giữ cụm từ khôi phục hoặc khóa riêng, ví không cần xác minh danh tính hay đăng nhập, và mất cụm từ khôi phục là mất quyền truy cập tài sản. Tài khoản sàn OKX là một đăng ký riêng, có xác minh danh tính. Mã giới thiệu được nhập khi tạo tài khoản sàn này.",
        [SRC.okx.walletEn, SRC.okx.refEn, SRC.okx.kycEn]),
      faq("OKX yêu cầu gì khi xác minh danh tính (KYC)?",
        "OKX yêu cầu giấy tờ tùy thân có ảnh do nhà nước cấp và được chấp nhận ở quốc gia của bạn, một ảnh selfie để đối chiếu với giấy tờ, và địa chỉ cư trú; nếu bạn đã chuyển nơi ở, có thể cần một chứng từ gần đây (hóa đơn tiện ích hoặc sao kê ngân hàng trong 3 tháng gần nhất). Bạn phải đủ 18 tuổi. Hoàn tất xác minh giúp nâng hạn mức nạp và rút.",
        [SRC.okx.kycEn]),
    ],
    // l10n: needs native review
    id: [
      faq("Di mana memasukkan kode referral OKX?",
        "Kode referral dimasukkan sebelum akun dibuat: di kolom formulir pendaftaran, atau sudah terisi otomatis saat Anda membuka tautan undangan. Jika tautan tidak terbuka, OKX menyarankan mengunduh aplikasi lalu mengetik kode di halaman pendaftaran. Kode mitra NexuAlpha untuk OKX adalah {code}.",
        [SRC.okx.refEn]),
      faq("Sudah daftar OKX, apakah kode referral bisa ditambahkan atau diganti?",
        "Tidak. Menurut OKX, kode referral hanya dapat ditautkan saat pendaftaran: setelah akun dibuat, kode tidak bisa ditambahkan atau diubah, dan tautan tidak berubah setelah pendaftaran atau verifikasi identitas. Untuk mengecek apakah akun Anda punya pengundang, buka aplikasi Menu > Pengaturan akun > Profil > Hadiah referral; jika menu itu tidak muncul, belum ada tautan.",
        [SRC.okx.refEn]),
      faq("Kenapa kode referral OKX tidak berfungsi?",
        "Penyebab yang disebut OKX: akun sudah dibuat sebelumnya (kode tidak bisa dimasukkan belakangan); kode lain sudah terisi karena Anda membuka tautan undangan atau mengunduh aplikasi lewat tautan berkode dalam 30 hari terakhir (OKX menyarankan mendaftar di jendela penyamaran dan memeriksa kode sebelum selesai); atau fitur referral tidak tersedia untuk semua pengguna. OKX juga menyebut undangan antarwilayah tidak memberi hadiah kepada pengundang.",
        [SRC.okx.refEn]),
      faq("Apakah OKX terdaftar di OJK?",
        "Pengawasan aset kripto di Indonesia sudah dialihkan dari Bappebti ke OJK. Halaman ini tidak memastikan bahwa platform global OKX terdaftar atau berizin di Indonesia: NexuAlpha belum memverifikasi status tersebut. Periksa daftar dan pengumuman resmi OJK sebelum mendaftar.",
        [REG.ojkTransition]),
      faq("Akun bursa OKX dan OKX Wallet, apa bedanya?",
        "OKX Web3 Wallet adalah dompet non-kustodian: Anda menyimpan sendiri frasa pemulihan atau kunci privat, dompet tidak memerlukan verifikasi identitas atau login, dan frasa yang hilang berarti akses aset hilang. Akun bursa OKX adalah pendaftaran terpisah dengan verifikasi identitas. Kode referral dimasukkan saat membuat akun bursa ini.",
        [SRC.okx.walletEn, SRC.okx.refEn, SRC.okx.kycEn]),
      faq("Dokumen apa yang diminta OKX untuk verifikasi identitas (KYC)?",
        "OKX meminta dokumen identitas resmi berfoto yang diterima di negara Anda, swafoto yang dicocokkan dengan dokumen, dan alamat tempat tinggal; jika alamat sudah berubah, bisa diminta bukti terbaru (tagihan utilitas atau rekening koran 3 bulan terakhir). Usia minimal 18 tahun. Verifikasi menaikkan batas deposit dan penarikan.",
        [SRC.okx.kycEn]),
    ],
  },
  binance: {
    // l10n: needs native review
    tr: [
      faq("Binance referans kodu nereye yazılır?",
        "Uygulamada hesabı oluşturduktan hemen sonra referans kodu adımı gelir. Bir referans bağlantısıyla geldiyseniz kod, yeşil onay işareti ve “Bağlandı” etiketiyle önceden dolu olur; kod geçersizse aynı adımda düzenleyebilir veya başka bir kod yazabilirsiniz. NexuAlpha'nın Binance ortaklık kodu {code}.",
        [SRC.binance.register]),
      faq("Binance referans kodu sonradan eklenir mi veya değiştirilir mi?",
        "Hayır. Binance'e göre bağlanan kod sonradan değiştirilemez ve yeni kullanıcı kaydı tamamladıktan sonra düzeltme yapılamaz. Binance'in saydığı bağlanmama nedenleri: başka bir kod kullanılmıştır, kayıt sırasında kod girilmemiştir ya da hesap kuralları ihlal etmiştir.",
        [SRC.binance.register, SRC.binance.referralLite]),
      faq("Binance komisyon iadesi nasıl yapılır, kim öder?",
        "NexuAlpha'nın ortaklık verilerine göre iade, ödediğiniz işlem ücretinden gelir ve Binance tarafından {cadence} olarak ödenir; güncel oran bu sayfadaki kayıt kartında gösterilir. İade, kaydı {code} koduyla ya da referans bağlantısıyla yapılan hesaplar içindir; Binance bağlanan kodun sonradan değiştirilemeyeceğini belirtir.",
        [SRC.binance.register, SRC.binance.referralLite]),
      faq("Binance TR mi, global Binance mi? Kod hangisinde geçerli?",
        "SPK'nın faaliyette bulunanlar listesinde (01 Ekim 2026 tarihli geçici liste) Binance Turkey Kripto Varlık Alım Satım Platformu AŞ yer alır; SPK, listede bulunmanın yetkilendirme anlamına gelmediğini de belirtir. {code}, NexuAlpha'nın Binance referans programındaki ortaklık kodudur ve NexuAlpha bu kodun Binance TR hesaplarında geçerli olduğunu henüz doğrulamamıştır. Kayıt ekranında hangi kuruluşa kaydolduğunuzu kontrol edin.",
        [REG.spkOperating, SRC.binance.register]),
      faq("Binance Wallet, Binance hesabıyla aynı şey mi?",
        "Hayır. Binance Wallet uygulamanın içindeki, anahtarı parçalara bölünüp cihazınızda ve bulutunuzda saklanan bir kendi kendine saklama cüzdanıdır; grubun başka bir şirketinin sunduğu isteğe bağlı bir üründür. Borsa hesabı ise kimlik doğrulamalı kayıttır ve referans kodu bu hesaba bağlanır.",
        [SRC.binance.wallet, SRC.binance.register]),
      faq("Binance kimlik doğrulamasında ne istiyor?",
        "Her yeni kullanıcı para yatırmak ve işlem yapmak için Doğrulanmış seviyeyi tamamlamalıdır. İkamet ülkesini, belgeyi veren ülkeyi ve belge türünü seçer, belgenin ön ve arka yüzünü yükler, kamerayla canlılık kontrolünü yapar ve bilgilerinizi onaylarsınız; bilgiler belgeyle eşleşmeli ve onaylandıktan sonra değiştirilemez.",
        [SRC.binance.kyc]),
    ],
    // l10n: needs native review
    vi: [
      faq("Nhập mã giới thiệu Binance ở đâu?",
        "Trong ứng dụng, ngay sau khi tạo tài khoản sẽ có bước nhập mã giới thiệu. Nếu bạn đến từ một liên kết giới thiệu, mã đã được điền sẵn kèm dấu tích xanh và nhãn “Đã liên kết”; nếu mã không hợp lệ, bạn có thể sửa hoặc nhập mã khác ngay ở bước này. Mã đối tác của NexuAlpha cho Binance là {code}.",
        [SRC.binance.register]),
      faq("Đổi mã giới thiệu Binance sau khi đăng ký được không?",
        "Không. Binance cho biết mã đã liên kết thì không thể sửa, và không thể điều chỉnh sau khi người dùng mới đã hoàn tất đăng ký.",
        [SRC.binance.register, SRC.binance.referralLite]),
      faq("Vì sao mã giới thiệu Binance không được liên kết?",
        "Các lý do Binance nêu: đã dùng một mã khác, không nhập mã trong lúc đăng ký, hoặc tài khoản vi phạm điều khoản. Vì không sửa được sau khi đăng ký, hãy kiểm tra mã ở bước nhập mã trước khi tiếp tục.",
        [SRC.binance.referralLite, SRC.binance.register]),
      faq("Mã giới thiệu Binance Wallet có giống tài khoản Binance không?",
        "Không. Binance Wallet là ví tự lưu ký trong ứng dụng, khóa được chia thành nhiều phần lưu trên thiết bị và đám mây của bạn; đây là sản phẩm tùy chọn do một công ty khác trong tập đoàn cung cấp. Tài khoản sàn là đăng ký có xác minh danh tính, và mã giới thiệu được liên kết với tài khoản này.",
        [SRC.binance.wallet, SRC.binance.register]),
      faq("Binance yêu cầu gì khi xác minh danh tính?",
        "Mọi người dùng mới phải hoàn tất cấp Đã xác minh để nạp tiền và giao dịch. Bạn chọn nơi cư trú, quốc gia cấp và loại giấy tờ, tải lên hai mặt, quét khuôn mặt bằng camera rồi xác nhận thông tin; thông tin phải khớp với giấy tờ và không thể sửa sau khi xác nhận.",
        [SRC.binance.kyc]),
    ],
  },
  bybit: {
    // l10n: needs native review
    tr: [
      faq("Bybit referans kodu nereye yazılır?",
        "Kayıt sırasında ülkenizi seçip e-posta veya telefon numaranızı girdikten sonra, hesap oluşturma (Sign Up Now) düğmesine basmadan önce referans ya da affiliate kodunu yazın. NexuAlpha'nın Bybit ortaklık kodu {code}.",
        [SRC.bybit.register]),
      faq("Bybit referans kodu sonradan eklenir mi?",
        "Genel kural olarak hayır: hesap açıldıktan sonra Bybit referans veya affiliate kodunun eklenmesine izin vermez. İstisna affiliate kodudur: ana hesap, henüz bağlı bir kod yoksa kayıttan sonraki 14 gün içinde Hesap > “Join an Affiliate's Community” yolundan affiliate kodu ekleyebilir. Kullanıcıdan kullanıcıya referans programının kodları bu yolla eklenemez.",
        [SRC.bybit.register, SRC.bybit.affiliateCode, SRC.bybit.referralFaq]),
      faq("Bybit referans kodu değiştirilebilir mi?",
        "Hayır. Bybit, hesap oluşturulduktan sonra referans veya affiliate kodunun değiştirilmesine ya da silinmesine izin vermez; 14 günlük affiliate istisnasıyla eklenen kod da sonradan değiştirilemez.",
        [SRC.bybit.register, SRC.bybit.affiliateCode]),
      faq("Bybit TR mi, global Bybit mi? Kod hangisinde geçerli?",
        "SPK'nın faaliyette bulunanlar listesinde (01 Ekim 2026 tarihli geçici liste) Bybit Kripto Varlık Alım Satım Platformu AŞ yer alır; SPK, listede bulunmanın yetkilendirme anlamına gelmediğini de belirtir. {code}, NexuAlpha'nın Bybit ortaklık kodudur ve NexuAlpha bu kodun Bybit'in Türkiye hesaplarında geçerli olduğunu henüz doğrulamamıştır. Kayıt ekranında hangi kuruluşa kaydolduğunuzu kontrol edin.",
        [REG.spkOperating, SRC.bybit.register]),
      faq("Bybit Wallet, Bybit hesabıyla aynı şey mi?",
        "Hayır. Bybit Wallet üç cüzdan türü sunar ve hiçbiri kimlik doğrulama istemez: kurtarma ifadeli cüzdanda anahtarları siz kontrol edersiniz; keyless cüzdanda anahtar Bybit ile bulutunuz arasında bölünür; bulut cüzdanda anahtarları Bybit yönetir. Borsa hesabı ise KYC'li kayıttır ve referans kodu bu hesaba girilir.",
        [SRC.bybit.wallet, SRC.bybit.register]),
      faq("Bybit'te kimlik doğrulaması (KYC) zorunlu mu?",
        "Evet. Tüm ürün ve hizmetler için en az Standard seviye zorunludur; bazı bölgeler veya ürünler daha yüksek seviye ister. Pasaport, kimlik kartı ve oturma izni kabul edilen belgeler arasındadır. Sonuç e-postayla gelir; en sık ret nedenleri okunamayan ad veya doğum tarihi, net olmayan yüz fotoğrafı ya da imzasız pasaporttur.",
        [SRC.bybit.kycFaq, SRC.bybit.kycFail]),
    ],
    // l10n: needs native review
    vi: [
      faq("Mã giới thiệu Bybit nhập ở đâu (trên máy tính hay điện thoại)?",
        "Khi đăng ký, sau khi chọn quốc gia và nhập email hoặc số điện thoại, hãy nhập mã giới thiệu hoặc mã affiliate trước khi bấm tạo tài khoản (Sign Up Now). Mã đối tác của NexuAlpha cho Bybit là {code}.",
        [SRC.bybit.register]),
      faq("Quên nhập mã giới thiệu Bybit, có thêm sau được không?",
        "Về nguyên tắc là không: sau khi tạo tài khoản, Bybit không cho thêm mã giới thiệu hay mã affiliate. Ngoại lệ là mã affiliate: tài khoản chính có thể thêm trong 14 ngày sau khi đăng ký, tại Tài khoản > “Join an Affiliate's Community”, nếu chưa liên kết mã nào. Mã của chương trình giới thiệu giữa người dùng không thêm được theo cách này.",
        [SRC.bybit.register, SRC.bybit.affiliateCode, SRC.bybit.referralFaq]),
      faq("Đổi mã giới thiệu Bybit được không?",
        "Không. Bybit không cho đổi hay xóa mã giới thiệu hoặc mã affiliate sau khi tài khoản đã tạo; mã đã thêm theo ngoại lệ affiliate 14 ngày cũng không đổi được.",
        [SRC.bybit.register, SRC.bybit.affiliateCode]),
      faq("Bybit Wallet và tài khoản sàn Bybit khác nhau thế nào?",
        "Bybit Wallet có ba loại ví và không loại nào cần xác minh danh tính: ví có cụm từ khôi phục do bạn giữ khóa; ví keyless chia khóa giữa Bybit và đám mây của bạn; ví đám mây do Bybit quản lý khóa. Tài khoản sàn là đăng ký có KYC, và mã giới thiệu được nhập cho tài khoản này.",
        [SRC.bybit.wallet, SRC.bybit.register]),
      faq("Xác minh danh tính (KYC) trên Bybit có bắt buộc không?",
        "Có. Tối thiểu cấp Standard là bắt buộc cho mọi sản phẩm và dịch vụ; một số khu vực hoặc sản phẩm yêu cầu cấp cao hơn. Giấy tờ được chấp nhận gồm hộ chiếu, căn cước và giấy phép cư trú. Kết quả gửi qua email; lý do bị từ chối thường gặp là tên hoặc ngày sinh không đọc được, ảnh khuôn mặt không rõ hoặc hộ chiếu chưa ký.",
        [SRC.bybit.kycFaq, SRC.bybit.kycFail]),
    ],
    // l10n: needs native review
    id: [
      faq("Di mana memasukkan kode referral Bybit?",
        "Saat mendaftar, setelah memilih negara dan mengisi email atau nomor ponsel, ketik kode referral atau kode afiliasi sebelum menekan tombol buat akun (Sign Up Now). Kode mitra NexuAlpha untuk Bybit adalah {code}.",
        [SRC.bybit.register]),
      faq("Lupa memasukkan kode referral Bybit, bisa ditambahkan nanti?",
        "Pada umumnya tidak: setelah akun dibuat, Bybit tidak mengizinkan penambahan kode referral atau kode afiliasi. Pengecualiannya kode afiliasi: akun utama dapat menambahkannya dalam 14 hari setelah pendaftaran lewat Akun > “Join an Affiliate's Community”, bila belum ada kode yang tertaut. Kode dari program referral antarpengguna tidak bisa ditambahkan dengan cara ini.",
        [SRC.bybit.register, SRC.bybit.affiliateCode, SRC.bybit.referralFaq]),
      faq("Apakah kode referral Bybit bisa diganti?",
        "Tidak. Bybit tidak mengizinkan kode referral atau afiliasi diubah atau dihapus setelah akun dibuat; kode yang ditambahkan lewat pengecualian afiliasi 14 hari juga tidak bisa diganti.",
        [SRC.bybit.register, SRC.bybit.affiliateCode]),
      faq("Apakah Bybit terdaftar di OJK?",
        "Pengawasan aset kripto di Indonesia sudah dialihkan dari Bappebti ke OJK. Halaman ini tidak memastikan bahwa platform global Bybit terdaftar atau berizin di Indonesia: NexuAlpha belum memverifikasi status tersebut. Periksa daftar dan pengumuman resmi OJK sebelum mendaftar.",
        [REG.ojkTransition]),
      faq("Bybit Wallet dan akun bursa Bybit, apa bedanya?",
        "Bybit Wallet punya tiga jenis dompet dan tidak ada yang memerlukan verifikasi identitas: dompet frasa pemulihan (Anda memegang kunci), dompet keyless (kunci dibagi antara Bybit dan cloud Anda), dan dompet cloud (kunci dikelola Bybit). Akun bursa adalah pendaftaran dengan KYC, dan kode referral dimasukkan untuk akun ini.",
        [SRC.bybit.wallet, SRC.bybit.register]),
      faq("Apakah verifikasi identitas (KYC) wajib di Bybit?",
        "Ya. Minimal level Standard wajib untuk semua produk dan layanan; beberapa wilayah atau produk meminta level lebih tinggi. Dokumen yang diterima antara lain paspor, kartu identitas, dan izin tinggal. Hasil dikirim lewat email; penolakan paling sering terjadi karena nama atau tanggal lahir tidak terbaca, foto wajah kurang jelas, atau paspor tidak ditandatangani.",
        [SRC.bybit.kycFaq, SRC.bybit.kycFail]),
    ],
  },
  bitget: {
    // l10n: needs native review
    vi: [
      faq("Cách nhập mã giới thiệu Bitget khi đăng ký?",
        "Theo hướng dẫn đăng ký chính thức, sau khi nhập email hoặc số điện thoại, bước 2 là nhập mã mời (không bắt buộc), trước khi đồng ý điều khoản và tạo tài khoản. Vì ô này ghi “không bắt buộc” nên nhiều người bỏ qua. Mã đối tác của NexuAlpha cho Bitget là {code}.",
        [SRC.bitget.regEn]),
      faq("Đã đăng ký Bitget rồi có thêm hoặc đổi mã giới thiệu được không?",
        "Hướng dẫn đăng ký của Bitget chỉ có ô nhập mã trong biểu mẫu tạo tài khoản và không mô tả cách thêm hay đổi mã sau đó. Chương trình giới thiệu của Bitget tính người được mời là người đăng ký bằng liên kết hoặc mã. Vì vậy hãy kiểm tra mã trước khi hoàn tất đăng ký.",
        [SRC.bitget.regEn, SRC.bitget.referral]),
      faq("Hoàn phí Bitget do ai trả và nhận khi nào?",
        "Theo dữ liệu đối tác của NexuAlpha, phần hoàn phí đến từ phí giao dịch bạn trả và do Bitget chi trả, thanh toán {cadence}; tỷ lệ hiện tại hiển thị trên thẻ đăng ký của trang này. Người được mời là người đăng ký bằng liên kết hoặc mã giới thiệu, theo chương trình giới thiệu của Bitget.",
        [SRC.bitget.referral]),
      faq("Bitget và Bitget Wallet có phải là một?",
        "Không. Theo tài liệu chính thức, Bitget Wallet là ví tiền mã hóa không lưu ký. Tài khoản sàn Bitget là một đăng ký khác, bằng email hoặc số điện thoại, có xác minh danh tính để nạp, rút và giao dịch. Mã giới thiệu trên trang này dùng cho việc đăng ký tài khoản sàn.",
        [SRC.bitget.wallet, SRC.bitget.regEn, SRC.bitget.kycEn]),
      faq("KYC của Bitget gồm những bước nào và vì sao bị từ chối?",
        "Bạn chọn quốc gia và loại giấy tờ, nhập họ tên đúng như trên giấy tờ, tải ảnh giấy tờ lên rồi quét khuôn mặt. Việc duyệt thường mất 1 ngày làm việc. Lý do bị từ chối thường gặp: thông tin không khớp giấy tờ, ảnh mờ, bị cắt hoặc đen trắng, giấy tờ hết hạn hoặc chỉ gửi một mặt, và ảnh selfie không đạt.",
        [SRC.bitget.kycEn, SRC.bitget.kycRejectEn]),
    ],
    // l10n: needs native review
    id: [
      faq("Di mana kolom kode referral Bitget saat daftar?",
        "Menurut panduan pendaftaran resmi, setelah mengisi email atau nomor ponsel, langkah 2 adalah memasukkan kode undangan (opsional), sebelum menyetujui ketentuan dan membuat akun. Karena kolomnya bertanda “opsional”, banyak orang melewatkannya. Kode mitra NexuAlpha untuk Bitget adalah {code}.",
        [SRC.bitget.regEn]),
      faq("Sudah daftar Bitget, apakah kode referral bisa ditambahkan nanti?",
        "Panduan pendaftaran Bitget hanya menampilkan kolom kode di formulir pembuatan akun dan tidak menjelaskan cara menambahkannya setelah itu. Program referral Bitget menghitung pengguna yang diundang sebagai orang yang mendaftar memakai tautan atau kode. Jadi periksa kode sebelum menyelesaikan pendaftaran.",
        [SRC.bitget.regEn, SRC.bitget.referral]),
      faq("Rabat biaya Bitget dibayar siapa dan kapan?",
        "Menurut data mitra NexuAlpha, rabat berasal dari biaya trading yang Anda bayar dan dibayarkan oleh Bitget {cadence}; persentase saat ini tampil di kartu pendaftaran halaman ini. Pengguna yang diundang adalah orang yang mendaftar memakai tautan atau kode referral, sesuai program referral Bitget.",
        [SRC.bitget.referral]),
      faq("Kode referral Bitget Wallet sama dengan akun Bitget?",
        "Tidak. Menurut dokumentasi resminya, Bitget Wallet adalah dompet kripto non-kustodian. Akun bursa Bitget adalah pendaftaran lain, memakai email atau nomor ponsel dan verifikasi identitas untuk deposit, penarikan, dan trading. Kode referral di halaman ini berlaku untuk pendaftaran akun bursa.",
        [SRC.bitget.wallet, SRC.bitget.regEn, SRC.bitget.kycEn]),
      faq("Apakah Bitget terdaftar di OJK?",
        "Pengawasan aset kripto di Indonesia sudah dialihkan dari Bappebti ke OJK. Halaman ini tidak memastikan bahwa platform global Bitget terdaftar atau berizin di Indonesia: NexuAlpha belum memverifikasi status tersebut. Periksa daftar dan pengumuman resmi OJK sebelum mendaftar.",
        [REG.ojkTransition]),
      faq("Bagaimana KYC Bitget dan kenapa bisa ditolak?",
        "Anda memilih negara dan jenis dokumen, mengisi nama persis seperti di dokumen, mengunggah foto dokumen, lalu melakukan pengenalan wajah. Peninjauan biasanya 1 hari kerja. Penolakan yang sering terjadi: data tidak sesuai dokumen, foto buram, terpotong, atau hitam-putih, dokumen kedaluwarsa atau hanya satu sisi, dan swafoto tidak sesuai.",
        [SRC.bitget.kycEn, SRC.bitget.kycRejectEn]),
    ],
  },
  hyperliquid: {
    en: [
      faq("What does a Hyperliquid referral code give you?",
        "Hyperliquid's docs say that using a referral code gives a 4% discount on your fees for your first $25M in volume, and that referral discounts do not apply to vaults or sub-accounts. You enter the code on the app's referrals page (app.hyperliquid.xyz/referrals) or by opening a shared join link (app.hyperliquid.xyz/join/…). NexuAlpha's partner code for Hyperliquid is {code}; NexuAlpha publishes no rebate share for Hyperliquid.",
        [SRC_EXTRA.hyperliquid.referrals, SRC_EXTRA.hyperliquid.fees]),
      faq("Can I change my Hyperliquid referral code later?",
        "Hyperliquid's referral docs explain how to enter a code but do not describe changing or removing one afterwards, so NexuAlpha cannot confirm that a code can be changed. Check the referrals page in the app before you enter a code.",
        [SRC_EXTRA.hyperliquid.referrals]),
    ],
  },
  backpack: {
    en: [
      faq("Does Backpack Exchange offer tokenized US stocks?",
        "Yes, through Backpack Securities. Backpack says eligible users with a verified Backpack account can buy US-listed stocks and ETFs, held as security entitlements under New York UCC Article 8, and that selected stocks can be tokenized 1:1 on Solana and redeemed 1:1 back into the underlying share. The tokenized form is a separate instrument (a claim on an SPV holding the underlying assets) and trades 24/7 on Solana. Backpack Securities is not available in the United States, the United Kingdom, the UAE, Japan or through Backpack EU.",
        [SRC_EXTRA.backpack.securities, SRC_EXTRA.backpack.tokenized]),
      faq("Does Backpack Exchange require KYC?",
        "Yes. Backpack's help center lists standard KYC as full name, date of birth and address, source of income and occupation, a valid ID document and a liveness check; some countries can verify through local government digital ID, and some (for example Australia and the UAE) may need proof of address. Backpack says it does not serve residents of North Korea, Iran, Cuba, Syria and the Crimea, Sevastopol, Luhansk and Donetsk regions, and asks residents of Canada, Japan and New Zealand to “stay tuned”.",
        [SRC_EXTRA.backpack.kyc]),
    ],
    fr: [
      faq("Backpack Exchange : avis — de quoi s’agit-il ?",
        "Backpack sépare deux produits : Backpack Exchange, une plateforme d’échange avec compte, et Backpack Wallet, une application Web3 en auto-garde. Selon sa documentation technique, chaque sous-compte de l’exchange est en marge croisée, multi-devises, et donne accès au spot, aux contrats perpétuels, à la marge, à l’emprunt et au prêt. Backpack propose aussi des actions américaines via Backpack Securities.",
        [SRC_EXTRA.backpack.about, SRC_EXTRA.backpack.margin, SRC_EXTRA.backpack.securities]),
      faq("Backpack Exchange est-il disponible en France ?",
        "NexuAlpha n’a pas confirmé l’accès depuis la France. La page KYC de Backpack cite les régions non servies (Corée du Nord, Iran, Cuba, Syrie, Crimée, Sébastopol, Louhansk, Donetsk) et demande aux résidents du Canada, du Japon et de la Nouvelle-Zélande de « patienter » ; la France n’y figure pas. Backpack mentionne aussi Backpack EU à part et précise que Backpack Securities (les actions) n’y est pas proposé. Vérifiez l’entité et les produits proposés pour votre pays au moment de l’inscription.",
        [SRC_EXTRA.backpack.kyc, SRC_EXTRA.backpack.securities]),
      faq("Quels sont les frais de Backpack Exchange ?",
        "Le site de Backpack annonce 0 % de frais sur les transactions d’actions. NexuAlpha n’a pas encore vérifié la grille de frais spot et perpétuels de Backpack ; aucun taux n’est donc affiché ici. Consultez la grille publiée dans le centre d’aide de Backpack avant de trader.",
        [SRC_EXTRA.backpack.home]),
      faq("Faut-il un KYC sur Backpack Exchange ?",
        "Oui. Le KYC standard demande le nom complet, la date de naissance et l’adresse, la source de revenus et la profession, une pièce d’identité valide et une vérification du vivant (liveness). Certains pays passent par une identité numérique publique locale, d’autres (Australie, Émirats arabes unis) peuvent demander un justificatif de domicile de moins de 3 mois.",
        [SRC_EXTRA.backpack.kyc]),
      faq("Backpack propose-t-il des actions américaines tokenisées ?",
        "Oui, via Backpack Securities : les détentions sont des droits sur titres (security entitlements) régis par le droit de New York (UCC Article 8), et certaines actions peuvent être tokenisées 1:1 sur Solana puis rachetées 1:1 contre l’action sous-jacente. La version tokenisée est un instrument distinct (une créance sur une SPV qui détient les actifs) et s’échange 24 h/24, 7 j/7 sur Solana. Backpack Securities n’est pas disponible aux États-Unis, au Royaume-Uni, aux Émirats arabes unis, au Japon ni via Backpack EU.",
        [SRC_EXTRA.backpack.securities, SRC_EXTRA.backpack.tokenized]),
      faq("Backpack Wallet ou compte Backpack Exchange : quelle différence ?",
        "Backpack Wallet est une application Web3 en auto-garde : vous gardez vos clés. Le compte Backpack Exchange est une inscription distincte, soumise au KYC, qui donne accès au spot, aux perpétuels et à la marge.",
        [SRC_EXTRA.backpack.about, SRC_EXTRA.backpack.kyc, SRC_EXTRA.backpack.margin]),
    ],
  },
};

function partnerFor(slug) {
  return REFERRAL_PARTNERS.find((partner) => partner.slug === slug) || null;
}

function cadenceFor(partner, locale) {
  return CADENCE[locale]?.[partner?.settle] || "";
}

function fill(text, partner, locale) {
  const name = partner?.name || "";
  const code = partner?.inviteCode || "";
  return String(text).replaceAll("{code}", code).replaceAll("{name}", name).replaceAll("{cadence}", cadenceFor(partner, locale));
}

function rawEntriesFor(slug, locale) {
  const local = PARTNER_VENUE_FAQ_LOCAL_TARGETS[locale];
  if (local) return local.includes(slug) ? LOCAL_ENTRIES[slug]?.[locale] || null : null;
  return ENTRIES[slug]?.[locale] || LOCAL_ENTRIES[slug]?.[locale] || null;
}

/**
 * Localized partner FAQ for an exchange profile, or null.
 * mode "replace": these entries ARE the page FAQ (visible + FAQPage). For es/binance the reviewed priority answers are
 *   kept after the partner entries so nothing reviewed disappears.
 * mode "append": entries are added after the page's existing FAQ (en / zh-Hans wallet answer).
 */
export function partnerVenueFaqFor(slug, locale = "en") {
  const normalized = normalizePartnerFaqLocale(locale);
  if (!normalized || !(PARTNER_VENUE_FAQ_SLUGS.includes(slug) || PARTNER_VENUE_FAQ_EXTRA_SLUGS.includes(slug))) return null;
  const raw = rawEntriesFor(slug, normalized);
  if (!raw?.length) return null;
  const partner = partnerFor(slug);
  // A code placeholder without a real partner code must never render as an empty code, and a payout-cadence answer
  // needs a cadence in the partner feed.
  const usable = raw.filter((entry) => (partner?.inviteCode || !/\{code\}/.test(entry.answer)) && (cadenceFor(partner, normalized) || !/\{cadence\}/.test(entry.answer)));
  const entries = usable.map((entry) => ({
    question: fill(entry.question, partner, normalized),
    answer: fill(entry.answer, partner, normalized),
    sources: entry.sources.map(([label, href]) => [label, href]),
    citations: entry.sources.map(([, href]) => href),
    showsInviteCode: /\{code\}/.test(entry.answer),
    origin: "partner",
  }));
  const mode = PARTNER_VENUE_FAQ_REPLACE_LOCALES.includes(normalized) || PARTNER_VENUE_FAQ_LOCAL_TARGETS[normalized] ? "replace" : "append";
  if (mode === "replace") {
    const priority = priorityVenueAnswerFor(slug, normalized);
    for (const [question, answer, citations = []] of priority?.faq || []) {
      if (entries.some((entry) => entry.question === question)) continue;
      entries.push({
        question,
        answer,
        sources: citations.map((href) => [priority.sources?.find(([, url]) => url === href)?.[0] || href, href]),
        citations: [...citations],
        showsInviteCode: false,
        origin: "priority",
      });
    }
  }
  return {
    slug,
    locale: normalized,
    mode,
    reviewedAt: PARTNER_VENUE_FAQ_REVIEWED_AT,
    entries,
    showsInviteCode: entries.some((entry) => entry.showsInviteCode),
  };
}

export function partnerFaqQuestion(entry) {
  return {
    "@type": "Question",
    name: entry.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: entry.answer,
      ...(entry.citations?.length ? { citation: [...entry.citations] } : {}),
    },
  };
}

/**
 * Apply the partner FAQ to an exchange-profile FAQPage schema (client and Worker call this with the same inputs).
 * Returns the schema unchanged when no partner FAQ applies.
 */
export function applyPartnerVenueFaqSchema(faqSchema, slug, locale, market) {
  if (!faqSchema || faqSchema["@type"] !== "FAQPage") return faqSchema;
  const partnerFaq = partnerVenueFaqFor(slug, locale);
  if (!partnerFaq) return faqSchema;
  const added = partnerFaq.entries.filter(entry => isPartnerPromotableIn(slug, { locale, market }) || !entry.showsInviteCode).map(partnerFaqQuestion);
  if (!added.length) return faqSchema;
  if (partnerFaq.mode === "replace") return { ...faqSchema, mainEntity: added };
  const existingNames = new Set((faqSchema.mainEntity || []).map((question) => question.name));
  return { ...faqSchema, mainEntity: [...(faqSchema.mainEntity || []), ...added.filter((question) => !existingNames.has(question.name))] };
}
