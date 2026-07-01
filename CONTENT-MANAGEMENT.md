# Portfolio content management

作品文案、順序、分類與顯示狀態由 Google Sheet `Portfolio Projects` 管理。

- [Portfolio Projects 試算表](https://docs.google.com/spreadsheets/d/1nMFCiGbw4tPGBrLoRHNU3-lUk1m5NiI2HPknMqG4MxM/edit)
- [公開唯讀 API](https://script.google.com/macros/s/AKfycbxE2wGrXxTimi8ZmhMhCOgK2yaekQHQNRji1cm5VOTHPiZuuy5NWmHpCf2g_ZKWrdB5/exec)

## 常用操作

- 修改文案：直接編輯對應作品列，網站重新整理後讀取最新資料。
- 隱藏作品：將 `published` 改為 `FALSE`；固定編號不會重新排列。
- 調整順序：修改 `sort_order`，數字越小越前面。
- 設為精選：將 `featured` 改為 `TRUE`，並用 `featured_order` 設定 1–4。
- 修改分類：使用 `web`、`ui`、`visual`、`brand`。
- 換圖：
  1. 將圖片上傳至 `assets/behance/` 並部署 GitHub Pages。
  2. 在 `image_path` 填入 `assets/behance/檔名.jpg`。
  3. `fallback_image_path` 保留可用的舊圖片，避免新路徑錯誤時出現破圖。
- 新增作品：新增一列，使用未曾使用過的固定 `number` 與唯一 `id`，填妥所有欄位後將 `published` 改為 `TRUE`。

## 安全與備份

- Sheet 可以維持私人；Apps Script Web App 只輸出公開作品欄位。
- 不要在 Sheet 放客戶機密、私人備註或未公開資料。
- `projects/projects-fallback.json` 是網站離線備份。當 API 無法讀取時，網站會使用瀏覽器快取或此檔案。
- API 網址設定在 `projects/portfolio-config.js`。

## Apps Script 更新

Apps Script 原始碼位於 `apps-script/`。修改程式後需在 Apps Script 重新部署 Web App，並確認：

- Execute as：Me
- Who has access：Anyone
- 回傳格式包含 `version` 與 `projects`

## 報價方案頁

報價頁位於 `pricing.html`，資料載入設定在 `pricing/pricing-config.js`。

- [報價 Google Sheet](https://docs.google.com/spreadsheets/d/1k1SwK9uKcZBQhjsrS_BFQosx5dH5Fc7EaOCgLYyNSdg/edit?gid=695559638#gid=695559638)
- 本地備份資料：`pricing/pricing-fallback.json`
- Apps Script 範本：`apps-script/PricingCode.gs`

報價 Sheet 欄位需包含：

- `published`
- `sort_order`
- `category`
- `service_name`
- `subtitle`
- `price_from`
- `price_to`
- `price_unit`
- `description`
- `deliverables`
- `timeline`
- `note`
- `cta_label`

常用操作：

- 顯示或隱藏方案：將 `published` 改為 `TRUE` 或 `FALSE`。
- 調整順序：修改 `sort_order`，數字越小越前面。
- 單一價格：只填 `price_from`，前台會顯示 `NT$ xx,xxx 起`。
- 價格區間：同時填 `price_from` 與 `price_to`，前台會顯示 `NT$ xx,xxx–xx,xxx`。
- 交付內容：`deliverables` 可用換行、`;` 或 `；` 分隔。

部署步驟：

1. 將 `apps-script/Code.gs` 與 `apps-script/PricingCode.gs` 同步到 Apps Script 專案。
2. 重新部署 Web App。
3. 開啟 `https://script.google.com/macros/s/你的部署ID/exec?dataset=pricing` 確認回傳包含 `version` 與 `pricing`。
4. 將該網址填入 `pricing/pricing-config.js` 的 `apiUrl`。
5. 本機與 GitHub Pages 驗證完成後再部署正式站。
