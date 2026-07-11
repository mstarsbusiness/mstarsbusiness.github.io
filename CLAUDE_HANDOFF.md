# CLAUDE_HANDOFF — 辰星商務中心官網交接紀錄

更新日期：2026-07-07  
正式上傳資料夾：`辰星網站-CMS版/上傳到GitHub`

## 目前狀態

這個資料夾是準備上傳到 GitHub / 正式網站根目錄的版本。上一輪已完成 SEO、AI 搜尋可讀性與畫面內容補強；本輪再補上 Journal 破圖修復、貼文產生器防呆、驗證工具與交接軌跡。

## 本輪新增 / 修改

### 1. 修正 Journal 兩篇貼文破圖

新增圖片到：

- `images/uploads/2026-06-18.jpg`
- `images/uploads/2026-06-19.jpg`

原因：`data/posts.json` 的前兩篇貼文圖片路徑指向 `/images/uploads/2026-06-18.jpg` 與 `/images/uploads/2026-06-19.jpg`，但正式上傳資料夾原本沒有這兩張圖，導致 `journal.html` 與貼文頁可能破圖。

來源：工作區根目錄 `每日貼文草稿` 內同名圖片。

### 2. 強化 `build-journal.js`

修改檔案：

- `build-journal.js`

新增邏輯：

- `localImageExists()`
- `safeImagePath()`
- `absoluteImageUrl()`

效果：

- 產生貼文頁與 Journal 卡片時，若 CMS 貼文填入不存在的本機圖片，會自動退回 `/images/og-cover.jpg`。
- 文章主圖與列表縮圖增加 `decoding="async"`。
- BlogPosting JSON-LD 的 `image` 會同步使用安全圖片網址，避免結構化資料指向缺圖。

### 3. 新增本機驗證工具

新增檔案：

- `validate-site.js`

用途：

- 檢查所有根目錄 HTML 與 `posts/*.html`
- 驗證 JSON-LD 可被解析
- 檢查本機圖片路徑是否存在
- 檢查 `sitemap.xml` 是否包含 `office-guide.html`、`journal.html`、`/posts/`

執行方式：

```bash
node validate-site.js
```

目前結果：

```text
OK：檢查 20 個 HTML、JSON-LD、圖片路徑與 sitemap。
```

### 4. 新增 `humans.txt`

新增檔案：

- `humans.txt`

用途：

- 放置網站維護與品牌聯絡資訊。
- 補充 AI / 人工審查可讀的基本網站脈絡。
- 記錄常用維護指令：`node build-journal.js`、`node validate-site.js`。

## 已執行驗證

在 `辰星網站-CMS版/上傳到GitHub` 執行：

```bash
node build-journal.js
node --check build-journal.js
node --check validate-site.js
node validate-site.js
```

結果：

- `build-journal.js` 成功產生 5 篇貼文、`journal.html` 與 `sitemap.xml`
- JS 語法檢查通過
- JSON-LD 檢查通過
- 圖片路徑檢查通過
- sitemap 基本檢查通過

## Claude 接手建議流程

1. 先進入正式資料夾：

   ```bash
   cd 辰星網站-CMS版/上傳到GitHub
   ```

2. 如果有改 `data/posts.json`：

   ```bash
   node build-journal.js
   ```

3. 上傳前必跑：

   ```bash
   node validate-site.js
   ```

4. 若要改 Journal 或貼文頁版型，請優先改 `build-journal.js`，再重新產生，不要只手動改 `journal.html` 或 `posts/*.html`，否則下次建置會被覆蓋。

## 已知限制 / 後續可優化

- `journal.html` 與 `posts/*.html` 是產生器輸出，目前可用且通過驗證，但視覺比首頁簡潔；若要更精緻，應從 `build-journal.js` 的 template 與 `assets/pages.css` 一起調整。
- 本機瀏覽器預覽曾受安全政策限制，若要做畫面 QA，建議上傳到測試網址或由本機啟動 HTTP server 後再檢查。
- 相簿頁檔案很大，未來可評估圖片壓縮、縮圖化、延遲載入與分頁，這會對速度與 Core Web Vitals 有幫助。
- 首頁 `index.html` 體積較大且包含動態模板，未來可考慮拆出共用 CSS / JS，降低維護成本。
- 若有 Google 商家、Facebook、Instagram、LINE 官方帳號公開網址，可補到首頁 Organization / LocalBusiness JSON-LD 的 `sameAs`。

## 重要檔案快速索引

- 首頁：`index.html`
- 服務指南：`office-guide.html`
- 借址登記：`virtual-office.html`
- 獨立辦公室：`private-office.html`
- 會議室：`meeting-room.html`
- AI 搜尋摘要：`llms.txt`
- 搜尋引擎規則：`robots.txt`
- sitemap：`sitemap.xml`
- 貼文資料源：`data/posts.json`
- 貼文產生器：`build-journal.js`
- 本機驗證：`validate-site.js`

---

## 2026-07-07 第二輪改版補充

使用者要求：「一起改動，包括網頁視覺效果都可以一起改，最後再交給 Claude。」

### 本輪重點

這一輪不只做檢查，而是主動改善 Journal、貼文頁與共用視覺效果。重點是把可被 CMS / GitHub Action 重複產生的內容放回 `build-journal.js`，避免只改輸出檔導致下次發文被覆蓋。

### 修改檔案

- `build-journal.js`
- `assets/pages.css`
- `journal.html`（由 `build-journal.js` 重新產生）
- `posts/*.html`（由 `build-journal.js` 重新產生）
- `sitemap.xml`（由 `build-journal.js` 重新產生）
- `CLAUDE_HANDOFF.md`

### Journal / 貼文頁改版內容

`build-journal.js` 已重寫成較乾淨、可維護的版本，新增：

- 品牌常數：`BRAND`
- 預設封面：`DEFAULT_IMAGE`
- 摘要產生：`excerpt()`
- 閱讀時間：`readingMinutes()`
- 圖片防呆：`safeImagePath()`、`absoluteImageUrl()`
- Journal 首頁新版 hero、分類標籤、Quick Answer 區塊
- Journal 精選文章區塊
- 所有文章卡片摘要與閱讀時間
- 單篇文章新版版型：側邊 CTA、文章摘要、文章底部 CTA、延伸閱讀
- Journal CollectionPage JSON-LD
- 單篇文章 BlogPosting JSON-LD 保持輸出

### 視覺效果改版內容

`assets/pages.css` 新增：

- Journal 漸層 hero、背景光暈、分類 pills
- 精選文章大卡片
- 文章頁雙欄版型與 sticky 側邊 CTA
- 文章摘要左金線、文章底部深色 CTA
- 文章卡片 hover 放大與底線光條
- 全站卡片 hover 浮起與陰影
- CTA 區塊背景光暈
- 按鈕 hover 掃光效果
- 比較表格列 hover
- 手機版 Journal / 文章頁響應式調整

### 驗證結果

本輪已重新執行：

```bash
node build-journal.js
node --check build-journal.js
node --check validate-site.js
node validate-site.js
```

結果：

```text
完成：產生 5 篇貼文、Journal 與 sitemap。
OK：檢查 20 個 HTML、JSON-LD、圖片路徑與 sitemap。
```

### 瀏覽器預覽狀態

嘗試用內建瀏覽器開啟本機 `file://.../journal.html`，但被瀏覽器安全政策阻擋。沒有繞過限制。若 Claude 後續要做肉眼 QA，建議：

1. 將 `上傳到GitHub` 資料夾上傳到測試站或正式站後，用公開網址檢查。
2. 或由使用者在本機允許安全的 HTTP server 預覽，再請 Claude 檢查 localhost。

### Claude 下一步建議

若要繼續做「畫面優化」，建議優先順序：

1. 檢查實機畫面：`journal.html`、任一 `posts/*.html`、`office-guide.html`、三個服務頁。
2. 如果 Journal 視覺 OK，再考慮把首頁 `index.html` 的大型 inline CSS / JS 分離，降低維護成本。
3. 相簿頁檔案仍然很大，下一輪最值得做圖片壓縮與縮圖化，對速度分數幫助最大。
4. 若取得 Google 商家、Facebook、Instagram、LINE 官方網址，可補進 LocalBusiness / Organization JSON-LD 的 `sameAs`。
