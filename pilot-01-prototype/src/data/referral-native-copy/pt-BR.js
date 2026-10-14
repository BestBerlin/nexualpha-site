const referralNativeCopyPtBr = {
  query: (name) => `código de convite ${name}`,
  labels: {
    code: "Código",
    benefit: "Benefício",
    entry: "Onde inserir",
    later: "Pode adicionar depois?",
    payout: "Pagamento",
    verified: "Verificado",
    check: "Verificação",
    source: "Fonte",
    log: "Registro de verificação",
    calculator: "Calculadora",
  },
  verifiedTitle: (name, code, benefit, date) =>
    `código de convite ${name}: ${code} — ${benefit} (verificado em ${date})`,
  share: (percent) => `Até ${percent}% das taxas de volta`,
  noBenefit: "Sem benefício verificado para o usuário",
  pending: "Não verificado",
  cadence: {
    hourly: "por hora",
    daily: "diariamente",
  },
  entryText: "Insira o código no campo de indicação antes de concluir o cadastro.",
  laterUnknown:
    "A ajuda oficial não confirma que seja possível adicionar o código depois do cadastro; não assuma que ele possa ser incluído.",
  laterBybit:
    "Na Bybit, apenas um código de afiliado pode ser adicionado a contas principais dentro de 14 dias, desde que não haja associação atual de afiliado ou indicador. Códigos comuns de indicação não são aceitos nessa etapa; a elegibilidade regulatória se aplica, contas market maker e institucionais ficam excluídas, e o código não pode ser alterado nem cancelado depois de adicionado.",
  laterBinance:
    "A Binance permite uma revinculação condicional de afiliado, não uma troca livre de código. A conta principal precisa ter KYC concluído, não ter indicador, volume dos últimos 90 dias abaixo de US$ 5.000 e passar por verificações de região e risco. A solicitação de afiliado exige US$ 150.000 em volume elegível em 30 dias; pares com taxa zero e subcontas são excluídos. A revinculação própria sem histórico de trading é separada. Esta página não confirma que este código seja elegível; não negocie apenas para revincular.",
  faqEntry: (name) => `Onde inserir o código de convite ${name}?`,
  faqLater: (name) => `Posso adicionar o código de convite ${name} depois do cadastro?`,
  faqPayout: (name) => `Quando o cashback ou a comissão de ${name} é pago?`,
  payoutText: (name, cadence) =>
    `Os dados de parceiro indicam que a ${name} paga ${cadence}; a elegibilidade se aplica.`,
  noPayout: "Sem cronograma de pagamento verificado",
};

export default referralNativeCopyPtBr;

// Venue-specific entry steps from the reviewed official help records.
// These supplement the shared interface copy without changing locale policy.
export const entryByVenue = {
  "bitget": "No formulário do site, insira o código opcional após o e-mail ou telefone, antes de clicar em Next.",
  "okx": "Confira o código preenchido antes de concluir o cadastro. Segundo a OKX, um link anterior pode ficar associado ao dispositivo por 30 dias.",
  "binance": "No app Binance, confira o código na etapa após a criação da conta, antes do KYC. Um código vinculado não pode ser alterado.",
  "bybit": "Insira o código de convite ou de afiliado antes de clicar em Sign Up Now.",
  "coinw": "Insira o código durante o cadastro para estabelecer o vínculo de indicação.",
  "kraken": "Insira o código ao criar uma conta no app Kraken. As condições do app não confirmam o benefício deste código de parceiro."
};
