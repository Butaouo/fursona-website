# LongDay · 哈古久天

A bilingual, fursona-centered personal site with warm liquid-glass surfaces, supplied original artwork, social links, and an official Apple Music embed.

繁體中文交付與修改說明：**docs/GUIDE.zh-TW.md**。

**Target repository:** https://github.com/Butaouo/fursona-website  
**Target Pages URL:** https://Butaouo.github.io/fursona-website/  
These are deployment targets, not proof of deployment. See docs/VERIFICATION.md for the actual status.

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

The included **.github/workflows/deploy.yml** builds and verifies each main-branch push, runs Chromium/Firefox/WebKit and mobile-emulation checks, audits Lighthouse, then deploys the verified dist artifact through GitHub Pages. Pull requests run checks only. Failure in verification prevents deployment. No third-party deployment service is required. The repository is public. GitHub Pages must use GitHub Actions as its build source; the deployment setup is managed by the agent.

Vite base is **/fursona-website/**. A future custom domain can override the base through `SITE_BASE=/`, with matching canonical/open-graph URLs in `index.html` and `site.url`. The site uses section anchors, so refreshes do not require SPA route rewriting.

## Architecture

- React 19 + TypeScript + Vite 7
- Tailwind CSS 4 and custom optical CSS
- Motion for React (lightweight LazyMotion), i18next
- CSS/SVG reflections, canvas particles and adaptive motion
- Playwright + axe, Vitest and Lighthouse
- Static files only; no private environment variables

See **docs/DESIGN.md**, **docs/ASSETS.md** and **docs/VERIFICATION.md** for decisions, provenance and testing limits.
