# LongDay 修復與正式驗收

更新日期：2026-10-12 UTC。以下只記錄實際執行的檢查。

## 發布狀態

網站已實際發布並可使用：[LongDay 正式網站](https://butaouo.github.io/fursona-website/)。

最終程式驗收樣本：提交 `03119a1500239fda7cb46e6fbf0f154de7184d0e`， [Actions 38217357729](https://github.com/Butaouo/fursona-website/actions/runs/38217357729)。verify 與 deploy 均成功，已在正式網址完成下列功能操作。本文記錄此樣本及已通過驗證的穩定性調整；更新後的完整報告保存在 [Actions](https://github.com/Butaouo/fursona-website/actions) 的 verification artifact，保留 30 天。

原始碼、原始獸設及自動部署設定均在本 Repository。每次推送 main 會重新執行必要驗證；任何必要檢查失敗均阻止部署。Pull request 只驗證、不發布。

## 原始失敗與修復

原始提交：`7e710bf2ab59083ac5af071c7721c6ccd4b661cc`。完整 [失敗執行 38128671495](https://github.com/Butaouo/fursona-website/actions/runs/38128671495) 的 verify job `114438264499` 日誌、Playwright JSON、失敗截圖與 trace 已檢查。

Checkout、Node、npm ci、6 項單元測試、TypeScript／Vite build、瀏覽器安裝均成功。真正失敗步驟是 `Test desktop, mobile, preferences, music, links and accessibility`，退出碼 1；45 項中 31 通過、13 失敗、1 項重試通過（flaky）、0 跳過。Lighthouse 與部署因此未執行。其餘 Node 20 action 棄用及 ubuntu-latest 升級公告不是根因。

| 問題／原因 | 涉及檔案 | 修正與驗證 |
|---|---|---|
| Hero grid 最小寬度及裝飾圖层造成橫向溢出、手機按鈕命中錯位 | src/styles.css | 設定可縮小 grid、限制 root 溢出、裝飾層不接收 pointer events；驗證完整主視覺邊界與按鈕操作 |
| 深色切換時按鈕文字先變、背景仍在過渡，出現 1.15:1 對比 | src/styles.css | 主按鈕和選中主題按鈕同步切換前景／背景，保留位移與陰影；淺深色 axe 檢查皆保留 |
| reduced-motion 在首次 render 和監聽註冊之間可能改變 | src/hooks/usePreferences.ts | 訂閱後立即讀取 matchMedia，並驗證 CSS 動畫停止及重整後手動暫停偏好 |
| Linux WebKit 在持續粒子重繪與多層濾鏡下畫面更新過慢，主題流程逾時 | src/components/Background.tsx、src/styles.css | 依實際更新速度降級：1.5 秒少於 24 次更新時減少濾鏡、停止粒子重繪與連續位移，保留半透明表面及高光；正常裝置仍使用原效果。CI 使用 Xvfb 視窗模式，未強制點擊或放寬斷言 |
| Firefox 圖庫測試對即將被替換的舊圖片呼叫 decode | tests/site.e2e.ts | 精確等待 artwork panel 的新圖片 src、complete 與 naturalWidth，消除 InvalidImageRequest 競態 |
| WebKit 動態改變手機模擬尺寸時 innerWidth 已更新但仍保留舊 device-width 版面 | tests/site.e2e.ts | 依 Playwright 官方建議先設尺寸再導航，保留嚴格 320／768px 斷言、兩種語言及完整圖片邊界；新增 320px 實際截圖 |
| 啟動錯誤監聽註冊太晚、社群目的地檢查不足 | tests/site.e2e.ts | 導航前監聽 JS、console、同站 HTTP 錯誤；精確核對全部 9 個連結與 QQ／Discord 資料 |
| 缺少小手機／平板雙語案例、action runtime 棄用 | tests/site.e2e.ts、.github/workflows/deploy.yml | 原 45 項皆保留，新增一個案例 × 五種瀏覽器／裝置設定，共 50 項。固定 Ubuntu 24.04、更新 Node 24 actions，失敗仍上傳證據 |

另外修正 `src/components/Socials.tsx`：將 aria-live 複製公告與 2.8 秒視覺勾號分離，避免輔助科技來不及讀到成功提示；成功樣本及正式站實際剪貼簿均驗證。

後續穩定性調整保留所有原斷言及 30 秒 timeout：`playwright.config.ts` 的 CI worker 從 2 改為 1，避免軟體合成器競爭；`src/styles.css` 將背景細紋 SVG 固定為 140×140px 重複貼片，減少全螢幕濾鏡成本；工作流程移除僅用於診斷的 WebKit A/B 探針，保留全部驗證及 Xvfb。這些調整已在上述最終樣本通過全部 50 項測試與 Lighthouse 門檻。

手機測試設定依據：[Playwright setViewportSize](https://playwright.dev/docs/api/class-page#page-set-viewport-size)，建議先設定尺寸再導航。

分層診斷在 Linux CI 測到：空白 WebKit 頁面約 60 次更新／秒，網站仍顯著較慢；僅把問題歸因於測試環境並不充分。多層效果降級後，關閉持續 canvas 合成的診斷樣本達 125 次／2 秒。這是 CI 軟體渲染診斷，不是實體 iPhone 或訪客 FPS 驗收。

## 測試結果

| 檢查 | 實際結果（上述成功樣本） |
|---|---|
| TypeScript | 通過 |
| Unit Tests | 6／6 通過，0 失敗、0 跳過 |
| Production Build | 通過 |
| Playwright | 50 項：50 項首次通過，0 重試、0 失敗、0 跳過 |
| Responsive Layout | 通過，含 320／768px、繁中／英文 |
| Accessibility | 淺深色 axe WCAG 2A／AA、2.1AA 通過 |
| Console／Resource checks | 通過，測試導航前即開始監聽 |
| Browser Compatibility | Chromium、Firefox、WebKit 及兩種手機模擬設定通過 |
| ESLint | 未執行，專案未配置 |

測試數量從 45 增為 50，來源是新增 320px／768px 雙語版面案例，分別在五種設定執行；沒有刪除、略過原有必要測試。範圍包含首頁圖片、gallery tabs／放大／Escape、精確社群連結、QQ 成功及拒絕剪貼簿的 fallback、Apple iframe、主題與語言持久化、system theme change、reduced-motion、axe、JS 錯誤、資源載入。

每個 Playwright 專案均為 Linux 上的瀏覽器引擎；iPhone 13／Pixel 7 為裝置模擬。Chromium 不代表已在 Windows Chrome 或 Microsoft Edge 產品上實測；Linux WebKit 不等同真實 iOS 或 macOS Safari。

## Lighthouse

以下是成功執行 38217357729 的實際分數，非預估：

| 模式 | Performance | Accessibility | Best Practices | SEO | LCP | CLS |
|---|---:|---:|---:|---:|---:|---:|
| 手機 | 94 | 100 | 100 | 100 | 2316ms | 0 |
| 桌面 | 100 | 100 | 100 | 100 | 510ms | 0 |

手機測試時間 2026-10-12T07:29:34.445Z；桌面 2026-10-12T07:29:42.917Z。先前執行曾測到手機 LCP 2608ms，門檻正確阻止部署；不能把不同次執行中的最高分混合作為同一次結果。

環境：GitHub Actions Ubuntu 24.04、Node 24、Lighthouse 13.5.0、Chrome headless，測試 production build 的 `http://127.0.0.1:4173/fursona-website/`。手機使用 Lighthouse 預設模擬行動裝置與節流；桌面 1350×940、1× CPU、40ms RTT、10Mbps 設定。動畫預設啟用，正常的效能自動降級機制亦啟用；Apple iframe 僅使用者操作後載入，因此不含第三方播放器啟動後的成本。

門檻：手機 Performance ≥85、桌面 ≥90、Accessibility ≥90、LCP <2500ms、CLS <0.1。腳本未降低門檻，任何未達標仍使 workflow 失敗。這是實驗室量測，不是正式網址的真實使用者 Core Web Vitals；沒有可用 INP 實測資料。

## 正式網站與六項功能

2026-10-12 在 Work 雲端 Chrome 實際開啟 HTTPS 正式網址並操作：

| 核心功能 | 驗證 |
|---|---|
| 獸設首頁 | 正常，完整立繪、頭像、參考圖及插畫載入；圖庫切換、放大、關閉正常 |
| 社群 | 正常，核對全部 9 個外部／郵件連結；實際系統剪貼簿取得 QQ 3505606117 與 Discord Butaouo，QQ 提示正常 |
| Apple Music | 正常，官方 Younger／陳芳語 iframe 成功顯示並操作播放，時間進到 0:29 後可暫停；首次進站不載入播放器、不強制播放 |
| 主題 | 正常，Light／Dark／System 可切換，Dark 重整後保留 |
| 語言 | 正常，繁中／English 切換及重整保留 |
| 背景與動態 | 正常，手動暫停與重整保留、重新啟用正常；雲端軟體渲染自動降級，未據此宣稱真機 60 FPS |

正式 HTML、CSS、JavaScript 與全部網站圖片共 11 個資源皆 HTTPS HTTP 200。已載入圖片皆 complete 且 naturalWidth > 0；桌面無橫向溢出。未觀察到本站或 Apple 的致命 JavaScript 錯誤；雲端瀏覽器擴充套件自身出現 metadata 傳送錯誤，來源為 chrome-extension，非網站程式。

此處是真實正式站互動結果，手機排版另由 CI 裝置模擬驗證。

## 素材、設定與權限

基準提交與修復版的 `assets/originals/`、`public/images/`、`src/config/` 經 Git 比對未修改。完整保留五張原始獸設、最佳化圖片、角色外觀、原本暖色 Liquid Glass 設計與所有帳號設定。

指定歌曲保持 Younger／陳芳語，Apple Music track ID `1814208601`、album ID `1814208594`。無 Last.fm、私人 API key 或未授權串流服務。自動測試 mock Apple iframe 以驗證本站整合，不能單憑 mock 宣稱真實播放；真實官方試聽已另於上述正式站人工互動驗證。

2026-10-11 外部連結檢查：10 個 HTTPS 社群／Apple 網址皆 HTTP 200，Bilibili 與 Facebook 正常追蹤重新導向。這只表示網址可達，不代表登入、帳號所有權或第三方所有互動皆驗證。QQ `3505606117`、Discord `Butaouo`、Email `Buta0318@outlook.com` 未改動；未寄送郵件。

GitHub API 寫入實測 `POST /repos/Butaouo/fursona-website/git/blobs` 回傳 `403 Resource not accessible by integration`，沒有重複同一失敗呼叫。修正已透過使用者授權且已登入的 GitHub 網頁編輯器提交，只操作本專案。

## 使用與修改

- 個人資料、社群、圖片路徑、歌曲：`src/config/site.ts`；未填社群隱藏。
- 所有介面翻譯：`src/config/translations.ts`。
- 更換原始圖：`assets/originals/`，執行 `node scripts/optimize-images.mjs` 產生 `public/images/` 的完整構圖 WebP；檔名／比例改變需同步設定及尺寸。
- 部署：main 推送觸發 `.github/workflows/deploy.yml`。Vite base 保持 `/fursona-website/`。
- 主要技術：React 19、TypeScript 5、Vite 7、Tailwind 4、Motion 12、i18next 25；Vitest、Playwright 1.64、axe 4.13、Lighthouse 13.5。

## 尚未執行／限制

- 本機 Playwright 安裝受環境限制：apt `setgroups (1: Operation not permitted)`，下載的瀏覽器 ZIP 亦無法解壓；因此瀏覽器與 Lighthouse 實測使用 GitHub CI。
- 未在實體 iPhone、Android、Windows Chrome／Edge 或 macOS Safari 測試；模擬結果不可替代真機。
- 未取得真實使用者 INP、實體裝置 GPU 或 60 FPS 數據。
- Apple 完整曲目播放受地區、登入、訂閱及瀏覽器限制；不繞過限制，保留官方試聽與直接連結。
- Repository 未設定 ESLint；TypeScript 及既有單元／瀏覽器／建置檢查均獨立記錄，不虛構 lint 執行結果。
