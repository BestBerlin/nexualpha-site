/**
 * AntiPhishingVerifier — 域名来源线索核对工具（承重柱二：信任建立）
 * 用户输入任意域名，核对是否匹配 NexuAlpha 已记录的来源线索。
 */
import { useState, useCallback, useMemo } from "react";
import { venueDatabase } from "../../data/venue-database.js";
import "./anti-phishing-verifier.css";

const copy = {
  "zh-Hans": {
    title: "官方域名反钓鱼核对",
    subtitle: "输入任意域名，核查是否匹配 NexuAlpha 已记录的官方来源。最终登录前仍请以平台官方页面为准。",
    placeholder: "输入域名，例如 binance.com",
    btnVerify: "立即核验",
    statusChecking: "正在核验…",
    resultSafe: "匹配已记录来源线索",
    resultDanger: "🚨 未知域名 — 请勿输入资产！",
    officialDomain: "官方主域名",
    mirrorDomain: "已记录备用来源线索",
    hint: "提示：只核验域名部分，例如 www.binance.com → 输入 binance.com",
    poweredBy: "数据来源：NexuAlpha 已记录来源线索",
    clearBtn: "清除",
    verifyAnother: "再核验一个",
    reportBtn: "举报钓鱼链接",
    learnMore: "了解如何识别钓鱼网站 →",
    empty: "请输入域名",
    tipSafe: "该域名与 NexuAlpha 已记录来源线索匹配，不构成实时授权或安全保证。请在打开后继续核对浏览器地址栏和平台官方提示。",
    tipDanger: "该域名不在 NexuAlpha 已记录来源线索中。请勿在此网站登录或操作资产。",
  },
  "zh-Hant": {
    title: "官方網域反釣魚核對",
    subtitle: "輸入任意網域，核查是否匹配 NexuAlpha 已記錄的官方來源。最終登入前仍請以平台官方頁面為準。",
    placeholder: "輸入網域，例如 binance.com",
    btnVerify: "立即核驗",
    statusChecking: "正在核驗…",
    resultSafe: "匹配已記錄來源線索",
    resultDanger: "🚨 未知網域 — 請勿輸入資產！",
    officialDomain: "官方主網域",
    mirrorDomain: "已記錄備用來源線索",
    hint: "提示：僅核驗網域部分，例如 www.binance.com → 輸入 binance.com",
    poweredBy: "資料來源：NexuAlpha 已記錄來源線索",
    clearBtn: "清除",
    verifyAnother: "再核驗一個",
    reportBtn: "舉報釣魚連結",
    learnMore: "了解如何識別釣魚網站 →",
    empty: "請輸入網域",
    tipSafe: "該網域與 NexuAlpha 已記錄來源線索匹配，不構成即時授權或安全保證。請在打開後繼續核對瀏覽器網址列和平台官方提示。",
    tipDanger: "該網域不在 NexuAlpha 已記錄來源線索中。請勿在此網站登入或操作資產。",
  },
  en: {
    title: "Anti-Phishing Domain Verifier",
    subtitle: "Type any domain to check whether it matches a NexuAlpha recorded source. Confirm the final login page with the platform before entering account details.",
    placeholder: "Enter a domain, e.g. binance.com",
    btnVerify: "Verify Now",
    statusChecking: "Checking…",
    resultSafe: "Matches Recorded Source Clue",
    resultDanger: "🚨 Unknown Domain — Do NOT enter assets!",
    officialDomain: "Official Domain",
    mirrorDomain: "Recorded Alternate Source Clue",
    hint: "Tip: enter just the domain, e.g. www.binance.com → type binance.com",
    poweredBy: "Powered by NexuAlpha recorded source clues",
    clearBtn: "Clear",
    verifyAnother: "Verify Another",
    reportBtn: "Report Phishing Link",
    learnMore: "Learn to spot phishing sites →",
    empty: "Please enter a domain",
    tipSafe: "This domain matches a NexuAlpha recorded source clue. It is not a live authorization or safety guarantee. Re-check the browser address bar and the platform's own notices before signing in.",
    tipDanger: "This domain is not in NexuAlpha recorded source clues. Do NOT log in or transfer assets here.",
  },
};

copy.ja = { ...copy.en, title:"フィッシング対策ドメイン確認", subtitle:"NexuAlphaの記録済みソース手掛かりと一致するか確認します。ログイン前に公式ページ表示も確認してください。", placeholder:"ドメインを入力（例: binance.com）", btnVerify:"今すぐ確認", statusChecking:"確認中…", resultSafe:"記録済みソース手掛かりと一致", resultDanger:"未確認のドメイン — 資産を入力しないでください", officialDomain:"主要ドメイン", mirrorDomain:"記録済み代替ソース手掛かり", clearBtn:"クリア", verifyAnother:"別のドメインを確認", empty:"ドメインを入力してください", tipSafe:"このドメインは記録済みソース手掛かりと一致しますが、リアルタイムの承認や安全保証ではありません。ログイン前に公式ページ表示も確認してください。", tipDanger:"このドメインは記録済みソース手掛かりにありません。ログインや資産操作は避けてください。" };
copy.ko = { ...copy.en, title:"피싱 방지 도메인 확인", subtitle:"NexuAlpha에 기록된 출처 단서와 일치하는지 확인합니다. 로그인 전 플랫폼 공식 화면도 확인하세요.", placeholder:"도메인 입력 (예: binance.com)", btnVerify:"지금 확인", statusChecking:"확인 중…", resultSafe:"기록된 출처 단서와 일치", resultDanger:"알 수 없는 도메인 — 자산을 입력하지 마세요", officialDomain:"주요 도메인", mirrorDomain:"기록된 대체 출처 단서", clearBtn:"지우기", verifyAnother:"다른 도메인 확인", empty:"도메인을 입력하세요", tipSafe:"이 도메인은 기록된 출처 단서와 일치하지만 실시간 승인이나 안전 보장이 아닙니다. 로그인 전 공식 화면을 다시 확인하세요.", tipDanger:"이 도메인은 NexuAlpha 기록 출처 단서에 없습니다. 로그인하거나 자산을 이동하지 마세요." };
copy.tr = { ...copy.en, title:"Kimlik avı önleme alan adı kontrolü", subtitle:"Alan adının NexuAlpha kayıtlı kaynak ipuçlarıyla eşleşip eşleşmediğini kontrol edin. Giriş yapmadan önce platform sayfasını da doğrulayın.", placeholder:"Alan adı girin (ör. binance.com)", btnVerify:"Şimdi kontrol et", statusChecking:"Kontrol ediliyor…", resultSafe:"Kayıtlı kaynak ipucuyla eşleşiyor", resultDanger:"Bilinmeyen alan adı — varlık girmeyin", officialDomain:"Birincil alan adı", mirrorDomain:"Kayıtlı alternatif kaynak ipucu", clearBtn:"Temizle", verifyAnother:"Başka alan adı kontrol et", empty:"Alan adı girin", tipSafe:"Bu alan adı kayıtlı bir kaynak ipucuyla eşleşir; canlı yetkilendirme veya güvenlik garantisi değildir. Giriş yapmadan önce platform bildirimlerini tekrar kontrol edin.", tipDanger:"Bu alan adı NexuAlpha kayıtlı kaynak ipuçlarında yok. Burada giriş yapmayın veya varlık aktarmayın." };

function getCopy(locale) {
  if (locale === "zh-Hans" || locale === "zh-CN") return copy["zh-Hans"];
  if (locale === "zh-Hant" || locale === "zh-TW") return copy["zh-Hant"];
  if (copy[locale]) return copy[locale];
  if (copy[String(locale || "").split("-")[0]]) return copy[String(locale || "").split("-")[0]];
  return copy.en;
}

// 从 venueDatabase 构建已记录域名索引
function buildRecordedDomainIndex() {
  const index = new Map(); // normalized domain -> { venue, type: 'official'|'mirror' }
  const normalize = (d) => d.replace(/^https?:\/\//, "").replace(/^www\./, "").toLowerCase().trim();

  Object.values(venueDatabase).forEach((venue) => {
    const official = normalize(venue.officialDomain || "");
    if (official) {
      index.set(official, { venue, type: "official" });
      index.set(`www.${official}`, { venue, type: "official" });
    }
    (venue.mirrors || []).forEach((mirror) => {
      const m = normalize(mirror);
      if (m && !index.has(m)) {
        index.set(m, { venue, type: "mirror" });
      }
    });
  });
  return { index, normalize };
}

export function AntiPhishingVerifier({ locale = "en" }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null); // null | { status: 'safe'|'danger', venue?, type? }
  const [checking, setChecking] = useState(false);
  const t = getCopy(locale);

  const { index, normalize } = useMemo(() => buildRecordedDomainIndex(), []);

  const verify = useCallback(() => {
    const raw = input.trim();
    if (!raw) {
      setResult({ status: "empty" });
      return;
    }
    setChecking(true);
    setResult(null);
    // Simulate async for UX (instant but shows "checking" state)
    setTimeout(() => {
      const key = normalize(raw);
      const found = index.get(key);
      if (found) {
        setResult({ status: "safe", venue: found.venue, matchType: found.type });
      } else {
        setResult({ status: "danger", query: raw });
      }
      setChecking(false);
    }, 320);
  }, [input, index, normalize]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") verify();
  };

  const reset = () => {
    setInput("");
    setResult(null);
  };

  return (
    <section className="apv v2-shell" id="verify-domain" aria-labelledby="apv-title">
      <div className="apv__header">
        <div className="apv__shield-icon" aria-hidden="true">🛡️</div>
        <h2 className="apv__title" id="apv-title">{t.title}</h2>
        <p className="apv__subtitle">{t.subtitle}</p>
      </div>

      <div className="apv__search-block">
        <div className="apv__input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            className="apv__input"
            aria-label={t.placeholder}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <button type="button" className="apv__btn-verify" onClick={verify} disabled={checking}>
            {checking ? t.statusChecking : t.btnVerify}
          </button>
          {(input || result) && (
            <button type="button" className="apv__btn-clear" onClick={reset} aria-label={t.clearBtn}>
              ✕
            </button>
          )}
        </div>
        <p className="apv__hint">{t.hint}</p>
      </div>

      {result && (
        <div className={`apv__result apv__result--${result.status}`} role="status" aria-live="polite">
          {result.status === "safe" && result.venue && (
            <>
              <div className="apv__result-headline apv__result-headline--safe">
                {t.resultSafe}
              </div>
              <div className="apv__result-detail">
                <div className="apv__result-row">
                  <span className="apv__result-key">{t[result.matchType === "official" ? "officialDomain" : "mirrorDomain"]}</span>
                  <span className="apv__result-val" translate="no" lang="en">{result.venue.officialDomain}</span>
                </div>
                <div className="apv__result-row">
                  <span className="apv__result-key">{locale.startsWith("zh") ? "平台" : "Platform"}</span>
                  <span className="apv__result-val" translate="no" lang="en">{result.venue.name}</span>
                </div>
                {result.venue.officialVerifyUrl && (
                  <div className="apv__result-row">
                    <a href={result.venue.officialVerifyUrl} target="_blank" rel="noopener noreferrer" className="apv__verify-link">
                      {locale.startsWith("zh") ? "查看平台官方核验页面 →" : "View official verification page →"}
                    </a>
                  </div>
                )}
              </div>
              <p className="apv__result-tip">{t.tipSafe}</p>
            </>
          )}

          {result.status === "danger" && (
            <>
              <div className="apv__result-headline apv__result-headline--danger">
                {t.resultDanger}
              </div>
              <div className="apv__result-detail">
                <div className="apv__result-row">
                  <span className="apv__result-key">{locale.startsWith("zh") ? "查询域名" : "Queried"}</span>
                  <span className="apv__result-val apv__result-val--danger" translate="no">{result.query}</span>
                </div>
              </div>
              <p className="apv__result-tip apv__result-tip--danger">{t.tipDanger}</p>
              <div className="apv__result-actions">
                <button type="button" className="apv__btn-secondary" onClick={reset}>{t.verifyAnother}</button>
              </div>
            </>
          )}

          {result.status === "empty" && (
            <div className="apv__result-headline apv__result-headline--neutral">{t.empty}</div>
          )}
        </div>
      )}

      <p className="apv__powered-by">{t.poweredBy}</p>
    </section>
  );
}

export default AntiPhishingVerifier;
