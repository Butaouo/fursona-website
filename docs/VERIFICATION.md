# Verification status

Updated: 2026-10-10 UTC (2026-10-11 Taiwan).

**Not deployed. External authorization is blocking publication.** The public repository Butaouo/fursona-website was created after secure GitHub browser sign-in. The remote repository contains only its initial README; the complete website source remains in the supplied source archive. Only this project has been queried; no other repository was accessed.

| Check | Actual result |
|---|---|
| Supplied artwork | All five files opened and inspected |
| Asset optimization | Complete; main WebP about 93 KB, mobile about 43 KB |
| Unit checks | 6 / 6 passed |
| TypeScript | Passed |
| Vite production build | Passed |
| Base path and built HTML asset references | Passed: /fursona-website/ |
| Required image assets | All 8 present, including official album cover and Bump icon |
| Social and Apple URLs | All 10 HTTPS destinations returned HTTP 200; Bilibili and Facebook redirects followed |
| Apple metadata | Track ID 1814208601, Younger, 陳芳語, kiki confirmed through Apple lookup |
| Browser test definitions | 45 tests discovered across desktop Chromium, Firefox, WebKit, iPhone WebKit emulation and Android Chromium emulation; not yet executed |
| Browser layout/interaction tests | Pending GitHub CI / available browser QA |
| Lighthouse mobile and desktop | Not run; no score claimed |
| iPhone/Android/Windows hardware | Not tested on physical devices |
| Runtime animation frame rate | Not measured; no 60 FPS claim |
| GitHub repository | Created, public, owner Butaouo; only initial README uploaded |
| Source upload | Blocked: GitHub write API returned HTTP 403, `Resource not accessible by integration` |
| Browser fallback | Blocked: browser runtime cannot safely resume native credential state; a new tab and runtime reset did not resolve it |
| GitHub Actions workflow | Written locally; not uploaded or executed |
| Pages / automatic re-deploy | Not configured or verified; no working production URL claimed |

The managed local environment does not expose the required control-browser skill. Its Sites instructions prohibit starting an improvised local browser-preview path in this situation. No local browser has been installed or launched to work around that restriction. A GitHub Actions verification workflow is included in the source archive and is ready for upload after write authorization is restored.

## Required continuation

Restore an authorized GitHub connection that can write this repository's source and workflow files, or provide a usable authenticated browser runtime. Restrict access to Butaouo/fursona-website. Do not provide passwords, verification codes, or personal access tokens in chat. Once access is restored, upload the source, configure Pages to use GitHub Actions, run the browser and Lighthouse checks, fix any failures, deploy, then verify the production URL and a subsequent automatic deployment. Repository creation alone is not completion.

The source archive includes the original five supplied images, optimized runtime images, the exact dependency lockfile, all configuration, tests, deployment workflow, and documentation. The recorded HTTP checks are included in docs/LINK_CHECKS.json.

HTTP 200 verifies reachability, not a successful login, account ownership or every interaction on external social sites. QQ/Discord are exact supplied account copy actions. Email uses the exact supplied mailto address; sending mail was neither requested nor performed.

The Apple iframe is loaded only after a click. Tests deliberately mock the remote frame to validate the site's integration; they do not certify Apple playback or bypass region/subscription restrictions. A direct Apple Music link remains available, including when the embed is blocked.

Lighthouse thresholds in scripts/lighthouse.mjs: mobile Performance >=85, desktop >=90, Accessibility >=90, LCP <2500 ms, CLS <0.1. The workflow fails instead of publishing false success if these thresholds fail. Reports and screenshots from actual future CI runs are uploaded as verification artifacts.
