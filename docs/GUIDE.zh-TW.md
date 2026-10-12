# LongDay 網站交付與修改說明

## 目前狀態

完整網站原始碼、五張原始獸設素材、最佳化圖片、測試與部署設定均保存在 GitHub。實際發布狀態、修復紀錄與驗收數據請見 `docs/VERIFICATION.md`，不以程式存在或建置成功代替正式網站驗證。

- 專案：https://github.com/Butaouo/fursona-website
- GitHub Pages：https://butaouo.github.io/fursona-website/
- GitHub API 寫入曾回傳 HTTP 403，修復工作已透過使用者授權的 GitHub 網頁編輯器提交。
- 完整實測紀錄：`docs/VERIFICATION.md`；外部連結 HTTP 檢查：`docs/LINK_CHECKS.json`。

## 主要技術

React、TypeScript、Vite、Tailwind CSS、Motion for React、i18next。背景使用 CSS 漸層與 Canvas 粒子，玻璃表面結合半透明、背景模糊、邊緣高光、SVG 折射反光及游標光源。測試設定採用 Vitest、Playwright、axe 與 Lighthouse；部署使用 GitHub Actions 與 GitHub Pages。

素材僅壓縮、調整尺寸，未改動角色毛色、圖案、服裝或構圖。介面從原圖提取暖白、金黃、琥珀與深灰色系，未使用紫色主題。

## 修改個人資料與社群

集中編輯 `src/config/site.ts`：角色名稱、中英文介紹、標語、性格、社群連結、圖片路徑和歌曲資訊都在這裡。介面翻譯放在 `src/config/translations.ts`。

尚未填寫的 Telegram 與 GitHub 社群項目會隱藏。QQ 和 Discord 使用帳號複製；無法取得剪貼簿權限時，會顯示可選取的帳號。所有外部連結使用提供的原始網址。

## 更換獸設素材

原始圖片保存在 `assets/originals/`，網站使用的 WebP 位於 `public/images/`。用同名新圖片替換原始檔後，執行 `node scripts/optimize-images.mjs` 產生最佳化素材。檔案對應表見 `docs/ASSETS.md`。若更換檔名或長寬比例，也需要同步更新 `src/config/site.ts` 的路徑，以及元件中的尺寸與 CSS 比例。

## 更換音樂

在 `src/config/site.ts` 的 `music` 區塊更新歌曲、歌手、專輯名稱、封面、Apple Music 網址及官方嵌入網址。更新 `public/images/younger-cover.webp`，或改成新封面路徑。

官方播放器由訪客點擊後才載入，不強制自動播放。播放範圍仍由 Apple 的地區、帳號與訂閱規則決定。直接開啟 Apple Music 的連結始終保留。最近播放的資料介面已預留，但目前沒有串接私人聆聽紀錄。

## 自動部署設定

`.github/workflows/deploy.yml`：每次推送 main 分支，會安裝鎖定版本套件、執行 6 項單元測試、TypeScript、正式建置、50 項瀏覽器測試及手機／桌面 Lighthouse。檢查通過後才部署 Pages，並檢查正式 HTML。失敗會保留測試報告並阻止部署。原有 45 項測試皆保留，另增加 320px／768px 雙語版面案例，於五種設定執行。

Vite 的正式路徑為 `/fursona-website/`，Pages 的來源已設定為 GitHub Actions。修改內容後推送 main 即可觸發整套流程；若驗證失敗，請從 Actions 的 verify 日誌及 verification artifact 查看原因。

## 已知限制

- CI 以 Chromium、Firefox、WebKit 執行桌面及手機模擬測試；未宣稱真實 iPhone、Android、Windows Edge 或 macOS Safari 裝置實測。
- Lighthouse 的實際分數與環境列於驗收文件；目前沒有真實訪客 INP 或實體裝置 60 FPS 量測。
- 畫面更新速度過低時會自動減少模糊與連續位移，保留半透明表面、高光、角色圖片與操作回饋；減少動態效果及手動暫停設定皆受到尊重。
- 外部連結收到 HTTP 200，僅證明連線成功，不代表社群登入或平台內全部操作已驗證。
- Apple Music 的跨網域播放器載入不代表完整歌曲可播放；保留合法試聽和跳轉。
