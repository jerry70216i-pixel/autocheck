# 工程照片查驗表自動化系統

目前版本：V2 Word 範本輸出

## 啟動方式

```powershell
python -m http.server 8000 -d public
```

開啟：

```text
http://127.0.0.1:8000
```

## V2 Word 範本輸出

目前 V2 使用 `.docx` Word 範本輸出正式查驗表。

- 不再使用 HTML 表格模擬 Word。
- 不使用 `.doc` 舊格式作為正式模板。
- 不新增 `package.json`。
- 不新增 Node build flow。
- 純前端靜態專案。
- 使用 `public/vendor/` 內建 PizZip、Docxtemplater、ImageModule。

正式模板：

- `templates/self-check-template.docx`
- `templates/supervision-inspection-template.docx`

## 輸出功能狀態

### 自主檢查

- 最多 30 張
- 每頁 3 張
- 最多 10 頁
- 圖片尺寸 `[460, 280]`
- 輸出正式 Word `.docx`

### 監造查驗

- 最多 20 張
- 每頁 2 張
- 最多 10 頁
- 圖片尺寸 `[480, 300]`
- 輸出正式 Word `.docx`

## 使用方式

1. 啟動本機靜態伺服器。
2. 開啟首頁。
3. 建立或選擇工程與照片資料。
4. 填寫照片名稱、位置、說明、設計值、實測值。
5. 匯出自主檢查 Word 或監造查驗 Word。
6. 下載產生的 `.docx` 檔案。

## 本機資料儲存

- 使用 IndexedDB 儲存工程與照片 metadata。
- 圖片 binary / data URL 不持久化儲存在 IndexedDB。
- V2 metadata 欄位包含 `date`、`location`、`description`、`designValue`、`measuredValue`。

## 不做事項

- 不做 AI。
- 不做 RAG。
- 不做雲端資料庫。
- 不做伺服器端輸出。
- 不做無上限照片輸出。
- 不新增 `package.json`。
- 不新增 Node build flow。
- 不使用 `.doc` 舊格式作為正式模板。

## 驗收重點

- 正式模板可正常載入。
- Word `.docx` 可正常產生與下載。
- 自主檢查最多 30 張照片。
- 監造查驗最多 20 張照片。
- 未使用頁面可正確移除。
- placeholder 不殘留。
- 圖片尺寸與版面符合人工驗收結果。
