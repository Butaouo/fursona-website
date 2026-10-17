import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const suppliedUrl = process.env.AUDIT_URL;
const url = suppliedUrl || 'http://127.0.0.1:4173/';
const server = suppliedUrl ? null : spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'ignore' });
let chrome;
try {
  for (let i = 0; i < 40; i++) {
    try { const response = await fetch(url); if (response.ok) break; } catch {}
    if (i === 39) throw new Error(`Server did not become available: ${url}`);
    await new Promise(r => setTimeout(r, 500));
  }
  await mkdir('reports', { recursive: true });
  chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  for (const formFactor of ['mobile', 'desktop']) {
    const opts = { port: chrome.port, output: ['html', 'json'], logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] };
    const config = formFactor === 'desktop' ? { extends: 'lighthouse:default', settings: { formFactor: 'desktop', screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 } } } : undefined;
    const result = await lighthouse(url, opts, config);
    if (!result) throw new Error('Lighthouse returned no result');
    await writeFile(`reports/lighthouse-${formFactor}.html`, result.report[0]);
    await writeFile(`reports/lighthouse-${formFactor}.json`, result.report[1]);
    const lhr = result.lhr;
    if (lhr.runtimeError) throw new Error(lhr.runtimeError.message);
    const summary = { formFactor, performance: Math.round(lhr.categories.performance.score * 100), accessibility: Math.round(lhr.categories.accessibility.score * 100), bestPractices: Math.round(lhr.categories['best-practices'].score * 100), seo: Math.round(lhr.categories.seo.score * 100), lcpMs: Math.round(lhr.audits['largest-contentful-paint'].numericValue), cls: lhr.audits['cumulative-layout-shift'].numericValue, fetchTime: lhr.fetchTime, url: lhr.finalDisplayedUrl, lighthouseVersion: lhr.lighthouseVersion };
    results.push(summary); console.log(JSON.stringify(summary));
  }
  await writeFile('reports/lighthouse-summary.json', JSON.stringify(results, null, 2));
  const markdown = ['| Profile | Performance | Accessibility | LCP | CLS |', '|---|---:|---:|---:|---:|', ...results.map(r => `| ${r.formFactor} | ${r.performance} | ${r.accessibility} | ${r.lcpMs} ms | ${r.cls.toFixed(3)} |`)].join('\n');
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Lighthouse\n\n${markdown}\n\nInitial page measured with animations enabled; Apple iframe is user-initiated.\n`);
  const failed = results.filter(r => r.performance < (r.formFactor === 'mobile' ? 85 : 90) || r.accessibility < 90 || r.lcpMs >= 2500 || r.cls >= 0.1);
  if (failed.length) { console.error('Acceptance thresholds not met:', failed); process.exitCode = 1; }
} finally {
  if (chrome) await chrome.kill();
  server?.kill();
}
