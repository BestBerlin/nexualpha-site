import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { after, test } from 'node:test';
import { checkPackage } from './index.mjs';
import { loadPackage } from './check-package.mjs';

const execFileAsync = promisify(execFile);
const testFile = fileURLToPath(import.meta.url);
const gateDir = path.dirname(testFile);
const repoRoot = path.resolve(gateDir, '../../..');
const scratchRoot = path.join(gateDir, '.test-tmp');
const now = '2026-10-12T12:00:00Z';
const enValueBlock = 'Official source check confirms the launch details.';
const zhValueBlock = '来源核查说明公告细节完整且口径一致，适合自动发布前复核。';

after(async () => {
  await rm(scratchRoot, { recursive: true, force: true });
});

function basePackage() {
  const en = 'Bybit launched 2 custody accounts on 2026-10-12.';
  const zh = 'Bybit 于 2026 年 10 月 12 日推出 2 个托管账户。';
  return {
    meta: {
      slug: 'bybit-custody-launch',
      lane: 'event',
      event_type: 'product_launch',
      title: {
        en: 'Bybit launched custody accounts',
        'zh-Hans': 'Bybit 推出托管账户'
      },
      subject: { en: 'Bybit', 'zh-Hans': 'Bybit' },
      title_event_terms: { en: ['launched'], 'zh-Hans': ['推出'] },
      primaryQuery: 'Bybit custody launch',
      entities: ['Bybit'],
      topic_tags: ['venue_support'],
      partner_names: [],
      relatedVenues: [],
      credibility: 2
    },
    articles: {
      en: `${en}\n\n## Source check\n${enValueBlock}\n`,
      'zh-Hans': `${zh}\n\n## 来源核查\n${zhValueBlock}\n`
    },
    claimsDocument: {
      claims: [{
        id: 'c1',
        key: true,
        kind: 'fact',
        texts: { en, 'zh-Hans': zh },
        evidence_ids: ['e1'],
        metadata: {}
      }, {
        id: 'c-value',
        key: false,
        kind: 'source_check',
        texts: { en: enValueBlock, 'zh-Hans': zhValueBlock },
        evidence_ids: ['e1'],
        metadata: {}
      }],
      quotes: [],
      ctaPlan: []
    },
    evidence: [{
      id: 'e1',
      url: 'https://example.com/bybit-custody-launch',
      kind: 'official_notice',
      excerpt: 'Bybit launched 2 custody accounts on 2026-10-12.',
      confidence: 'high',
      published_at: now,
      author_account: 'Bybit'
    }],
    history: [],
    humanReviews: [],
    now,
    historyComplete: true
  };
}

function clone(value) {
  return structuredClone(value);
}

function setMainClaim(pkg, { en, zh = en, kind = 'fact', metadata = {} }) {
  pkg.claimsDocument.claims[0] = {
    ...pkg.claimsDocument.claims[0],
    kind,
    texts: { en, 'zh-Hans': zh },
    metadata
  };
  pkg.articles.en = `${en}\n\n## Source check\n${enValueBlock}\n`;
  pkg.articles['zh-Hans'] = `${zh}\n\n## 来源核查\n${zhValueBlock}\n`;
}

function resultFor(mutator) {
  const pkg = basePackage();
  mutator?.(pkg);
  return checkPackage(pkg);
}

function assertRule(result, rule, severity) {
  assert.ok(
    result.reasons.some(reason => reason.rule === rule && (!severity || reason.severity === severity)),
    `expected ${rule}${severity ? `/${severity}` : ''}, got ${JSON.stringify(result.reasons)}`
  );
}

test('base bilingual synthetic package passes every gate', () => {
  const result = checkPackage(basePackage());
  assert.equal(result.status, 'pass');
  assert.equal(result.publishAllowed, true);
  assert.deepEqual(result.reasons, []);
});

test('allowed evidence shapes for risky rules still pass', () => {
  const cases = [
    ['T1/T2 sale wording with sale evidence', pkg => {
      pkg.meta.event_type = 'exchange_flow';
      pkg.meta.title.en = 'Bybit transferred tokens';
      pkg.meta.title['zh-Hans'] = 'Bybit 转移代币';
      pkg.meta.title_event_terms.en = ['transferred'];
      pkg.meta.title_event_terms['zh-Hans'] = ['转移'];
      pkg.evidence[0].finding = 'sale';
      setMainClaim(pkg, {
        en: 'Bybit reported transferring 2 tokens to an exchange and sold them on 2026-10-12.',
        zh: 'Bybit 于 2026 年 10 月 12 日报告将 2 个代币转入交易所并卖出。',
        metadata: { sale_confirmed_by: 'e1' }
      });
    }],
    ['T3 sourced address label', pkg => {
      pkg.evidence[0].label_source = 'etherscan';
      pkg.evidence[0].confidence = 'high';
      setMainClaim(pkg, {
        en: 'Bybit reported controlled address held 2 tokens on 2026-10-12.',
        zh: 'Bybit 于 2026 年 10 月 12 日报告控制地址持有 2 个代币。',
        kind: 'address_label',
        metadata: { address_owner: 'Bybit', label_source: 'etherscan', confidence: 'high' }
      });
    }],
    ['L1/L2 valid liquidation metadata', pkg => {
      pkg.meta.event_type = 'liquidation_wave';
      pkg.meta.title.en = 'Bybit recorded liquidations';
      pkg.meta.title['zh-Hans'] = 'Bybit 录得爆仓';
      pkg.meta.title_event_terms.en = ['recorded'];
      pkg.meta.title_event_terms['zh-Hans'] = ['录得'];
      setMainClaim(pkg, {
        en: 'Bybit recorded 2 million dollars of BTC liquidations in 1h on 2026-10-12, a lower bound.',
        zh: 'Bybit 于 2026 年 10 月 12 日录得 1h 内 BTC 2 百万美元爆仓，为下限。',
        kind: 'liquidation',
        metadata: { liquidation_type: 'realized', window: '1h', venues: ['Bybit'], coins: ['BTC'], source: 'e1', lower_bound: true }
      });
    }],
    ['R1 stronger bankruptcy term with court evidence', pkg => {
      pkg.evidence[0].kind = 'court_record';
      pkg.evidence[0].finding = 'in_bankruptcy';
      setMainClaim(pkg, {
        en: 'Bybit is bankrupt with 2 accounts on 2026-10-12.',
        zh: 'Bybit 于 2026 年 10 月 12 日已破产，涉及 2 个账户。'
      });
    }],
    ['Q1 exact original quote evidence', pkg => {
      const quoteSentence = 'Ben said "we launched 2 accounts" on 2026-10-12.';
      pkg.evidence[0].kind = 'original_statement';
      pkg.evidence[0].excerpt = 'Ben said we launched 2 accounts.';
      pkg.evidence[0].author_account = 'Ben';
      pkg.claimsDocument.quotes = [{
        locale: 'en',
        text: 'we launched 2 accounts',
        speaker: 'Ben',
        date: now,
        evidence_id: 'e1'
      }];
      pkg.articles.en = `${pkg.claimsDocument.claims[0].texts.en} ${quoteSentence}\n\n## Source check\n${enValueBlock}\n`;
      pkg.claimsDocument.claims.push({
        id: 'q-body',
        key: false,
        kind: 'fact',
        texts: { en: quoteSentence, 'zh-Hans': 'Ben 于 2026 年 10 月 12 日表示推出 2 个账户。' },
        evidence_ids: ['e1'],
        metadata: {}
      });
    }],
    ['Q2 attributed prediction', pkg => {
      setMainClaim(pkg, {
        en: 'Bybit said it will launch 2 custody accounts on 2026-10-12.',
        zh: 'Bybit 表示将会于 2026 年 10 月 12 日推出 2 个托管账户。'
      });
    }],
    ['C1 tentative causation with mechanism and separated analysis', pkg => {
      pkg.meta.event_type = 'politics_market';
      pkg.meta.title.en = 'Bitcoin recorded election move';
      pkg.meta.title['zh-Hans'] = 'Bitcoin 录得选举行情';
      pkg.meta.subject.en = 'Bitcoin';
      pkg.meta.subject['zh-Hans'] = 'Bitcoin';
      pkg.meta.title_event_terms.en = ['recorded'];
      pkg.meta.title_event_terms['zh-Hans'] = ['录得'];
      pkg.meta.mechanism = 'ETF flow channel';
      pkg.meta.analysis = 'separate analysis';
      pkg.meta.fact_summary = 'price and election news are separate facts';
      setMainClaim(pkg, {
        en: 'Bitcoin recorded a 2 percent move that may reflect election news flows on 2026-10-12.',
        zh: 'Bitcoin 于 2026 年 10 月 12 日录得 2% 波动，可能反映选举消息相关资金流。'
      });
    }],
    ['D1 dispute with sourced response URL', pkg => {
      pkg.meta.event_type = 'dispute';
      pkg.meta.title.en = 'Bybit reported dispute';
      pkg.meta.title['zh-Hans'] = 'Bybit 报告争议';
      pkg.meta.title_event_terms.en = ['reported'];
      pkg.meta.title_event_terms['zh-Hans'] = ['报告'];
      pkg.meta.counterparty_response = pkg.evidence[0].url;
      setMainClaim(pkg, {
        en: 'Bybit reported 2 disputed accounts on 2026-10-12.',
        zh: 'Bybit 于 2026 年 10 月 12 日报告 2 个争议账户。'
      });
      pkg.articles.en += `[Counterparty response](${pkg.evidence[0].url})\n`;
      pkg.articles['zh-Hans'] += `[对方回应](${pkg.evidence[0].url})\n`;
    }],
    ['D2 fraud wording with official finding', pkg => {
      pkg.evidence[0].finding = 'fraud';
      setMainClaim(pkg, {
        en: 'Bybit reported a fraud finding involving 2 accounts on 2026-10-12.',
        zh: 'Bybit 于 2026 年 10 月 12 日报告涉及 2 个账户的诈骗认定。'
      });
    }],
    ['H1 heat wording with measured discussion', pkg => {
      pkg.meta.discussion = { independent_posts: 3 };
      setMainClaim(pkg, {
        en: 'Bybit reported viral discussion of 2 custody accounts on 2026-10-12.',
        zh: 'Bybit 于 2026 年 10 月 12 日报告 2 个托管账户全网热议。'
      });
    }],
    ['CTA1 valid partner directive', pkg => {
      pkg.evidence[0].venues = ['Bybit'];
      pkg.meta.partner_names = ['Bybit'];
      pkg.meta.relatedVenues = ['Bybit'];
      pkg.claimsDocument.ctaPlan = [{ intent: 'venue_support', venue: 'Bybit' }];
      pkg.articles.en += '::cta venue_support Bybit\n';
    }],
    ['B1 reviewed by with dated human record', pkg => {
      pkg.meta.human_reviewed_by = 'Alice';
      pkg.meta.human_reviewed_at = now;
      pkg.humanReviews = [{ slug: pkg.meta.slug, reviewer: 'Alice', reviewed_at: now }];
      pkg.articles.en += 'Reviewed by Alice.\n';
    }],
    ['DUP ignores old duplicate-looking history', pkg => {
      pkg.history = [{ slug: 'old', title: { en: pkg.meta.title.en }, recordedAt: '2026-10-09T10:00:00Z' }];
    }]
  ];

  for (const [name, mutator] of cases) {
    const pkg = basePackage();
    mutator(pkg);
    const result = checkPackage(pkg);
    assert.equal(result.status, 'pass', `${name}: ${JSON.stringify(result.reasons)}`);
    assert.equal(result.publishAllowed, true, name);
  }
});

test('legacy packages without claims.json go to review', () => {
  const pkg = basePackage();
  pkg.claimsDocument = undefined;
  const result = checkPackage(pkg);
  assert.equal(result.status, 'needs-review');
  assert.equal(result.publishAllowed, false);
  assertRule(result, 'LEGACY', 'needs-review');
});

test('localized editions outside the EN/ZH lexicons require review', () => {
  const pkg = basePackage();
  const tr = 'Bybit 2026-10-12 tarihinde 2 saklama hesabı başlattı.';
  pkg.meta.title.tr = 'Bybit saklama hesaplarını başlattı';
  pkg.meta.subject.tr = 'Bybit';
  pkg.meta.title_event_terms.tr = ['başlattı'];
  pkg.articles.tr = `${tr}\n\n## Source check\n`;
  pkg.claimsDocument.claims[0].texts.tr = tr;
  const result = checkPackage(pkg);
  assert.equal(result.status, 'needs-review');
  assertRule(result, 'LOCALE', 'needs-review');
});

test('G1 fails invalid evidence references and duplicate IDs', () => {
  const result = resultFor(pkg => {
    pkg.evidence.push({ ...pkg.evidence[0] });
    pkg.claimsDocument.claims[0].evidence_ids = ['missing'];
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'G1', 'fail');
});

test('G1 fails title numbers missing from locale claims', () => {
  const result = resultFor(pkg => {
    pkg.meta.title.en = 'Bybit launched 999 custody accounts';
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'G1', 'fail');
});

test('G1 accepts mapped decimal body numbers without sentence-splitting artifacts', () => {
  const result = resultFor(pkg => {
    setMainClaim(pkg, {
      en: 'Bybit launched 12.54 custody accounts on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日推出 12.54 个托管账户。'
    });
  });
  assert.equal(result.status, 'pass', JSON.stringify(result.reasons));
});

test('G1 fails unmapped decimal body numbers', () => {
  const result = resultFor(pkg => {
    pkg.articles.en += 'The spread was 12.54 percent.\n';
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'G1', 'fail');
});

test('G2 reviews unmapped name-bearing body facts', () => {
  const result = resultFor(pkg => {
    pkg.articles.en += 'Alpaca reported custody.\n';
  });
  assert.equal(result.status, 'needs-review');
  assertRule(result, 'G2', 'needs-review');
});

test('T1 blocks transfer-as-sale wording without sale evidence', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'whale_transfer';
    pkg.meta.title.en = 'Bybit transferred tokens';
    pkg.meta.title['zh-Hans'] = 'Bybit 转移代币';
    pkg.meta.title_event_terms.en = ['transferred'];
    pkg.meta.title_event_terms['zh-Hans'] = ['转移'];
    setMainClaim(pkg, {
      en: 'Bybit transferred and sold 2 tokens on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日转移并卖出 2 个代币。'
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'T1', 'fail');
});

test('T1 blocks sale_confirmed_by when the referenced evidence is only a transfer finding', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'exchange_flow';
    pkg.meta.title.en = 'Bybit transferred tokens';
    pkg.meta.title['zh-Hans'] = 'Bybit 转移代币';
    pkg.meta.title_event_terms.en = ['transferred'];
    pkg.meta.title_event_terms['zh-Hans'] = ['转移'];
    pkg.evidence[0].kind = 'onchain_tx';
    pkg.evidence[0].finding = 'transfer';
    setMainClaim(pkg, {
      en: 'Bybit reported transferring 2 tokens to an exchange and sold them on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日报告将 2 个代币转入交易所并卖出。',
      metadata: { sale_confirmed_by: 'e1' }
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'T1', 'fail');
  assertRule(result, 'T2', 'fail');
});

test('T2 blocks exchange-deposit-as-dumping wording without sale evidence', () => {
  const result = resultFor(pkg => {
    setMainClaim(pkg, {
      en: 'Bybit transferred 2 tokens to an exchange and dumped them on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日将 2 个代币转入交易所并抛售。'
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'T2', 'fail');
});

test('T3 blocks named owners for unknown addresses', () => {
  const result = resultFor(pkg => {
    setMainClaim(pkg, {
      en: 'Bybit controlled address held 2 tokens on 2026-10-12.',
      zh: 'Bybit 控制的地址于 2026 年 10 月 12 日持有 2 个代币。',
      kind: 'address_label',
      metadata: { address_unknown: true, address_owner: 'Bybit' }
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'T3', 'fail');
});

test('T3 detects controlled address wording even when the claim kind is fact', () => {
  const result = resultFor(pkg => {
    setMainClaim(pkg, {
      en: 'Bybit controlled address held 2 tokens on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日控制地址持有 2 个代币。',
      kind: 'fact'
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'T3', 'fail');
});

test('L1 requires liquidation type, window, venues, coins, source and lower-bound metadata', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'liquidation_wave';
    pkg.meta.title.en = 'Bybit recorded liquidations';
    pkg.meta.title['zh-Hans'] = 'Bybit 录得爆仓';
    pkg.meta.title_event_terms.en = ['recorded'];
    pkg.meta.title_event_terms['zh-Hans'] = ['录得'];
    setMainClaim(pkg, {
      en: 'Bybit recorded 2 million dollars of liquidations on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日录得 2 百万美元爆仓。',
      kind: 'liquidation',
      metadata: {}
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'L1', 'fail');
});

test('L1 total=false still requires single-position wording and total words override it', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'liquidation_wave';
    pkg.meta.title.en = 'Bybit recorded liquidations';
    pkg.meta.title['zh-Hans'] = 'Bybit 录得爆仓';
    pkg.meta.title_event_terms.en = ['recorded'];
    pkg.meta.title_event_terms['zh-Hans'] = ['录得'];
    setMainClaim(pkg, {
      en: 'Bybit recorded a total 2 million dollars of liquidations on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日录得总计 2 百万美元爆仓。',
      kind: 'liquidation',
      metadata: { liquidation_type: 'realized', total: false }
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'L1', 'fail');
});

test('L1 requires liquidation total details to be visible, not only metadata', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'liquidation_wave';
    pkg.meta.title.en = 'Bybit recorded liquidations';
    pkg.meta.title['zh-Hans'] = 'Bybit 录得爆仓';
    pkg.meta.title_event_terms.en = ['recorded'];
    pkg.meta.title_event_terms['zh-Hans'] = ['录得'];
    setMainClaim(pkg, {
      en: 'Bybit recorded 2 million dollars of liquidations on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日录得 2 百万美元爆仓。',
      kind: 'liquidation',
      metadata: { liquidation_type: 'realized', window: '1h', venues: ['Bybit'], coins: ['BTC'], source: 'e1', lower_bound: true }
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'L1', 'fail');
});

test('L2 blocks summing liquidation snapshots from the same source', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'liquidation_wave';
    pkg.meta.title.en = 'Bybit recorded liquidations';
    pkg.meta.title['zh-Hans'] = 'Bybit 录得爆仓';
    pkg.meta.title_event_terms.en = ['recorded'];
    pkg.meta.title_event_terms['zh-Hans'] = ['录得'];
    setMainClaim(pkg, {
      en: 'Bybit recorded 2 million dollars of BTC liquidations in 1h on 2026-10-12, a lower bound.',
      zh: 'Bybit 于 2026 年 10 月 12 日录得 1h 内 BTC 2 百万美元爆仓，为下限。',
      kind: 'liquidation',
      metadata: {
        liquidation_type: 'realized',
        window: '1h',
        venues: ['Bybit'],
        coins: ['BTC'],
        source: 'e1',
        lower_bound: true,
        sum_of: ['p1', 'p2']
      }
    });
    pkg.claimsDocument.claims.push(
      { id: 'p1', key: false, kind: 'liquidation', texts: { en: 'Part one.', 'zh-Hans': '部分一。' }, evidence_ids: ['e1'], metadata: { source: 'market-a', snapshot_at: '2026-10-12T11:00:00Z' } },
      { id: 'p2', key: false, kind: 'liquidation', texts: { en: 'Part two.', 'zh-Hans': '部分二。' }, evidence_ids: ['e1'], metadata: { source: 'market-a', snapshot_at: '2026-10-12T11:05:00Z' } }
    );
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'L2', 'fail');
});

test('L2 blocks same-source snapshots even at the same UTC time', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'liquidation_wave';
    pkg.meta.title.en = 'Bybit recorded liquidations';
    pkg.meta.title['zh-Hans'] = 'Bybit 录得爆仓';
    pkg.meta.title_event_terms.en = ['recorded'];
    pkg.meta.title_event_terms['zh-Hans'] = ['录得'];
    setMainClaim(pkg, {
      en: 'Bybit recorded 2 million dollars of BTC liquidations in 1h on 2026-10-12, a lower bound.',
      zh: 'Bybit 于 2026 年 10 月 12 日录得 1h 内 BTC 2 百万美元爆仓，为下限。',
      kind: 'liquidation',
      metadata: {
        liquidation_type: 'realized',
        window: '1h',
        venues: ['Bybit'],
        coins: ['BTC'],
        source: 'e1',
        lower_bound: true,
        sum_of: ['p1', 'p2']
      }
    });
    pkg.claimsDocument.claims.push(
      { id: 'p1', key: false, kind: 'liquidation', texts: { en: 'Part one.', 'zh-Hans': '部分一。' }, evidence_ids: ['e1'], metadata: { source: 'market-a', snapshot_at: '2026-10-12T11:00:00Z' } },
      { id: 'p2', key: false, kind: 'liquidation', texts: { en: 'Part two.', 'zh-Hans': '部分二。' }, evidence_ids: ['e1'], metadata: { source: 'market-a', snapshot_at: '2026-10-12T11:00:00Z' } }
    );
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'L2', 'fail');
});

test('L2 requires summed parts to be liquidation or arithmetic claims with UTC snapshots', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'liquidation_wave';
    pkg.meta.title.en = 'Bybit recorded liquidations';
    pkg.meta.title['zh-Hans'] = 'Bybit 录得爆仓';
    pkg.meta.title_event_terms.en = ['recorded'];
    pkg.meta.title_event_terms['zh-Hans'] = ['录得'];
    setMainClaim(pkg, {
      en: 'Bybit recorded 2 million dollars of BTC liquidations in 1h on 2026-10-12, a lower bound.',
      zh: 'Bybit 于 2026 年 10 月 12 日录得 1h 内 BTC 2 百万美元爆仓，为下限。',
      kind: 'liquidation',
      metadata: {
        liquidation_type: 'realized',
        window: '1h',
        venues: ['Bybit'],
        coins: ['BTC'],
        source: 'e1',
        lower_bound: true,
        sum_of: ['p1', 'p2']
      }
    });
    pkg.claimsDocument.claims.push(
      { id: 'p1', key: false, kind: 'fact', texts: { en: 'Part one.', 'zh-Hans': '部分一。' }, evidence_ids: ['e1'], metadata: { source: 'market-a', snapshot_at: '2026-10-12T11:00:00Z' } },
      { id: 'p2', key: false, kind: 'liquidation', texts: { en: 'Part two.', 'zh-Hans': '部分二。' }, evidence_ids: ['e1'], metadata: { source: 'market-b', snapshot_at: '2026-10-12 11:05:00' } }
    );
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'L2', 'fail');
});

test('R1 blocks stronger halt-ladder and rug claims without official finding evidence', () => {
  const result = resultFor(pkg => {
    setMainClaim(pkg, {
      en: 'Bybit halted withdrawals and is bankrupt with 2 accounts on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日暂停提现并已破产，涉及 2 个账户。'
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'R1', 'fail');
});

test('R1 bans rug wording in headlines', () => {
  const result = resultFor(pkg => {
    pkg.meta.title.en = 'Bybit rug pull custody launch';
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'R1', 'fail');
});

test('Q1 requires quote text, speaker and date to match original evidence', () => {
  const result = resultFor(pkg => {
    const quoteSentence = 'Ben said "we launched 2 accounts" on 2026-10-12.';
    pkg.articles.en = `${pkg.claimsDocument.claims[0].texts.en} ${quoteSentence}\n\n## Source check\n`;
    pkg.claimsDocument.claims.push({
      id: 'q-body',
      key: false,
      kind: 'fact',
      texts: { en: quoteSentence, 'zh-Hans': 'Ben 于 2026 年 10 月 12 日表示推出 2 个账户。' },
      evidence_ids: ['e1'],
      metadata: {}
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'Q1', 'fail');
});

test('Q2 sends unattributed predictions to review', () => {
  const result = resultFor(pkg => {
    setMainClaim(pkg, {
      en: 'Bybit will launch 2 custody accounts on 2026-10-12.',
      zh: 'Bybit 将会于 2026 年 10 月 12 日推出 2 个托管账户。'
    });
  });
  assert.equal(result.status, 'needs-review');
  assertRule(result, 'Q2', 'needs-review');
});

test('C1 sends unsupported politics or macro causation to review', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'politics_market';
    pkg.meta.title.en = 'Bitcoin recorded election move';
    pkg.meta.title['zh-Hans'] = 'Bitcoin 录得选举行情';
    pkg.meta.subject.en = 'Bitcoin';
    pkg.meta.subject['zh-Hans'] = 'Bitcoin';
    pkg.meta.title_event_terms.en = ['recorded'];
    pkg.meta.title_event_terms['zh-Hans'] = ['录得'];
    setMainClaim(pkg, {
      en: 'Bitcoin recorded a 2 percent move because election news changed flows on 2026-10-12.',
      zh: 'Bitcoin 于 2026 年 10 月 12 日因为选举消息录得 2% 波动。'
    });
  });
  assert.equal(result.status, 'needs-review');
  assertRule(result, 'C1', 'needs-review');
});

test('D1 requires a sourced response or explicit checked no-response statement', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'dispute';
    pkg.meta.title.en = 'Bybit reported dispute';
    pkg.meta.title['zh-Hans'] = 'Bybit 报告争议';
    pkg.meta.title_event_terms.en = ['reported'];
    pkg.meta.title_event_terms['zh-Hans'] = ['报告'];
    setMainClaim(pkg, {
      en: 'Bybit reported 2 disputed accounts on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日报告 2 个争议账户。'
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'D1', 'fail');
});

test('D1 requires response evidence to be visible in every locale body', () => {
  const result = resultFor(pkg => {
    pkg.meta.event_type = 'dispute';
    pkg.meta.title.en = 'Bybit reported dispute';
    pkg.meta.title['zh-Hans'] = 'Bybit 报告争议';
    pkg.meta.title_event_terms.en = ['reported'];
    pkg.meta.title_event_terms['zh-Hans'] = ['报告'];
    pkg.meta.counterparty_response = pkg.evidence[0].url;
    setMainClaim(pkg, {
      en: 'Bybit reported 2 disputed accounts on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日报告 2 个争议账户。'
    });
    pkg.articles.en += `[Counterparty response](${pkg.evidence[0].url})\n`;
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'D1', 'fail');
});

test('D2 sends unproven fraud allegations to review', () => {
  const result = resultFor(pkg => {
    setMainClaim(pkg, {
      en: 'Bybit reported a fraud claim involving 2 accounts on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日报告涉及 2 个账户的诈骗指控。'
    });
  });
  assert.equal(result.status, 'needs-review');
  assertRule(result, 'D2', 'needs-review');
});

test('D2 sends headline fraud allegations to review without official evidence', () => {
  const result = resultFor(pkg => {
    pkg.meta.title.en = 'Bybit launched fraud claim custody accounts';
  });
  assert.equal(result.status, 'needs-review');
  assertRule(result, 'D2', 'needs-review');
});

test('H1 requires measured discussion before heat words', () => {
  const result = resultFor(pkg => {
    setMainClaim(pkg, {
      en: 'Bybit went viral with 2 custody accounts on 2026-10-12.',
      zh: 'Bybit 于 2026 年 10 月 12 日因 2 个托管账户全网热议。'
    });
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'H1', 'fail');
});

test('TT1 blocks hype titles and non-literal wrongdoing questions', () => {
  const result = resultFor(pkg => {
    pkg.meta.title.en = 'Bybit guaranteed custody moon';
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'TT1', 'fail');
});

test('W1 requires a core-fact opener and value block', () => {
  const result = resultFor(pkg => {
    const en = 'The launch included 2 custody accounts on 2026-10-12.';
    const zh = '此次上线于 2026 年 10 月 12 日包括 2 个托管账户。';
    pkg.claimsDocument.claims[0].texts = { en, 'zh-Hans': zh };
    pkg.articles.en = `${en}\n`;
    pkg.articles['zh-Hans'] = `${zh}\n`;
  });
  assert.equal(result.status, 'needs-review');
  assertRule(result, 'W1', 'needs-review');
});

test('W1 rejects empty value-block headings', () => {
  const result = resultFor(pkg => {
    const en = pkg.claimsDocument.claims[0].texts.en;
    const zh = pkg.claimsDocument.claims[0].texts['zh-Hans'];
    pkg.articles.en = `${en}\n\n## Source check\n`;
    pkg.articles['zh-Hans'] = `${zh}\n\n## 来源核查\n`;
  });
  assert.equal(result.status, 'needs-review');
  assertRule(result, 'W1', 'needs-review');
});

test('CTA1 blocks bad CTA shape, prose codes and disclaimer paragraphs', () => {
  const result = resultFor(pkg => {
    pkg.articles.en += '::cta signup Bybit\n::cta fees Bybit\n::cta venue_support Bybit\nNew users can use code 48553. This is not financial advice.\n';
    pkg.claimsDocument.ctaPlan = [
      { intent: 'signup', venue: 'Bybit' },
      { intent: 'fees', venue: 'Bybit' },
      { intent: 'venue_support', venue: 'Bybit' }
    ];
    pkg.meta.partner_names = ['Bybit'];
    pkg.meta.relatedVenues = ['Bybit'];
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'CTA1', 'fail');
});

test('B1 blocks Reviewed by claims without a dated human review record', () => {
  const result = resultFor(pkg => {
    pkg.articles.en += 'Reviewed by Alice.\n';
    pkg.meta.human_reviewed_by = 'Alice';
    pkg.meta.human_reviewed_at = now;
  });
  assert.equal(result.status, 'fail');
  assertRule(result, 'B1', 'fail');
});

test('AUTO sends otherwise valid low-credibility packages to review', () => {
  const result = resultFor(pkg => {
    pkg.meta.credibility = 1;
  });
  assert.equal(result.status, 'needs-review');
  assertRule(result, 'AUTO', 'needs-review');
});

test('DUP blocks duplicate titles and reviews incomplete history inputs', () => {
  const duplicate = resultFor(pkg => {
    pkg.history = [{
      slug: 'older-bybit-custody-launch',
      title: { en: pkg.meta.title.en },
      primaryQuery: 'different query',
      recordedAt: '2026-10-12T10:00:00Z'
    }];
  });
  assert.equal(duplicate.status, 'fail');
  assertRule(duplicate, 'DUP', 'fail');

  const incompleteRecentPublication = resultFor(pkg => {
    pkg.history = [{
      slug: 'ledger-row-without-feed-metadata',
      status: 'PUBLISHED_AND_VERIFIED',
      recordedAt: '2026-10-12T10:30:00Z'
    }];
  });
  assert.equal(incompleteRecentPublication.status, 'needs-review');
  assertRule(incompleteRecentPublication, 'DUP', 'needs-review');

  const incomplete = resultFor(pkg => {
    pkg.historyComplete = false;
  });
  assert.equal(incomplete.status, 'needs-review');
  assertRule(incomplete, 'DUP', 'needs-review');
});

async function writePackage(root, pkg) {
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'meta.json'), `${JSON.stringify(pkg.meta, null, 2)}\n`);
  await writeFile(path.join(root, 'article.en.md'), pkg.articles.en);
  await writeFile(path.join(root, 'article.zh-Hans.md'), pkg.articles['zh-Hans']);
  await writeFile(path.join(root, 'claims.json'), `${JSON.stringify({ ...pkg.claimsDocument, evidence: pkg.evidence }, null, 2)}\n`);
}

async function runCli(packageDir, historyPath, ledgerPath, queueDir, reviewsPath) {
  const args = [
    path.join(gateDir, 'check-package.mjs'),
    packageDir,
    '--history',
    historyPath,
    '--ledger',
    ledgerPath,
    '--queue',
    queueDir,
    '--now',
    now
  ];
  if (reviewsPath) args.push('--reviews', reviewsPath);
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, args, { cwd: repoRoot });
    return { code: 0, stdout, stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test('CLI loads package/history/ledger inputs and returns exit 0, 1 and 2 with review queue IO', async () => {
  await mkdir(scratchRoot, { recursive: true });
  const root = await mkdtemp(path.join(scratchRoot, 'cli-'));
  const historyPath = path.join(root, 'history.json');
  const ledgerPath = path.join(root, 'ledger.jsonl');
  const queueDir = path.join(root, 'queue');
  try {
    await writeFile(historyPath, '{"articles":[]}\n');
    await writeFile(ledgerPath, '');

    const passingDir = path.join(root, 'pass');
    await writePackage(passingDir, basePackage());
    const pass = await runCli(passingDir, historyPath, ledgerPath, queueDir);
    assert.equal(pass.code, 0);
    assert.equal(JSON.parse(pass.stdout).status, 'pass');

    const failing = basePackage();
    failing.meta.title.en = 'Bybit guaranteed custody moon';
    const failingDir = path.join(root, 'fail');
    await writePackage(failingDir, failing);
    const fail = await runCli(failingDir, historyPath, ledgerPath, queueDir);
    assert.equal(fail.code, 1);
    assert.equal(JSON.parse(fail.stdout).status, 'fail');

    const review = basePackage();
    review.meta.credibility = 1;
    const reviewDir = path.join(root, 'review');
    await writePackage(reviewDir, review);
    const needsReview = await runCli(reviewDir, historyPath, ledgerPath, queueDir);
    assert.equal(needsReview.code, 2);
    const envelope = JSON.parse(needsReview.stdout);
    assert.equal(envelope.status, 'needs-review');
    assert.ok(envelope.queue_file.startsWith(queueDir));
    const queued = JSON.parse(await readFile(envelope.queue_file, 'utf8'));
    assert.equal(queued.status, 'needs-review');
    assertRule(queued, 'AUTO', 'needs-review');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI fails with INPUT on missing required package argument', async () => {
  const cli = path.join(gateDir, 'check-package.mjs');
  let result;
  try {
    await execFileAsync(process.execPath, [cli], { cwd: repoRoot });
    assert.fail('CLI without args should fail');
  } catch (error) {
    result = { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
  assert.equal(result.code, 1);
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.status, 'fail');
  assertRule(envelope, 'INPUT', 'fail');
});

test('CLI accepts trusted --reviews records for Reviewed by copy', async () => {
  await mkdir(scratchRoot, { recursive: true });
  const root = await mkdtemp(path.join(scratchRoot, 'reviews-'));
  const packageDir = path.join(root, 'reviewed');
  const historyPath = path.join(root, 'history.json');
  const ledgerPath = path.join(root, 'ledger.jsonl');
  const queueDir = path.join(root, 'queue');
  const reviewsPath = path.join(root, 'reviews.json');
  const pkg = basePackage();
  pkg.meta.human_reviewed_by = 'Alice';
  pkg.meta.human_reviewed_at = now;
  pkg.articles.en += 'Reviewed by Alice.\n';

  try {
    await writePackage(packageDir, pkg);
    await writeFile(historyPath, '{"articles":[]}\n');
    await writeFile(ledgerPath, '');
    await writeFile(reviewsPath, `${JSON.stringify([{ slug: pkg.meta.slug, reviewer: 'Alice', reviewed_at: now }])}\n`);

    const result = await runCli(packageDir, historyPath, ledgerPath, queueDir, reviewsPath);
    assert.equal(result.code, 0, result.stdout || result.stderr);
    assert.equal(JSON.parse(result.stdout).status, 'pass');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI enriches recent ledger rows from staged package metadata before duplicate checks', async () => {
  await mkdir(scratchRoot, { recursive: true });
  const root = await mkdtemp(path.join(scratchRoot, 'ledger-'));
  const currentDir = path.join(root, 'current');
  const queueDir = path.join(root, 'queue');
  const historyPath = path.join(root, 'history.json');
  const ledgerDir = path.join(root, 'state', 'engine', 'ledger');
  const ledgerPath = path.join(ledgerDir, 'article-ledger.jsonl');
  const stagedPackageDir = path.join(root, 'packages', 'older-bybit-package');

  try {
    await writePackage(currentDir, basePackage());
    await mkdir(ledgerDir, { recursive: true });
    await mkdir(stagedPackageDir, { recursive: true });
    await writeFile(historyPath, '{"articles":[]}\n');
    await writeFile(path.join(stagedPackageDir, 'meta.json'), `${JSON.stringify({
      slug: 'older-bybit-package',
      title: { en: 'Different venue launched custody accounts' },
      primaryQuery: 'different venue custody launch'
    }, null, 2)}\n`);
    await writeFile(ledgerPath, `${JSON.stringify({
      slug: 'older-bybit-package',
      status: 'PUBLISHED_AND_VERIFIED',
      recordedAt: '2026-10-12T10:00:00Z',
      packagePath: 'packages/older-bybit-package'
    })}\n`);

    const result = await runCli(currentDir, historyPath, ledgerPath, queueDir);
    assert.equal(result.code, 0, result.stdout || result.stderr);
    assert.equal(JSON.parse(result.stdout).status, 'pass');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('real copied fixtures load as legacy packages until claims.json migration exists', async () => {
  const fixturesRoot = path.resolve('ops/newsroom/gates/fixtures/real');
  const fixtureNames = [
    'bybit-us-stocks-etfs-usdc-alpaca-what-you-own',
    'reserve-rights-rsr-upbit-listing-46-percent-negative-funding',
    'standard-chartered-rlusd-custody-lmax-collateral-what-it-means'
  ];

  for (const name of fixtureNames) {
    const loaded = await loadPackage(path.join(fixturesRoot, name));
    assert.ok(loaded.meta.slug, name);
    assert.ok(loaded.articles.en.trim(), name);
    assert.ok(loaded.articles['zh-Hans'].trim(), name);
    const result = checkPackage({ ...loaded, history: [], now, historyComplete: true });
    assert.equal(result.status, 'needs-review', name);
    assertRule(result, 'LEGACY', 'needs-review');
  }
});

test('risk wording in headlines cannot bypass body gates', () => {
  const sale = basePackage();
  sale.meta.event_type = 'whale_transfer';
  sale.meta.title.en = 'Bybit launched custody accounts and sold tokens';
  assertRule(checkPackage(sale), 'T1', 'fail');
  const bankruptcy = basePackage();
  bankruptcy.meta.title.en = 'Bybit launched custody accounts in bankruptcy';
  assertRule(checkPackage(bankruptcy), 'R1', 'fail');
  const prediction = basePackage();
  prediction.meta.title.en = 'Bybit will launch 2 accounts';
  prediction.meta.title_event_terms.en = ['launch'];
  assertRule(checkPackage(prediction), 'Q2', 'needs-review');
  const quotation = basePackage();
  quotation.meta.title.en = 'Bybit launched "safe accounts"';
  assertRule(checkPackage(quotation), 'Q1', 'fail');
});

test('arithmetic marker cannot bypass rug and allegation wording gates', () => {
  const pkg = basePackage();
  const sentence = '(our arithmetic: Bybit recorded a rug pull involving 2 accounts).';
  pkg.articles.en += sentence;
  pkg.claimsDocument.claims.push({ id: 'arithmetic', key: true, kind: 'arithmetic', texts: { en: sentence }, evidence_ids: ['e1'], metadata: {} });
  assertRule(checkPackage(pkg), 'R1', 'fail');
});

test('CTA registry and topic tags cannot be supplied solely by writer metadata', () => {
  const unknown = basePackage();
  unknown.meta.partner_names = ['WEEX'];
  unknown.meta.relatedVenues = ['WEEX'];
  unknown.evidence[0].venues = ['WEEX'];
  unknown.claimsDocument.ctaPlan = [{ intent: 'venue_support', venue: 'WEEX' }];
  unknown.articles.en += '::cta venue_support WEEX\n';
  assertRule(checkPackage(unknown), 'CTA1', 'fail');
  const missingTags = basePackage();
  missingTags.meta.topic_tags = [];
  missingTags.claimsDocument.ctaPlan = [{ intent: 'site_tool' }];
  missingTags.articles.en += '::cta site_tool\n';
  assertRule(checkPackage(missingTags), 'CTA1', 'fail');
  const mentions = basePackage();
  mentions.meta.partner_names = [];
  mentions.articles.en += 'Binance OKX Bitget.\n';
  assertRule(checkPackage(mentions), 'CTA1', 'fail');
});
