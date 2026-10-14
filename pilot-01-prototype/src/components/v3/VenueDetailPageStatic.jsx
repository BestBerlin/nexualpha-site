// Venue detail page with its "Sources" hub wired statically: for server-side tests that render the page outside App.jsx
// (App.jsx injects the hub through the route-module cache so the browser loads it on demand).
import { VenueDetailPage as VenueDetailPageBase } from "./VenueDetailPage.jsx";
import { VenueDetailResearch } from "./VenueDetailResearch.jsx";
import { VenuePopularCoins } from "./VenuePopularCoins.jsx";
import { ExchangeLicenseSection } from "../licenses/LicensePages.jsx";
import { ExchangeQuickAnswers } from "./ExchangeQuickAnswers.jsx";
import { HubNewsLinks } from "../shared/HubNewsLinks.jsx";
import { VenueKeywordSections } from "./VenueKeywordSections.jsx";
import { BrazilDeadlineNotice } from "./BrazilDeadlineNotice.jsx";
import { TelegramAlertsStrip } from "./TelegramAlertsStrip.jsx";

const supportComponents = {
  VenuePopularCoins,
  ExchangeLicenseSection,
  ExchangeQuickAnswers,
  HubNewsLinks,
  VenueKeywordSections,
  BrazilDeadlineNotice,
  TelegramAlertsStrip,
};

export function VenueDetailPage(props) {
  return <VenueDetailPageBase {...props} researchComponent={VenueDetailResearch} supportComponents={supportComponents} />;
}
