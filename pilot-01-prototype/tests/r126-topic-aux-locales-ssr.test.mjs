import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const locales = ['en','zh-Hans','zh-Hant','ja','ko','tr','es','pt-BR','fr','de','ru','ar','id','vi','it'];
const expected = {
  en: { badge: 'Source-bound meme coin platform checklist', summary: 'Review topic scope and verification boundaries', pills: ['Token and pool verification', 'Published fee and spread checks', 'Wallet approval and MEV boundaries', 'Exit path and regional terms'] },
  'zh-Hans': { badge: '来源约束的 Meme 币平台检查清单', summary: '查看专题范围与核验边界', pills: ['合约地址与池子核验', '公开费率与价差检查', '钱包授权与 MEV 边界', '退出路径与地区条件'] },
  'zh-Hant': { badge: '來源約束的 Meme 幣平台檢查清單', summary: '檢視專題範圍與核驗邊界', pills: ['合約地址與池子核驗', '公開費率與價差檢查', '錢包授權與 MEV 邊界', '退出路徑與地區條件'] },
  ja: { badge: '出典に基づくミームコインプラットフォームチェックリスト', summary: 'トピック範囲と確認境界を確認', pills: ['トークンとプールを確認', '公開手数料とスプレッドを確認', 'ウォレット承認とMEV境界を確認', '出口経路と地域条件を確認'] },
  ko: { badge: '출처 기반 밈코인 플랫폼 체크리스트', summary: '주제 범위와 검증 경계 확인', pills: ['토큰과 풀 검증', '공개 수수료와 스프레드 확인', '지갑 승인과 MEV 경계', '출구 경로와 지역 조건'] },
  tr: { badge: 'Kaynak sınırlı meme coin platform kontrol listesi', summary: 'Konu kapsamını ve doğrulama sınırlarını incele', pills: ['Token ve havuz doğrulaması', 'Yayınlanmış ücret ve spread kontrolü', 'Cüzdan onayı ve MEV sınırları', 'Çıkış yolu ve bölgesel koşullar'] },
  es: { badge: 'Checklist de plataformas meme coin basado en fuentes', summary: 'Revisar alcance del tema y límites de verificación', pills: ['Verificación de token y pool', 'Comisiones publicadas y spread', 'Aprobación de wallet y límites MEV', 'Ruta de salida y condiciones regionales'] },
  'pt-BR': { badge: 'Checklist de plataformas meme coin com fontes', summary: 'Revisar escopo do tema e limites de verificação', pills: ['Verificação de token e pool', 'Taxas publicadas e spread', 'Aprovação da carteira e limites de MEV', 'Rota de saída e termos regionais'] },
  fr: { badge: 'Checklist de plateformes meme coin fondée sur les sources', summary: 'Vérifier le périmètre du sujet et les limites de vérification', pills: ['Vérification du token et du pool', 'Frais publiés et spread', 'Approbation du wallet et limites MEV', 'Chemin de sortie et conditions régionales'] },
  de: { badge: 'Quellengebundene Meme-Coin-Plattform-Checkliste', summary: 'Themenumfang und Prüfgrenzen ansehen', pills: ['Token- und Pool-Prüfung', 'Veröffentlichte Gebühren und Spread', 'Wallet-Freigabe und MEV-Grenzen', 'Ausstiegspfad und regionale Bedingungen'] },
  ru: { badge: 'Чеклист платформ meme coin с привязкой к источникам', summary: 'Проверить рамки темы и границы проверки', pills: ['Проверка токена и пула', 'Опубликованные комиссии и спред', 'Разрешение кошелька и границы MEV', 'Маршрут выхода и региональные условия'] },
  ar: { badge: 'قائمة تحقق قائمة على المصادر لمنصات عملات الميم', summary: 'راجع نطاق الموضوع وحدود التحقق', pills: ['فحص عقد الرمز والمجمع', 'الرسوم المنشورة والفارق', 'تفويض المحفظة وحدود MEV', 'مسار الخروج والشروط الإقليمية'] },
  id: { badge: 'Checklist platform meme coin berbasis sumber', summary: 'Tinjau cakupan topik dan batas verifikasi', pills: ['Verifikasi token dan pool', 'Biaya yang dipublikasikan dan spread', 'Persetujuan wallet dan batas MEV', 'Jalur keluar dan ketentuan wilayah'] },
  vi: { badge: 'Checklist nền tảng meme coin dựa trên nguồn', summary: 'Xem phạm vi chủ đề và ranh giới xác minh', pills: ['Xác minh token và pool', 'Phí công bố và spread', 'Phê duyệt ví và ranh giới MEV', 'Lộ trình thoát và điều kiện khu vực'] },
  it: { badge: 'Checklist piattaforme meme coin basata su fonti', summary: 'Rivedi ambito del tema e limiti di verifica', pills: ['Verifica token e pool', 'Commissioni pubblicate e spread', 'Approvazione wallet e limiti MEV', 'Percorso di uscita e condizioni regionali'] },
};
const englishLeak = /Source-bound meme coin platform checklist|Token and pool verification|Published fee and spread checks|Wallet approval and MEV boundaries|Exit path and regional terms|Review topic scope and verification boundaries/;
let rendered;
const dir = await mkdtemp(path.join(root, 'tests/.tmp-r126-topic-aux-'));
try {
  const entry = path.join(dir, 'entry.mjs');
  const bundle = path.join(dir, 'bundle.cjs');
  await writeFile(entry, `import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {TopicGuidePage} from '../../src/components/v3/TopicGuidePage.jsx'; const locales=${JSON.stringify(locales)}; const result={}; for (const locale of locales) result[locale]=renderToStaticMarkup(React.createElement(TopicGuidePage,{slug:'meme-coins',locale})); console.log(JSON.stringify(result));`);
  await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: bundle, loader: { '.css': 'empty' }, logLevel: 'silent' });
  rendered = JSON.parse(execFileSync(process.execPath, [bundle], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }));
} finally {
  await rm(dir, { recursive: true, force: true });
}

for (const locale of locales) {
  test(`meme topic auxiliary copy is localized in SSR for ${locale}`, () => {
    const html = rendered[locale].replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&quot;', '"');
    assert.ok(html.includes(expected[locale].badge), `${locale} badge is localized`);
    assert.ok(html.includes(expected[locale].summary), `${locale} context summary is localized`);
    for (const pill of expected[locale].pills) assert.ok(html.includes(pill), `${locale} pill appears: ${pill}`);
    if (locale !== 'en') assert.doesNotMatch(html, englishLeak, `${locale} does not leak English auxiliary copy`);
  });
}
