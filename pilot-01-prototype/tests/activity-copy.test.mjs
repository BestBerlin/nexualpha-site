import assert from "node:assert/strict";
import test from "node:test";
import {
  activityCenterCopy,
  activityCenterCopyByLocale,
  activityCenterRequiredKeys,
} from "../src/components/v3/activity/activity-copy.js";

const supportedLocales = [
  "en",
  "zh-Hans",
  "zh-Hant",
  "es",
  "pt-BR",
  "fr",
  "de",
  "ja",
  "ko",
  "ar",
  "tr",
  "ru",
  "id",
  "vi",
  "it",
];

const mustLocalizeKeys = [
  "rewards",
  "products",
  "rules",
  "showAll",
  "browsePlatforms",
  "comparePlatforms",
];

test("activity center copy covers every supported locale and required key", () => {
  assert.deepEqual(Object.keys(activityCenterCopyByLocale), supportedLocales);

  for (const locale of supportedLocales) {
    const localizedCopy = activityCenterCopyByLocale[locale];
    assert.ok(localizedCopy, `missing ${locale}`);

    for (const key of activityCenterRequiredKeys) {
      assert.ok(Object.hasOwn(localizedCopy, key), `missing ${locale}.${key}`);

      if (key === "criteria") {
        assert.ok(Array.isArray(localizedCopy.criteria), `${locale}.${key} must be an array`);
        assert.equal(localizedCopy.criteria.length, 3, `${locale}.${key} should keep three qualification bullets`);
        for (const [index, item] of localizedCopy.criteria.entries()) {
          assert.equal(typeof item, "string", `${locale}.${key}[${index}] must be text`);
          assert.ok(item.trim(), `${locale}.${key}[${index}] must not be empty`);
        }
        continue;
      }

      assert.equal(typeof localizedCopy[key], "string", `${locale}.${key} must be text`);
      assert.ok(localizedCopy[key].trim(), `${locale}.${key} must not be empty`);
    }
  }
});

test("activity center uses neutral product titles, not official-site labels", () => {
  assert.equal(activityCenterCopyByLocale.en.title, "Activities and listings");
  assert.equal(activityCenterCopyByLocale["zh-Hans"].title, "活动与上币中心");
  assert.equal(activityCenterCopyByLocale["zh-Hant"].title, "活動與上幣中心");

  const serialized = JSON.stringify(activityCenterCopyByLocale);
  assert.doesNotMatch(
    serialized,
    /Official activity center|官方活动中心|官方活動中心/i,
  );
});

test("activity center no longer exposes internal project or CTA setup language", () => {
  assert.doesNotMatch(
    JSON.stringify(activityCenterCopyByLocale),
    /中心已经准备好|中心已經準備好|CTA 待配置|CTA pending|转化路径|轉化路徑|conversion path|目标不是让用户停留|目標不是讓用戶停留|默认6家|預設6家|正在跟踪|正在追蹤/i,
  );
});

test("non-English locales do not reuse English fallback for required activity controls", () => {
  const englishCopy = activityCenterCopyByLocale.en;

  for (const locale of supportedLocales.filter((value) => value !== "en")) {
    const localizedCopy = activityCenterCopyByLocale[locale];
    for (const key of mustLocalizeKeys) {
      assert.notEqual(localizedCopy[key], englishCopy[key], `${locale}.${key} should be localized`);
    }
    assert.notDeepEqual(localizedCopy.criteria, englishCopy.criteria, `${locale}.criteria should be localized`);
  }
});

test("unknown locale falls back explicitly to English copy", () => {
  assert.equal(activityCenterCopy("missing-locale"), activityCenterCopyByLocale.en);
});
