# V2 Template Analysis

## 目前結論

目前自製 HTML 方案不符合需求，不能作為 V2 正式輸出方案。

V2 正式方向改為：

- 複製使用者提供的 Word `.docx` 範本。
- 透過範本內 placeholder 填入工程資料、日期、位置、說明與照片。
- 不再用自製 HTML 表格宣稱完成 Word 範本輸出。

## 目前範本狀態

- `templates/supervision-inspection-template.docx`
  - 格式：`.docx`
  - 檢查結果：目前未找到 `{{...}}` placeholder。
  - 結論：不能直接用於 placeholder 填值，需要先在 Word 內加入 placeholder。

- `templates/self-check-template.doc`
  - 格式：舊版 `.doc`
  - 結論：目前不處理舊版 `.doc`。請先另存為 `.docx`。

## 是否可直接使用目前 Word 範本

目前不能直接使用。

原因：

- 自主檢查範本是 `.doc`，不是 `.docx`。
- 監造查驗 `.docx` 沒有 placeholder。
- 尚未有可在純前端穩定複製範本、替換文字 placeholder、插入圖片的套件。

## Placeholder 方案

請依 `docs/V2_TEMPLATE_PLACEHOLDER_GUIDE.md` 在 Word 範本中加入 placeholder。

### 自主檢查

- 一頁 3 組照片。
- 左側照片，右側日期、位置、說明。
- 每組需要：
  - `{{SELF_PHOTO_N}}`
  - `{{SELF_DATE_N}}`
  - `{{SELF_LOCATION_N}}`
  - `{{SELF_DESC_N}}`
- 頁首需要：
  - `{{PROJECT_NAME}}`

### 監造查驗

- 一頁 2 組照片。
- 左側照片，右側說明。
- 頁首需要：
  - `{{COMPANY_NAME}}`
  - `{{PROJECT_NAME}}`
  - `{{CHECK_ITEM}}`
- 每組需要：
  - `{{SUP_PHOTO_N}}`
  - `{{SUP_DATE_N}}`
  - `{{SUP_LOCATION_N}}`
  - `{{SUP_DESC_N}}`

## 每張照片資料需求

後續正式 V2 實作前，需要讓每張照片支援：

- `photo.date`
- `photo.location`
- `photo.description`

資料規則：

- 全域查驗日期只作為新增照片時的預設值。
- 全域施工位置只作為新增照片時的預設值。
- 每張照片可以自行修改日期與位置。
- 匯出時優先使用 `photo.date`。
- 匯出時優先使用 `photo.location`。
- 若 `photo.date` 空白，才使用全域查驗日期。
- 若 `photo.location` 空白，才使用全域施工位置。
- 不得使用照片檔名作為位置。
- 照片檔名不得出現在正式匯出的日期、位置、說明欄位。

## 技術限制

目前專案沒有 `package.json`，也沒有 docx 處理套件。

若要在純前端穩定操作 `.docx` 範本並插入圖片，通常需要新增 dependency。

候選方案：

- `pizzip`
  - 用途：讀寫 `.docx` zip 結構。
  - 純前端：可用。
  - 搬遷性：需要把套件納入專案或建置流程。
  - 是否能插入圖片：本身不負責圖片 placeholder。

- `docxtemplater`
  - 用途：文字 placeholder 替換。
  - 純前端：可用。
  - 搬遷性：需要新增套件。
  - 是否能插入圖片：文字可，圖片需要 image module。

- `docxtemplater-image-module-free` 或官方 image module
  - 用途：將圖片插入 docx placeholder。
  - 純前端：需再驗證版本與授權。
  - 搬遷性：需要新增套件。
  - 是否能插入圖片：是，目標就是圖片插入。

未經確認，不應新增 dependency。

## 採取行動

本次只完成分析與 placeholder guide。

尚未進行：

- 不實作 docx 填值。
- 不新增 dependency。
- 不繼續自製 HTML 表格方向。
- 不 commit。
- 不 push。

