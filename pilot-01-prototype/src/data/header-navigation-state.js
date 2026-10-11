import { parsePublicRoute } from './locale-routing.js';

// Exact URL location and the broader research module are separate statements.
export function headerNavigationState(href, currentUrl) {
  if (!currentUrl) return {};
  try {
    const current = new URL(currentUrl);
    const target = new URL(href, current);
    if (target.origin !== current.origin) return {};
    const path = (url) => parsePublicRoute(url.pathname, url.searchParams).contentPathname;
    const currentPath = path(current), targetPath = path(target);
    if (currentPath === targetPath && (!target.hash || current.hash === target.hash)) {
      return { current: target.hash ? 'location' : 'page', active: true };
    }
    const section = targetPath === '/' && target.hash === '#exchanges' ? '/exchanges'
      : targetPath === '/' && target.hash === '#compare' ? '/compare'
      : targetPath === '/exchanges' ? '/exchanges'
      : targetPath === '/compare' || targetPath.startsWith('/compare/') ? '/compare'
      : targetPath === '/topics/meme-coins' ? '/topics'
      : ['/news', '/activities', '/telegram'].includes(targetPath) ? targetPath : null;
    return section && (currentPath === section || currentPath.startsWith(`${section}/`)) ? { active: true } : {};
  } catch {
    return {};
  }
}
