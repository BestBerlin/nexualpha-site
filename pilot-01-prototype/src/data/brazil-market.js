export const BRAZIL_SOURCES = [
  {
    id: "binance-brl-pix-deposit",
    title: "Binance Brasil — Como Depositar BRL na Binance",
    url: "https://www.binance.com/pt-BR/support/faq/detail/53636607eebc42dbb513863b49bba98f",
    checkedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "binance-brl-transfer-faq",
    title: "Binance Brasil — Perguntas Frequentes sobre Transferência Bancária BRL",
    url: "https://www.binance.com/pt-BR/support/faq/detail/2604a5d35bd947d485dc30d865539e3e",
    checkedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "binance-brl-pix-buy",
    title: "Binance Brasil — Como Comprar Criptomoedas via Pix (BRL)",
    url: "https://www.binance.com/pt-BR/support/faq/detail/b90065c7a7d44d0bb8b2ac7dc2cb0391",
    checkedAt: "2026-09-08T00:00:00.000Z",
  },
  {
    id: "binance-brl-pix-withdraw",
    title: "Binance Brasil — Como sacar BRL da Binance",
    url: "https://www.binance.com/pt-BR/support/faq/detail/08722a3b5ad7465e8c74ddc0240cec4c",
    checkedAt: "2026-09-08T00:00:00.000Z",
  },
  {
    id: "binance-terms-br",
    title: "Binance — Termos de Uso da Binance",
    url: "https://www.binance.com/pt-BR/terms",
    checkedAt: "2026-09-08T00:00:00.000Z",
  },
  {
    id: "okx-brl-pix-deposit",
    title: "OKX — How do I deposit BRL with Pix transfer?",
    url: "https://www.okx.com/help/how-do-i-deposit-brl",
    checkedAt: "2026-10-02T00:00:00.000Z",
  },
  {
    id: "okx-brl-pix-withdraw",
    title: "OKX — How do I withdraw BRL with Pix transfer?",
    url: "https://www.okx.com/help/how-do-i-withdraw-brl",
    checkedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "okx-brl-limits-fees",
    title: "OKX — Where do I find limits, fees and processing time details for cash deposit?",
    url: "https://www.okx.com/help/where-do-i-find-limits-fees-and-processing-time-details-for-cash-deposit",
    checkedAt: "2026-09-08T00:00:00.000Z",
  },
  {
    id: "okx-brazil-referral-terms",
    title: "OKX — Brazil Referral Program Terms and Conditions",
    url: "https://www.okx.com/help/brazil-referral-program-terms-and-conditions",
    checkedAt: "2026-09-08T00:00:00.000Z",
  },
  {
    id: "bcb-pix-faq",
    title: "Banco Central do Brasil — Perguntas e Respostas Pix",
    url: "https://www.bcb.gov.br/estabilidadefinanceira/perguntaserespostaspix",
    checkedAt: "2026-09-14T00:00:00.000Z",
  },
  {
    id: "receita-federal-cpf",
    title: "Receita Federal — Meu CPF",
    url: "https://www.gov.br/receitafederal/pt-br/assuntos/meu-cpf",
    checkedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "bcb-pix-speed-availability",
    title: "Banco Central do Brasil — Porque o Pix é um sucesso",
    url: "https://www.bcb.gov.br/meubc/faqs/p/porque-o-pix-e-um-sucesso",
    checkedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "bcb-pix-med",
    title: "Banco Central do Brasil — Mecanismo Especial de Devolução Pix",
    url: "https://bcb.gov.br/meubc/faqs/p/o-que-e-e-como-funciona-o-mecanismo-especial-de-devolucao-med",
    checkedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "okx-pix-deposit-learn",
    title: "OKX Brasil — Depósito Pix na OKX: como funciona",
    url: "https://www.okx.com/en-br/learn/deposito-pix-okx",
    checkedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "receita-cripto-servico",
    title: "Gov.br — Declarar operações com criptoativos",
    url: "https://www.gov.br/pt-br/servicos/declarar-operacoes-com-criptoativos",
    checkedAt: "2026-09-22T00:00:00.000Z",
  },
  {
    id: "receita-irpf-2026-cripto",
    title: "Receita Federal — Perguntas e Respostas IRPF 2026, criptoativos",
    url: "https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/perguntas-e-respostas/dirpf/p-r-irpf-2026-v1-00-2026-04-23.pdf",
    checkedAt: "2026-09-22T00:00:00.000Z",
  },
];

export const BRAZIL_VENUES = [
  {
    slug: "binance",
    name: "Binance",
    product: "spot",
    paymentSummary: "BRL via Pix/TED aparece no material oficial; confira a disponibilidade do método na sua conta.",
    requirements: [
      "Concluir verificação de identidade antes de usar o fluxo BRL.",
      "Usar conta bancária vinculada ao próprio CPF/CNPJ e com nome compatível com a conta Binance.",
      "Conferir domínio, valor da ordem, método Pix/TED e histórico de depósito antes de considerar a entrada concluída.",
    ],
    feeNote: "A página oficial de depósito não substitui a tabela de taxas. A estimativa da NexuAlpha usa taxa spot e custo de entrada informados pelo usuário.",
    eligibilityNote: "Benefícios de usuário, código de indicação e disponibilidade de campanha devem ser confirmados dentro da conta Binance antes de concluir o cadastro.",
    sourceIds: ["binance-brl-pix-deposit", "binance-brl-transfer-faq", "binance-brl-pix-buy", "binance-brl-pix-withdraw", "binance-terms-br"],
    access: "source-backed",
  },
  {
    slug: "okx",
    name: "OKX",
    product: "spot",
    paymentSummary: "BRL via Pix está documentado para clientes brasileiros elegíveis; limites, taxas e métodos aparecem dentro da conta.",
    requirements: [
      "Entrar na conta OKX e selecionar Brazilian Real no fluxo de depósito ou saque.",
      "Fazer Pix a partir de conta com nome e CPF compatíveis com a conta OKX; divergências podem gerar rejeição e devolução.",
      "Verificar limites, taxa, prazo e disponibilidade regional dentro do método exibido antes de transferir fundos.",
    ],
    feeNote: "O custo real depende do método mostrado na conta, limite, tamanho da ordem e taxa de trading; a calculadora mantém essas hipóteses editáveis.",
    eligibilityNote: "Termos de indicação e recompensas podem variar por campanha, ciclo e elegibilidade da conta; não trate bônus como garantido sem confirmar na OKX.",
    sourceIds: ["okx-brl-pix-deposit", "okx-brl-pix-withdraw", "okx-brl-limits-fees", "okx-brazil-referral-terms"],
    access: "source-backed",
  },
];

export const BRAZIL_DECISION_CHAIN = [
  { path: "/br", label: "Entrada", shortLabel: "Início" },
  { path: "/br/pix", label: "Pix e BRL", shortLabel: "Pix" },
  { path: "/br/custos", label: "Custos", shortLabel: "Custos" },
  { path: "/br/comparar", label: "Comparar", shortLabel: "Comparar" },
];

export const BRAZIL_EVIDENCE_CHAIN = [
  { path: "/br/kyc-cpf", label: "KYC e CPF", shortLabel: "CPF" },
  { path: "/br/conta", label: "Conta e benefício", shortLabel: "Conta" },
  { path: "/br/saque-pix", label: "Saque Pix", shortLabel: "Saque" },
];

export const BRAZIL_PAGES = [
  {
    slug: "br-home",
    path: "/br",
    title: "Compare custos e condições antes de abrir sua conta cripto no Brasil",
    description: "Um guia local em português para comparar Pix, BRL, KYC, CPF, taxa spot e link oficial antes de sair da NexuAlpha.",
    answer: "Para abrir uma conta cripto no Brasil, a primeira decisão não é a marca: é o caminho de entrada. Se você pretende comprar spot com BRL, confirme Pix, CPF, titularidade bancária, taxa de trading e condições da conta antes de clicar em registrar.",
    nextSteps: [
      { label: "Comparar Binance e OKX para BRL/Pix", href: "/br/comparar?locale=pt-BR&market=BR&product=spot", kind: "compare" },
      { label: "Revisar conta, código parceiro e benefício", href: "/br/conta?locale=pt-BR&market=BR&product=spot", kind: "cta-check" },
      { label: "Continuar a pesquisa no Telegram", href: "telegram:compare", kind: "telegram" },
    ],
    sourceIds: ["binance-brl-pix-deposit", "binance-brl-transfer-faq", "binance-brl-pix-buy", "okx-brl-pix-deposit", "okx-brl-limits-fees"],
    sections: [
      {
        title: "O que decidir antes do clique",
        paragraphs: [
          "Use a página como uma lista curta antes do cadastro. Escolha o produto, veja se a entrada em BRL/Pix faz sentido e confira quais pontos precisam aparecer no domínio oficial.",
          "Quando você abre a plataforma com essa lista em mãos, fica mais fácil perceber se o método de depósito, a taxa exibida e a regra da conta combinam com o seu caso.",
        ],
        bullets: [
          "Produto pretendido: spot, perpetuals ou ainda desconhecido.",
          "Entrada em moeda local: BRL, Pix, TED ou outro caminho mostrado pela plataforma.",
          "Conta: KYC, CPF/CNPJ, titularidade bancária e elegibilidade da campanha.",
          "Custo: taxa spot, custo de depósito, spread, slippage e possíveis impostos revisados separadamente.",
        ],
      },
      {
        title: "Como escolher entre as opções",
        paragraphs: [
          "Compare o método de depósito que você pretende usar, os documentos exigidos e o custo da operação. A escolha pode mudar conforme o valor e os recursos de que você precisa.",
          "Confira os limites e as condições dentro da sua conta na plataforma escolhida. Uma condição exibida a outra pessoa pode não estar disponível para você.",
        ],
      },
    ],
    faq: [
      { question: "Quais documentos devo conferir antes do cadastro?", answer: "Consulte os documentos aceitos na verificação de identidade da plataforma. Para o fluxo BRL, confira o CPF e a correspondência de nome e titularidade bancária exigida pelo método de depósito." },
      { question: "O link de parceiro garante bônus ou desconto?", answer: "Não. Benefícios, campanhas e descontos dependem das regras exibidas pela plataforma e da elegibilidade da sua conta." },
      { question: "Por que só algumas plataformas aparecem no shortlist brasileiro?", answer: "Estas opções têm instruções oficiais sobre entrada em BRL/Pix que podem ser comparadas aqui. O diretório global reúne outras plataformas e produtos." },
    ],
  },
  {
    slug: "br-comparar",
    path: "/br/comparar",
    title: "Comparar Binance e OKX antes do cadastro no Brasil",
    description: "Compare plataformas parceiras por Pix, BRL, KYC, custo estimado, uso pretendido e confirmação no domínio oficial.",
    answer: "Binance e OKX podem servir a usuários brasileiros de spot, mas a escolha prática depende de três coisas: como o dinheiro entra, qual custo aparece na sua conta e se a titularidade/CPF passam sem atrito.",
    nextSteps: [
      { label: "Simular custo em BRL antes do clique", href: "/br/custos?locale=pt-BR&market=BR&product=spot", kind: "cost" },
      { label: "Revisar elegibilidade de conta e campanha", href: "/br/conta?locale=pt-BR&market=BR&product=spot", kind: "cta-check" },
      { label: "Continuar comparação no Telegram", href: "telegram:compare", kind: "telegram" },
    ],
    sourceIds: ["binance-brl-pix-deposit", "binance-brl-transfer-faq", "okx-brl-pix-deposit", "okx-brl-pix-withdraw", "okx-brl-limits-fees"],
    sections: [
      {
        title: "Critério 1: entrada em BRL",
        paragraphs: [
          "Para Binance, o material oficial descreve depósito em BRL por Pix/TED e reforça compatibilidade de nome e CPF/CNPJ. Para OKX, o material oficial descreve depósito BRL via Pix para clientes brasileiros elegíveis e exige que nome e CPF combinem com a conta.",
          "Na prática, o usuário deve abrir a plataforma escolhida e conferir se o método aparece para a própria conta antes de pagar.",
        ],
      },
      {
        title: "Critério 2: custo de trading e custo de entrada",
        paragraphs: [
          "A taxa spot em bps é apenas uma parte do custo. Depósito, saque, spread, slippage, limite e tempo de processamento podem mudar a decisão, principalmente em valores pequenos.",
          "Use a calculadora para traduzir cada taxa em reais. Uma taxa fixa de R$ 5 representa 2,5% de uma entrada de R$ 200, mas apenas 0,05% de R$ 10.000; estes são exemplos, não tarifas das plataformas.",
        ],
        bullets: ["Valor de referência em BRL", "Taxa spot assumida", "Custo percentual de depósito", "Custo fixo de depósito", "Plataforma preferida ou ainda indefinida"],
      },
      {
        title: "Critério 3: campanha e indicação",
        paragraphs: [
          "Código parceiro não é garantia automática de bônus. A plataforma pode limitar campanhas por país, ciclo, perfil da conta, novo usuário, verificação ou tarefa concluída.",
          "Os termos do programa comum de indicação da OKX no Brasil excluem o Affiliate Program. Portanto, uma recompensa descrita nesses termos não comprova benefício para um link de afiliado; confira as condições apresentadas no seu cadastro.",
        ],
      },
    ],
    faq: [
      { question: "Posso escolher só pela taxa spot?", answer: "Não é o ideal. Taxa spot ajuda, mas Pix, limite, spread, saque, prazo e elegibilidade da conta também alteram o custo final." },
      { question: "Por que a página pede valor aproximado?", answer: "Porque o impacto de taxa fixa e taxa percentual muda conforme o tamanho da entrada. R$ 200 e R$ 10.000 podem levar a decisões diferentes." },
    ],
  },
  {
    slug: "br-pix",
    path: "/br/pix",
    title: "Pix/BRL em corretora cripto no Brasil: checklist de depósito e saque",
    description: "Checklist em português para revisar Pix, BRL, depósito, saque, CPF, titularidade bancária, limites, taxas e domínio oficial antes de usar uma corretora cripto.",
    answer: "Para usar Pix/BRL em uma corretora cripto no Brasil, trate depósito e saque como duas verificações separadas. Antes de escolher a plataforma ou copiar qualquer código Pix, confirme domínio oficial, conta logada, BRL/Pix, CPF ou CNPJ, titularidade bancária, limite, taxa, prazo e status da ordem dentro da própria plataforma.",
    nextSteps: [
      { label: "Comparar Binance e OKX com BRL/Pix", href: "/br/comparar?locale=pt-BR&market=BR&product=spot", kind: "compare" },
      { label: "Ver CTA e benefício antes do cadastro", href: "/br/conta?locale=pt-BR&market=BR&product=spot", kind: "cta-check" },
      { label: "Levar a dúvida para o Telegram", href: "telegram:compare", kind: "telegram" },
    ],
    sourceIds: ["binance-brl-pix-deposit", "binance-brl-transfer-faq", "binance-brl-pix-buy", "okx-brl-pix-deposit", "okx-brl-pix-withdraw", "okx-brl-limits-fees", "bcb-pix-speed-availability", "okx-pix-deposit-learn"],
    sections: [
      {
        title: "Checklist antes do Pix",
        paragraphs: [
          "Pix no Brasil é rápido e funciona todos os dias, mas isso não prova que a sua conta cripto já pode receber BRL. A instrução de pagamento precisa aparecer dentro da sua conta, no domínio oficial, com moeda, método, titularidade, limite, taxa e prazo corretos.",
          "Separe depósito e saque. Um Pix de entrada pode estar disponível, mas o saque em BRL pode ter outra regra de titularidade, taxa, limite, prazo ou status de processamento.",
        ],
        bullets: [
          "Confirmar domínio oficial e sessão logada.",
          "Confirmar BRL como moeda e Pix como método quando aplicável.",
          "Confirmar nome, CPF/CNPJ e titularidade bancária exigidos pela plataforma.",
          "Confirmar valor, limite mínimo/máximo, taxa exibida, prazo de processamento e status da ordem.",
          "Guardar histórico da ordem dentro da plataforma.",
        ],
      },
      {
        title: "Depósito e saque não são a mesma decisão",
        paragraphs: [
          "Para depósito, a prioridade é confirmar se a plataforma mostra BRL/Pix para a sua conta e se o pagador combina com o cadastro. Para saque, a prioridade é confirmar recebedor, conta de destino, titularidade, limite, taxa, prazo e status antes de solicitar a retirada.",
          "Se qualquer campo não aparecer de forma clara no fluxo oficial, trate o próximo passo como pesquisa, não como cadastro imediato.",
        ],
      },
      {
        title: "Se o método de depósito não aparecer",
        paragraphs: [
          "Se o produto pretendido é derivativo, se você não sabe qual conta bancária usará, ou se o método BRL não aparece na plataforma, o melhor próximo passo é voltar ao diretório global e comparar com calma.",
          "Procure a ajuda oficial da plataforma para esclarecer a disponibilidade do método antes de iniciar uma transferência.",
        ],
      },
    ],
    faq: [
      { question: "A NexuAlpha recebe ou processa Pix?", answer: "Não. A NexuAlpha não recebe fundos. Depósitos, saques e verificação acontecem somente na plataforma oficial escolhida." },
      {
        question: "No depósito Pix, o CPF do pagador e o CNPJ do recebedor são a mesma verificação?",
        answer: "Não. Confira separadamente quem envia e quem recebe. O nome e o CPF do pagador precisam atender às regras da sua conta. No aplicativo bancário, confira também o nome e o CNPJ do recebedor contra as instruções de depósito geradas dentro da conta oficial. A ajuda da OKX orienta essa conferência para o seu fluxo BRL/Pix. Se houver divergência, interrompa o depósito e consulte o suporte oficial; não use dados recebidos em mensagens ou capturas antigas. A NexuAlpha não fornece chave Pix nem recebe fundos.",
        sourceIds: ["okx-brl-pix-deposit"],
      },
      { question: "Pix significa aprovação instantânea?", answer: "Não necessariamente. O método pode ser rápido, mas a plataforma ainda pode rejeitar divergência de CPF, nome, limite ou elegibilidade." },
    ],
    aeoAnswers: [
      {
        id: "br-pix-deposit",
        question: "Como conferir depósito e saque Pix/BRL antes de escolher uma corretora cripto?",
        answer: "Pix no Brasil é rápido e funciona todos os dias, mas isso não prova que a conta cripto já pode depositar ou sacar BRL. Antes do cadastro ou de copiar um código Pix, confirme no domínio oficial: BRL, Pix, valor da ordem, taxa exibida, limite, prazo, nome, CPF/CNPJ, titularidade bancária e status. Se faltar algo, trate como pesquisa, não transferência.",
        localized: {
          en: "Pix in Brazil is fast and available every day, but that does not prove your crypto account can already receive BRL. Before registering or copying a Pix code, check the official platform flow for BRL, Pix, order amount, displayed fee, limits, processing time, name, CPF/CNPJ, bank-account ownership, and order status. If any field is missing from your own account screen, treat the next step as research, not a transfer.",
          "zh-Hans": "巴西 Pix 本身很快，也可以每天使用，但这并不等于你的交易所账户已经支持 BRL 入金。注册或复制 Pix 代码前，必须在平台官网的账户流程里核对：BRL、Pix、订单金额、显示费用、限额、到账时间、姓名、CPF/CNPJ、银行卡归属和订单状态。只要这些信息没有出现在你自己的账户页面，就先当成研究步骤，不要直接转账。",
        },
        steps: [
          "Abrir o domínio oficial da plataforma e entrar na própria conta.",
          "Selecionar BRL e Pix no fluxo de depósito mostrado para aquela conta.",
          "Conferir nome, CPF/CNPJ, titularidade bancária, valor, limite mínimo/máximo, taxa, prazo e status.",
          "Guardar o histórico da ordem dentro da plataforma antes de considerar o depósito concluído.",
        ],
        table: [
          { item: "Pix", check: "Rápido e disponível todos os dias não significa que a conta cripto esteja apta a receber BRL.", sourceIds: ["bcb-pix-speed-availability"] },
          { item: "Binance", check: "Verificar depósito BRL/Pix, CPF/CNPJ, titularidade, valor, limites, taxa quando houver e histórico no fluxo oficial.", sourceIds: ["binance-brl-pix-deposit", "binance-brl-transfer-faq", "binance-brl-pix-buy"] },
          { item: "OKX", check: "Verificar Pix em BRL, nome e CPF compatíveis, limites, taxas, prazo e tela final exibidos na conta.", sourceIds: ["okx-brl-pix-deposit", "okx-pix-deposit-learn", "okx-brl-limits-fees"] },
        ],
        sourceIds: ["bcb-pix-speed-availability", "binance-brl-pix-deposit", "binance-brl-transfer-faq", "binance-brl-pix-buy", "okx-brl-pix-deposit", "okx-pix-deposit-learn", "okx-brl-limits-fees"],
      },
      {
        id: "br-pix-withdraw",
        question: "Quais condições devo confirmar antes de sacar BRL por Pix?",
        answer: "Antes de sacar BRL por Pix, confirme que o método aparece na conta oficial, que o recebedor e a titularidade bancária correspondem ao cadastro, e que limite, taxa, prazo e status da ordem estão claros. Se qualquer dado divergir, revise a ajuda oficial antes de solicitar o saque.",
        steps: [
          "Entrar na conta oficial e abrir o fluxo de saque em BRL/Pix.",
          "Confirmar titularidade, CPF/CNPJ, conta de destino e nome do recebedor.",
          "Revisar limite mínimo/máximo, taxa, prazo de processamento e status da ordem.",
          "Salvar o comprovante ou histórico interno depois que a plataforma registrar a solicitação.",
        ],
        table: [
          { item: "Conta de destino", check: "Nome, CPF/CNPJ e titularidade precisam combinar com o cadastro quando a plataforma exigir.", sourceIds: ["binance-brl-pix-withdraw", "okx-brl-pix-withdraw"] },
          { item: "Custo e prazo", check: "Taxas, limites e tempo de processamento devem ser lidos na tela da conta antes do saque.", sourceIds: ["okx-brl-limits-fees"] },
        ],
        sourceIds: ["binance-brl-pix-withdraw", "okx-brl-pix-withdraw", "okx-brl-limits-fees"],
      },
    ],
  },
  {
    slug: "br-saque-pix",
    path: "/br/saque-pix",
    title: "Saque Pix em BRL: checklist antes de retirar cripto no Brasil",
    description: "Checklist em português para revisar saque Pix, conta de destino, CPF/CNPJ, limites, taxas e prazo antes de retirar BRL.",
    answer: "Antes de sacar BRL por Pix, trate a retirada como uma checagem de conta: o método precisa aparecer no domínio oficial, o recebedor deve combinar com o cadastro quando a plataforma exigir, e limite, taxa, prazo e status da ordem precisam estar claros antes da solicitação.",
    nextSteps: [
      { label: "Voltar à comparação antes de depositar", href: "/br/comparar?locale=pt-BR&market=BR&product=spot", kind: "compare" },
      { label: "Revisar CPF, KYC e titularidade", href: "/br/kyc-cpf?locale=pt-BR&market=BR&product=spot", kind: "account" },
      { label: "Continuar no Telegram com contexto BRL", href: "telegram:compare", kind: "telegram" },
    ],
    sourceIds: ["binance-brl-pix-withdraw", "okx-brl-pix-withdraw", "okx-brl-limits-fees", "bcb-pix-faq", "bcb-pix-med", "receita-federal-cpf", "okx-pix-deposit-learn"],
    sections: [
      {
        title: "O que revisar antes do saque",
        paragraphs: [
          "Um depósito Pix aprovado não significa que todo saque BRL está livre. Abra o fluxo de saque somente dentro da plataforma oficial; a NexuAlpha não processa Pix, não recebe fundos e não consegue confirmar saldo, aprovação ou prazo individual.",
          "Leia a tela final antes de solicitar a retirada. Se conta de destino, titularidade, CPF/CNPJ, limite, taxa, prazo ou fundos temporariamente indisponíveis não estiverem claros, volte para a comparação antes de registrar ou depositar.",
        ],
        bullets: [
          "Conta logada no domínio oficial da plataforma.",
          "BRL e Pix selecionados no fluxo de saque quando disponíveis para a conta.",
          "Nome, CPF/CNPJ e conta de destino compatíveis com as regras exibidas.",
          "Limite mínimo/máximo, taxa, prazo de processamento e status da ordem revisados.",
          "Histórico interno salvo depois que a plataforma registrar a solicitação.",
        ],
      },
      {
        title: "Quando voltar para a comparação",
        paragraphs: [
          "Se o saque Pix não aparecer, se o custo for diferente do esperado ou se a conta de destino não combinar com o cadastro, volte ao comparativo antes de enviar uma nova ordem.",
          "Para usuários que ainda estão escolhendo a corretora, esta página funciona como um filtro: uma plataforma pode ser boa para compra spot e ainda assim exigir atenção extra no saque em BRL.",
        ],
      },
    ],
    faq: [
      { question: "A NexuAlpha garante saque Pix aprovado?", answer: "Não. Saque, prazo, rejeição, taxa e limite são definidos pela plataforma oficial e pela conta do usuário." },
      { question: "O saque precisa ir para uma conta com o mesmo CPF?", answer: "Quando a plataforma exigir correspondência de titularidade, nome e CPF/CNPJ precisam combinar com o cadastro. Confira a regra exibida no fluxo oficial antes de solicitar." },
      {
        question: "Se eu consigo depositar por Pix, posso sacar para qualquer conta?",
        answer: "Não trate assim. Depósito e saque têm regras próprias. Confirme conta de destino, CPF/CNPJ, titularidade, limite, taxa e prazo dentro da plataforma oficial antes de registrar ou depositar.",
        localized: {
          en: "Do not assume that. Deposits and withdrawals have separate rules. Confirm destination account, CPF/CNPJ, ownership, limits, fee, and processing time inside the official platform before registering or depositing.",
          "zh-Hans": "不能这样假设。入金和出金规则不同。注册或入金前，请在官方平台内确认收款账户、CPF/CNPJ、账户归属、限额、费用和处理时间。",
        },
      },
    ],
    aeoAnswers: [
      {
        id: "br-pix-withdrawal-checklist",
        question: "Como revisar saque Pix em BRL antes de retirar fundos de uma corretora cripto?",
        answer: "Um depósito Pix aprovado não libera automaticamente todo saque BRL. Para sacar, revise conta de destino, titularidade, CPF/CNPJ, limite, taxa, prazo e fundos temporariamente indisponíveis. Se o caminho de saída não estiver claro, volte para comparação antes de registrar ou depositar.",
        localized: {
          en: "An approved Pix deposit does not mean every BRL withdrawal is clear. Review destination account, ownership, CPF/CNPJ, limits, fee, processing time, and temporarily unavailable funds. If the exit path is unclear, return to comparison before registering or depositing.",
          "zh-Hans": "Pix 入金成功不代表 BRL 出金路径也没问题。出金前要重新核对收款账户、归属、CPF/CNPJ、限额、费用、处理时间，以及是否有暂时不可用资金。如果出金路径不清楚，先回到比较页，不要急着注册或入金。",
        },
        steps: [
          "Abrir a conta oficial e selecionar saque em BRL/Pix quando o método aparecer.",
          "Conferir recebedor, CPF/CNPJ, titularidade e conta de destino.",
          "Revisar limite, taxa, prazo de processamento e status antes de confirmar.",
          "Guardar o histórico da solicitação dentro da plataforma.",
        ],
        table: [
          { item: "Binance", check: "Revisar saque BRL para conta bancária com o mesmo nome da conta Binance.", sourceIds: ["binance-brl-pix-withdraw", "binance-brl-transfer-faq"] },
          { item: "OKX", check: "Conta bancária pode vir de depósito bem-sucedido ou cadastro manual; dados incorretos ou não verificáveis podem ser rejeitados.", sourceIds: ["okx-brl-pix-withdraw", "okx-brl-limits-fees", "okx-pix-deposit-learn"] },
          { item: "Pix", check: "Recuperação por erro ou fraude segue regras do banco do usuário e não é garantia da NexuAlpha ou da corretora.", sourceIds: ["bcb-pix-med"] },
        ],
        sourceIds: ["binance-brl-pix-withdraw", "binance-brl-transfer-faq", "okx-brl-pix-withdraw", "okx-brl-limits-fees", "okx-pix-deposit-learn", "bcb-pix-med", "receita-federal-cpf"],
      },
    ],
  },
  {
    slug: "br-custos",
    path: "/br/custos",
    title: "Calcular custo de entrada e taxa spot antes do cadastro",
    description: "Use hipóteses simples de valor, taxa spot e custo de entrada para comparar plataformas no mercado-alvo Brasil.",
    answer: "Para estimar uma operação spot, use a fórmula: custo aproximado = valor × taxa spot em bps ÷ 10.000 + valor × custo percentual de entrada + custo fixo em BRL. O resultado é um filtro de decisão antes do cadastro, não uma tarifa oficial da sua conta.",
    nextSteps: [
      { label: "Usar a comparação com as hipóteses de custo", href: "/br/comparar?locale=pt-BR&market=BR&product=spot", kind: "compare" },
      { label: "Checar benefício e CTA antes de abrir conta", href: "/br/conta?locale=pt-BR&market=BR&product=spot", kind: "cta-check" },
      { label: "Enviar o cenário para o Telegram", href: "telegram:fees", kind: "telegram" },
    ],
    sourceIds: ["binance-brl-pix-deposit", "okx-brl-limits-fees", "okx-brl-pix-deposit", "receita-cripto-servico", "receita-irpf-2026-cripto"],
    sections: [
      {
        title: "Como a estimativa funciona",
        paragraphs: [
          "A calculadora soma a taxa spot assumida e o custo de entrada informado pelo usuário: valor × bps ÷ 10.000, mais valor × custo percentual, mais custo fixo em BRL. Ela não tenta estimar spread, slippage, imposto, saque ou variação de preço, porque esses dados mudam por ordem, ativo e momento.",
          "Mesmo simples, a conta ajuda o usuário a comparar cenários. Se o custo total mal muda, o critério decisivo pode ser Pix, limite, confiança, produto ou usabilidade. Se muda muito, a taxa vira o assunto principal.",
        ],
        bullets: ["10 bps = 0,10%", "Taxa spot estimada = valor × bps ÷ 10.000", "Custo de entrada = valor × percentual + custo fixo em BRL", "O resultado é uma estimativa, não uma cotação em tempo real nem a taxa oficial da conta"],
      },
      {
        title: "O que a conta não cobre",
        paragraphs: [
          "A estimativa não prova que a conta terá aquela taxa. Conta nova, VIP, BNB, produto, método de entrada, spread, slippage, saque, imposto e horário da ordem podem mudar o custo final.",
          "Limites, tarifas e prazo precisam vir da forma de pagamento exibida na sua conta. Use a calculadora para saber qual número muda sua decisão; use a tela oficial para confirmar o custo aplicável à sua conta.",
        ],
      },
      {
        title: "Salvar e comparar seus cenários",
        paragraphs: [
          "Altere uma hipótese por vez e compare o total. Você pode copiar o link para retomar o mesmo valor, as mesmas taxas e a plataforma selecionada em outro navegador.",
          "A URL compartilhável guarda somente as escolhas públicas da comparação. Assim você pode voltar ao mesmo cenário antes de abrir a plataforma oficial.",
        ],
      },
    ],
    faq: [
      { question: "A estimativa substitui a tabela oficial de taxas?", answer: "Não. Ela serve para comparar hipóteses antes do cadastro. A taxa final deve ser verificada dentro da plataforma oficial." },
      { question: "Por que manter campos editáveis?", answer: "Porque taxas, limites e custos mudam por conta e campanha. Use os valores mostrados para a sua conta na tabela oficial ao simular." },
      { question: "A calculadora cobre imposto ou declaração de criptoativos?", answer: "Não. A NexuAlpha não calcula imposto. Separe custo de plataforma de obrigação fiscal, guarde comprovantes, histórico de ordem e valor em reais, e consulte orientação fiscal quando necessário." },
    ],
    aeoAnswers: [
      {
        id: "br-fee-estimate",
        question: "Por que uma estimativa de taxas não substitui a tabela oficial da conta?",
        answer: "A estimativa da NexuAlpha compara hipóteses, mas limites, tarifas e prazo precisam vir da forma de pagamento exibida na sua conta. Use a calculadora para saber qual número muda sua decisão; use a tela oficial para confirmar custo, status e condições aplicáveis antes de depositar ou enviar ordem.",
        localized: {
          en: "The NexuAlpha calculator helps compare assumptions, but limits, fees, and processing time must come from the payment method shown in your own account. Use the calculator to see which number changes the decision; use the official screen to confirm the account-specific cost.",
          "zh-Hans": "NexuAlpha 的计算器只用于比较假设，真实限额、费用和处理时间必须看你账户里显示的支付方式。计算器用于判断哪个成本会影响选择，官方页面用于确认你账户实际适用的成本。",
        },
        steps: [
          "Usar valor, taxa spot e custo de entrada como hipóteses, não como cotação.",
          "Conferir a tabela oficial e a tela da própria conta antes de enviar uma ordem.",
          "Separar taxa de trading, custo de depósito, spread, slippage e custo de saque.",
          "Atualizar a simulação sempre que a plataforma mostrar novas condições.",
        ],
        table: [
          { item: "Taxa spot estimada", check: "valor × bps ÷ 10.000; serve para comparar hipóteses antes de abrir a plataforma.", sourceIds: ["okx-brl-limits-fees"] },
          { item: "Custo de entrada", check: "valor × custo percentual + custo fixo em BRL; depende do método exibido na conta.", sourceIds: ["binance-brl-pix-deposit", "okx-brl-pix-deposit"] },
          { item: "Diferença real", check: "spread, slippage, saque, imposto, VIP/BNB, produto e tela final podem alterar o total.", sourceIds: ["binance-brl-pix-deposit", "okx-brl-limits-fees"] },
          { item: "Custo oficial", check: "limites, taxas, prazo, taxa da transação quando houver e status devem ser conferidos na tela oficial da conta.", sourceIds: ["binance-brl-pix-deposit", "okx-brl-limits-fees"] },
          { item: "Registro fiscal", check: "obrigações de declaração, ganho de capital e documentos ficam fora da calculadora; guarde comprovantes e histórico em BRL.", sourceIds: ["receita-cripto-servico", "receita-irpf-2026-cripto"] },
        ],
        sourceIds: ["binance-brl-pix-deposit", "okx-brl-limits-fees", "okx-brl-pix-deposit", "receita-cripto-servico", "receita-irpf-2026-cripto"],
      },
    ],
  },
  {
    slug: "br-conta",
    path: "/br/conta",
    title: "Conta nova, código parceiro e benefício: o que checar no Brasil",
    description: "Entenda como conferir benefício de usuário, código parceiro, regra da plataforma e elegibilidade antes de criar uma conta.",
    answer: "Conta nova, link de parceiro, código de indicação, campanha e benefício de usuário não são a mesma coisa. Antes de criar conta no Brasil, confirme no domínio oficial se a campanha aparece para você, quais tarefas são exigidas, qual produto é elegível e se a tela final mostra a regra aplicável.",
    nextSteps: [
      { label: "Comparar novamente antes de escolher", href: "/br/comparar?locale=pt-BR&market=BR&product=spot", kind: "compare" },
      { label: "Revisar Pix e BRL antes de sair", href: "/br/pix?locale=pt-BR&market=BR&product=spot", kind: "funding" },
      { label: "Perguntar no Telegram sem expor dados pessoais", href: "telegram:compare", kind: "telegram" },
    ],
    sourceIds: ["okx-brazil-referral-terms", "okx-brl-pix-deposit", "binance-terms-br", "binance-brl-transfer-faq"],
    sections: [
      {
        title: "O que pode mudar por usuário",
        paragraphs: [
          "Campanhas de indicação podem depender de novo usuário, país, KYC, ciclo de campanha, tarefa concluída, produto, depósito, negociação e disponibilidade regional. Mesmo quando existe link parceiro, o benefício visto por uma conta pode não ser igual ao de outra.",
          "Confira o nome da campanha, sua validade, o código exibido quando aplicável, as tarefas exigidas e as condições no momento do cadastro. Guarde as regras que forem apresentadas à sua conta.",
        ],
        bullets: ["Novo usuário ou conta existente", "País e residência informados no KYC", "Produto disponível para aquela conta", "Campanha ativa no momento do cadastro", "Tarefas exigidas após registro"],
      },
      {
        title: "Separar link, código e benefício",
        paragraphs: [
          "O link de parceiro é a rota de cadastro. O código de indicação é um campo ou identificador que pode aparecer no fluxo oficial. A campanha é o conjunto de tarefas e prazos. O benefício só deve ser tratado como aplicável quando a plataforma mostra a regra para a própria conta.",
          "A NexuAlpha não publica comissão privada e não transforma comissão comercial em promessa de desconto. O usuário deve confirmar benefício e elegibilidade diretamente na plataforma oficial.",
        ],
      },
      {
        title: "Como decidir com segurança",
        paragraphs: [
          "Antes de criar conta, abra o domínio oficial, confira se o código apareceu quando aplicável, leia a regra de campanha e guarde a própria comparação para revisar depois.",
          "Se alguma condição não aparecer para a sua conta, volte ao comparativo e escolha outro caminho antes de enviar documentos ou transferir BRL.",
        ],
      },
    ],
    faq: [
      { question: "A NexuAlpha promete desconto fixo ao usuário brasileiro?", answer: "Não. Quando não houver condição pública e verificável, a página orienta o usuário a confirmar benefício e regra dentro da plataforma." },
      { question: "Onde confirmo a regra final da campanha?", answer: "Dentro da plataforma oficial, antes de concluir o cadastro ou cumprir qualquer tarefa de campanha." },
    ],
    aeoAnswers: [
      {
        id: "br-referral-boundary",
        question: "Um link de parceiro garante bônus ou desconto para todo usuário brasileiro?",
        answer: "Não. Link de parceiro, código de indicação, campanha e benefício de usuário são verificações diferentes. O usuário brasileiro deve confirmar se a campanha aparece na própria conta, quais tarefas são exigidas, qual produto é elegível, se há prazo ou depósito mínimo e quais termos oficiais valem antes de concluir o cadastro.",
        steps: [
          "Abrir o cadastro somente pelo domínio oficial exibido.",
          "Verificar se o código, campanha ou benefício aparece para a própria conta.",
          "Ler tarefas, prazo, país, KYC, produto, depósito mínimo e restrições da campanha.",
          "Considerar benefício como não confirmado quando a tela da conta não mostrar a regra aplicável.",
        ],
        table: [
          { item: "Link de parceiro", check: "Identifica uma rota de cadastro, mas não comprova benefício individual.", sourceIds: ["binance-terms-br", "okx-brazil-referral-terms"] },
          { item: "Código de indicação", check: "Pode aparecer no fluxo oficial, mas a elegibilidade depende da conta e da campanha.", sourceIds: ["okx-brazil-referral-terms"] },
          { item: "Campanha", check: "Define tarefas, prazo, produto, país, KYC e possíveis requisitos de depósito ou negociação.", sourceIds: ["okx-brazil-referral-terms"] },
          { item: "Tela final da conta", check: "É onde o usuário deve confirmar campanha, tarefas e termos antes de prosseguir.", sourceIds: ["okx-brazil-referral-terms", "okx-brl-pix-deposit"] },
        ],
        sourceIds: ["okx-brazil-referral-terms", "okx-brl-pix-deposit", "binance-terms-br", "binance-brl-transfer-faq"],
      },
    ],
  },
  {
    slug: "br-kyc-cpf",
    path: "/br/kyc-cpf",
    title: "KYC e CPF em conta cripto no Brasil: titularidade bancária e benefícios",
    description: "Guia em português para revisar KYC, CPF, titularidade bancária, produto, elegibilidade e benefício de indicação antes de criar uma conta cripto no Brasil.",
    answer: "KYC e CPF não são apenas etapas burocráticas: eles definem se a plataforma consegue verificar a pessoa, associar a conta ao titular correto e liberar métodos como BRL/Pix. Antes do cadastro, confirme documentos, país, produto, titularidade bancária e qualquer benefício de indicação no fluxo oficial da própria conta.",
    nextSteps: [
      { label: "Voltar ao checklist Pix/BRL", href: "/br/pix?locale=pt-BR&market=BR&product=spot", kind: "funding" },
      { label: "Comparar plataformas antes do CTA", href: "/br/comparar?locale=pt-BR&market=BR&product=spot", kind: "compare" },
      { label: "Continuar no Telegram com retorno para o site", href: "telegram:compare", kind: "telegram" },
    ],
    sourceIds: ["receita-federal-cpf", "binance-brl-transfer-faq", "binance-terms-br", "okx-brl-pix-deposit", "okx-pix-deposit-learn", "okx-brl-pix-withdraw", "okx-brl-limits-fees"],
    sections: [
      {
        title: "Checklist de identidade e conta",
        paragraphs: [
          "A Receita Federal descreve o CPF como cadastro com informações pessoais e número único para cada cidadão. Para BRL/Pix, CPF e titularidade não são detalhes administrativos: são filtro de entrada antes do CTA final.",
          "Binance informa que nome e CPF/CNPJ da conta bancária precisam corresponder ao cadastro. OKX informa que Pix de terceiros pode ser devolvido e que saque para CPF ou nome diferente pode ser rejeitado. A NexuAlpha organiza a decisão, mas não aprova KYC nem valida documentos.",
        ],
        bullets: [
          "CPF em situação conferida nos canais oficiais quando houver dúvida cadastral.",
          "Nome, data de nascimento e documento compatíveis com o cadastro usado na plataforma.",
          "Conta bancária de entrada ou saída em nome compatível quando a plataforma exigir.",
          "Produto pretendido disponível para Brasil e para o nível de conta.",
          "Campanha, código parceiro e benefício verificados separadamente dentro da conta.",
        ],
      },
      {
        title: "Erros que atrasam a primeira operação",
        paragraphs: [
          "Divergência de nome, CPF/CNPJ, banco, residência ou produto pode travar depósito, saque, campanha ou primeira ordem. Por isso, o melhor momento de resolver a dúvida é antes de enviar documentos ou transferir BRL.",
          "Se a plataforma mostrar uma condição diferente da página pública, use a condição exibida para a sua conta e guarde o histórico oficial.",
        ],
      },
    ],
    faq: [
      { question: "KYC aprovado garante Pix, bônus ou taxa específica?", answer: "Não. KYC pode ser necessário para a conta, mas Pix, bônus, taxa, limite e produto dependem das condições exibidas pela plataforma." },
      { question: "Posso usar CPF de outra pessoa para abrir conta?", answer: "Não trate isso como caminho válido. A conta, o documento e a titularidade bancária devem seguir as regras oficiais da plataforma e do cadastro usado." },
    ],
    aeoAnswers: [
      {
        id: "br-kyc-cpf-checklist",
        question: "O que revisar sobre KYC, CPF, titularidade bancária e benefício antes de abrir conta cripto no Brasil?",
        answer: "Para uma conta cripto no Brasil, KYC, CPF e titularidade bancária são filtros de entrada. Antes do CTA final, decida se usará conta bancária no próprio CPF e com nome compatível. KYC aprovado não garante Pix, bônus, desconto, indicação ou produto; essas condições precisam aparecer no fluxo oficial da própria conta.",
        localized: {
          en: "For BRL/Pix, CPF and account ownership are an entry filter. Before the final CTA, decide whether you are using a bank account under your own CPF with matching name details. KYC approval does not guarantee Pix, bonus, discount, or product access; those conditions must appear in your own official account flow.",
          "zh-Hans": "对 BRL/Pix 来说，CPF 和银行卡归属是准入条件。最终 CTA 前，先判断你是否使用本人 CPF 且姓名匹配的银行账户。KYC 通过不代表一定有 Pix、奖励、折扣或某个产品；这些条件必须出现在你自己的官方账户流程里。",
        },
        steps: [
          "Conferir CPF e dados pessoais nos canais oficiais quando houver dúvida cadastral.",
          "Ler documentos aceitos, país, produto e nível de conta no fluxo oficial da plataforma.",
          "Confirmar titularidade bancária antes de usar BRL/Pix.",
          "Separar KYC, código parceiro, campanha e benefício em verificações diferentes.",
        ],
        table: [
          { item: "CPF", check: "Tratar o CPF como identificador cadastral da pessoa e revisar a situação quando houver dúvida.", sourceIds: ["receita-federal-cpf"] },
          { item: "Titularidade", check: "Confirmar nome, CPF/CNPJ e conta bancária compatíveis; Binance exige correspondência e OKX pode devolver Pix de terceiros.", sourceIds: ["binance-brl-transfer-faq", "okx-brl-pix-deposit", "okx-pix-deposit-learn", "okx-brl-pix-withdraw"] },
          { item: "Produto e campanha", check: "Confirmar produto, tarefa, prazo e elegibilidade dentro da conta oficial.", sourceIds: ["binance-terms-br", "okx-brl-limits-fees"] },
        ],
        sourceIds: ["receita-federal-cpf", "binance-brl-transfer-faq", "binance-terms-br", "okx-brl-pix-deposit", "okx-pix-deposit-learn", "okx-brl-pix-withdraw", "okx-brl-limits-fees"],
      },
    ],
  },
];

export function getBrazilPage(pathname) {
  return BRAZIL_PAGES.find((page) => page.path === pathname) || null;
}

export function getBrazilSource(id) {
  return BRAZIL_SOURCES.find((source) => source.id === id) || null;
}

export function getBrazilPartnerVenue(slug) {
  return BRAZIL_VENUES.find((venue) => venue.slug === slug) || null;
}
