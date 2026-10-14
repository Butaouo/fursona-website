# LongDay：Google 圖文出版操作指南

## 狀態與安全邊界

程式已具備 Google Docs／Drive／Sheets 的唯讀同步管線，但沒有你的 Google 授權之前不會讀取任何文件。網站訪客不需要登入。網站不使用 Last.fm、Decap 或管理員後台。

Google Docs → GitHub Actions（伺服器端唯讀同步、圖片轉存與驗證）→ GitHub Pages。

只有 Sheet 中 `publishStatus` 完全等於 `published`，且日期不在未來的列會被讀取。草稿文件不會送出 Docs 讀取請求。Google 文件 ID、Service Account 私鑰與 Access Token 不會寫入網站 JSON。正文以 React 文字節點呈現，不執行 HTML。圖片下載後重新編碼為 WebP 並移除 metadata，網站不依賴私人 Drive 連結。所有檔案成功才替换待建置資料；同步、測試、建置或效能驗收失敗都不部署，現有正式站保留。

## 一次性設定（需要擁有者授權，請勿在聊天貼出金鑰）

1. 在你自己的 Google Cloud 專案啟用 **Google Docs API、Google Drive API、Google Sheets API**。不需要購買服務；如帳號要求付款或組織批准，先停止，不要自行付費。
2. 建立專用 Service Account，不授予 Cloud 專案管理員、不啟用全網域委派。建立 JSON 金鑰並保存在你自己的裝置上。只有這個網站的同步服務使用它；之後可改成 Workload Identity Federation 免長效金鑰。
3. 在 Drive 建立專用「LongDay 發布」資料夾，內含發布用 Docs、圖片與下述 Sheet；只將這個資料夾以「檢視者」分享給 Service Account 的 email。不要公開整個 Drive，也不要把私人文件搬入此資料夾。資料夾內檔案會繼承該唯讀權限。
4. 建立 Google Sheet，兩個工作表必須命名為 `Articles` 與 `Products`，第一列使用下表欄名。可先只填標題列。
5. 到本專案 **Settings → Secrets and variables → Actions**，新增 Repository secrets：`GOOGLE_SERVICE_ACCOUNT_JSON`（完整 JSON，只貼在 GitHub 的 Secret 表單）、`GOOGLE_PUBLICATION_SHEET_ID`（Sheet 網址 `/d/` 與 `/edit` 之間的 ID）。若要關係圖同步，另設 `GOOGLE_RELATIONSHIP_FOLDER_ID`，指向專用圖檔資料夾。
6. 至少準備一筆正式發布內容後，新增 Repository variable `GOOGLE_SYNC_ENABLED=true`，在 **Actions → Test and deploy LongDay to GitHub Pages → Run workflow** 執行一次。成功後每小時第 17、47 分自動檢查；GitHub 排程可能延遲，實際更新還需等待完整測試與部署，不是即時。

若目前完全沒有內容但要驗證連線，另外設 `GOOGLE_ALLOW_EMPTY_PUBLICATION=true` 明確允許空白發布；確認完成後移除此旗標。若曾發布過內容，不要隨意關閉 `GOOGLE_SYNC_ENABLED` 後重新部署，因為 Repository 的初始 catalog 是空白；要暫停發文，保留現有 published 列，停止修改即可。

## Articles 欄位（A～N）

| 欄位 | 用法 |
|---|---|
| id | 網址代號：小寫英文、數字、連字號，唯一，例如 chapter-01 |
| kind | `novel` 或 `diary` |
| title / titleEn | 中文標題／選填英文標題 |
| summary / summaryEn | 摘要／選填英文摘要 |
| date | `YYYY-MM-DD`；以 UTC 日期判斷未來發布 |
| series | 同系列識別字；不填則獨立文章 |
| chapter | 系列章節數字，供上一章／下一章排序 |
| docId | Google Docs 網址 `/d/` 後的文件 ID |
| tabId | 多個文件分頁時必填，網址中的 `tab=` 值；只有一頁可留空 |
| publishStatus | `draft` 或 `published`；只有後者會公開 |
| coverDriveId | 選填封面圖的 Drive 檔案 ID |

欄位順序可調整，但欄名必須一致，且不能重複。正文不做機器翻譯；英文 UI 會明確提示文章使用作者原文。

## iPhone 新增圖文小說／日記

1. 打開 Google Docs App，在「LongDay 發布」資料夾新增文件。先於 Sheets 的 Articles 新增一列，`publishStatus=draft`。
2. 在 Docs 輸入標題及段落；可使用標題樣式、粗體、斜體。「插入 → 圖片」將插畫放入正文，使用**與文字排列／inline**，不要使用浮動或文字環繞。文字、圖片的先後順序即網站順序。
3. 圖片後另起一段可寫圖片說明；如果設定圖片替代文字／標題，網站使用它作為 alt／caption。分隔章節可另起一段輸入 `---`。目前不支援表格、繪圖、嵌入物件、註腳；遇到不支援內容會停止發布，不會默默丟失。
4. 將文件連結中的 ID 填入 `docId`，填入文章標題、日期、分類、系列與章節。封面圖片上傳到發布資料夾，填 `coverDriveId`。多分頁文件必須填 `tabId`，避免其他草稿分頁意外公開。
5. 檢查完畢，把該列改為 `published`。等待下一次排程與驗證完成，到網站「創作」閱讀。日常操作不使用 ChatGPT，也不消耗 ChatGPT Token。
6. 修改已發布文件會在下一次成功同步公開。若要先保留草稿，複製成另一份未列入發布清單的文件，完成後再替換 docId。改為 draft 會在下次成功同步下架；已被別人下載或快取的內容無法追回。

## 更新角色關係圖

1. 將專用資料夾的 ID 設為 `GOOGLE_RELATIONSHIP_FOLDER_ID`，並分享該資料夾給 Service Account 檢視。
2. 在這個資料夾內只保留一個正式檔：`relationships-published.png`、`.jpg`、`.jpeg` 或 `.webp`。其他草稿可用不同名稱。
3. 上傳替換圖片（不必公開連結）；等下一次同步。若有零個或多個符合的圖檔，同步會停止並保留舊站。
4. 網站直接顯示圖片，支援拖曳、雙指縮放、鍵盤縮放、重設與全螢幕。iPhone 不支援原生 element fullscreen 時，使用填滿視窗的替代模式。

## Products 欄位（A～O）

`id,name,nameEn,imageDriveId,summary,summaryEn,description,descriptionEn,price,status,statusEn,order,publishStatus`

必填 id、name、imageDriveId；建議填 summary、description、status、order。price 可留空，否則以你輸入的完整文字顯示（包含幣別）。publishStatus 改為 published 才展示。status 是對外狀態，如「準備中」或「已完售」，不等於發布控制。商品圖片上傳到同一專用 Drive 發布資料夾，再把檔案 ID 填入 imageDriveId；不使用私人圖片 URL。網站只有展示，沒有購物車、付款或虛構售價。

資料格式保留 `images` 陣列作未來多張詳細圖片擴充；目前 Sheet 每件商品同步一張主圖，完整說明會逐字展開。

## 維護與限制

- 每張原圖上限 20 MB／2400 萬像素，輸出最多 2000 × 2400、保留比例。原始文件和圖片不會被修改。
- 單次上限 Articles 1000 列、Products 200 列；這是個人網站用途，不是大量內容 CMS。
- Docs 標題與段落、粗斜體、inline 圖片及分隔線支援；不完整模擬所有 Google Docs 排版。
- Google 授權後仍必須做一次真實文件、圖片與失敗保留舊版的端到端驗收。單元 fixture 測試不能替代帳號整合驗收。
- 同步程式只在 GitHub Actions 使用 Secret，不可將 Secret 改成 `VITE_` 環境變數或提交到 Repository。
- 更新金鑰：先在 GitHub Secret 替換並驗證，再撤銷舊金鑰。若曾洩漏，立刻撤銷，不要只刪除聊天或檔案。
- 官方依據：[Docs tabs](https://developers.google.com/workspace/docs/api/how-tos/tabs)、[Service account OAuth](https://developers.google.com/identity/protocols/oauth2/service-account)、[GitHub schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。
