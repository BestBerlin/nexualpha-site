// Season 1 visual direction for every episode: set, shot ids, optional heading/framing/pose overrides,
// one primary teaching widget per content shot, and the conversion-card CTA.
// `t(i)` returns the source shot's i-th on-screen text as {en, zh-Hans}, so source copy stays exact.
// Numbers are the scripts' own teaching numbers; no caveat captions (owner rule, see fine-print.mjs).

import { readFileSync } from 'node:fs';

export const L = (en, zh) => ({ en, 'zh-Hans': zh });

// Partner invite codes are read from the site's partner registry, never typed here.
const PARTNERS = JSON.parse(readFileSync(new URL('../../pilot-01-prototype/public/intel/partners.json', import.meta.url), 'utf8'));
export function registryCode(slug) {
  const list = Array.isArray(PARTNERS) ? PARTNERS : PARTNERS.partners ?? Object.values(PARTNERS);
  const partner = list.find((p) => p.slug === slug);
  if (!partner?.inviteCode) throw new Error(`Partner registry has no invite code for ${slug}`);
  return partner.inviteCode;
}

// Conversion venues. Bitget is displayed as "Bitget.com" and always linked through our /go redirect.
export const VENUES = {
  okx: { name: L('OKX', 'OKX'), url: 'nexualpha.com/go/okx' },
  bitget: { name: L('Bitget.com', 'Bitget.com'), url: 'nexualpha.com/go/bitget' },
  binance: { name: L('Binance', 'Binance'), url: 'nexualpha.com/go/binance' },
};

// Default host acting by antenna colour; index alternates gestures so neighbouring shots differ.
export function defaultPoses(index, antenna) {
  if (index === 0) return antenna === 'red' ? ['shield', 'warning', 'point', 'surprised'] : ['point', 'thinking', 'point', 'confused'];
  if (antenna === 'red') return ['shield', 'warning', 'rest', 'worried'];
  if (antenna === 'amber') return index % 2 ? ['hold-phone', 'thinking', 'rest', 'worried'] : ['point', 'thinking', 'hold-phone', 'confused'];
  if (antenna === 'green') return ['thumbs-up', 'happy', 'point', 'happy'];
  return index % 2 ? ['point', 'happy', 'rest', 'neutral'] : ['hold-phone', 'happy', 'rest', 'neutral'];
}

const quickCheck = L('Quick check', '小测验');
const no = L('NO', '不能');
const notGuaranteed = L('NOT GUARANTEED', '不保证');
const item = (label, done = true) => ({ label, done });

export const EPISODE_CONFIG = {
  1: {
    set: 'study-desk',
    shots: [
      { id: 'price-shock', heading: L('One coin costs that much?', '一枚就这么贵？'), widget: () => ({ type: 'cards', items: [{ label: L('1 BTC', '1 BTC'), value: '50,000 USDT' }, { label: L('My budget', '我的预算'), value: '100 USDT', mark: 'warn' }] }) },
      { id: 'decimal-ruler', widget: () => ({ type: 'cards', items: ['1', '0.1', '0.01', '0.001'].map((n) => ({ label: L(n, n) })), separator: '›' }) },
      { id: 'practice-sum', framing: 'wide', widget: () => ({ type: 'formula', rows: [{ expr: L('Spend', '花费'), result: '100 USDT' }, { expr: '100 ÷ 50,000', result: '0.002 BTC', emphasis: true }] }) },
      { id: 'quantity-value', heading: L('Buying a little ≠ no risk', '买得少 ≠ 没风险'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'ok' }, { label: t(1), mark: 'warn' }] }) },
      { id: 'min-and-fees', heading: L('Check before you confirm', '确认前先看'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'warn' }, { label: t(1), mark: 'warn' }, { label: t(2), mark: 'ok' }] }) },
      { id: 'whole-coin-quiz', heading: quickCheck, widget: (t) => ({ type: 'quiz', question: L('Do you have to buy a whole bitcoin?', '必须买一整枚比特币吗？'), options: [{ label: L('Must buy 1 whole coin', '必须买 1 整枚'), correct: false }, { label: t(1), correct: true }] }) },
    ],
  },
  2: {
    set: 'study-desk',
    shots: [
      { id: 'dollar-drawer', heading: L('USDT = dollar savings?', 'USDT = 美元存款？'), widget: () => ({ type: 'warning', message: L('USDT in the "Dollar savings" drawer?', '把 USDT 放进“美元存款”抽屉？') }) },
      { id: 'three-cards', heading: L('Three different things', '三样不同的东西'), widget: (t) => ({ type: 'cards', items: [{ label: t(0) }, { label: t(1) }, { label: t(2) }], separator: '≠' }) },
      { id: 'priced-in-usdt', widget: () => ({ type: 'flow', steps: [{ label: 'USDT', note: L('you pay', '你付出') }, { label: 'BTC', note: L('you get', '你得到') }, { label: 'USDT', note: L('when you sell', '卖出时拿回') }] }) },
      { id: 'stable-goal', heading: L("'Stable' is a goal, not a guarantee", '“稳定”是目标，不是保证'), widget: (t) => ({ type: 'cards', items: [0, 1, 2].map((i) => ({ label: t(i), mark: 'warn' })) }) },
      { id: 'two-paths', heading: L('Depends on region and platform', '取决于地区和平台'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'ok' }, { label: t(1), mark: 'ok' }] }) },
      { id: 'stable-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('"A stablecoin always equals $1 and has no risk."', '“稳定币永远等于1美元，没有风险。”'), verdict: L('FALSE', '错误') }) },
    ],
  },
  3: {
    set: 'study-desk',
    shots: [
      { id: 'phone-broke', heading: L('Phone broke = coins gone?', '手机坏了 = 币没了？'), widget: () => ({ type: 'cards', items: [{ label: L('Phone', '手机'), value: L('broken', '坏了'), mark: 'no' }, { label: L('Coins', '币'), value: '?', mark: 'warn' }] }) },
      { id: 'window-key', heading: L('Your coins are not in your phone', '币不在手机里'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'ok' }, { label: t(1), mark: 'ok' }] }) },
      { id: 'who-holds-keys', heading: L('Who holds the keys?', '谁掌握密钥？'), widget: () => ({ type: 'compare', left: { title: L('Custodial exchange', '托管交易所'), rows: [L('Platform holds keys', '平台保管密钥'), L('You act through your account', '你通过账户操作')] }, right: { title: L('Self-custody wallet', '自托管钱包'), rows: [L('You hold recovery', '你保管恢复凭证'), L('You approve actions', '你自己授权操作')] } }) },
      { id: 'recovery', heading: L('Forgot it? Different rescue', '忘了？救法不一样'), widget: () => ({ type: 'compare', left: { title: L('Exchange', '交易所'), rows: [L('Account recovery via support', '可通过客服恢复账户')] }, right: { title: L('Recovery-phrase wallet', '助记词钱包'), rows: [L('Restore from your own backup', '只能用你自己的备份恢复'), L("Lost phrase: support can't help", '丢了助记词，客服帮不了')] } }) },
      { id: 'risk-cards', heading: L('Different risks, not a ranking', '风险不同，不是排名'), widget: (t) => ({ type: 'cards', items: [0, 1, 2].map((i) => ({ label: t(i), mark: 'warn' })) }) },
      { id: 'match-quiz', heading: L('Who controls the assets?', '谁控制资产？'), widget: () => ({ type: 'quiz', question: L('Match each one to who holds the permission.', '把它们和掌握权限的一方连起来。'), options: [{ label: L('Exchange → platform custody', '交易所 → 平台托管'), correct: true }, { label: L('Self-custody → you keep the recovery credentials', '自托管 → 你保管恢复凭证'), correct: true }] }) },
    ],
  },
  4: {
    set: 'study-desk',
    cta: L('Find the verified official door first.', '先找到核实过的官方入口。'),
    shots: [
      { id: 'two-doors', heading: L('Which door is real?', '哪扇门是真的？'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'warn' }, { label: t(1), mark: 'ok' }] }) },
      { id: 'four-checks', heading: L('Check before the reward', '先查清楚，再看奖励'), widget: (t) => ({ type: 'checklist', items: [0, 1, 2, 3].map((i) => item(t(i))) }) },
      { id: 'official-signup', heading: L('Sign up on the verified page', '在核实过的官网注册'), widget: (t) => ({ type: 'flow', title: L('✓ Verified official domain', '✓ 已核实官方域名'), steps: [{ label: t(0) }, { label: t(1) }, { label: t(2) }] }) },
      { id: 'security-on', heading: L('Turn on security', '打开安全设置'), widget: (t) => ({ type: 'checklist', items: [0, 1, 2].map((i) => item(t(i))) }) },
      { id: 'partner-not-guarantee', heading: L("Facts not confirmed? Don't start", '事实未确认？先别注册'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), value: L('≠ safety guarantee', '≠ 安全保证'), mark: 'warn' }, { label: t(1), mark: 'warn' }] }) },
      { id: 'region-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L("High reward, but your region isn't supported. Keep signing up, or stop?", '奖励很高，但你的地区不支持。继续注册，还是停下？'), verdict: L('STOP', '停下') }) },
    ],
  },
  5: {
    set: 'study-desk',
    cta: L('Start verification only on the official site.', '只在官网开始认证。'),
    shots: [
      { id: 'problem', poses: ['shield', 'warning', 'rest', 'worried'], widget: (t) => ({ type: 'warning', message: t(0) }) },
      { id: 'official-flow', poses: ['shield', 'happy', 'rest', 'confused'], widget: () => ({ type: 'checklist', items: [item(L('Official domain', '官方域名')), item(L('Official verification entry', '官方认证入口')), item(L('No chat agents', '不找私信代办'))] }) },
      { id: 'kyc-steps', poses: ['hold-phone', 'thinking', 'hold-phone', 'neutral'], widget: () => ({ type: 'checklist', items: [item(L('Real details', '真实信息')), item(L('Valid ID', '有效证件')), item(L('Photo / face check', '照片／本人验证'))] }) },
      { id: 'fix-rejection', poses: ['point', 'thinking', 'rest', 'confused'], widget: () => ({ type: 'id-samples', labels: [L('Glare', '反光'), L('Cropped', '裁切'), L('Expired', '过期')] }) },
      { id: 'review-status', poses: ['hold-phone', 'thinking', 'point', 'neutral'], widget: () => ({ type: 'checklist', items: [item(L('Under review', '审核中')), item(L('Official help', '官方帮助')), item(L('No countdown promise', '不承诺审核时限'))] }) },
      { id: 'official-only', poses: ['thumbs-up', 'happy', 'point', 'happy'], widget: () => ({ type: 'checklist', items: [item(L('Official verification page', '官网认证入口')), item(L("Private 'agent'", '私信代办'), false), item(L('Course chat upload', '课程聊天区上传'), false)] }) },
    ],
  },
  6: {
    set: 'transfer-station',
    shots: [
      { id: 'three-buttons', heading: L('Which one do I press?', '我该按哪个？'), widget: (t) => ({ type: 'cards', items: [0, 1, 2].map((i) => ({ label: t(i) })) }) },
      { id: 'three-routes', heading: L('Start with what you hold', '先看你手里有什么'), widget: (t) => ({ type: 'cards', items: [0, 1, 2].map((i) => ({ label: t(i), mark: 'ok' })) }) },
      { id: 'fiat-details', heading: L('Fiat deposit: check the details', '法币入金：核对细节'), widget: (t) => ({ type: 'checklist', items: [0, 1, 2, 3].map((i) => item(t(i))) }) },
      { id: 'coins-vs-internal', heading: L('Check where the balance lands', '先看余额落在哪'), widget: (t) => ({ type: 'compare', left: { title: L('Deposit coins', '充币'), rows: [t(0)] }, right: { title: L('Internal transfer', '内部划转'), rows: [t(1)] } }) },
      { id: 'p2p', heading: L('P2P is not a bank transfer', 'P2P 不是银行转账'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'warn' }, { label: t(1), mark: 'no' }, { label: t(2), mark: 'no' }] }) },
      { id: 'channel-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('Can a bank balance be sent straight to a USDT on-chain address?', '银行余额能直接转到 USDT 链上地址吗？'), verdict: no }) },
    ],
  },
  7: {
    set: 'trading-desk',
    cta: L('Ready for a real first trade? Same five checks.', '准备好真实的第一笔？同样五项检查。'),
    shots: [
      { id: 'the-slash', widget: () => ({ type: 'warning', message: L('Buy two coins at once?', '一次买两种币？') }) },
      { id: 'base-quote', heading: L('Read the slash', '读懂这个斜杠'), widget: () => ({ type: 'compare', divider: '/', left: { title: 'BTC', rows: [L('what you trade', '你交易的币')] }, right: { title: 'USDT', rows: [L("what it's priced in", '计价单位')] } }) },
      { id: 'practice-ticket', heading: L('Spot · Market buy', '现货 · 市价买入'), widget: (t) => ({ type: 'order-ticket', title: t(0), orderType: 'market', side: L('Buy', '买入'), amount: '100 USDT' }) },
      { id: 'fill-math', widget: () => ({ type: 'formula', rows: [{ expr: '100 ÷ 50,000', result: '0.002 BTC' }, { expr: L('Fee 0.1%', '手续费 0.1%'), result: '0.10 USDT' }, { expr: L('Total spent', '合计花费'), result: '100.10 USDT', emphasis: true }] }) },
      { id: 'filled', heading: L('Filled? Check the record', '成交了？看记录'), widget: (t) => ({ type: 'balance-ledger', title: t(0), rows: [{ asset: 'BTC', available: '0.002', locked: '0' }, { asset: 'USDT', available: '899.90', locked: '0' }] }) },
      { id: 'five-checks', heading: L('Five checks', '五项检查'), widget: (t) => ({ type: 'checklist', items: [0, 1, 2, 3, 4].map((i) => item(t(i))) }) },
    ],
  },
  8: {
    set: 'trading-desk',
    shots: [
      { id: 'bank-unchanged', heading: L('Sold, but the bank is empty?', '卖了，银行却没钱？'), widget: () => ({ type: 'cards', items: [{ label: L('Sold', '已卖出'), mark: 'ok' }, { label: L('Bank balance', '银行余额'), value: L('unchanged', '没变'), mark: 'warn' }] }) },
      { id: 'sold-into-usdt', heading: L('Selling ≠ withdrawing', '卖出 ≠ 提现'), widget: () => ({ type: 'flow', steps: [{ label: '0.002 BTC' }, { label: L('USDT balance', 'USDT 余额'), state: 'ok' }, { label: L('Bank', '银行'), state: 'no' }] }) },
      { id: 'sell-math', widget: () => ({ type: 'formula', rows: [{ expr: '0.002 × 55,000', result: '110' }, { expr: L('Fee', '手续费'), result: '− 0.11' }, { expr: L('Net', '到账'), result: '109.89 USDT', emphasis: true }] }) },
      { id: 'net-gain', heading: L('Take off the costs', '扣掉成本'), widget: (t) => ({ type: 'formula', rows: [{ expr: '109.89 − 100.10', result: '9.79', emphasis: true }, { expr: L('USDT balance', 'USDT 余额'), result: '1,009.79' }], note: t(2) }) },
      { id: 'withdraw-status', heading: L('Withdraw to an account in your name', '提到本人名下账户'), widget: (t) => ({ type: 'flow', steps: [{ label: t(0) }, { label: t(1) }, { label: t(2), state: 'ok' }] }) },
      { id: 'bank-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('Your USDT balance went up. Has your bank received the money?', 'USDT 余额涨了，银行就到账了吗？'), verdict: no }) },
    ],
  },
  9: {
    set: 'transfer-station',
    shots: [
      { id: 'problem', poses: ['shield', 'warning', 'point', 'surprised'], widget: (t) => ({ type: 'warning', message: t(0) }) },
      { id: 'match-ends', poses: ['point', 'thinking', 'rest', 'neutral'], framing: 'detail', focus: 'nexubo', widget: () => ({ type: 'transfer-match', sender: L('Sender', '发送方'), receiver: L('Receiver', '接收方'), coin: L('USDT', 'USDT'), network: L('Supported network', '支持的网络'), note: L('Check receiving platform support', '核对接收平台支持情况') }) },
      { id: 'route-analogy', poses: ['hold-phone', 'thinking', 'rest', 'confused'], widget: () => ({ type: 'checklist', items: [item(L('Network = route', '网络＝路线')), item(L('Address = destination', '地址＝目的地'))] }) },
      { id: 'transfer-checklist', heading: L("Don't guess any of these", '这些都别靠猜'), poses: ['point', 'thinking', 'hold-phone', 'neutral'], widget: () => ({ type: 'checklist', title: L('Pre-transfer checklist', '转账前检查清单'), items: [item(L('Coin', '币种')), item(L('Network', '网络')), item(L('Full address', '完整地址')), item(L('Memo / Tag if required', 'Memo / Tag（如需）')), item(L('Minimum deposit', '最低充值')), item(L('Withdrawal fee', '提币费用')), item(L('Estimated arrival', '预计到账'))] }) },
      { id: 'test-transfer', poses: ['thumbs-up', 'happy', 'hold-phone', 'happy'], widget: () => ({ type: 'checklist', items: [item(L('Small test credited', '小额测试已入账')), item(L('Re-check before the next one', '下一笔前重新核对'))] }) },
      { id: 'dont-send', poses: ['thumbs-up', 'happy', 'point', 'happy'], widget: (t) => ({ type: 'warning', message: t(0) }) },
    ],
  },
  10: {
    set: 'transfer-station',
    shots: [
      { id: 'dont-resend', widget: () => ({ type: 'warning', message: L('Submitted · receiver still shows 0', '已提交 · 接收方仍显示 0') }) },
      { id: 'three-stations', heading: L("Find the station where it's stuck", '找到卡在哪一站'), widget: (t) => ({ type: 'flow', steps: [{ label: t(0) }, { label: t(1) }, { label: t(2) }] }) },
      { id: 'send-record', heading: L('Keep the send record', '保留转账记录'), widget: (t) => ({ type: 'checklist', items: [0, 1, 2, 3].map((i) => item(t(i))) }) },
      { id: 'who-to-contact', heading: L('Who to contact', '该联系谁'), widget: (t) => ({ type: 'cards', items: [{ label: t(0) }, { label: t(1) }, { label: t(2), mark: 'warn' }] }) },
      { id: 'recovery-scam', heading: L("On-chain transfers don't rewind", '链上转账不能倒回'), widget: (t) => ({ type: 'warning', message: t(0) }) },
      { id: 'support-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('Does support need your transaction hash, or your recovery phrase?', '客服需要交易哈希，还是助记词？'), options: [{ label: L('Tx hash', '交易哈希'), correct: true }, { label: L('Recovery phrase', '助记词'), correct: false }] }) },
    ],
  },
  11: {
    set: 'study-desk',
    shots: [
      { id: 'fake-support', heading: L('"Support" wants your phrase?', '“客服”要你的助记词？'), widget: (t) => ({ type: 'warning', message: t(0) }) },
      { id: 'control-key', widget: () => ({ type: 'cards', items: [{ label: L('Recovery phrase', '助记词'), value: L('never send', '绝不发送'), mark: 'no' }, { label: L('Private key', '私钥'), value: L('never send', '绝不发送'), mark: 'no' }] }) },
      { id: 'more-signs', heading: L('Two more danger signs', '另外两个危险信号'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'no' }, { label: t(1), mark: 'no' }] }) },
      { id: 'connect-vs-approve', heading: L("Don't understand it? Don't confirm", '看不懂就别确认'), widget: (t) => ({ type: 'cards', items: [{ label: t(0) }, { label: t(1), value: t(2), mark: 'warn' }] }) },
      { id: 'official-security', heading: L('Use the official security channel', '走官方安全渠道'), widget: (t) => ({ type: 'checklist', items: [0, 1, 2].map((i) => item(t(i))) }) },
      { id: 'share-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('Which one is safe to share?', '哪个可以分享？'), options: [{ label: L('Public receiving address', '公开收款地址'), correct: true }, { label: L('Recovery phrase', '助记词'), correct: false }, { label: L('One-time code', '一次性验证码'), correct: false }] }) },
    ],
  },
  12: {
    set: 'study-desk',
    cta: L('Compare exchanges on NexuAlpha · Telegram @NexuAlphaGlobal', '在 NexuAlpha 比较交易所 · Telegram @NexuAlphaClub'),
    shots: [
      { id: 'deposit-now', heading: L('Deposit now?', '现在就入金？'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'warn' }, { label: t(1), mark: 'ok' }] }) },
      { id: 'task-sheet', heading: L('One practice flow', '一次练习流程'), widget: (t) => ({ type: 'checklist', title: t(0), items: [1, 2, 3, 4].map((i) => item(t(i))) }) },
      { id: 'checks-not-profit', heading: L('Price fell, checks still pass', '价格跌了，检查照样合格'), widget: () => ({ type: 'cards', items: [{ label: L('Checks', '检查'), mark: 'ok' }, { label: L('Score', '得分'), value: L('≠ profit', '≠ 盈利') }] }) },
      { id: 'refuse-transfer', heading: L('Stopping is a correct answer', '停下也是正确答案'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'ok' }] }) },
      { id: 'say-it-back', heading: L('Say three things back', '复述三件事'), widget: (t) => ({ type: 'checklist', items: [0, 1, 2].map((i) => item(t(i))) }) },
      { id: 'season-complete', widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'ok' }, { label: t(1) }, { label: t(2) }] }) },
    ],
  },
  13: {
    set: 'trading-desk',
    cta: L('Compare fees on NexuAlpha.', '在 NexuAlpha 比较手续费。'),
    shots: [
      { id: 'bill-different', heading: L('Why is my bill different?', '为什么账单不一样？'), widget: () => ({ type: 'cards', items: [{ label: L('Screen price', '屏幕价格'), value: '50,000' }, { label: L('Average fill', '成交均价'), value: '50,050', mark: 'warn' }] }) },
      { id: 'last-price-receipt', widget: () => ({ type: 'order-book', levels: [{ price: '50,200', size: '0.003' }, { price: '50,100', size: '0.001' }, { price: '50,000', size: '0.001' }], last: '50,000' }) },
      { id: 'two-levels', heading: L('Buy 0.002 BTC', '买入 0.002 BTC'), widget: () => ({ type: 'order-book', levels: [{ price: '50,000', size: '0.001 BTC', fill: true }, { price: '50,100', size: '0.001 BTC', fill: true }], average: '50,050' }) },
      { id: 'read-bill', heading: L('Read the bill', '看账单'), widget: () => ({ type: 'formula', rows: [{ expr: L('Total', '合计'), result: '100.10', emphasis: true }, { expr: L('Fee', '手续费'), result: L('separate line', '单独一行') }, { expr: L('Slippage', '滑点'), result: L('≠ fee', '≠ 手续费') }] }) },
      { id: 'depth', heading: L('Size and depth matter', '单量和深度很重要'), widget: (t) => ({ type: 'compare', left: { title: t(0), rows: [L('A big order moves the price more', '大单更容易推动价格')] }, right: { title: t(1), rows: [L('Absorbs more size', '能承接更大单量')] } }) },
      { id: 'fill-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('Can the last price guarantee a big order fills entirely at that price?', '最新价能保证大单全部按这个价成交吗？'), verdict: no }) },
    ],
  },
  14: {
    set: 'trading-desk',
    shots: [
      { id: 'not-filling', heading: L("Why isn't it filling?", '为什么不成交？'), widget: () => ({ type: 'order-ticket', title: L('Open · waiting', '挂单中 · 等待'), orderType: 'limit', side: L('Buy', '买入'), price: '49,000', quantity: '0.002 BTC' }) },
      { id: 'market-vs-limit', heading: L('Two order types', '两种订单'), widget: () => ({ type: 'compare', left: { title: L('Market', '市价'), rows: [L('Fill first', '先成交'), L('Final price can move', '成交价会变')] }, right: { title: L('Limit', '限价'), rows: [L('Price limit first', '先守住价格'), L('May not fill', '可能不成交')] } }) },
      { id: 'waiting-queue', heading: L('Below market → may wait', '低于市价 → 可能要等'), widget: () => ({ type: 'cards', items: [{ label: L('Now', '现价'), value: '50,000' }, { label: L('Limit buy', '限价买入'), value: '49,000', mark: 'warn' }, { label: L('Status', '状态'), value: L('waiting', '等待中') }] }) },
      { id: 'cancel-rest', heading: L('Cancel only the unfilled part', '撤单只撤未成交部分'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'ok' }, { label: t(1), mark: 'no' }] }) },
      { id: 'statuses', heading: L('Read the status first', '先看状态'), widget: (t) => ({ type: 'flow', steps: [0, 1, 2, 3].map((i) => ({ label: t(i) })), note: t(4) }) },
      { id: 'limit-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('A limit buy at 49,000, and the market stays above it. Will it definitely fill?', '限价 49,000 买入，市价一直在上方，一定会成交吗？'), verdict: no }) },
    ],
  },
  15: {
    set: 'trading-desk',
    shots: [
      { id: 'green-candle', heading: L('Green = keeps going up?', '绿了就会继续涨？'), widget: () => ({ type: 'candlestick-chart', ohlc: [{ open: 49800, high: 50100, low: 49600, close: 49700 }, { open: 49700, high: 50000, low: 49500, close: 49900 }, { open: 50000, high: 51000, low: 49000, close: 50500 }] }) },
      { id: 'four-prices', heading: L('One candle, four prices', '一根K线，四个价格'), widget: () => ({ type: 'candlestick-chart', annotate: true, title: L('5-minute candle', '5分钟K线'), ohlc: [{ open: 50000, high: 51000, low: 49000, close: 50500 }] }) },
      { id: 'body-wicks', heading: L('Body and wicks', '实体和影线'), widget: () => ({ type: 'compare', divider: '+', left: { title: L('Body', '实体'), rows: [L('open ↔ close', '开盘 ↔ 收盘')] }, right: { title: L('Wicks', '影线'), rows: [L('high / low', '最高 / 最低')] } }) },
      { id: 'time-frame', heading: L('Read the time frame first', '先看周期'), widget: () => ({ type: 'compare', left: { title: '5m', rows: [L('Each candle = 5 minutes', '每根 = 5分钟')] }, right: { title: '1h', rows: [L('Each candle = 1 hour', '每根 = 1小时')] } }) },
      { id: 'legend', heading: L('Read the legend and the numbers', '看图例和数字'), widget: (t) => ({ type: 'cards', items: [{ label: t(0) }, { label: t(1), mark: 'warn' }] }) },
      { id: 'candle-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L("Find this candle's high and close.", '找出这根K线的最高价和收盘价。'), options: [{ label: L('High 51,000', '最高 51,000'), correct: true }, { label: L('Close 50,500', '收盘 50,500'), correct: true }] }) },
    ],
  },
  16: {
    set: 'trading-desk',
    shots: [
      { id: 'all-in', heading: L('All in, for a 20 risk?', '只想亏20，就全仓？'), widget: () => ({ type: 'cards', items: [{ label: L('Balance', '余额'), value: '1,000' }, { label: L('Max loss', '最多亏'), value: '20', mark: 'warn' }] }) },
      { id: 'three-cups', heading: L('Three different numbers', '三个不同的数'), widget: (t) => ({ type: 'cards', items: [0, 1, 2].map((i) => ({ label: t(i) })) }) },
      { id: 'exit-distance', heading: L('Decide your exit first', '先定离场点'), widget: () => ({ type: 'formula', rows: [{ expr: L('Entry', '入场'), result: '50,000' }, { expr: L('Exit', '离场'), result: '47,500' }, { expr: '(50,000 − 47,500) ÷ 50,000', result: '5%', emphasis: true }] }) },
      { id: 'size-it', heading: L('Size the position', '算仓位'), widget: (t) => ({ type: 'formula', rows: [{ expr: '20 ÷ 5%', result: '400', emphasis: true }, { expr: '400 ÷ 50,000', result: '0.008 BTC' }], note: t(2) }) },
      { id: 'not-a-cap', heading: L('Planned risk is not a cap', '计划风险不是上限'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'warn' }, { label: t(1), mark: 'no' }, { label: t(2), mark: 'no' }] }) },
      { id: 'loss-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L("Ignoring fees, a 400 position falls 5%. What's the price loss?", '不计费用，400 的仓位下跌 5%，价格亏损是多少？'), verdict: L('400 × 5% = 20', '400 × 5% = 20'), tone: 'ok' }) },
    ],
  },
  17: {
    set: 'trading-desk',
    shots: [
      { id: 'force-field', heading: L('Stop-loss = force field?', '止损 = 防护罩？'), widget: (t) => ({ type: 'warning', message: t(0) }) },
      { id: 'action-plan', heading: L('A plan, not insurance', '是计划，不是保险'), widget: (t) => ({ type: 'flow', steps: [0, 1, 2].map((i) => ({ label: t(i) })) }) },
      { id: 'stop-market', widget: () => ({ type: 'flow', steps: [{ label: L('Trigger', '触发') }, { label: L('Market order', '市价单') }, { label: L('Fill may slip', '成交可能滑点'), state: 'warn' }] }) },
      { id: 'stop-limit', widget: (t) => ({ type: 'flow', steps: [{ label: L('Trigger', '触发') }, { label: L('Limit order', '限价单') }, { label: t(1), state: 'no' }] }) },
      { id: 'check-after', heading: L('Check after setting', '设置后核对'), widget: (t) => ({ type: 'checklist', items: [0, 1, 2, 3].map((i) => item(t(i))) }) },
      { id: 'stop-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('Once a stop-limit is triggered, is it guaranteed to fill?', '止损限价单触发后，一定成交吗？'), verdict: notGuaranteed }) },
    ],
  },
  18: {
    set: 'trading-desk',
    shots: [
      { id: 'same-trade', heading: L('Same trade?', '同一种交易？'), widget: (t) => ({ type: 'cards', items: [{ label: t(0) }, { label: t(1) }], separator: '?' }) },
      { id: 'spot-vs-perp', heading: L("You're not buying the same thing", '买的不是同一个东西'), widget: () => ({ type: 'compare', left: { title: L('Spot', '现货'), rows: [L('Pay USDT → get BTC', '付 USDT → 得 BTC')] }, right: { title: L('Futures', '合约'), rows: [L('Position + P&L', '仓位 + 盈亏'), L('No withdrawable BTC', '没有可提取的 BTC')] } }) },
      { id: 'long-short', heading: L('Wrong direction loses either way', '方向错了，哪边都亏'), widget: (t) => ({ type: 'compare', divider: '|', left: { title: t(0), rows: [L('Price up → gain', '涨 → 盈'), L('Price down → loss', '跌 → 亏')] }, right: { title: t(1), rows: [L('Price down → gain', '跌 → 盈'), L('Price up → loss', '涨 → 亏')] } }) },
      { id: 'four-fields', heading: L('A different risk, not a level', '不同的风险，不是升级'), widget: (t) => ({ type: 'cards', items: [0, 1, 2, 3].map((i) => ({ label: t(i) })) }) },
      { id: 'no-liquidation', heading: L('No liquidation ≠ protected', '不强平 ≠ 有保护'), widget: () => ({ type: 'compare', left: { title: L('Plain spot', '普通现货'), rows: [L('No margin liquidation', '没有保证金强平')] }, right: { title: L('Still', '仍然有'), rows: [L('Price risk', '价格风险'), L('Platform risk', '平台风险')] } }) },
      { id: 'contract-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('Does opening a bitcoin contract add withdrawable bitcoin to your account?', '开比特币合约会给账户增加可提取的比特币吗？'), verdict: no }) },
    ],
  },
  19: {
    set: 'trading-desk',
    shots: [
      { id: 'ten-x-machine', heading: L('10x = a free 900?', '10倍 = 白送 900？'), widget: () => ({ type: 'flow', steps: [{ label: '100' }, { label: '10x' }, { label: L('1,000 cash?', '1,000 现金？'), state: 'warn' }] }) },
      { id: 'margin-notional', heading: L('Not free cash', '不是白给的钱'), widget: () => ({ type: 'cards', items: [{ label: L('Margin', '保证金'), value: '100' }, { label: L('Notional position', '名义仓位'), value: '1,000' }, { label: L('Leverage', '杠杆'), value: '10x' }] }) },
      { id: 'one-percent', heading: L('Same 1% move, bigger hit', '同样 1%，伤害更大'), widget: (t) => ({ type: 'formula', rows: [{ expr: '10x · 1,000 · −1%', result: '≈ −10' }, { expr: '20x · 2,000 · −1%', result: '≈ −20', emphasis: true }], note: t(2) }) },
      { id: 'fixed-position', heading: L('Position fixed, leverage changes', '仓位不变，只改杠杆'), widget: (t) => ({ type: 'cards', items: [{ label: t(0) }, { label: t(1), mark: 'ok' }, { label: t(2), mark: 'warn' }] }) },
      { id: 'not-the-formula', heading: L('Real liquidation has more parts', '真实强平涉及更多因素'), widget: (t) => ({ type: 'cards', items: [{ label: '10% = 1/10', value: L('not the real formula', '不是真实公式'), mark: 'no' }, { label: t(1) }, { label: t(2) }, { label: t(3) }] }) },
      { id: 'win-rate-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('Does 10x leverage make your win rate ten times higher?', '10倍杠杆会让胜率也变成10倍吗？'), verdict: no }) },
    ],
  },
  20: {
    set: 'trading-desk',
    shots: [
      { id: 'money-left', heading: L('Money left, still forced out?', '还有钱，却被强平？'), widget: (t) => ({ type: 'warning', message: t(0) }) },
      { id: 'four-boxes', heading: L('Four different numbers', '四个不同的数'), widget: (t) => ({ type: 'cards', items: [0, 1, 2, 3].map((i) => ({ label: t(i) })) }) },
      { id: 'equity-math', heading: L('The buffer shrinks', '缓冲在变小'), widget: () => ({ type: 'formula', rows: [{ expr: L('Initial margin', '初始保证金'), result: '100' }, { expr: L('Unrealised loss', '未实现亏损'), result: '−20' }, { expr: L('Equity', '权益'), result: '100 − 20 = 80', emphasis: true }], note: L('Fees ignored', '不计费用') }) },
      { id: 'maintenance-line', widget: (t) => ({ type: 'buffer-gauge', from: 80, to: 34, line: 25, fillLabel: L('Equity', '权益'), lineLabel: L('Maintenance requirement', '维持保证金要求'), title: t(1) }) },
      { id: 'adding-money', heading: L('Adding money ≠ safe', '加钱 ≠ 安全'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'ok' }, { label: t(1), mark: 'warn' }] }) },
      { id: 'margin-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('Are initial margin and maintenance margin the same thing?', '初始保证金和维持保证金是一回事吗？'), verdict: no }) },
    ],
  },
  21: {
    set: 'trading-desk',
    shots: [
      { id: 'problem', poses: ['point', 'thinking', 'point', 'confused'], widget: () => ({ type: 'margin-flow', balance: 900, margin: 100, autoAdd: false, label: L('Box 100 · Balance 900', '小盒子 100 · 余额 900') }) },
      { id: 'own-margin', poses: ['point', 'happy', 'rest', 'neutral'], widget: () => ({ type: 'margin-flow', balance: 900, margin: 100, autoAdd: false, label: L('Isolated = own margin', '逐仓 = 单独保证金'), note: L('"Forever" removed', '去掉“永远”') }) },
      { id: 'box-risk', poses: ['shield', 'thinking', 'rest', 'worried'], widget: () => ({ type: 'margin-flow', balance: 900, margin: 100, autoAdd: false, label: L('100 can still be lost', '这100仍可能亏损'), note: L('Isolated is not a stop-loss', '逐仓不是止损') }) },
      { id: 'auto-add-on', poses: ['shield', 'warning', 'point', 'surprised'], framing: 'detail', focus: 'nexubo', widget: () => ({ type: 'margin-flow', balance: 900, margin: 100, autoAdd: true, label: L('Auto-add margin: ON · 100 → more', '自动追加：开 · 100 → 更多') }) },
      { id: 'settings-check', heading: L('Check the settings', '检查设置'), poses: ['hold-phone', 'thinking', 'hold-phone', 'neutral'], widget: () => ({ type: 'checklist', items: [item(L('Mode', '模式')), item(L('Auto-add', '自动追加')), item(L('Fee deduction', '费用扣取')), item(L('Total committed', '可投入总额'))] }) },
      { id: 'auto-add-answer', poses: ['thumbs-up', 'happy', 'point', 'happy'], framing: 'detail', focus: 'nexubo', widget: () => ({ type: 'margin-flow', balance: 900, margin: 100, autoAdd: true, label: L('Isolated + auto-add = only 100?', '逐仓 + 自动追加 = 只用100？'), note: L('No', '不能') }) },
    ],
  },
  22: {
    set: 'trading-desk',
    shots: [
      { id: 'shared-tank', heading: L('Why is the right one in danger too?', '为什么右边也危险？'), widget: () => ({ type: 'flow', steps: [{ label: L('Position A', '仓位 A'), note: L('losing', '亏损中'), state: 'no' }, { label: L('Shared tank', '共享池') }, { label: L('Position B', '仓位 B'), note: L('level drops', '水位下降'), state: 'warn' }] }) },
      { id: 'one-pool', heading: L('One shared pool', '一个共享池'), widget: (t) => ({ type: 'cards', items: [{ label: L('Shared pool', '共享池'), value: L('1,000 eligible collateral', '1,000 合格抵押品'), mark: 'ok' }, { label: t(1), mark: 'no' }] }) },
      { id: 'loss-spreads', heading: L('One loss eats the shared buffer', '一个亏损吃掉共享缓冲'), widget: () => ({ type: 'flow', steps: [{ label: L('A loss ↑', 'A 亏损 ↑'), state: 'warn' }, { label: L('Shared equity ↓', '共享权益 ↓') }, { label: L('B buffer ↓', 'B 缓冲 ↓'), state: 'warn' }] }) },
      { id: 'walls-vs-pool', heading: L('Neither is a safety champion', '谁都不是安全冠军'), widget: () => ({ type: 'compare', left: { title: L('Isolated', '逐仓'), rows: [L('Clear walls', '清晰隔墙')] }, right: { title: L('Cross', '全仓'), rows: [L('Shared pool', '共享池'), L('More money on the line', '更多资金承担亏损')] } }) },
      { id: 'scope', heading: L('Cross margin has a scope', '全仓也有范围'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'ok' }, { label: t(1), mark: 'no' }] }) },
      { id: 'cross-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L("Under cross margin, is one position's risk always limited to its initial 100?", '全仓下，一个仓位的风险总是只限于最初的100吗？'), verdict: L('NOT NECESSARILY', '不一定') }) },
    ],
  },
  23: {
    set: 'trading-desk',
    shots: [
      { id: 'alarm', heading: L("Price hasn't got there. Why the alarm?", '价格没到，为什么报警？'), widget: (t) => ({ type: 'warning', message: t(0) }) },
      { id: 'three-lines', heading: L("Three lines. Don't mix them", '三条线，别混用'), widget: (t) => ({ type: 'cards', items: [{ label: t(0) }, { label: t(1) }, { label: L('Risk line', '风险线') }] }) },
      { id: 'equity-shrinks', heading: L('Losses eat into equity', '亏损侵蚀权益'), widget: (t) => ({ type: 'buffer-gauge', title: t(0), from: 100, to: 30, line: 20, fillLabel: L('Equity', '权益'), lineLabel: L('Maintenance requirement', '维持保证金要求') }) },
      { id: 'can-still-trigger', heading: L('A forced-close risk event', '强制平仓风险事件'), widget: (t) => ({ type: 'cards', items: [0, 1, 2].map((i) => ({ label: t(i), mark: i === 2 ? undefined : 'warn' })) }) },
      { id: 'no-comeback', heading: L("A closed position doesn't come back", '平掉的仓位不会回来'), widget: (t) => ({ type: 'flow', steps: [{ label: L('Price falls', '价格下跌') }, { label: t(0), state: 'no' }, { label: L('Price rebounds', '价格反弹') }], note: t(1) }) },
      { id: 'path-quiz', heading: quickCheck, widget: () => ({ type: 'quiz', question: L('If the price ends back where it started, are you guaranteed not to be liquidated along the way?', '价格最后回到起点，途中就一定不会被强平吗？'), verdict: notGuaranteed }) },
    ],
  },
  24: {
    set: 'trading-desk',
    cta: L('Fees add up. Compare them on NexuAlpha.', '手续费会累积。在 NexuAlpha 比较。'),
    shots: [
      { id: 'balance-down', heading: L('Price flat, balance down?', '价格没动，余额却少了？'), widget: () => ({ type: 'cards', items: [{ label: L('Price', '价格'), value: L('flat', '几乎没动') }, { label: L('Futures balance', '合约余额'), value: '↓', mark: 'warn' }] }) },
      { id: 'two-costs', heading: L('Two different costs', '两种不同的费用'), widget: (t) => ({ type: 'compare', divider: '+', left: { title: t(0), rows: [L('Paid when you trade', '成交时支付')] }, right: { title: t(1), rows: [t(2), t(3)] } }) },
      { id: 'funding-math', heading: L('Funding: one settlement', '资金费：一次结算'), widget: (t) => ({ type: 'formula', rows: [{ expr: '1,000 × 0.01%', result: '0.10', emphasis: true }], note: t(1) }) },
      { id: 'interval-varies', heading: L('Not every 8 hours, forever', '不是永远每8小时'), widget: (t) => ({ type: 'cards', items: [0, 1, 2].map((i) => ({ label: t(i), mark: 'warn' })) }) },
      { id: 'final-card', heading: L('Final practice card', '最终练习卡'), widget: (t) => ({ type: 'checklist', title: t(7), items: [0, 1, 2, 3, 4, 5, 6].map((i) => item(t(i))) }) },
      { id: 'choose-not-to', heading: L('A passing result: choosing not to', '合格结果：选择不做'), widget: (t) => ({ type: 'cards', items: [{ label: t(0), mark: 'ok' }, { label: t(1), mark: 'ok' }, { label: L('Open position', '开仓'), value: L('OFF', '关闭'), mark: 'no' }] }) },
    ],
  },
};
