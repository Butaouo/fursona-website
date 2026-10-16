# LongDay · 哈古久天

A bilingual, fursona-centered personal IP site with warm liquid-glass surfaces, supplied original artwork, social links, an official Apple Music embed, illustrated stories and diaries, a relationship image viewer, and a product showcase.

繁體中文交付與修改說明：**docs/GUIDE.zh-TW.md**。

**Repository:** https://github.com/Butaouo/fursona-website

**GitHub Pages:** https://butaouo.github.io/fursona-website/

See **docs/VERIFICATION.md** for actual deployment evidence, repair details, test counts, Lighthouse measurements, and testing limits.

That report records the original release. Phase 3 preserves the existing 75 browser checks and adds 25 motion/branding checks (100 total), with 24 unit checks; use the current Actions run and its verification artifact for the latest results. Google authorization and real-device testing are separate from automated fixture tests.

## Publish stories, relationship art and products

See **[docs/GOOGLE-SYNC.md](docs/GOOGLE-SYNC.md)** for the one-time restricted Google authorization and complete iPhone publishing steps. Write illustrated novels or diaries in Google Docs, manage publication and products in Google Sheets, and store artwork in a dedicated Drive folder. Opt-in GitHub Actions synchronization downloads and validates published content and stable local images before deployment. Secrets remain in Actions; visitors do not log in. Failed synchronization or verification preserves the existing deployment. The initial catalog is deliberately empty, and four shop cards are explicitly marked placeholders without invented merchandise or prices.

## Development

Node 24 is used in CI. Install the exact lockfile dependencies with `npm ci`, then use `npm run dev`. Production build: `npm run build`. Unit checks: `npm test`. Browser checks: `npx playwright install --with-deps chromium firefox webkit` then `npm run test:e2e`. Lighthouse: `npm run audit` with a Chrome installation available.

## Update personal content

Edit **src/config/site.ts**. It contains names, Chinese and English introductions, tagline, traits, image paths, music information and every social destination. Empty social values stay hidden. Add the missing Telegram or GitHub URL there when ready. QQ and Discord are copy actions because a username alone is not a valid Discord profile URL. A denied clipboard opens a selectable account dialog.

Interface translations live in **src/config/translations.ts**. The initial language follows the browser (Chinese -> Traditional Chinese, otherwise English); the visitor's explicit choice is remembered. Theme offers light, dark and live system-following modes. Storage errors do not prevent rendering.

## Replace artwork

Replace the corresponding file in **assets/originals/** and run `node scripts/optimize-images.mjs`. This produces full-frame WebP assets without changing colors or content. Update paths in `src/config/site.ts` if using different names. Hero uses two sizes, 640 and 1120 pixels; preserve matching aspect ratios and adjust the width/height and CSS aspect-ratio if a future replacement has a different composition. See docs/ASSETS.md for the mapping.

## Change the featured song

In **src/config/site.ts**, update `music.track`, `artist`, `album`, `artwork`, `appleMusicUrl` and the official `embedUrl` together. Replace `public/images/younger-cover.webp` or use a new artwork path. No Apple login or private API key is necessary for an embed. The provider/mode fields and `recentlyPlayedEndpoint` reserve a future integration boundary; dynamic listening history is not currently connected or claimed.

## Deployment

The included **.github/workflows/deploy.yml** builds and verifies each main-branch push, runs 100 Chromium/Firefox/WebKit and mobile-emulation checks, audits Lighthouse, then deploys the verified dist artifact through GitHub Pages. Pull requests run checks only. Failure in verification prevents deployment. Google synchronization is opt-in and runs twice per hour after authorization; schedules may be delayed. No third-party deployment service is required. The repository is public and Pages uses GitHub Actions as its build source. Browser tests use a virtual display on Linux; original assertions remain active.

Vite base is **/fursona-website/**. A future custom domain can override the base through `SITE_BASE=/`, with matching canonical/open-graph URLs in `index.html` and `site.url`. Pages use hash routes (`#/archive`, `#/relationships`, `#/shop`, `#/about`), so direct links and refreshes work without server rewrites. Original homepage section anchors still work.

## Architecture

- React 19 + TypeScript + Vite 7
- Tailwind CSS 4 and custom optical CSS
- Motion for React (lightweight LazyMotion), i18next
- Layered CSS environment lighting, compositor motion, scroll reveals and adaptive quality
- Playwright + axe, Vitest and Lighthouse
- Static frontend; Google secrets only in the server-side publication workflow

See **docs/DESIGN.md**, **docs/ASSETS.md** and **docs/VERIFICATION.md** for decisions, provenance and testing limits.

Phase 3 motion architecture and testing scope: [docs/PHASE3.md](docs/PHASE3.md). Google synchronization remains opt-in and unchanged.
