# longday.tw migration

Target canonical origin: https://longday.tw/. This document describes the prepared cutover, not proof that DNS or HTTPS is already active.

## Isolation from Phase 3

This branch starts from the deployed main commit 47e3d6b. PR #2 remains separate because its run 38935719800 failed browser verification (88 passed, 1 flaky, 11 failed). Its visual changes and local fixes are preserved. No artwork, social accounts, music, Google sync settings or animation implementation are changed by this migration.

## DNS and activation

1. Finish verification on this branch. Obtain HiNet DNS access before cutting over so the current address is not stranded by a premature redirect.
2. In this repository's Pages settings, set Custom domain to `longday.tw` with source GitHub Actions.
3. In HiNet, use four A records at the apex (`@`, blank, or `longday.tw` as required by its form): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
4. Set `www` CNAME to `butaouo.github.io` (no protocol or repository path). Preserve unrelated MX/TXT records. Check existing conflicting web records before modifying them.
5. Merge and deploy the root-base build; wait for GitHub DNS verification and the TLS certificate, then enable Enforce HTTPS. GitHub redirects www to the configured apex. DNS/certificate propagation can take up to 24 hours.
6. Verify apex HTTPS, www HTTPS redirect, old Pages redirect, every hash route with refresh, image responses and Safari emulation. A real iPhone check remains distinct from WebKit simulation.

## Deployment persistence

Vite defaults to `/`; browser tests and Lighthouse use the root path. `public/CNAME` is copied into the artifact and checked during every build, together with canonical/OG URLs and local sharing images. GitHub Actions custom-workflow hosting stores the actual custom domain in Pages settings; a CNAME artifact is not what configures it. The existing configure-pages/deploy-pages workflow does not reset the domain, and Google synchronization only writes published content.

Before later merging PR #2, retain these domain changes in index.html and validate-build.mjs; update its old sharing-image assertion to `https://longday.tw/images/lyont-avatar.webp`. Do not restore the old base or hostname. Re-run all tests after resolving the merge.

Reference: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
