"use strict";

import {
  buildExportFileName,
  buildWordHtml,
  chunkItems,
  downloadWordHtml,
  escapeHtml
} from "./exporter-utils.js";

export const selfCheckExporter = {
  id: "self-check",
  label: "自主檢查",
  export(context) {
    const html = buildSelfCheckDocument(context);
    const fileName = buildExportFileName(context.meta.projectName, "自主檢查");
    downloadWordHtml(html, fileName);
  }
};

function buildSelfCheckDocument(context) {
  const pages = chunkItems(context.photos, 3);
  const bodyHtml = pages.map((pagePhotos) => buildPage(context.meta, pagePhotos)).join("");

  return buildWordHtml("自主照片紀錄", bodyHtml, `
    .self-page {
      page-break-after: always;
    }
    .self-page:last-child {
      page-break-after: auto;
    }
    .self-title {
      text-align: center;
      font-size: 22pt;
      font-weight: 700;
      margin: 0 0 10px;
    }
    .project-name {
      font-size: 13pt;
      margin: 0 0 8px;
    }
    .self-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }
    .self-photo-cell {
      width: 58%;
      height: 210px;
      text-align: center;
      vertical-align: middle;
    }
    .self-info-cell {
      width: 42%;
      height: 210px;
      line-height: 1.7;
      vertical-align: top;
    }
    .self-photo {
      max-width: 100%;
      max-height: 198px;
      width: auto;
      height: auto;
    }
    .label {
      font-weight: 700;
    }
  `);
}

function buildPage(meta, photos) {
  const rows = photos.map((photo) => buildPhotoRow(meta, photo)).join("");

  return `
    <section class="self-page">
      <h1 class="self-title">自主照片紀錄</h1>
      <div class="project-name">工程名稱：${escapeHtml(meta.projectName || "")}</div>
      <table class="self-table">
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function buildPhotoRow(meta, photo) {
  const date = getPhotoDate(photo, meta);
  const location = getPhotoLocation(photo, meta);
  const description = photo.description || "";

  return `
    <tr>
      <td class="self-photo-cell">
        <img class="self-photo" src="${photo.dataUrl}" alt="">
      </td>
      <td class="self-info-cell">
        <div><span class="label">日期：</span>${escapeHtml(date)}</div>
        <div><span class="label">位置：</span>${escapeHtml(location)}</div>
        <div><span class="label">說明：</span>${escapeHtml(description)}</div>
      </td>
    </tr>
  `;
}

function getPhotoDate(photo, meta) {
  return typeof photo.date === "string" && photo.date.trim()
    ? photo.date.trim()
    : meta.inspectionDate || "";
}

function getPhotoLocation(photo, meta) {
  return typeof photo.location === "string" && photo.location.trim()
    ? photo.location.trim()
    : meta.location || "";
}

