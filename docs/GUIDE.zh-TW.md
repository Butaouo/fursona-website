# LongDay 網站交付與修改說明

## 目前狀態

網站六項功能的程式已實作，正式建置與 6 項單元測試通過。GitHub 公開專案已建立，但目前遠端只有初始化的 README。網站尚未部署，跨瀏覽器測試與 Lighthouse 尚未執行，不能視為正式驗收完成。

- 專案：https://github.com/Butaouo/fursona-website
- 預計網址：https://Butaouo.github.io/fursona-website/（尚未部署）
- 阻礙：現有 GitHub 連接寫入時回傳 HTTP 403；雲端瀏覽器無法安全恢復登入工作階段。
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

`.github/workflows/deploy.yml` 已準備好：每次推送 main 分支，會安裝鎖定版本套件、執行單元測試、正式建置、45 項瀏覽器測試及手機／桌面 Lighthouse。檢查通過後才部署 Pages，並檢查正式 HTML。失敗會保留測試報告，不會假裝部署成功。

Vite 的正式路徑為 `/fursona-website/`。Pages 的來源需設為 GitHub Actions；這仍屬尚待代理完成的部署工作，不要求你自行編寫程式或設定流程。

## 已知限制

- 尚無瀏覽器視覺驗證、真實 iPhone／Android／Windows 裝置測試或動畫 FPS 量測。
- Lighthouse 尚無實測分數；85／90 分、LCP 2.5 秒與 CLS 0.1 都是待驗收門檻。
- 外部連結收到 HTTP 200，僅證明連線成功，不代表社群登入或平台內全部操作已驗證。
- Apple Music 的跨網域播放器載入不代表完整歌曲可播放；保留合法試聽和跳轉。
- 公開專案已建立，但程式上傳、Pages 開通、首次部署與再次推送自動部署驗證仍須完成。
