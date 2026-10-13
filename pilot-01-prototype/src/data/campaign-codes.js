// Campaign codes that live outside the partner registry. Owned by their campaign modules (bitget-alliance.js re-exports
// BITGET_ALLIANCE_CODE); listed here once so the neutral-locale article filter (neutral-article.js) can recognise them
// without pulling a campaign module into the news route chunk.
export const BITGET_ALLIANCE_CODE = "DPRWSXAS";
export const CAMPAIGN_INVITE_CODES = Object.freeze([BITGET_ALLIANCE_CODE]);
