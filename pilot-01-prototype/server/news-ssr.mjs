import { pathToFileURL } from "node:url";
import path from "node:path";

export function createNewsSsrRenderer(distRoot) {
  let pending;
  return async (url, options) => {
    if (!pending) pending = import(pathToFileURL(path.join(distRoot, "news-ssr", "entry-server.js")).href)
      .catch(error => { pending = undefined; throw error; });
    const module = await pending;
    return module.render(url, options);
  };
}
