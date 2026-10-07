#!/usr/bin/env node
// Bounded release matrix: retain the existing harness and add all research and
// unavailable-detail templates without modifying the historic baseline plan.
import { routes, run, parseArgs } from './verify-browser.mjs';
routes.push(
  { id: 'research-cex', path: '/activities/research/binance', required: ['.official-research-page', '.official-research-page__reward', '.official-research-page__sources'] },
  { id: 'research-dex', path: '/activities/research/uniswap', required: ['.official-research-page', '.official-research-page__reward', '.official-research-page__sources'] },
  { id: 'research-perp', path: '/activities/research/hyperliquid', required: ['.official-research-page', '.official-research-page__reward', '.official-research-page__sources'] },
  { id: 'unpublished-detail', path: '/activities/missing-reviewed-activity', required: ['.v3-activity-detail.v3-page--empty'] },
  { id: 'unknown-research', path: '/activities/research/unknown-platform', required: ['.v3-page--empty'] },
);
const options=parseArgs(process.argv.slice(2));
const result=await run(options);
console.log(JSON.stringify({status:result.status,runDir:result.runDir,counts:result.findings?.counts},null,2));
if (options.strict && result.status==='NEEDS_ATTENTION') process.exitCode=1;
