// Venue detail page with its "Sources" hub wired statically: for server-side tests that render the page outside App.jsx
// (App.jsx injects the hub through the route-module cache so the browser loads it on demand).
import { VenueDetailPage as VenueDetailPageBase } from "./VenueDetailPage.jsx";
import { VenueDetailResearch } from "./VenueDetailResearch.jsx";

export function VenueDetailPage(props) {
  return <VenueDetailPageBase {...props} researchComponent={VenueDetailResearch} />;
}
