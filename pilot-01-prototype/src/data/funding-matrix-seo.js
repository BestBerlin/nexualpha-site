import { localizedPath } from "./locale-routing.js";
import { fundingMatrixCopy } from "./funding-matrix-copy.js";

export function fundingMatrixSeo(locale = "en") {
  const copy = fundingMatrixCopy(locale);
  const title = copy.title;
  const description = copy.description;
  const url = `https://nexualpha.com${localizedPath("/funding-rates/matrix", locale)}`;
  return { title, description, schema: [
    { "@context": "https://schema.org", "@type": "Dataset", name: title.split(" | ")[0], description, url, inLanguage: locale,
      creator: { "@type": "Organization", name: "NexuAlpha", url: "https://nexualpha.com" },
      variableMeasured: ["Funding rate per settlement interval", "8-hour equivalent funding rate", "Annualized funding rate", "Next funding time"],
      distribution: [{ "@type": "DataDownload", encodingFormat: "application/json", contentUrl: "https://nexualpha.com/intel/funding-matrix.json" }] },
    { "@context": "https://schema.org", "@type": "WebApplication", name: title.split(" | ")[0], url, description,
      applicationCategory: "FinanceApplication", operatingSystem: "Any", inLanguage: locale,
      browserRequirements: "JavaScript required for interactive calculator; funding table available in HTML" },
  ] };
}
