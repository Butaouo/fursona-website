# LongDay 第三階段：動態與品牌

基準版本：47e3d6b。保留既有圖片、文案、社群、音樂、Google 同步設定及全部 75 項瀏覽器測試。

## 動態設計

- 1.15 秒非阻擋開場：上下鏡幕、金色地平線與品牌字標。以 sessionStorage 記錄單一分頁已播放，不在回首頁或重新整理時重播；不延遲主視覺圖片請求。暫停／reduced-motion 不播放。
- 三個全域光場：暖金主光、琥珀側光、低比例冷青補光，搭配弧形光帶與懸浮微粒。各頁調整構圖，手機保留三層。漸層固定繪製，持續動畫只改 transform／opacity，不對全螢幕做即時 blur 或 SVG 濾鏡。
- 頁面退出上移、進場縮放與位移，加上跨頁光掃描。標題遮罩逐字揭露，原有語言逐字切換保留。
- IntersectionObserver 觀察正文節點與各區塊，滑動時揭露。圖片與文字採不同距離、節奏；保留原本語意結構與圖片放大功能。
- 手機觸控光波、玻璃局部反射及按壓回饋；商品原有共享元素展開與反向打字保留。

## 效能策略修正

舊版 1.5 秒內少於 24 幀會把 quality 設為 minimal，停用主要裝飾動畫；CPU 核心數 <=4 也會先降級。新策略不以觸控或核心數判斷能力。記憶體 <=2 GB／Save-Data 先減少粒子與模糊；一般裝置忽略初始 1.5 秒，須持續取樣至少 6 秒、80 幀且超過 60% 幀間距 >50ms 才降低昂貴效果。30fps Safari 仍保留主要動畫。低品質只移除微粒並降低玻璃模糊，不關閉光場、文字、轉場或互動。

不再使用背景 Canvas；不以測試環境、user-agent 或 Lighthouse 偵測偷偷停用動畫。效能門檻維持原值。

## 品牌與素材

原有正式圖檔都在 public/images 與 public/brand，使用 lyont-*、younger-cover、bump 等中性檔名；未發現正式素材依賴生成工具暫存網域。角色原始檔完整保留，無重新生成、改色或裁切。分享 metadata 補齊品牌名稱、語系與圖片替代文字，仍使用同一張原始角色頭像。

建置會檢查發布檔名、HTML／JSON／SVG／XML／一般文字及分享圖片路徑；瀏覽器會檢查畫面文字、img URL／alt、metadata 與對外連結。第三方授權與來源說明不做刪改。Google 同步沒有啟用或變更。

## 驗收

新增 6 個動畫政策單元測試，共 24 個。新增 5 個瀏覽器案例 × 5 組引擎，共 100 個：開場不重播、正常手機三層光場實際位移、滑動景深、觸控回饋、低效能仍有動畫、暫停／reduced-motion、圖文分層進場、品牌來源檢查。

以 GitHub Actions 執行結果及其 verification artifact 為準。瀏覽器範圍為 Chromium／Firefox／WebKit／iPhone 13 WebKit 模擬／Pixel 7 Chromium 模擬。這不等同真實 iPhone、Android 或 macOS Safari 測試。自動 Lighthouse 為 CI Linux 本地正式建置，不代表真實訪客 INP 或長時間 60 FPS。

## 維護

- 光場與手機視覺：src/phase3.css。
- 光場互動與取樣：src/components/Background.tsx、src/motionPolicy.ts。
- 開場與滑動揭露：src/components/SceneMotion.tsx。
- 原有個人資料仍在 src/config/site.ts。
