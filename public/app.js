import {
  getDefaultInspectionTextTemplates,
  getDefaultWorkItems,
  getInspectionTextTemplates,
  getWorkItems,
  savePhotoMetadata
} from "./storage-repository.js";
import { getExporter, getExporters } from "./exporters/exporter-registry.js";

"use strict";

const state = {
  photos: []
};

const repositoryState = {
  workItems: getDefaultWorkItems(),
  inspectionTextTemplates: getDefaultInspectionTextTemplates()
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  renderVersionLabel();
  bindEvents();
  renderExportFormatOptions();
  renderPhotoList();
  renderTablePreview();
  loadRepositoryData();
});

function renderVersionLabel() {
  const versionLabel = document.querySelector(".eyebrow");

  if (versionLabel) {
    versionLabel.textContent = "V2 Word \u7bc4\u672c\u8f38\u51fa";
  }

  document.title = "\u5de5\u7a0b\u7167\u7247\u67e5\u9a57\u8868\u81ea\u52d5\u5316\u7cfb\u7d71 V2";
}

async function loadRepositoryData() {
  try {
    const [workItems, inspectionTextTemplates] = await Promise.all([
      getWorkItems(),
      getInspectionTextTemplates()
    ]);

    repositoryState.workItems = workItems;
    repositoryState.inspectionTextTemplates = inspectionTextTemplates;
    renderPhotoList();
  } catch {
    repositoryState.workItems = getDefaultWorkItems();
    repositoryState.inspectionTextTemplates = getDefaultInspectionTextTemplates();
    renderPhotoList();
  }
}

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
  elements.exportFormat = document.getElementById("exportFormat");
  elements.refreshPreviewButton = document.getElementById("refreshPreviewButton");
}

function bindEvents() {
  elements.photoInput.addEventListener("change", handlePhotoSelection);
  elements.exportButton.addEventListener("click", exportTableHtml);
  elements.exportFormat.addEventListener("change", renderTablePreview);
  elements.refreshPreviewButton.addEventListener("click", renderTablePreview);

  [
    elements.projectName,
    elements.inspectionDate,
    elements.location,
    elements.inspectionItem
  ].forEach((input) => input.addEventListener("input", renderTablePreview));
}

function renderExportFormatOptions() {
  elements.exportFormat.innerHTML = getExporters().map((exporter) => (
    `<option value="${escapeHtml(exporter.id)}">${escapeHtml(exporter.label)}</option>`
  )).join("");

  elements.exportFormat.value = "self-check";
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
        workItemId: null,
        date: elements.inspectionDate.value || "",
        location: elements.location.value.trim(),
        description: "",
        designValue: "",
        measuredValue: ""
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
    title.textContent = String(index + 1) + ". " + photo.name;

    const size = document.createElement("span");
    size.textContent = formatFileSize(photo.size);

    const workItemLabel = document.createElement("label");
    workItemLabel.textContent = "\u5de5\u9805";

    const workItemSelect = document.createElement("select");
    workItemSelect.innerHTML = buildWorkItemOptions(photo.workItemId);
    workItemSelect.addEventListener("change", () => {
      updatePhotoWorkItem(photo, workItemSelect.value || null);
    });

    workItemLabel.appendChild(workItemSelect);

    const dateLabel = createPhotoFieldLabel(photo, "date", "\u65e5\u671f", "date");
    const locationLabel = createPhotoFieldLabel(photo, "location", "\u4f4d\u7f6e", "text");
    const designValueLabel = createPhotoFieldLabel(photo, "designValue", "\u8a2d\u8a08\u503c", "text");
    const measuredValueLabel = createPhotoFieldLabel(photo, "measuredValue", "\u5be6\u6e2c\u503c", "text");

    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent = "\u67e5\u9a57\u8aaa\u660e";

    const description = document.createElement("textarea");
    description.rows = 3;
    description.value = photo.description || "";
    description.placeholder = "\u8f38\u5165\u6bcf\u5f35\u7167\u7247\u7684\u67e5\u9a57\u8aaa\u660e";
    description.addEventListener("input", () => {
      photo.description = description.value;
      persistPhotoMetadata(photo);
      renderTablePreview();
    });

    descriptionLabel.appendChild(description);
    meta.append(title, size, workItemLabel, dateLabel, locationLabel, designValueLabel, measuredValueLabel, descriptionLabel);

    const actions = document.createElement("div");
    actions.className = "photo-actions";

    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.textContent = "\u4e0a\u79fb";
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => movePhoto(index, -1));

    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.textContent = "\u4e0b\u79fb";
    downButton.disabled = index === state.photos.length - 1;
    downButton.addEventListener("click", () => movePhoto(index, 1));

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "\u79fb\u9664";
    removeButton.addEventListener("click", () => removePhoto(photo.id));

    actions.append(upButton, downButton, removeButton);
    card.append(image, meta, actions);
    elements.photoList.appendChild(card);
  });
}

function createPhotoFieldLabel(photo, fieldName, labelText, inputType) {
  const label = document.createElement("label");
  label.textContent = labelText;

  const input = document.createElement("input");
  input.type = inputType;
  input.value = photo[fieldName] || "";
  input.addEventListener("input", () => {
    photo[fieldName] = input.value;
    persistPhotoMetadata(photo);
    renderTablePreview();
  });

  label.appendChild(input);
  return label;
}

function buildWorkItemOptions(selectedWorkItemId) {
  const options = ['<option value="">\u672a\u9078\u64c7\u5de5\u9805</option>'];

  repositoryState.workItems.forEach((workItem) => {
    const selected = workItem.id === selectedWorkItemId ? " selected" : "";
    options.push(`<option value="${escapeHtml(workItem.id)}"${selected}>${escapeHtml(workItem.name)}</option>`);
  });

  return options.join("");
}

function findDefaultTemplateForWorkItem(workItemId) {
  return repositoryState.inspectionTextTemplates.find((template) => (
    template.workItemId === workItemId && template.isDefault
  )) || null;
}

function updatePhotoWorkItem(photo, workItemId) {
  const defaultTemplate = findDefaultTemplateForWorkItem(workItemId);

  photo.workItemId = workItemId;

  if (photo.description === "" && defaultTemplate) {
    photo.description = defaultTemplate.text;
  }

  persistPhotoMetadata(photo);
  renderPhotoList();
  renderTablePreview();
}

function persistPhotoMetadata(photo) {
  savePhotoMetadata({
    id: photo.id,
    name: photo.name,
    workItemId: photo.workItemId,
    date: photo.date || "",
    location: photo.location || "",
    description: photo.description || "",
    designValue: photo.designValue || "",
    measuredValue: photo.measuredValue || ""
  }).catch(() => {});
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
    elements.tablePreview.innerHTML = '<div class="empty-table-note">\u9078\u53d6\u7167\u7247\u5f8c\uff0c\u9019\u88e1\u6703\u986f\u793a\u56fa\u5b9a\u8868\u683c\u9810\u89bd\u3002</div>';
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
      <td>${escapeHtml(photo.description || "")}</td>
    </tr>
  `).join("");

  return `
    <table class="inspection-sheet">
      <caption>\u5de5\u7a0b\u7167\u7247\u67e5\u9a57\u8868</caption>
      <tbody>
        <tr>
          <th>\u5de5\u7a0b\u540d\u7a31</th>
          <td colspan="3">${escapeHtml(meta.projectName || "\u672a\u586b\u5beb")}</td>
        </tr>
        <tr>
          <th>\u67e5\u9a57\u65e5\u671f</th>
          <td>${escapeHtml(meta.inspectionDate || "\u672a\u586b\u5beb")}</td>
          <th>\u65bd\u5de5\u4f4d\u7f6e</th>
          <td>${escapeHtml(meta.location || "\u672a\u586b\u5beb")}</td>
        </tr>
        <tr>
          <th>\u67e5\u9a57\u9805\u76ee</th>
          <td colspan="3">${escapeHtml(meta.inspectionItem || "\u672a\u586b\u5beb")}</td>
        </tr>
      </tbody>
      <thead>
        <tr>
          <th style="width: 64px;">\u5e8f\u865f</th>
          <th style="width: 260px;">\u7167\u7247</th>
          <th>\u6a94\u540d</th>
          <th>\u67e5\u9a57\u8aaa\u660e</th>
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

async function exportTableHtml() {
  if (state.photos.length === 0) {
    alert("\u8acb\u5148\u9078\u53d6\u7167\u7247\u3002");
    return;
  }

  const exporter = getExporter(elements.exportFormat.value);

  try {
    await exporter.export({
      meta: getProjectMeta(),
      photos: state.photos.slice()
    });
  } catch (error) {
    alert(error && error.message ? error.message : String(error));
  }
}

function buildExportDocumentHtml(tableHtml) {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>\u5de5\u7a0b\u7167\u7247\u67e5\u9a57\u8868</title>
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
  const name = meta.projectName || "\u5de5\u7a0b\u7167\u7247\u67e5\u9a57\u8868";
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