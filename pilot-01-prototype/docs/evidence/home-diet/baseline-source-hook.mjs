// Read the four changed pre-existing data modules from the starting revision without editing the checkout.
// Used only to classify a failing Node-side attribution contract against its actual baseline.
import { execFileSync } from "node:child_process";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";

const revision = "3bc0e9c78c05a9e81b959ea6c9dc40e157c02249";
const sources = new Map(["directory-context.js", "decision-passport.js", "regional-cta.js", "source-bound-cta.js"].map((name) => {
  const file = `src/data/${name}`;
  return [pathToFileURL(path.resolve(file)).href, execFileSync("git", ["show", `${revision}:pilot-01-prototype/${file}`], { encoding: "utf8" })];
}));
registerHooks({
  load(url, context, nextLoad) {
    return sources.has(url) ? { format: "module", source: sources.get(url), shortCircuit: true } : nextLoad(url, context);
  },
});
