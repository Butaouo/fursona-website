# LongDay test review: social presentation and day/night character copy

This is an unmerged review build on local branch `review/day-night-character`, based on `main` at `d0a55973a8594da439d0a956559ee7d8ebc36e1d`. Production has not been deployed or modified. At the time of this review there were no open pull requests or remote branch for this revision. GitHub's browser session was signed out; remote branch upload and GitHub Actions execution remain pending authenticated access.

## Changes for review

- Retain the exact existing `Socials.tsx` implementation, original eleven-platform grid, SVG/image brand marks, account copy actions and existing responsive CSS. Its history contains `fdf797c` (accessible copy confirmations) and `7e710bf` (original upload). No expander or replacement social component is introduced.
- Centralize all ten author quotes, English translations and fixed placements in `src/config/characterCopy.ts`. Replace the old sunset line with the newly requested exact line. No additional character quote is invented.
- Home keeps its existing hero, artwork, frame angle, social float buttons, opening, music and background. The frame footer follows the effective theme; the floating label identifies the image as artwork rather than repeating the name or quote.
- Character page separates literary narration from objective name meaning. Retain the three reference views, keyboard selection, enlargement, fullscreen presentation, basic data and the original five color values. This integrates the earlier character-file review layout into the existing React application.
- Reserve the height of all theme/language variants and fade the visible text without changing route keys or opening state.

| Position | Light | Dark |
| --- | --- | --- |
| Home main quote | 原諒我愛自由 | 我從來都不想要自由 |
| Artwork footer | 獨一無二的金幣 | 夢的鯨魚悄悄擱淺 |
| Artwork floating label | 角色插畫 | 角色插畫 |
| Character narration | 名字取意於希望日落能停留更久 | 可夢終會醒 日總會落 |
| Character main quote | 落日熔金 盼願永恆 | 夢醒來後又該如何重新睡去 |
| Objective name meaning | 希望日落能停留得更久 | 希望日落能停留得更久 |

## Executed verification

- `npm test`: **45 passed, 0 failed**, six unit-test files. Eight new checks preserve exact author text, translations, fixed placements, objective meaning, reserves and color values.
- `npm run build`: **passed**, including TypeScript, Vite and existing build, canonical-domain, public-content and asset-brand validations.
- `git diff --check`: **passed**.
- Playwright test discovery: **220 cases across five projects**. Existing 180 cases are retained; eight new scenarios multiply to 40 additional cases. Existing expectations changed only for deliberately updated labels, page headings and confirmed character data. No tests, thresholds or projects were removed.
- Manual cloud Chromium inspection of the actual production build: Chinese and English navigation/copy, light/dark/system selection, eleven social cards and brand marks, no social disclosure control, reference tabs, enlargement, fullscreen and return focus were observed working.
- Desktop theme-switch measurement: frame height 803.85406 to 803.85400 CSS px; hero action top 627.828125 before and after. Character reference heading top 393.484375 before and after. No opening overlay reappeared.
- Narrow-frame Chromium inspection: 390 px frame with 375 px content width due to a desktop scrollbar; document scroll width was 375 px. The artwork footer and floating label fit without overlap. Theme-switch frame height changed by less than 0.001 px. A QQ copy confirmation was observed; the OS clipboard value was not independently confirmed.
- A further 320 px frame was inspected. Its desktop scrollbar reduces available width to 305 px, below the existing site's 320 px minimum; it clips 15 px. This is not an iPhone viewport test and is not reported as a passing 320 px phone check.

## Not executed / environment limitations

- Browser-engine installation failed: the official Playwright Chromium download was returned as a zero-length/truncated ZIP (`End of central directory record signature not found`). No repeat installation was attempted after the installer failed.
- A temporary local run of the eight new cases using the installed system Chromium failed at browser startup, before any website assertion: `socket() failed: Operation not permitted (1)` and `ptrace: Operation not permitted (1)`. Thus **zero browser cases are marked passed** from that run. The temporary runner configuration was removed; the checked-in five-project Playwright configuration remains unchanged.
- The full 220-case suite, Firefox, WebKit, touch emulation, system color-scheme change emulation, reduced-motion browser checks and Lighthouse have not run on this revision. They require a working browser runner or the isolated-branch CI run after GitHub sign-in is restored.
- No physical iPhone or Android device was tested. Cloud Chromium and embedded-width layout inspection are not Safari or device certification.
- Google sync source, workflows and authorization were not changed or enabled. Existing unit fixtures passed; live private Google sync was not invoked.
- Original images, social destinations, music, animation architecture, `public/CNAME`, canonical origin and deployment workflows are unchanged. Runtime logs observed in the cloud browser belonged to its browser extension; this is not an exhaustive production console/resource audit.

## Review and release boundary

Review the four desktop screenshots and the mobile artwork details. The source and built output are supplied for continuity. Do not merge, publish to `main`, or deploy to `longday.tw` until the author confirms. Before release, upload this branch, run all existing CI gates unchanged, resolve any failures and report actual browser and Lighthouse results.
