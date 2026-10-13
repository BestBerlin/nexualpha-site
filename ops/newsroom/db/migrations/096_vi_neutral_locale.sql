-- Owner 2026-10-13 (legal): Vietnamese is an information-only locale and Vietnam a no-promotion market
-- (Vietnam Government Resolution 05/2025/NQ-CP). Mirrors NEUTRAL_CTA_LOCALE_LIST in
-- pilot-01-prototype/src/data/locale-policy.js and JURISDICTION_PROMOTION_BANS in partner-geo-restrictions.js.
alter table promotions alter column locales_neutral set default '{ru,ar,zh-Hant,uk,ur,vi}';
update promotions set locales_neutral = array_append(locales_neutral, 'vi') where not ('vi' = any(locales_neutral));
update promotions set regions_blocked = array_append(regions_blocked, 'VN') where not ('VN' = any(regions_blocked));
