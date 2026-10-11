import level0 from "./levels/01-what-am-i-buying.json" with { type: "json" };
import level1 from "./levels/02-pick-an-exchange.json" with { type: "json" };
import level2 from "./levels/03-can-an-exchange-collapse.json" with { type: "json" };
import level3 from "./levels/04-signup-and-kyc.json" with { type: "json" };
import level4 from "./levels/05-lock-your-account.json" with { type: "json" };
import level5 from "./levels/06-first-deposit.json" with { type: "json" };
import level6 from "./levels/07-p2p-and-bank-freeze.json" with { type: "json" };
import level7 from "./levels/08-first-spot-trade.json" with { type: "json" };
import level8 from "./levels/09-fees-and-rebates.json" with { type: "json" };
import level9 from "./levels/10-check-network-before-withdraw.json" with { type: "json" };
import level10 from "./levels/11-seed-phrase-basics.json" with { type: "json" };
import level11 from "./levels/12-before-futures-liquidation.json" with { type: "json" };

export const starterLevels = Object.freeze([level0, level1, level2, level3, level4, level5, level6, level7, level8, level9, level10, level11]);
export const publicStarterLevels = (reviewed = false) => starterLevels.filter(level => level.meta.level !== 7 || reviewed);
export const starterHref = (slug = "", locale = "en") => `${locale === "zh-Hans" ? "/zh-hans" : ""}/starter${slug ? `/${slug}` : ""}`;
export function starterContent(level, locale = "en") {
  const zh = locale === "zh-Hans";
  return {
    title: level.meta[zh ? "title_zh" : "title_en"],
    summary: level.page[zh ? "summary_zh" : "summary_en"],
    checklist: level.page[zh ? "checklist_zh" : "checklist_en"],
    quiz: zh ? level.page.quiz : level.page.quiz_en,
    faq: zh ? level.page.faq : level.page.faq_en,
    points: level.scenes.map(scene => scene[zh ? "voice_zh" : "voice_en"]),
  };
}
