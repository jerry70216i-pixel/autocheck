"use strict";

export function chunkItems(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export function downloadWordHtml(html, fileName) {
  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function buildWordHtml(title, bodyHtml, styleHtml) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm;
    }
    body {
      margin: 0;
      color: #111;
      font-family: "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif;
      font-size: 12pt;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
    th,
    td {
      border: 1px solid #222;
      padding: 6px;
      vertical-align: top;
    }
    img {
      display: block;
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      margin: 0 auto;
      object-fit: contain;
    }
    .page {
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: auto;
    }
    ${styleHtml}
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

export function buildExportFileName(projectName, keyword, extension = "doc") {
  const name = sanitizeFileName(projectName || "工程照片查驗表");
  const date = new Date().toISOString().slice(0, 10);
  return `${name}-${keyword}-${date}.${extension}`;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeFileName(value) {
  return String(value)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .slice(0, 80);
}

