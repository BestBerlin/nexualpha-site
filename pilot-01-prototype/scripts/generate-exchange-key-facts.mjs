import { writeFile } from "node:fs/promises";
import { EXCHANGE_KEY_FACT_SLUGS, buildExchangeKeyFacts } from "../src/data/exchange-key-facts-source.js";

const sheets = Object.fromEntries(EXCHANGE_KEY_FACT_SLUGS.map(slug => [slug, buildExchangeKeyFacts(slug)]));
await writeFile(new URL("../src/data/exchange-key-facts.generated.js", import.meta.url),
  `// Generated from existing dated fee, license, app and research records. Run scripts/generate-exchange-key-facts.mjs.\nexport const EXCHANGE_KEY_FACT_SHEETS = ${JSON.stringify(sheets, null, 2)};\n`);
console.log(`Generated ${EXCHANGE_KEY_FACT_SLUGS.length} source-bound exchange fact sheets`);
