# V2 Template Placeholder Guide

V2 正式版改採「Word 範本複製 / placeholder 填值」方案，不再以自製 HTML 表格作為最終輸出方案。

## 範本格式要求

- 請提供 `.docx` 範本。
- 舊版 `.doc` 請先用 Microsoft Word 或 LibreOffice 另存為 `.docx`。
- 請不要提供只有圖片截圖的範本；placeholder 必須是 Word 文件中的可選取文字。
- placeholder 建議獨立放在對應儲存格或文字框中，避免被 Word 拆成多段格式。

## 自主檢查範本 placeholder

一頁 3 組照片，左圖右文字。

頁首：

```text
{{PROJECT_NAME}}
```

第 1 組：

```text
{{SELF_PHOTO_1}}
{{SELF_DATE_1}}
{{SELF_LOCATION_1}}
{{SELF_DESC_1}}
```

第 2 組：

```text
{{SELF_PHOTO_2}}
{{SELF_DATE_2}}
{{SELF_LOCATION_2}}
{{SELF_DESC_2}}
```

第 3 組：

```text
{{SELF_PHOTO_3}}
{{SELF_DATE_3}}
{{SELF_LOCATION_3}}
{{SELF_DESC_3}}
```

照片超過 3 張時，後續實作需要複製同樣版面到下一頁。

## 監造查驗範本 placeholder

一頁 2 組照片，左圖右說明。

頁首：

```text
{{COMPANY_NAME}}
{{PROJECT_NAME}}
{{CHECK_ITEM}}
```

第 1 組：

```text
{{SUP_PHOTO_1}}
{{SUP_DATE_1}}
{{SUP_LOCATION_1}}
{{SUP_DESC_1}}
```

第 2 組：

```text
{{SUP_PHOTO_2}}
{{SUP_DATE_2}}
{{SUP_LOCATION_2}}
{{SUP_DESC_2}}
```

照片超過 2 張時，後續實作需要複製同樣版面到下一頁。

## 日期與位置資料規則

- 每張照片需要獨立 `photo.date`。
- 每張照片需要獨立 `photo.location`。
- 全域查驗日期只作為新增照片時的預設值。
- 全域施工位置只作為新增照片時的預設值。
- 匯出時優先使用 `photo.date`。
- 匯出時優先使用 `photo.location`。
- 若 `photo.date` 空白，才使用全域查驗日期。
- 若 `photo.location` 空白，才使用全域施工位置。
- 不得使用照片檔名作為位置。

## 下一步需要提供的檔案

- `templates/self-check-template.docx`
- `templates/supervision-inspection-template.docx`

兩份 `.docx` 都需要放入上述 placeholder。

