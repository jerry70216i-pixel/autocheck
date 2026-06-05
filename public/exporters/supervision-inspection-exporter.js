"use strict";

import {
  buildExportFileName,
  buildWordHtml,
  chunkItems,
  downloadWordHtml,
  escapeHtml
} from "./exporter-utils.js";

export const supervisionInspectionExporter = {
  id: "supervision-inspection",
  label: "監造查驗",
  export(context) {
    const html = buildSupervisionDocument(context);
    const fileName = buildExportFileName(context.meta.projectName, "監造查驗");
    downloadWordHtml(html, fileName);
  }
};

function buildSupervisionDocument(context) {
  const pages = chunkItems(context.photos, 2);
  const bodyHtml = pages.map((pagePhotos) => buildPage(context.meta, pagePhotos)).join("");

  return buildWordHtml("照片紀錄表", bodyHtml, `
    .supervision-page {
      page-break-after: always;
    }
    .supervision-page:last-child {
      page-break-after: auto;
    }
    .company-name {
      text-align: center;
      font-size: 14pt;
      font-weight: 700;
      margin: 0 0 4px;
    }
    .supervision-title {
      text-align: center;
      font-size: 22pt;
      font-weight: 700;
      margin: 0 0 10px;
    }
    .header-table {
      width: 100%;
      table-layout: fixed;
      margin-bottom: 8px;
    }
    .header-table th {
      width: 110px;
      background: #f3f3f3;
      text-align: center;
    }
    .supervision-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
    }
    .supervision-photo-cell {
      width: 58%;
      height: 285px;
      text-align: center;
      vertical-align: middle;
    }
    .supervision-info-cell {
      width: 42%;
      height: 285px;
      line-height: 1.7;
      vertical-align: top;
    }
    .supervision-photo {
      max-width: 100%;
      max-height: 270px;
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
    <section class="supervision-page">
      <div class="company-name">台灣世曦工程顧問股份有限公司</div>
      <h1 class="supervision-title">照片紀錄表</h1>
      <table class="header-table">
        <tbody>
          <tr>
            <th>工程名稱</th>
            <td>${escapeHtml(meta.projectName || "")}</td>
          </tr>
          <tr>
            <th>拍攝項目</th>
            <td>${escapeHtml(meta.inspectionItem || "")}</td>
          </tr>
        </tbody>
      </table>
      <table class="supervision-table">
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
      <td class="supervision-photo-cell">
        <img class="supervision-photo" src="${photo.dataUrl}" alt="">
      </td>
      <td class="supervision-info-cell">
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

