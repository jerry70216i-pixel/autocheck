"use strict";

const state = {
  photos: []
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  renderPhotoList();
  renderTablePreview();
});

function cacheElements() {
  elements.projectName = document.getElementById("projectName");
  elements.inspectionDate = document.getElementById("inspectionDate");
  elements.location = document.getElementById("location");
  elements.inspectionItem = document.getElementById("inspectionItem");
  elements.photoInput = document.getElementById("photoInput");
  elements.photoList = document.getElementById("photoList");
  elements.emptyState = document.getElementById("emptyState");
  elements.tablePreview = document.getElementById("tablePreview");
  elements.exportButton = document.getElementById("exportButton");
  elements.refreshPreviewButton = document.getElementById("refreshPreviewButton");
}

function bindEvents() {
  elements.photoInput.addEventListener("change", handlePhotoSelection);
  elements.exportButton.addEventListener("click", exportTableHtml);
  elements.refreshPreviewButton.addEventListener("click", renderTablePreview);

  [
    elements.projectName,
    elements.inspectionDate,
    elements.location,
    elements.inspectionItem
  ].forEach((input) => input.addEventListener("input", renderTablePreview));
}

async function handlePhotoSelection(event) {
  const files = Array.from(event.target.files || []);
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  const loadedPhotos = await Promise.all(imageFiles.map(readPhotoFile));

  state.photos = state.photos.concat(loadedPhotos);
  event.target.value = "";
  renderPhotoList();
  renderTablePreview();
}

function readPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        dataUrl: reader.result,
        description: ""
      });
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function renderPhotoList() {
  elements.photoList.innerHTML = "";
  elements.emptyState.hidden = state.photos.length > 0;

  state.photos.forEach((photo, index) => {
    const card = document.createElement("article");
    card.className = "photo-card";

    const image = document.createElement("img");
    image.src = photo.dataUrl;
    image.alt = photo.name;

    const meta = document.createElement("div");
    meta.className = "photo-meta";

    const title = document.createElement("strong");
    title.textContent = `${index + 1}. ${photo.name}`;

    const size = document.createElement("span");
    size.textContent = formatFileSize(photo.size);

    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent = "查驗說明";

    const description = document.createElement("textarea");
    description.rows = 3;
    description.value = photo.description;
    description.placeholder = "例：現場施工情形符合查驗項目。";
    description.addEventListener("input", () => {
      photo.description = description.value;
      renderTablePreview();
    });

    descriptionLabel.appendChild(description);
    meta.append(title, size, descriptionLabel);

    const actions = document.createElement("div");
    actions.className = "photo-actions";

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.textContent = "上移";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => movePhoto(index, -1));

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.textContent = "下移";
    downButton.disabled = index === state.photos.length - 1;
    downButton.addEventListener("click", () => movePhoto(index, 1));

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "移除";
    removeButton.addEventListener("click", () => removePhoto(photo.id));

    actions.append(upButton, downButton, removeButton);
    card.append(image, meta, actions);
    elements.photoList.appendChild(card);
  });
}

function movePhoto(index, direction) {
  const targetIndex = index + direction;

  if (targetIndex < 0 || targetIndex >= state.photos.length) {
    return;
  }

  const [photo] = state.photos.splice(index, 1);
  state.photos.splice(targetIndex, 0, photo);
  renderPhotoList();
  renderTablePreview();
}

function removePhoto(photoId) {
  state.photos = state.photos.filter((photo) => photo.id !== photoId);
  renderPhotoList();
  renderTablePreview();
}

function renderTablePreview() {
  if (state.photos.length === 0) {
    elements.tablePreview.innerHTML = '<div class="empty-table-note">選取照片後會在這裡產生固定表格預覽。</div>';
    return;
  }

  elements.tablePreview.innerHTML = buildInspectionTableHtml();
}

function buildInspectionTableHtml() {
  const meta = getProjectMeta();
  const rows = state.photos.map((photo, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><img src="${photo.dataUrl}" alt="${escapeHtml(photo.name)}"></td>
      <td>${escapeHtml(photo.name)}</td>
      <td>${escapeHtml(photo.description || "未填寫")}</td>
    </tr>
  `).join("");

  return `
    <table class="inspection-sheet">
      <caption>工程照片查驗表</caption>
      <tbody>
        <tr>
          <th>工程名稱</th>
          <td colspan="3">${escapeHtml(meta.projectName || "未填寫")}</td>
        </tr>
        <tr>
          <th>查驗日期</th>
          <td>${escapeHtml(meta.inspectionDate || "未填寫")}</td>
          <th>施工位置</th>
          <td>${escapeHtml(meta.location || "未填寫")}</td>
        </tr>
        <tr>
          <th>查驗項目</th>
          <td colspan="3">${escapeHtml(meta.inspectionItem || "未填寫")}</td>
        </tr>
      </tbody>
      <thead>
        <tr>
          <th style="width: 64px;">序號</th>
          <th style="width: 260px;">照片</th>
          <th>檔名</th>
          <th>查驗說明</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

function getProjectMeta() {
  return {
    projectName: elements.projectName.value.trim(),
    inspectionDate: elements.inspectionDate.value,
    location: elements.location.value.trim(),
    inspectionItem: elements.inspectionItem.value.trim()
  };
}

function exportTableHtml() {
  if (state.photos.length === 0) {
    alert("請先選取照片。");
    return;
  }

  const documentHtml = buildExportDocumentHtml(buildInspectionTableHtml());
  const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = buildExportFileName();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildExportDocumentHtml(tableHtml) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>工程照片查驗表</title>
  <style>
    body {
      margin: 24px;
      color: #111;
      font-family: "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif;
    }
    .inspection-sheet {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
    }
    .inspection-sheet caption {
      padding: 14px;
      font-size: 24px;
      font-weight: 900;
    }
    .inspection-sheet th,
    .inspection-sheet td {
      border: 1px solid #222;
      padding: 8px;
      vertical-align: top;
    }
    .inspection-sheet th {
      background: #f1efe8;
      white-space: nowrap;
    }
    .inspection-sheet img {
      width: 220px;
      max-width: 100%;
      max-height: 180px;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    @media print {
      body {
        margin: 0;
      }
    }
  </style>
</head>
<body>
${tableHtml}
</body>
</html>`;
}

function buildExportFileName() {
  const meta = getProjectMeta();
  const name = meta.projectName || "工程照片查驗表";
  const date = meta.inspectionDate || new Date().toISOString().slice(0, 10);
  return `${sanitizeFileName(name)}-${date}.html`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function sanitizeFileName(value) {
  return value.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 80);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

