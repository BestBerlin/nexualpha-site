// Public-source research input; never a human-approved participation feed.
// AI_SOURCE_CHECKED never means human approval, account eligibility or payout.
// No referral destinations, invitation codes or commercial switches live here.
export const OFFICIAL_CAMPAIGN_RESEARCH_CHECKED_AT = "2026-09-06T18:11:47Z";
// Incremental recheck time. Unchanged sources retain their original timestamps.
export const OFFICIAL_CAMPAIGN_RESEARCH_REFRESHED_AT = "2026-09-06T18:35:39Z";

const tr = (en, hans, hant) => ({ en, "zh-Hans": hans, "zh-Hant": hant });
const source = (id, title, url, sourceType, summary, extra = {}) => ({
  id, title, url, sourceType, access: "READ",
  checkedAt: OFFICIAL_CAMPAIGN_RESEARCH_CHECKED_AT,
  publishedAt: null, startAt: null, endAt: null, timeZone: null,
  publishedDate: null, datePrecision: "UNKNOWN", regions: null,
  eligibility: null, kyc: null, deposit: null, trading: null,
  rewardType: null, maximumConditions: null, limitations: null,
  summary, ...extra,
});
const record = (venueSlug, summary, signupReward, sources, notices = []) => ({
  venueSlug, checkedAt: OFFICIAL_CAMPAIGN_RESEARCH_CHECKED_AT,
  reviewMode: "AI_SOURCE_CHECKED", summary,
  signupReward: {
    kind: null, amount: null, conditions: [], sourceUrls: [],
    startAt: null, endAt: null, timeZone: null, ...signupReward,
  },
  sources, notices,
});

const urls = {
  binance: "https://www.binance.com/en/rewards-hub",
  coinbase: "https://help.coinbase.com/en/coinbase/getting-started/getting-started-with-coinbase/new-customer-incentive",
  bybit: "https://www.bybit.com/en/help-center/article/FAQ-Rewards-Hub",
  bitget: "https://www.bitget.com/zh-CN/support/articles/12560603821815",
  okx: "https://www.okx.com/en-eu/help/new-user-bonus-program-faq-eea",
  kraken: "https://support.kraken.com/articles/kraken-pro-app-referrals",
  gate: "https://www.gate.com/rewards_hub",
  gateEurope: "https://www.gate.com/en-eu/announcements/article/228091",
  kucoin: "https://www.kucoin.com/support/8434569945113",
  mexc: "https://www.mexc.com/en-GB/announcements/article/the-industry-s-best-welcome-17827791527250",
  mexcEnded: "https://www.mexc.com/zh-MY/campaigns/TradingPapa8",
  backpack: "https://support.backpack.exchange/exchange/programs/referrals",
  deribit: "https://support.deribit.com/hc/en-us/articles/25944777728797-Affiliate-Program",
  uniswap: "https://blog.uniswap.org/how-permissioned-pools-work-on-uniswap-v4",
  pancake: "https://blog.pancakeswap.finance/articles/tmx-trading-competition",
  jupiter: "https://support.jup.ag/",
  raydium: "https://docs.raydium.io/",
  aerodrome: "https://aerodrome.finance/docs",
  curve: "https://resources.curve.finance/user/introduction",
  hyperliquid: "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals",
  dydx: "https://docs.dydx.xyz/",
  gmx: "https://docs.gmx.io/docs/referrals/",
  drift: "https://www.drift.trade/updates/drift-recovery-update-june-3-2026",
};

export const officialCampaignResearchByVenue = {
  binance: record("binance",
    tr("The public Rewards Hub separates tasks, points and vouchers; a visible hub is not a personal reward offer.", "福利中心分列任务、积分与卡券；看到入口不代表账户已获得某项奖励。", "福利中心分列任務、積分與卡券；看到入口不代表帳戶已獲得某項獎勵。"),
    { status: "ACCOUNT_CONFIRMATION", kind: "task_rewards", sourceUrls: [urls.binance],
      summary: tr("No account-specific amount or qualifying task was exposed in this public view.", "本次公开页面没有显示账户专属金额或达标任务。", "本次公開頁面沒有顯示帳戶專屬金額或達標任務。"),
      conditions: [
        tr("Open the task assigned to the eligible account before acting.", "操作前查看合资格账户实际获得的任务。", "操作前查看合資格帳戶實際獲得的任務。"),
        tr("Read voucher use and expiry separately from points redemption.", "卡券用途与有效期、积分兑换条件需分别查看。", "卡券用途與有效期、積分兌換條件需分別查看。"),
        tr("Region, KYC and funding thresholds remain unconfirmed in this view.", "此页面未核实地区、KYC 与入金门槛。", "此頁面未核實地區、KYC 與入金門檻。"),
      ] },
    [source("binance-rewards", "Binance Rewards Hub", urls.binance, "campaign_hub",
      tr("Public task, points and voucher navigation was readable; personal terms were not.", "已读到任务、积分和卡券导航，未读到账户专属条款。", "已讀到任務、積分和卡券導覽，未讀到帳戶專屬條款。"))]),

  coinbase: record("coinbase",
    tr("New-customer promotions and referral rewards are different entry paths; some cannot be combined.", "新客促销与邀请奖励属于不同参与路径，部分优惠不能叠加。", "新客促銷與邀請獎勵屬於不同參與路徑，部分優惠不能疊加。"),
    { status: "ACCOUNT_CONFIRMATION", kind: "crypto_or_random_reward", sourceUrls: [urls.coinbase],
      summary: tr("The official page describes country- and offer-specific rewards, including random prizes. No universal amount is established.", "官方条款按国家和优惠区分奖励，包含随机奖项，不能概括为人人可领的统一金额。", "官方條款按國家和優惠區分獎勵，包含隨機獎項，不能概括為人人可領的統一金額。"),
      conditions: [
        tr("For the referral path, apply the link or code while creating the new account.", "选择邀请路径时，需在创建新账户时使用链接或代码。", "選擇邀請路徑時，需在建立新帳戶時使用連結或代碼。"),
        tr("Referral purchases use eligible retail payment methods; Advanced and Prime trades are excluded.", "邀请奖励需通过合资格零售支付方式购买；Advanced 与 Prime 交易不计入。", "邀請獎勵需透過合資格零售支付方式購買；Advanced 與 Prime 交易不計入。"),
        tr("Check country, purchase deadline and non-stacking terms. Referral participants are excluded from specified new-user spin promotions.", "核对国家、购买期限及互斥条款；邀请活动参与者不适用于条款列出的新客转盘优惠。", "核對國家、購買期限及互斥條款；邀請活動參與者不適用於條款列出的新客轉盤優惠。"),
      ] },
    [source("coinbase-new-customer", "Coinbase new-customer incentives", urls.coinbase, "reward_terms",
      tr("One help page covers several distinct offers; advertised random maximums are not guaranteed payouts.", "同一帮助页涵盖多种独立优惠，随机奖项的最高额不等于保证到账额。", "同一說明頁涵蓋多種獨立優惠，隨機獎項的最高額不等於保證到帳額。"))]),

  bybit: record("bybit",
    tr("Bybit distinguishes bonuses, Fee Savers, airdrops and trial funds; these do not share the same withdrawal rules.", "Bybit 将赠金、手续费抵扣、空投与体验金分开管理，提现规则并不相同。", "Bybit 將贈金、手續費抵扣、空投與體驗金分開管理，提領規則並不相同。"),
    { status: "ACCOUNT_CONFIRMATION", kind: "bonus_and_vouchers", sourceUrls: [urls.bybit],
      summary: tr("The Rewards Hub FAQ confirms that bonuses and Fee Savers are not withdrawable and unused rewards can expire.", "福利中心 FAQ 明确：赠金和手续费抵扣不能直接提现，未使用奖励可能到期失效。", "福利中心 FAQ 明確：贈金和手續費抵扣不能直接提領，未使用獎勵可能到期失效。"),
      conditions: [
        tr("Complete the required identity verification before claiming.", "领取前完成所需身份验证。", "領取前完成所需身分驗證。"),
        tr("Complete and claim each task before its own deadline.", "按各任务的独立期限完成并领取。", "按各任務的獨立期限完成並領取。"),
        tr("Confirm the reward type and permitted use; do not treat bonus face value as cash.", "核对奖励类型和适用范围，不把赠金面值当作现金。", "核對獎勵類型和適用範圍，不把贈金面值當作現金。"),
      ] },
    [source("bybit-rewards-faq", "Bybit Rewards Hub FAQ", urls.bybit, "reward_terms",
      tr("Help-page update shown: 25 November 2025; the page does not establish a current account-specific amount.", "帮助页显示更新于 2025 年 11 月 25 日，未证明当前账户可获的具体金额。", "說明頁顯示更新於 2025 年 11 月 25 日，未證明目前帳戶可獲的具體金額。"))]),

  bitget: record("bitget",
    tr("The stated welcome bundle combines different tasks, including inviting another person; it is not a simple deposit cash gift.", "欢迎礼包汇总了不同任务，还包含邀请他人的任务，并非单纯充值即得现金。", "歡迎禮包彙總了不同任務，還包含邀請他人的任務，並非單純儲值即得現金。"),
    { status: "ACCOUNT_CONFIRMATION", kind: "bonus_and_vouchers", sourceUrls: [urls.bitget],
      summary: tr("The 2025 guide describes a 6,200 USDT face-value bundle. Its current availability and the account's exact voucher terms require confirmation.", "2025 年指南描述了面值合计 6,200 USDT 的礼包，当前可用性与账户实际卡券条款仍需确认。", "2025 年指南描述了面值合計 6,200 USDT 的禮包，目前可用性與帳戶實際卡券條款仍需確認。"),
      conditions: [
        tr("The guide gives new users seven days for the deposit/trading challenge.", "该指南给新用户的充值与交易挑战期限为注册后七天。", "該指南給新用戶的儲值與交易挑戰期限為註冊後七天。"),
        tr("It describes a three-day observation period, then a two-day manual claim window.", "指南写明三天观察期后，还需在两天内手动领取。", "指南寫明三天觀察期後，還需在兩天內手動領取。"),
        tr("Rewards go to the coupon center; check each instrument's use, expiry and current eligibility.", "奖励进入卡券中心，需核对各类卡券用途、期限与当前参与资格。", "獎勵進入卡券中心，需核對各類卡券用途、期限與目前參與資格。"),
      ] },
    [source("bitget-rewards-guide", "Bitget Rewards Hub Guide", urls.bitget, "reward_terms",
      tr("Dated 23 January 2025. A historical program guide, not proof that a new account receives the advertised maximum today.", "页面日期为 2025 年 1 月 23 日；这是历史计划指南，不证明今天的新账户可获得宣传最高额。", "頁面日期為 2025 年 1 月 23 日；這是歷史計畫指南，不證明今天的新帳戶可獲得宣傳最高額。"))]),

  okx: record("okx",
    tr("The EEA program assigns offers by account and acquisition channel; depositing alone does not create an entitlement.", "EEA 计划按账户与来源渠道分配优惠，仅充值不会自动产生奖励资格。", "EEA 計畫按帳戶與來源管道分配優惠，僅儲值不會自動產生獎勵資格。"),
    { status: "ACCOUNT_CONFIRMATION", kind: "crypto_voucher_or_pass", sourceUrls: [urls.okx],
      summary: tr("The EEA FAQ covers crypto, X-Perps vouchers and VIP passes. This is region-specific, not a worldwide welcome offer.", "EEA FAQ 涵盖加密资产、X-Perps 体验金券与 VIP 体验资格，这是地区性规则，不是全球统一优惠。", "EEA FAQ 涵蓋加密資產、X-Perps 體驗金券與 VIP 體驗資格，這是地區性規則，不是全球統一優惠。"),
      conditions: [
        tr("Confirm EEA residence support, a new main account, identity checks and the eligible entry channel.", "确认 EEA 地区支持、新主账户、身份验证及合资格入口渠道。", "確認 EEA 地區支援、新主帳戶、身分驗證及合資格入口管道。"),
        tr("Use the assigned task thresholds and deadlines; internal transfers do not qualify as eligible deposits.", "以账户分配的任务门槛和期限为准，内部转账不属于合资格入金。", "以帳戶分配的任務門檻和期限為準，內部轉帳不屬於合資格入金。"),
        tr("Check channel binding and stacking restrictions before using a different referral or promotion.", "使用其他邀请或促销前，先核对渠道绑定和优惠叠加限制。", "使用其他邀請或促銷前，先核對管道綁定和優惠疊加限制。"),
      ] },
    [source("okx-eea-new-user", "OKX EEA New User Bonus Program FAQ", urls.okx, "reward_terms",
      tr("The page shows 27 August 2026; reward amount and task timing are assigned in the eligible account.", "页面显示日期为 2026 年 8 月 27 日，奖励金额和任务时间由合资格账户内的优惠决定。", "頁面顯示日期為 2026 年 8 月 27 日，獎勵金額和任務時間由合資格帳戶內的優惠決定。"))]),

  kraken: record("kraken",
    tr("Kraken Pro referrals require an app-specific eligible path; the public page contains inconsistent reward amounts.", "Kraken Pro 邀请需走合资格应用内路径，公开页面对奖励金额的描述存在冲突。", "Kraken Pro 邀請需走合資格應用程式內路徑，公開頁面對獎勵金額的描述存在衝突。"),
    { status: "ACCOUNT_CONFIRMATION", kind: "referral_reward", sourceUrls: [urls.kraken],
      summary: tr("The heading says up to $200 while the FAQ describes a fixed 20 in the default currency. No common amount should be advertised until resolved.", "标题写最高 $200，FAQ 又写默认货币固定 20；在冲突解决前不展示统一奖励金额。", "標題寫最高 $200，FAQ 又寫預設貨幣固定 20；在衝突解決前不展示統一獎勵金額。"),
      conditions: [
        tr("The friend must be new to Kraken, verified, and use the referral during account creation.", "好友须为 Kraken 新用户、完成验证，并在创建账户时使用邀请。", "好友須為 Kraken 新用戶、完成驗證，並在建立帳戶時使用邀請。"),
        tr("Meet the app's fiat-deposit and trading requirements within 30 days; card deposits are excluded in these terms.", "三十天内完成应用内要求的法币入金与交易；该条款不计入银行卡入金。", "三十天內完成應用程式要求的法幣入金與交易；該條款不計入銀行卡入金。"),
        tr("Verify supported countries and the same-country or eligible EEA cross-country rule.", "核对支持国家，以及同国或合资格 EEA 跨国邀请规则。", "核對支援國家，以及同國或合資格 EEA 跨國邀請規則。"),
      ] },
    [source("kraken-pro-referrals", "Kraken Pro app referrals", urls.kraken, "reward_terms",
      tr("Page update shown: 8 May 2026. The amount conflict is preserved as an unresolved source issue.", "页面显示更新于 2026 年 5 月 8 日；金额冲突作为未解决来源问题保留。", "頁面顯示更新於 2026 年 5 月 8 日；金額衝突作為未解決來源問題保留。"))]),

  "gate-io": record("gate-io",
    tr("Gate's welcome package is composed of vouchers. Gate Europe runs separate, region-bound campaign terms.", "Gate 欢迎礼包由卡券组成，Gate Europe 则有独立的地区活动条款。", "Gate 歡迎禮包由卡券組成，Gate Europe 則有獨立的地區活動條款。"),
    { status: "PUBLIC_TERMS", kind: "vouchers", sourceUrls: [urls.gate],
      summary: tr("The public hub labels the 135 USDT welcome package as multiple vouchers, not 135 USDT of freely withdrawable cash.", "公开福利中心将 135 USDT 欢迎礼包逐项标为卡券，不是可自由提现的 135 USDT 现金。", "公開福利中心將 135 USDT 歡迎禮包逐項標為卡券，不是可自由提領的 135 USDT 現金。"),
      conditions: [
        tr("The package combines signup, identity/face verification, first deposit, first trade and first app download.", "礼包合计包含注册、身份与人脸验证、首次入金、首次交易和首次下载应用任务。", "禮包合計包含註冊、身分與人臉驗證、首次入金、首次交易和首次下載應用程式任務。"),
        tr("The displayed deposit task requires at least 50 USDT; the first trade task at least 30 USDT.", "页面入金任务要求至少 50 USDT，首笔交易任务要求至少 30 USDT。", "頁面入金任務要求至少 50 USDT，首筆交易任務要求至少 30 USDT。"),
        tr("Read the account's voucher utility, claim deadline and jurisdiction before participating.", "参与前查看账户实际卡券用途、领取期限和适用地区。", "參與前查看帳戶實際卡券用途、領取期限和適用地區。"),
      ] },
    [source("gate-rewards-hub", "Gate Rewards Hub", urls.gate, "reward_terms",
      tr("All five welcome task rewards are labelled vouchers; advanced trading maximums are separate tasks.", "五项欢迎任务奖励均标为卡券，进阶交易宣传最高额属于另一组任务。", "五項歡迎任務獎勵均標為卡券，進階交易宣傳最高額屬於另一組任務。")),
    source("gate-europe-august-campaign", "Gate Europe campaign terms · 24 August 2026", urls.gateEurope, "campaign_hub",
      tr("This dated Europe campaign ends at 00:00 UTC on 7 September. The first-200 new-user deposit/trade tasks award fee-rebate vouchers, not cash; higher tiers have distinct terms.", "该欧洲活动于 9 月 7 日 00:00 UTC 截止。新用户入金与交易各限前 200 名，发放手续费返还券而非现金；更高档任务另有条件。", "該歐洲活動於 9 月 7 日 00:00 UTC 截止。新用戶入金與交易各限前 200 名，發放手續費返還券而非現金；更高檔任務另有條件。"),
      { publishedAt: "2026-08-24T08:06:00Z", startAt: "2026-08-24T09:00:00Z", endAt: "2026-09-07T00:00:00Z", timeZone: "UTC" })],
    [tr("The dated Gate Europe campaign must not be presented as ongoing after its end time; it is not a global Gate offer.", "到达截止时间后，不得继续将该 Gate Europe 活动标为进行中，也不能作为全球 Gate 优惠展示。", "到達截止時間後，不得繼續將該 Gate Europe 活動標為進行中，也不能作為全球 Gate 優惠展示。")]),

  kucoin: record("kucoin",
    tr("KuCoin's hub separates coupon rewards, crypto rewards and futures trial funds; withdrawal can require an additional threshold.", "KuCoin 福利中心区分卡券、加密资产奖励与合约体验金，提取奖励还可能有额外门槛。", "KuCoin 福利中心區分卡券、加密資產獎勵與合約體驗金，提領獎勵還可能有額外門檻。"),
    { status: "ACCOUNT_CONFIRMATION", kind: "crypto_and_coupons", sourceUrls: [urls.kucoin],
      summary: tr("The FAQ advertises an aggregate up to 3,200 USDT in USDT and coupons; some task rewards are random and withdrawal is conditional.", "FAQ 宣传 USDT 与卡券合计最高 3,200 USDT，部分任务随机发奖，提取奖励另有条件。", "FAQ 宣傳 USDT 與卡券合計最高 3,200 USDT，部分任務隨機發獎，提領獎勵另有條件。"),
      conditions: [
        tr("Complete the relevant new-user tasks within 30 days of registration; participation is once per user.", "相关新客任务需在注册后三十天内完成，每位用户只能参加一次。", "相關新客任務需在註冊後三十天內完成，每位用戶只能參加一次。"),
        tr("Verify whether the selected task needs identity checks, a first purchase/deposit or a specific trade.", "查看所选任务是否需要身份验证、首次购买或入金，以及指定交易。", "查看所選任務是否需要身分驗證、首次購買或入金，以及指定交易。"),
        tr("Check the reward withdrawal threshold, claim deadline and coupon expiry rather than relying on the headline maximum.", "核对奖励提取门槛、领取期限与卡券有效期，不仅看宣传最高额。", "核對獎勵提領門檻、領取期限與卡券有效期，不僅看宣傳最高額。"),
      ] },
    [source("kucoin-rewards-faq", "KuCoin Rewards Hub FAQ", urls.kucoin, "reward_terms",
      tr("The help page describes distinct reward balances and a separate registration/completion/claim requirement for limited-time futures tasks.", "帮助页分别说明不同奖励余额；限时合约任务要求报名、完成任务和领取均在期限内。", "說明頁分別說明不同獎勵餘額；限時合約任務要求報名、完成任務和領取均在期限內。"))]),

  mexc: record("mexc",
    tr("MEXC futures welcome tasks use net-deposit, holding and fee-paying-volume conditions; older campaign pages do not prove a current offer.", "MEXC 合约欢迎任务涉及净入金、持有期和付费交易量，旧活动页面不能证明当前仍有同一优惠。", "MEXC 合約歡迎任務涉及淨入金、持有期和付費交易量，舊活動頁面不能證明目前仍有同一優惠。"),
    { status: "ACCOUNT_CONFIRMATION", kind: "futures_bonus", sourceUrls: [urls.mexc],
      summary: tr("The August 2025 announcement is historical program guidance, not a verified current 10,000 USDT cash offer.", "2025 年 8 月公告只作为历史计划说明，不作为已核实的当前 10,000 USDT 现金优惠。", "2025 年 8 月公告只作為歷史計畫說明，不作為已核實的目前 10,000 USDT 現金優惠。"),
      conditions: [
        tr("Some tasks require advanced identity verification; confirm the account's current task.", "部分任务要求高级身份验证，需核对账户当前任务。", "部分任務要求進階身分驗證，需核對帳戶目前任務。"),
        tr("The guide counts on-chain/P2P deposits, not internal transfers, and requires maintaining the task's minimum net balance.", "该指南计入链上与 P2P 入金、不计内部划转，并要求在任务持有期内维持最低净余额。", "該指南計入鏈上與 P2P 入金、不計內部劃轉，並要求在任務持有期內維持最低淨餘額。"),
        tr("Confirm fee-paying futures-volume rules and whether moving funds would forfeit a bonus.", "核对付费合约交易量规则，以及转出资金是否会使赠金失效。", "核對付費合約交易量規則，以及轉出資金是否會使贈金失效。"),
      ] },
    [source("mexc-welcome-guide", "MEXC welcome-program announcement · August 2025", urls.mexc, "reward_terms",
      tr("Historical headline maximum; no current account-specific entitlement verified.", "历史宣传最高额，未核实当前账户实际奖励资格。", "歷史宣傳最高額，未核實目前帳戶實際獎勵資格。")),
    source("mexc-tradingpapa-ended", "MEXC TradingPapa8 · ended campaign", urls.mexcEnded, "campaign_hub",
      tr("The page explicitly says Event Ended and shows 20 August–2 September 2026. Its timezone is not stated; no UTC deadline is inferred.", "页面明确显示活动已结束，日期为 2026 年 8 月 20 日至 9 月 2 日；未标时区，因此不推算 UTC 截止时间。", "頁面明確顯示活動已結束，日期為 2026 年 8 月 20 日至 9 月 2 日；未標時區，因此不推算 UTC 截止時間。"),
      { observedStatus: "ENDED" })],
    [tr("TradingPapa8 is historical and ended. Its channel-bound futures bonuses must not appear as a currently claimable signup gift.", "TradingPapa8 已结束，其指定渠道的合约赠金不得展示为当前可领取的注册礼。", "TradingPapa8 已結束，其指定管道的合約贈金不得展示為目前可領取的註冊禮。")]),

  backpack: record("backpack",
    tr("Backpack's referral document describes a commission paid to the inviter, not a verified cash payment to a new user.", "Backpack 邀请文档描述的是邀请人佣金，不是已核实的新用户现金奖励。", "Backpack 邀請文件描述的是邀請人佣金，不是已核實的新用戶現金獎勵。"),
    { status: "UNCONFIRMED", kind: "referrer_commission", sourceUrls: [urls.backpack],
      summary: tr("The source describes a 10% inviter fee share after the referred user completes KYC. No invitee cash amount was verified from this document.", "来源描述好友完成 KYC 后，邀请人可分得 10% 交易手续费；该文档未核实受邀人的现金奖励金额。", "來源描述好友完成 KYC 後，邀請人可分得 10% 交易手續費；該文件未核實受邀人的現金獎勵金額。"),
      conditions: [
        tr("Add a referral code before completing KYC; the document disallows adding one retroactively after KYC.", "邀请码需在完成 KYC 前添加，文档不支持 KYC 后补填。", "邀請碼需在完成 KYC 前加入，文件不支援 KYC 後補填。"),
        tr("Keep inviter commission separate from any benefit actually offered to the invitee.", "将邀请人佣金与受邀人实际优惠分开说明。", "將邀請人佣金與受邀人實際優惠分開說明。"),
        tr("Review product exclusions and claim terms; equity-perpetual fees are excluded in this source.", "核对产品排除项和领取条款；来源排除了股票永续相关手续费。", "核對產品排除項和領取條款；來源排除了股票永續相關手續費。"),
      ] },
    [source("backpack-referrals", "Backpack Exchange referral program", urls.backpack, "reward_terms",
      tr("Read from the official support Markdown export after the web reader rejected its content type. Inviter benefits are not re-labelled as invitee rewards.", "网页读取器不支持内容类型后，已读取官方支持站的 Markdown 导出；不会把邀请人利益改写为受邀人奖励。", "網頁讀取器不支援內容類型後，已讀取官方支援站的 Markdown 匯出；不會把邀請人利益改寫為受邀人獎勵。"))]),

  deribit: record("deribit",
    tr("Deribit's published affiliate benefit is a time-limited fee discount; the program also has a documented migration schedule.", "Deribit 公开邀请利益属于限期手续费折扣，该计划还列有迁移时间表。", "Deribit 公開邀請利益屬於限期手續費折扣，該計畫還列有遷移時間表。"),
    { status: "PUBLIC_TERMS", kind: "fee_discount", amount: "10%", sourceUrls: [urls.deribit],
      summary: tr("Eligible new users of the covered entity receive a 10% trading-fee discount for six months through a valid affiliate link; spot is excluded.", "适用实体的合资格新用户通过有效邀请链接，可在六个月内享 10% 交易手续费折扣，现货不适用。", "適用實體的合資格新用戶透過有效邀請連結，可在六個月內享 10% 交易手續費折扣，現貨不適用。"),
      conditions: [
        tr("Confirm the account is under DRB Panama, not Deribit FZE, and that the user's region is eligible.", "确认账户属于 DRB Panama 而非 Deribit FZE，并核对用户地区资格。", "確認帳戶屬於 DRB Panama 而非 Deribit FZE，並核對用戶地區資格。"),
        tr("The discount covers the first six months and excludes spot trading; it is not a cash bonus.", "折扣限前六个月且排除现货交易，不是现金赠金。", "折扣限前六個月且排除現貨交易，不是現金贈金。"),
        tr("New affiliate creation stops on 9 September 2026; the document ends new-user onboarding through legacy links on 1 January 2027.", "2026 年 9 月 9 日停止创建新 affiliate；文档说明 2027 年 1 月 1 日起旧链接不再用于新用户归因开户。", "2026 年 9 月 9 日停止建立新 affiliate；文件說明 2027 年 1 月 1 日起舊連結不再用於新用戶歸因開戶。"),
      ] },
    [source("deribit-affiliate-migration", "Deribit Affiliate Program and migration notice", urls.deribit, "reward_terms",
      tr("Updated 7 August 2026. Migration dates are stated without a timezone; no precise UTC cutoff is invented.", "更新于 2026 年 8 月 7 日。迁移日期未标时区，不虚构精确 UTC 截止时刻。", "更新於 2026 年 8 月 7 日。遷移日期未標時區，不虛構精確 UTC 截止時刻。"))],
    [tr("Before enabling any commercial link, recheck the migration and account entity. A readable old affiliate page is not proof of perpetual attribution.", "启用任何商业链接前须再次核对迁移与账户实体；旧邀请页仍可打开，不代表归因永久有效。", "啟用任何商業連結前須再次核對遷移與帳戶實體；舊邀請頁仍可開啟，不代表歸因永久有效。")]),

  uniswap: record("uniswap",
    tr("Uniswap v4 can host permissioned pools: issuer allowlists can apply to swaps and liquidity separately, unlike unrestricted pools.", "Uniswap v4 可承载许可型池：发行方能分别控制交易与提供流动性的白名单，并非所有池都无条件开放。", "Uniswap v4 可承載許可型池：發行方能分別控制交易與提供流動性的白名單，並非所有池都無條件開放。"),
    { status: "NOT_APPLICABLE", kind: "pool_specific_access", sourceUrls: [urls.uniswap],
      summary: tr("This is a pool-access product notice, not a centralized-exchange signup reward.", "这是流动性池准入机制的产品说明，不是中心化交易所式注册奖励。", "這是流動性池准入機制的產品說明，不是中心化交易所式註冊獎勵。"),
      conditions: [
        tr("Identify whether the specific pool uses permissioned access.", "先识别目标池是否采用许可准入。", "先識別目標池是否採用許可准入。"),
        tr("Check the issuer's wallet eligibility separately for swapping and liquidity provision.", "分别核对发行方对交易和提供流动性的钱包资格要求。", "分別核對發行方對交易和提供流動性的錢包資格要求。"),
        tr("Review issuer controls and the risk that permission can be paused or withdrawn.", "查看发行方控制权限，以及许可可能暂停或撤回的风险。", "查看發行方控制權限，以及許可可能暫停或撤回的風險。"),
      ] },
    [source("uniswap-v4-permissioned", "How permissioned pools work on Uniswap v4", urls.uniswap, "protocol_docs",
      tr("Official product article dated 24 August 2026. Permissioned-pool features do not describe every Uniswap pool.", "官方产品文章日期为 2026 年 8 月 24 日，许可型池的特征不代表所有 Uniswap 池。", "官方產品文章日期為 2026 年 8 月 24 日，許可型池的特徵不代表所有 Uniswap 池。"))]),

  pancakeswap: record("pancakeswap",
    tr("The reviewed PancakeSwap event is a wallet trading competition with random winners, not a guaranteed account-opening reward.", "本次读到的 PancakeSwap 活动是钱包交易竞赛，采用抽奖，不是保证领取的开户奖励。", "本次讀到的 PancakeSwap 活動是錢包交易競賽，採用抽獎，不是保證領取的開戶獎勵。"),
    { status: "NOT_APPLICABLE", kind: "trading_raffle", sourceUrls: [urls.pancake],
      summary: tr("The TMX competition has a stated pool of 833,333 TMX and ends 9 September at noon SGT. The pool is not a per-person prize, and unresolved TBD wording remains in the rules.", "TMX 竞赛标示总奖池 833,333 TMX，于 9 月 9 日新加坡时间中午截止。总奖池不是人均奖额，且规则仍有未填妥的 TBD 文案。", "TMX 競賽標示總獎池 833,333 TMX，於 9 月 9 日新加坡時間中午截止。總獎池不是人均獎額，且規則仍有未填妥的 TBD 文案。"),
      conditions: [
        tr("The entry tier requires at least $500 of eligible TMX volume on BNB Chain through PancakeSwap web or mobile.", "入门档要求通过 PancakeSwap 网页或移动端，在 BNB Chain 完成至少 $500 的合资格 TMX 交易量。", "入門檔要求透過 PancakeSwap 網頁或行動端，在 BNB Chain 完成至少 $500 的合資格 TMX 交易量。"),
        tr("External-aggregator volume is excluded; one wallet can win only one prize and selection is random.", "外部聚合器交易量不计入；每个钱包最多获得一份奖品，获奖者随机选出。", "外部聚合器交易量不計入；每個錢包最多獲得一份獎品，得獎者隨機選出。"),
        tr("The source retains TBD placeholders in asset-related clauses. Resolve those terms before treating the event as participation-ready.", "来源在资产相关条款中仍保留 TBD 占位符；这些条款澄清前，不将活动视为可直接推荐参与。", "來源在資產相關條款中仍保留 TBD 佔位符；這些條款澄清前，不將活動視為可直接推薦參與。"),
      ], startAt: "2026-08-26T04:00:00Z", endAt: "2026-09-09T04:00:00Z", timeZone: "Asia/Singapore" },
    [source("pancakeswap-tmx-competition", "PancakeSwap TMX trading competition", urls.pancake, "campaign_hub",
      tr("Dated official contest rules, with explicit Singapore time and incomplete TBD wording. This snapshot is research, not an approved live offer.", "官方竞赛规则列有新加坡时区，但包含不完整 TBD 文案；此快照属于研究，不是已审核上线优惠。", "官方競賽規則列有新加坡時區，但包含不完整 TBD 文案；此快照屬於研究，不是已審核上線優惠。"),
      { startAt: "2026-08-26T04:00:00Z", endAt: "2026-09-09T04:00:00Z", timeZone: "Asia/Singapore" })]),

  jupiter: record("jupiter",
    tr("The official support index was reachable, but this pass did not establish current Jupiter reward or listing terms.", "官方支持目录可访问，但本轮未核实 Jupiter 当前奖励或上币条款。", "官方支援目錄可存取，但本輪未核實 Jupiter 目前獎勵或上幣條款。"),
    { status: "UNCONFIRMED", summary: tr("No amount, deadline or eligibility was verified; this does not mean no program exists.", "未核实金额、截止时间或资格，不代表平台没有相关计划。", "未核實金額、截止時間或資格，不代表平台沒有相關計畫。") },
    [source("jupiter-support", "Jupiter Support", urls.jupiter, "protocol_docs",
      tr("Support-index content only; not evidence of a specific promotion.", "仅核实支持目录内容，不作为具体促销的证据。", "僅核實支援目錄內容，不作為具體促銷的證據。")),
    source("jupiter-updates-shell", "Jupiter Updates", "https://jup.ag/updates", "listing_hub",
      tr("The available view rendered a site shell without readable update terms.", "当前读取结果只有站点外壳，未取得可读动态条款。", "目前讀取結果只有站點外殼，未取得可讀動態條款。"), { access: "INACCESSIBLE" })]),

  raydium: record("raydium",
    tr("Raydium's documentation distinguishes AMM v4, CPMM, CLMM, farms and LaunchLab; these are separate product paths.", "Raydium 文档分别列出 AMM v4、CPMM、CLMM、农场与 LaunchLab，应按具体产品路径判断。", "Raydium 文件分別列出 AMM v4、CPMM、CLMM、農場與 LaunchLab，應按具體產品路徑判斷。"),
    { status: "UNCONFIRMED", kind: "product_specific_incentives", sourceUrls: [urls.raydium],
      summary: tr("The readable product index does not establish a current farm rate, token giveaway or new-user reward.", "可读产品目录不能证明当前农场收益率、代币赠送或新用户奖励。", "可讀產品目錄不能證明目前農場收益率、代幣贈送或新用戶獎勵。") },
    [source("raydium-docs", "Raydium documentation", urls.raydium, "protocol_docs",
      tr("Product-family navigation was readable; reward-specific rates and deadlines remain unknown.", "已读到产品分类导航，具体奖励率与期限仍未知。", "已讀到產品分類導覽，具體獎勵率與期限仍未知。"))]),

  aerodrome: record("aerodrome",
    tr("The official documentation page returned no readable body in this pass. Existing platform research is not replaced with invented campaign terms.", "本轮官方文档页面未返回可读正文，不用虚构活动条款替代已有平台研究。", "本輪官方文件頁面未傳回可讀正文，不用虛構活動條款替代已有平台研究。"),
    { status: "UNCONFIRMED", summary: tr("Reward amount, eligibility and dates are unknown from this attempt.", "本次访问未核实奖励金额、资格与日期。", "本次存取未核實獎勵金額、資格與日期。") },
    [source("aerodrome-docs-unread", "Aerodrome documentation", urls.aerodrome, "protocol_docs",
      tr("Empty readable response. Search excerpts were not promoted to verified source evidence.", "可读响应为空，未将搜索摘要提升为已核实来源证据。", "可讀回應為空，未將搜尋摘要提升為已核實來源證據。"), { access: "INACCESSIBLE" })]),

  curve: record("curve",
    tr("Curve's introduction separates swaps, liquidity and lending; LLAMMA's gradual collateral conversion does not eliminate liquidation risk.", "Curve 入门文档区分兑换、流动性与借贷；LLAMMA 的渐进抵押品转换不等于没有清算风险。", "Curve 入門文件區分兌換、流動性與借貸；LLAMMA 的漸進抵押品轉換不等於沒有清算風險。"),
    { status: "NOT_APPLICABLE", kind: "protocol_product", sourceUrls: [urls.curve],
      summary: tr("This source explains protocol products, not an account-opening cash reward.", "该来源说明协议产品，不是开户现金奖励。", "該來源說明協議產品，不是開戶現金獎勵。"),
      conditions: [
        tr("Identify whether the intended action is swapping, supplying liquidity or borrowing.", "先明确目标操作是兑换、提供流动性还是借贷。", "先明確目標操作是兌換、提供流動性還是借貸。"),
        tr("For lending, distinguish collateral conversion from an assurance against losses.", "使用借贷时，不把抵押品转换机制理解为损失保障。", "使用借貸時，不把抵押品轉換機制理解為損失保障。"),
        tr("Check the specific pool or lending-market terms; this introduction states no universal reward rate.", "核对具体池或借贷市场条款，入门文档没有给出统一奖励率。", "核對具體池或借貸市場條款，入門文件沒有給出統一獎勵率。"),
      ] },
    [source("curve-introduction", "Curve user introduction", urls.curve, "protocol_docs",
      tr("The documentation explicitly retains loss and full-liquidation risks for the lending mechanism.", "文档明确保留借贷机制中的损失与完全清算风险。", "文件明確保留借貸機制中的損失與完全清算風險。"))]),

  hyperliquid: record("hyperliquid",
    tr("A referral-document URL was checked, but a reliable readable extraction was not completed before the 3.0 freeze.", "已检查邀请文档地址，但在 3.0 冻结前未完成可靠的可读正文核实。", "已檢查邀請文件網址，但在 3.0 凍結前未完成可靠的可讀正文核實。"),
    { status: "UNCONFIRMED", summary: tr("No referral discount, points allocation or signup amount is asserted from this attempt.", "不根据本次未完成访问声称邀请折扣、积分分配或注册金额。", "不根據本次未完成存取聲稱邀請折扣、積分分配或註冊金額。") },
    [source("hyperliquid-referrals-unread", "Hyperliquid referral documentation", urls.hyperliquid, "reward_terms",
      tr("The web reader rejected the content type; a subsequent HTML response was not reliably extracted. Terms remain unverified.", "网页读取器不支持该内容类型，后续 HTML 响应未完成可靠提取，条款仍未核实。", "網頁讀取器不支援該內容類型，後續 HTML 回應未完成可靠擷取，條款仍未核實。"), { access: "INACCESSIBLE" })]),

  dydx: record("dydx",
    tr("The readable dYdX developer index separates wallet setup, trading and integration interfaces; it is not a reward announcement.", "可读的 dYdX 开发者目录区分钱包设置、交易与集成接口，不属于奖励公告。", "可讀的 dYdX 開發者目錄區分錢包設定、交易與整合介面，不屬於獎勵公告。"),
    { status: "UNCONFIRMED", sourceUrls: [urls.dydx],
      summary: tr("No current referral rate, campaign window or new-user payout was verified in this limited pass.", "本轮有限检查未核实当前邀请比例、活动期限或新用户到账奖励。", "本輪有限檢查未核實目前邀請比例、活動期限或新用戶到帳獎勵。") },
    [source("dydx-docs-index", "dYdX documentation", urls.dydx, "protocol_docs",
      tr("Documentation index only. Product navigation should not be mistaken for a token-listing or giveaway notice.", "仅为文档目录，产品导航不能被当作上币或赠送代币公告。", "僅為文件目錄，產品導覽不能被當作上幣或贈送代幣公告。"))]),

  gmx: record("gmx",
    tr("GMX v2 referral benefits reduce qualifying opening/closing fees at execution; they do not reduce every cost or create cash rewards.", "GMX v2 邀请利益在成交时减免合资格开平仓费用，不涵盖所有成本，也不产生现金注册礼。", "GMX v2 邀請利益在成交時減免合資格開平倉費用，不涵蓋所有成本，也不產生現金註冊禮。"),
    { status: "PUBLIC_TERMS", kind: "fee_discount", amount: "5%–10%", sourceUrls: [urls.gmx],
      summary: tr("The documented trader discount is 5% at tier 1 and 10% at tiers 2–3. Borrowing and funding fees are excluded; governance may change the rules.", "文档交易者折扣为一级 5%、二至三级 10%，不减免借款费和资金费，治理可能调整规则。", "文件交易者折扣為一級 5%、二至三級 10%，不減免借款費和資金費，治理可能調整規則。"),
      conditions: [
        tr("For v2, use a valid case-sensitive code; it is saved on-chain with the first qualifying order.", "v2 需使用区分大小写的有效代码，首个合资格订单会将其写入链上。", "v2 需使用區分大小寫的有效代碼，首個合資格訂單會將其寫入鏈上。"),
        tr("Confirm the code's tier and keep position fees separate from borrowing and funding costs.", "确认代码等级，并将开平仓费用与借款费、资金费分开计算。", "確認代碼等級，並將開平倉費用與借款費、資金費分開計算。"),
        tr("Do not apply old v1 rebate or ended esGMX bonus terms to new v2 orders.", "不要将旧 v1 返佣或已结束的 esGMX 赠送条款套用于新的 v2 订单。", "不要將舊 v1 返佣或已結束的 esGMX 贈送條款套用於新的 v2 訂單。"),
      ] },
    [source("gmx-referrals-v2", "GMX referral documentation", urls.gmx, "reward_terms",
      tr("The page distinguishes v2 execution-time discounts from inactive v1 rewards; additional esGMX bonuses ended on 4 February 2026.", "页面区分 v2 成交时折扣与不再发放的 v1 奖励，额外 esGMX 赠送于 2026 年 2 月 4 日结束。", "頁面區分 v2 成交時折扣與不再發放的 v1 獎勵，額外 esGMX 贈送於 2026 年 2 月 4 日結束。"))]),

  drift: record("drift",
    tr("The reviewed Drift notice discusses recovery of outstanding user losses and a protocol reboot. It does not verify normal current trading or deposit availability.", "本次读取的 Drift 公告讨论用户未补偿损失的恢复与协议重启，不能据此证明当前交易或充值正常可用。", "本次讀取的 Drift 公告討論用戶未補償損失的恢復與協議重啟，不能據此證明目前交易或儲值正常可用。"),
    { status: "UNCONFIRMED", summary: tr("Current service access and reward eligibility require fresh official confirmation. Old referral or points posts are not evidence of an active offer.", "当前服务可用性与奖励资格需重新通过官方确认，旧邀请或积分文章不能证明活动仍有效。", "目前服務可用性與獎勵資格需重新透過官方確認，舊邀請或積分文章不能證明活動仍有效。"),
      sourceUrls: [urls.drift],
      conditions: [
        tr("Read current recovery and service notices before considering a deposit.", "考虑充值前先查看最新恢复与服务公告。", "考慮儲值前先查看最新恢復與服務公告。"),
        tr("Do not infer a relaunch date from a recovery roadmap without an explicit official date.", "官方未明确日期时，不从恢复路线图推断重启时间。", "官方未明確日期時，不從恢復路線圖推斷重啟時間。"),
        tr("Reconfirm the official application and documentation destination; the documentation URL redirected during this check.", "重新确认官方应用与文档目标域名，本次检查发现文档地址发生重定向。", "重新確認官方應用程式與文件目標網域，本次檢查發現文件網址發生重新導向。"),
      ] },
    [source("drift-recovery-june", "Drift Recovery Update · June 2026", urls.drift, "protocol_docs",
      tr("The article title says 3 June and the page date says 4 June 2026. It discusses recovery and a reboot but provides no launch date.", "文章标题为 6 月 3 日更新，页面日期为 2026 年 6 月 4 日；内容讨论恢复与重启，但未给出上线日期。", "文章標題為 6 月 3 日更新，頁面日期為 2026 年 6 月 4 日；內容討論恢復與重啟，但未給出上線日期。")),
    source("drift-docs-redirect", "Drift documentation redirect observation", "https://docs.drift.trade/", "protocol_docs",
      tr("The URL redirected to docs.velocity.exchange/protocol. The redirect alone does not establish a rebrand or equivalent user protections.", "地址重定向至 docs.velocity.exchange/protocol；仅凭重定向不能确认品牌更名或同等用户保障。", "網址重新導向至 docs.velocity.exchange/protocol；僅憑重新導向不能確認品牌更名或同等用戶保障。"))],
    [tr("Material service-status caution: do not label Drift as normally available or promote a deposit based solely on the reviewed historical recovery notice.", "重要服务状态提醒：不能仅根据已读历史恢复公告，将 Drift 标为正常可用或推荐用户充值。", "重要服務狀態提醒：不能僅根據已讀歷史恢復公告，將 Drift 標為正常可用或推薦用戶儲值。")]),
};

// Resumed research: bounded direct-page checks, no change to approval gates.
const refreshedAt = OFFICIAL_CAMPAIGN_RESEARCH_REFRESHED_AT;
const refreshedSource = (...args) => ({ ...source(...args), checkedAt: refreshedAt });
const hyperliquidMarkdown = "https://hyperliquid.gitbook.io/hyperliquid-docs/referrals.md";
officialCampaignResearchByVenue.hyperliquid = record("hyperliquid",
  tr("Hyperliquid documents a volume-limited trading-fee discount for referred users, separate from inviter commission.", "Hyperliquid 文档明确了受邀用户的限成交量手续费折扣，应与邀请人佣金分开看。", "Hyperliquid 文件明確了受邀用戶的限成交量手續費折扣，應與邀請人佣金分開看。"),
  { status: "PUBLIC_TERMS", kind: "fee_discount", amount: "4%", sourceUrls: [hyperliquidMarkdown],
    summary: tr("The documented discount is 4% on fees for the first $25 million of volume; vaults and sub-accounts are excluded. This is not a cash signup reward.", "文档折扣为首 2,500 万美元成交量的手续费减免 4%，金库与子账户不适用，不是注册现金奖励。", "文件折扣為首 2,500 萬美元成交量的手續費減免 4%，金庫與子帳戶不適用，不是註冊現金獎勵。"),
    conditions: [
      tr("A valid referral code or link must be applied. This research panel does not include referral codes; the sign-up cards on this site do.", "需绑定有效邀请代码或链接。本研究面板不附邀请码；本站的开户卡片会附带邀请码。", "需綁定有效邀請代碼或連結。本研究面板不附邀請碼；本站的開戶卡片會附帶邀請碼。"),
      tr("The fee discount stops after the referred account's first $25 million in volume; vaults and sub-accounts do not inherit it.", "受邀账户首 2,500 万美元成交量之后不再适用；金库与子账户不会继承此折扣。", "受邀帳戶首 2,500 萬美元成交量之後不再適用；金庫與子帳戶不會繼承此折扣。"),
      tr("The inviter's $10,000 volume requirement and fee share are separate from the referred user's benefit. Region and identity requirements are not specified on this page.", "邀请人创建代码所需的 1 万美元交易量及其手续费分成，与受邀人权益不同；本页未说明地区与身份要求。", "邀請人建立代碼所需的 1 萬美元交易量及其手續費分成，與受邀人權益不同；本頁未說明地區與身分要求。"),
    ] },
  [refreshedSource("hyperliquid-referrals-markdown", "Hyperliquid referral documentation · official Markdown", hyperliquidMarkdown, "reward_terms",
    tr("The official Markdown export resolved the earlier reader error. Discounts are limited by volume; the page gives no publication date or campaign end date.", "官方 Markdown 导出解决了此前读取错误。折扣受成交量限制，页面未提供发布日期或活动结束日期。", "官方 Markdown 匯出解決了此前讀取錯誤。折扣受成交量限制，頁面未提供發布日期或活動結束日期。"), { access: "READ", retrievalMethod: "OFFICIAL_MARKDOWN" })]);
officialCampaignResearchByVenue.hyperliquid.checkedAt = refreshedAt;

const supplementalSources = {
  binance: [refreshedSource("binance-monitoring-september", "Binance UK · Monitoring Tag update", "https://www.binance.com/en-GB/support/announcement/binance-will-extend-the-monitoring-tag-to-include-ava-gns-scr-towns-on-2026-09-04-59c847eea19149369c3bf4b01edfa6df", "listing_hub",
    tr("The 4 September notice adds AVA, GNS, SCR and TOWNS to Monitoring Tags, identifying possible delisting risk. The UK page warns that some named tokens may not be available there; this is a monitoring notice, not a new listing or reward.", "9 月 4 日公告将 AVA、GNS、SCR、TOWNS 纳入监控标签，提示潜在下架风险。英国页面说明部分代币在当地可能不可用；这是监控通知，不是上币或奖励。", "9 月 4 日公告將 AVA、GNS、SCR、TOWNS 納入監控標籤，提示潛在下架風險。英國頁面說明部分代幣在當地可能不可用；這是監控通知，不是上幣或獎勵。"),
    { publishedDate: "2026-09-04 08:00", datePrecision: "LOCAL_DATETIME_WITHOUT_ZONE", regions: ["UK"], observedStatus: "ANNOUNCED", contentKind: "listing_monitoring", retrievalMethod: "OFFICIAL_PAGE" })],
  bybit: [refreshedSource("bybit-cpusdt-september", "Bybit · CPUSDT perpetual announcement", "https://announcements.bybit.com/en/article/new-listing-cpusdt-perpetual-contract-in-innovation-zone-with-up-to-20x-leverage--arta2f11bae44af/", "listing_hub",
    tr("The 4 September notice describes CPUSDT perpetuals in the Innovation Zone, settled in USDT with four-hour funding. Innovation Zone fees are higher; listing parameters can change. It does not establish spot availability or personal eligibility.", "9 月 4 日公告描述创新区 CPUSDT 永续合约，以 USDT 结算、每四小时收取资金费。创新区交易费更高，参数可调整；不证明现货上线或个人参与资格。", "9 月 4 日公告描述創新區 CPUSDT 永續合約，以 USDT 結算、每四小時收取資金費。創新區交易費更高，參數可調整；不證明現貨上線或個人參與資格。"),
    { publishedDate: "2026-09-04", datePrecision: "DATE_ONLY", observedStatus: "ANNOUNCED", contentKind: "perpetual_listing", retrievalMethod: "OFFICIAL_PAGE" })],
  bitget: [refreshedSource("bitget-hajimi-september", "Bitget · 哈基米USDT futures announcement", "https://www.bitget.com/support/articles/12560603894295", "listing_hub",
    tr("The notice names 哈基米USDT futures and bots on 6 September 2026 (UTC+8), with 3x maximum leverage and four-hour funding. It gives no precise launch clock time; parameters may change. This is a derivative announcement, not a spot-token reward.", "公告说明 2026 年 9 月 6 日（UTC+8）上线哈基米USDT 合约与机器人，最高杠杆 3 倍、每四小时结算资金费。未列精确上线时刻，参数可调整；这是衍生品公告，不是现货代币奖励。", "公告說明 2026 年 9 月 6 日（UTC+8）上線哈基米USDT 合約與機器人，最高槓桿 3 倍、每四小時結算資金費。未列精確上線時刻，參數可調整；這是衍生品公告，不是現貨代幣獎勵。"),
    { publishedDate: "2026-09-06 12:49", eventDate: "2026-09-06", timeZone: "UTC+08:00", datePrecision: "EVENT_DATE_WITH_ZONE_PUBLICATION_ZONE_UNKNOWN", observedStatus: "ANNOUNCED", contentKind: "perpetual_listing", retrievalMethod: "OFFICIAL_PAGE" })],
  okx: [refreshedSource("okx-fet-september", "OKX · FET perpetual listing schedule", "https://www.okx.com/help/okx-to-list-perpetual-futures-for-fet-crypto", "listing_hub",
    tr("The announcement schedules FET/USDT perpetuals for 5 September 2026 at 03:30 UTC on web, app and API. It asks users to confirm regional availability in the app. A published schedule does not prove a current account can trade.", "公告安排 FET/USDT 永续于 2026 年 9 月 5 日 03:30 UTC 在网页、应用与 API 上线，并要求在应用内确认地区支持。发布的时间表不能证明当前账户可以交易。", "公告安排 FET/USDT 永續於 2026 年 9 月 5 日 03:30 UTC 在網頁、應用程式與 API 上線，並要求在應用程式內確認地區支援。發布的時間表不能證明目前帳戶可以交易。"),
    { publishedDate: "2026-09-05", startAt: "2026-09-05T03:30:00Z", timeZone: "UTC", datePrecision: "EVENT_INSTANT_PUBLICATION_DATE_ONLY", observedStatus: "ANNOUNCED", contentKind: "perpetual_listing", retrievalMethod: "OFFICIAL_PAGE" })],
  kucoin: [refreshedSource("kucoin-marscoin-september", "KuCoin · MARSCOIN spot listing schedule", "https://www.kucoin.com/announcement/en-marscoin-marscoin-listed-on-kucoin", "listing_hub",
    tr("The MARSCOIN/USDT spot notice specifies BSC-BEP20 deposits, a 5 September 06:00–07:00 UTC auction, 07:00 UTC trading and 6 September 10:00 UTC withdrawals. The displayed publication clock has no timezone. This is not a verified giveaway or service-status test.", "MARSCOIN/USDT 现货公告列出 BSC-BEP20 入金、9 月 5 日 06:00–07:00 UTC 集合竞价、07:00 UTC 交易及 9 月 6 日 10:00 UTC 提币。页面发布时钟未标时区，不作为赠币或实时服务可用性证明。", "MARSCOIN/USDT 現貨公告列出 BSC-BEP20 入金、9 月 5 日 06:00–07:00 UTC 集合競價、07:00 UTC 交易及 9 月 6 日 10:00 UTC 提幣。頁面發布時鐘未標時區，不作為贈幣或即時服務可用性證明。"),
    { publishedDate: "2026-09-05 09:57:00", startAt: "2026-09-05T07:00:00Z", withdrawalAt: "2026-09-06T10:00:00Z", timeZone: "UTC", datePrecision: "EVENT_INSTANT_PUBLICATION_ZONE_UNKNOWN", observedStatus: "ANNOUNCED", contentKind: "spot_listing", retrievalMethod: "OFFICIAL_PAGE" })],
  mexc: [refreshedSource("mexc-pair-september", "MEXC · PAIRUSDT Innovation Zone schedule", "https://www.mexc.com/announcements/article/mexc-to-list-pairusdt-futures-in-innovation-zone-on-sep-6-2026-15-17827791538274", "listing_hub",
    tr("PAIRUSDT futures are scheduled for 6 September 2026 at 15:30 UTC. The notice specifies higher Innovation Zone fees (0.04% maker, 0.10% taker), regional restrictions and no API trading. Its generic welcome-reward banner contains no qualifying terms and is not treated as reward evidence.", "PAIRUSDT 合约时间表为 2026 年 9 月 6 日 15:30 UTC。公告说明创新区费率更高（挂单 0.04%、吃单 0.10%）、有地区限制且不支持 API 交易。通用新客奖励横幅未含资格条款，不作为奖励证据。", "PAIRUSDT 合約時間表為 2026 年 9 月 6 日 15:30 UTC。公告說明創新區費率更高（掛單 0.04%、吃單 0.10%）、有地區限制且不支援 API 交易。通用新客獎勵橫幅未含資格條款，不作為獎勵證據。"),
    { publishedDate: null, startAt: "2026-09-06T15:30:00Z", timeZone: "UTC", datePrecision: "EVENT_INSTANT_PUBLICATION_RELATIVE_ONLY", observedStatus: "ANNOUNCED", contentKind: "perpetual_listing", retrievalMethod: "OFFICIAL_PAGE" })],
  dydx: [refreshedSource("dydx-surge-june", "dYdX · Surge Season 15 June notice", "https://www.dydx.xyz/blog/dydx-surge-season-15-continues-through-june", "campaign_hub",
    tr("The 1 June notice covers June incentives: BTC/BONK trading-fee discounts and partial liquidation rebates on eligible non-BTC markets. Gas, bridging, slippage and third-party costs remain. It establishes no September renewal, so the reviewed June period is historical.", "6 月 1 日公告只覆盖 6 月激励：BTC/BONK 交易费优惠及合资格非 BTC 市场的部分清算返还。Gas、跨链、滑点和第三方成本仍存在；未证明 9 月续期，本次所读 6 月周期已属历史。", "6 月 1 日公告只涵蓋 6 月激勵：BTC/BONK 交易費優惠及合資格非 BTC 市場的部分清算返還。Gas、跨鏈、滑點和第三方成本仍存在；未證明 9 月續期，本次所讀 6 月週期已屬歷史。"),
    { publishedDate: "2026-06-01", datePrecision: "MONTH_SCOPE_NO_EXACT_CUTOFF", observedStatus: "ENDED", contentKind: "historical_campaign", retrievalMethod: "OFFICIAL_PAGE" }),
    refreshedSource("dydx-arcus-july", "dYdX · A New Arc product notice", "https://www.dydx.xyz/blog/a-new-arc", "protocol_docs",
    tr("The July update distinguishes the new Arcus product from dYdX v4 and says v4 continues to be supported. A possible future token allocation is mentioned without a claim amount or date. Neither this notice nor a historical campaign proves a current signup reward.", "7 月更新区分新产品 Arcus 与 dYdX v4，并表示继续支持 v4。文中提及潜在未来代币分配，但没有领取金额或日期；该公告与历史活动都不能证明当前注册奖励。", "7 月更新區分新產品 Arcus 與 dYdX v4，並表示繼續支援 v4。文中提及潛在未來代幣分配，但沒有領取金額或日期；該公告與歷史活動都不能證明目前註冊獎勵。"),
    { publishedDate: "2026-06-30", updatedDate: "2026-07-01", datePrecision: "DATE_ONLY", observedStatus: "ANNOUNCED", contentKind: "product_update", retrievalMethod: "OFFICIAL_PAGE" })],
};
for (const [slug, sources] of Object.entries(supplementalSources)) {
  officialCampaignResearchByVenue[slug].sources.push(...sources);
  // Means the record was extended; each individual source retains its own time.
  officialCampaignResearchByVenue[slug].checkedAt = refreshedAt;
}
officialCampaignResearchByVenue.dydx.summary = tr("The reviewed dYdX incentive notice covers June, while a later product update distinguishes Arcus from dYdX v4. Neither establishes a current signup payout.", "已读 dYdX 激励公告覆盖 6 月，后续产品更新区分 Arcus 与 dYdX v4；两者都不能证明当前注册到账奖励。", "已讀 dYdX 激勵公告涵蓋 6 月，後續產品更新區分 Arcus 與 dYdX v4；兩者都不能證明目前註冊到帳獎勵。");
officialCampaignResearchByVenue.dydx.signupReward.summary = tr("The June campaign is historical. No September renewal, current referral benefit or personal eligibility was established in the reviewed sources.", "6 月活动已属历史；本次来源没有证明 9 月续期、当前邀请优惠或个人参与资格。", "6 月活動已屬歷史；本次來源沒有證明 9 月續期、目前邀請優惠或個人參與資格。");

// These six earlier sources were directly reopened, with the same conclusions.
const recheckedSourceIds = new Set(["gate-rewards-hub", "gate-europe-august-campaign", "kraken-pro-referrals", "kucoin-rewards-faq", "pancakeswap-tmx-competition", "deribit-affiliate-migration"]);
for (const item of Object.values(officialCampaignResearchByVenue)) {
  for (const itemSource of item.sources) {
    if (recheckedSourceIds.has(itemSource.id)) itemSource.checkedAt = refreshedAt;
  }
}

// Structured participation checkpoints. Null means the reviewed source does not
// establish the field; it does not mean unrestricted access or no requirement.
const conditionAt = (slug, index) => officialCampaignResearchByVenue[slug].signupReward.conditions[index] ?? null;
const requirementMap = {
  binance: { eligibility: conditionAt("binance", 0), limitations: conditionAt("binance", 1) },
  coinbase: { eligibility: conditionAt("coinbase", 0), deposit: conditionAt("coinbase", 1), trading: conditionAt("coinbase", 1), limitations: conditionAt("coinbase", 2) },
  bybit: { kyc: conditionAt("bybit", 0), eligibility: conditionAt("bybit", 1), limitations: conditionAt("bybit", 2) },
  bitget: { eligibility: conditionAt("bitget", 0), deposit: conditionAt("bitget", 0), trading: conditionAt("bitget", 0), limitations: conditionAt("bitget", 1), maximumConditions: officialCampaignResearchByVenue.bitget.signupReward.summary },
  okx: { regions: tr("EEA offer only; country and account eligibility must still be confirmed.", "仅为 EEA 优惠，仍需确认国家与账户资格。", "僅為 EEA 優惠，仍需確認國家與帳戶資格。"), eligibility: conditionAt("okx", 0), kyc: conditionAt("okx", 0), deposit: conditionAt("okx", 1), trading: conditionAt("okx", 1), limitations: conditionAt("okx", 2) },
  kraken: { regions: conditionAt("kraken", 2), eligibility: conditionAt("kraken", 0), kyc: conditionAt("kraken", 0), deposit: conditionAt("kraken", 1), trading: conditionAt("kraken", 1), limitations: officialCampaignResearchByVenue.kraken.signupReward.summary },
  "gate-io": { eligibility: conditionAt("gate-io", 0), kyc: conditionAt("gate-io", 0), deposit: conditionAt("gate-io", 1), trading: conditionAt("gate-io", 1), limitations: conditionAt("gate-io", 2), maximumConditions: officialCampaignResearchByVenue["gate-io"].signupReward.summary },
  kucoin: { eligibility: conditionAt("kucoin", 0), kyc: conditionAt("kucoin", 1), deposit: conditionAt("kucoin", 1), trading: conditionAt("kucoin", 1), maximumConditions: officialCampaignResearchByVenue.kucoin.signupReward.summary, limitations: conditionAt("kucoin", 2) },
  mexc: { eligibility: conditionAt("mexc", 0), kyc: conditionAt("mexc", 0), deposit: conditionAt("mexc", 1), trading: conditionAt("mexc", 2), limitations: officialCampaignResearchByVenue.mexc.signupReward.summary },
  backpack: { eligibility: conditionAt("backpack", 0), kyc: conditionAt("backpack", 0), limitations: conditionAt("backpack", 2) },
  deribit: { regions: conditionAt("deribit", 0), eligibility: conditionAt("deribit", 0), trading: conditionAt("deribit", 1), maximumConditions: conditionAt("deribit", 1), limitations: conditionAt("deribit", 2) },
  uniswap: { eligibility: conditionAt("uniswap", 1), trading: conditionAt("uniswap", 0), limitations: conditionAt("uniswap", 2) },
  pancakeswap: { eligibility: conditionAt("pancakeswap", 0), trading: conditionAt("pancakeswap", 0), maximumConditions: conditionAt("pancakeswap", 1), limitations: conditionAt("pancakeswap", 2) },
  jupiter: {}, raydium: {}, aerodrome: {},
  curve: { eligibility: conditionAt("curve", 0), limitations: conditionAt("curve", 1) },
  hyperliquid: { eligibility: conditionAt("hyperliquid", 0), trading: conditionAt("hyperliquid", 1), maximumConditions: conditionAt("hyperliquid", 1), limitations: conditionAt("hyperliquid", 2) },
  dydx: { limitations: officialCampaignResearchByVenue.dydx.signupReward.summary },
  gmx: { eligibility: conditionAt("gmx", 0), trading: conditionAt("gmx", 1), maximumConditions: officialCampaignResearchByVenue.gmx.signupReward.summary, limitations: conditionAt("gmx", 2) },
  drift: { eligibility: conditionAt("drift", 0), limitations: conditionAt("drift", 2) },
};
const rewardTypes = {
  task_rewards: tr("Account-assigned tasks, points and vouchers", "账户分配的任务、积分与卡券", "帳戶分配的任務、積分與卡券"),
  crypto_or_random_reward: tr("Offer-specific crypto or random prize", "依优惠条款发放的加密资产或随机奖", "依優惠條款發放的加密資產或隨機獎"),
  bonus_and_vouchers: tr("Trading bonus and vouchers; not uniformly withdrawable", "交易赠金与卡券，不是统一可提现现金", "交易贈金與卡券，不是統一可提領現金"),
  crypto_voucher_or_pass: tr("Crypto, trading voucher or VIP pass", "加密资产、交易体验金券或 VIP 体验资格", "加密資產、交易體驗金券或 VIP 體驗資格"),
  referral_reward: tr("Referral reward; public amount conflict unresolved", "邀请奖励，公开金额冲突尚未解决", "邀請獎勵，公開金額衝突尚未解決"),
  vouchers: tr("Task vouchers, with separate use and expiry rules", "任务卡券，各有用途与期限", "任務卡券，各有用途與期限"),
  crypto_and_coupons: tr("Crypto rewards and coupons with withdrawal conditions", "加密资产与卡券，提取另有条件", "加密資產與卡券，提領另有條件"),
  futures_bonus: tr("Conditional futures bonus", "附条件合约赠金", "附條件合約贈金"),
  referrer_commission: tr("Inviter commission; invitee payment unconfirmed", "邀请人佣金，受邀人到账奖励未核实", "邀請人佣金，受邀人到帳獎勵未核實"),
  fee_discount: tr("Discount on specified trading fees", "指定交易手续费折扣", "指定交易手續費折扣"),
  pool_specific_access: tr("Pool-access product rules; no signup reward established", "池准入产品规则，未证明注册奖励", "池准入產品規則，未證明註冊獎勵"),
  trading_raffle: tr("Wallet trading draw; prize pool is not an individual award", "钱包交易抽奖，总奖池不是个人奖额", "錢包交易抽獎，總獎池不是個人獎額"),
  product_specific_incentives: tr("Product-specific incentives not verified", "具体产品激励尚未核实", "具體產品激勵尚未核實"),
  protocol_product: tr("Protocol product guidance; no signup reward established", "协议产品说明，未证明注册奖励", "協議產品說明，未證明註冊獎勵"),
};
const datedSources = {
  "bybit-rewards-faq": ["2025-11-25", "DATE_ONLY"],
  "bitget-rewards-guide": ["2025-01-23", "DATE_ONLY"],
  "okx-eea-new-user": ["2026-08-27", "DATE_ONLY"],
  "kraken-pro-referrals": ["2026-05-08", "DATE_ONLY"],
  "kucoin-rewards-faq": ["2026-03-16 01:28:00", "LOCAL_DATETIME_WITHOUT_ZONE"],
  "deribit-affiliate-migration": ["2026-08-07 16:12", "LOCAL_DATETIME_WITHOUT_ZONE"],
  "uniswap-v4-permissioned": ["2026-08-24", "DATE_ONLY"],
  "pancakeswap-tmx-competition": ["2026-08-26", "DATE_ONLY"],
  "drift-recovery-june": ["2026-06-04", "DATE_ONLY_TITLE_DIFFERS"],
};
for (const [slug, item] of Object.entries(officialCampaignResearchByVenue)) {
  for (const itemSource of item.sources) {
    if (datedSources[itemSource.id]) [itemSource.publishedDate, itemSource.datePrecision] = datedSources[itemSource.id];
    if (itemSource.publishedAt) itemSource.datePrecision = "INSTANT_WITH_ZONE";
  }
  const mainSource = item.sources.find((itemSource) => item.signupReward.sourceUrls.includes(itemSource.url)) ?? item.sources[0];
  item.signupReward.checkedAt = mainSource?.checkedAt ?? null;
  item.evidenceRequirements = {
    regions: null, eligibility: null, kyc: null, deposit: null, trading: null,
    rewardType: rewardTypes[item.signupReward.kind] ?? null,
    maximumConditions: null, limitations: null,
    publishedDate: mainSource?.publishedDate ? tr(mainSource.publishedDate, mainSource.publishedDate, mainSource.publishedDate) : null,
    datePrecision: mainSource?.publishedDate ? tr("Source date retained as displayed; no missing timezone is inferred.", "保留来源显示日期，不推断缺失时区。", "保留來源顯示日期，不推斷缺失時區。") : null,
    ...requirementMap[slug], gaps: [],
  };
  if (!item.evidenceRequirements.regions) item.evidenceRequirements.gaps.push(tr("A complete country/region eligibility list was not established for this specific offer.", "尚未核实这项具体优惠的完整国家或地区资格清单。", "尚未核實這項具體優惠的完整國家或地區資格清單。"));
  if (!item.evidenceRequirements.kyc) item.evidenceRequirements.gaps.push(tr("This source does not establish the applicable identity-verification requirement; null does not mean no KYC.", "该来源未确定适用的身份验证要求；未知不代表无需 KYC。", "該來源未確定適用的身分驗證要求；未知不代表無需 KYC。"));
  if (!item.signupReward.startAt || !item.signupReward.endAt) item.evidenceRequirements.gaps.push(tr("No complete absolute campaign window was verified; a readable page alone cannot establish that an offer is active.", "未核实完整绝对活动窗口；页面可读不能单独证明优惠正在进行。", "未核實完整絕對活動視窗；頁面可讀不能單獨證明優惠正在進行。"));
  if (["UNCONFIRMED", "ACCOUNT_CONFIRMATION"].includes(item.signupReward.status)) item.evidenceRequirements.gaps.push(item.signupReward.summary);
  if (slug === "pancakeswap") item.evidenceRequirements.gaps.push(conditionAt(slug, 2));
  if (slug === "drift") item.evidenceRequirements.gaps.push(item.summary);
}

export default officialCampaignResearchByVenue;
