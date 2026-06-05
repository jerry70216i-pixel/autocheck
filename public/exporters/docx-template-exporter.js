"use strict";

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const SELF_TEMPLATE_PATH = "../templates/self-check-template.docx";
const SUPERVISION_TEMPLATE_PATH = "../templates/supervision-inspection-template.docx";
const SELF_IMAGE_SIZE = [460, 280];
const SUPERVISION_IMAGE_SIZE = [480, 300];

const SELF_MAX_PHOTOS = 30;
const SUPERVISION_MAX_PHOTOS = 20;

const SELF_PLACEHOLDER_MAP = createPhotoPlaceholderMap("SELF", SELF_MAX_PHOTOS, {
  SELF_DOC_NO: "text",
  SELF_DOC_VERSION: "text",
  PROJECT_NAME: "text"
});

const SUPERVISION_PLACEHOLDER_MAP = createPhotoPlaceholderMap("SUP", SUPERVISION_MAX_PHOTOS, {
  SUP_DOC_NO: "text",
  SUP_DOC_VERSION: "text",
  COMPANY_NAME: "text",
  PROJECT_NAME: "text",
  CHECK_ITEM: "text"
});

export const selfCheckDocxExporter = {
  id: "self-check",
  label: "\u81ea\u4e3b\u6aa2\u67e5 Word",
  async export(context) {
    if (context.photos.length > SELF_MAX_PHOTOS) {
      throw new Error("\u81ea\u4e3b\u6aa2\u67e5\u6700\u591a\u53ef\u8f38\u51fa 30 \u5f35\u7167\u7247\uff0c\u8acb\u6e1b\u5c11\u7167\u7247\u6578\u91cf\u5f8c\u518d\u532f\u51fa\u3002");
    }

    const selfContext = {
      ...context,
      photos: context.photos.slice(0, SELF_MAX_PHOTOS)
    };
    const imageMap = buildSelfImageMap(selfContext);
    const data = buildSelfData(selfContext, imageMap);

    const zip = await loadTemplateZip(SELF_TEMPLATE_PATH);
    pruneTemplatePages(zip, getPageCount(selfContext.photos.length, 3));
    convertDoubleBracePlaceholders(zip, SELF_PLACEHOLDER_MAP);
    const doc = createDocxtemplater(zip, SELF_IMAGE_SIZE, imageMap);
    doc.render(data);
    sanitizeGeneratedDocxXml(doc.getZip());
    downloadBlob(generateDocxBlob(doc), buildFileName(selfContext.meta, "\u81ea\u4e3b\u6aa2\u67e5"));
  }
};

export const supervisionInspectionDocxExporter = {
  id: "supervision-inspection",
  label: "\u76e3\u9020\u67e5\u9a57 Word",
  async export(context) {
    if (context.photos.length > SUPERVISION_MAX_PHOTOS) {
      throw new Error("\u76e3\u9020\u67e5\u9a57\u6700\u591a\u53ef\u8f38\u51fa 20 \u5f35\u7167\u7247\uff0c\u8acb\u6e1b\u5c11\u7167\u7247\u6578\u91cf\u5f8c\u518d\u532f\u51fa\u3002");
    }

    const zip = await loadTemplateZip(SUPERVISION_TEMPLATE_PATH);
    pruneTemplatePages(zip, getPageCount(context.photos.length, 2));
    convertDoubleBracePlaceholders(zip, SUPERVISION_PLACEHOLDER_MAP);
    const doc = createDocxtemplater(zip, SUPERVISION_IMAGE_SIZE);
    doc.render(buildSupervisionData(context));
    sanitizeGeneratedDocxXml(doc.getZip());
    downloadBlob(generateDocxBlob(doc), buildFileName(context.meta, "\u76e3\u9020\u67e5\u9a57"));
  }
};

async function loadTemplateZip(templatePath) {
  assertDocxVendors();
  const response = await fetch(templatePath);

  if (!response.ok) {
    throw new Error(`Template load failed: HTTP ${response.status} ${response.statusText}`);
  }

  const templateBuffer = await response.arrayBuffer();
  return new window.PizZip(templateBuffer);
}

function createPhotoPlaceholderMap(prefix, slotCount, extraPlaceholders) {
  const placeholderMap = { ...extraPlaceholders };

  for (let slot = 1; slot <= slotCount; slot += 1) {
    placeholderMap[`${prefix}_PHOTO_${slot}`] = "image";
    placeholderMap[`${prefix}_DATE_${slot}`] = "text";
    placeholderMap[`${prefix}_LOCATION_${slot}`] = "text";
    placeholderMap[`${prefix}_DESC_${slot}`] = "text";
    placeholderMap[`${prefix}_DESIGN_VALUE_${slot}`] = "text";
    placeholderMap[`${prefix}_MEASURED_VALUE_${slot}`] = "text";
  }

  return placeholderMap;
}

function getPageCount(photoCount, photosPerPage) {
  return Math.max(1, Math.ceil(photoCount / photosPerPage));
}

function pruneTemplatePages(zip, pageCount) {
  const file = zip.file("word/document.xml");

  if (!file) {
    return;
  }

  let xml = file.asText();
  const bodyMatch = xml.match(/<w:body>([\s\S]*)<\/w:body>/);

  if (!bodyMatch) {
    return;
  }

  const body = bodyMatch[1];
  const sectionMatch = body.match(/(<w:sectPr[\s\S]*<\/w:sectPr>)\s*$/);

  if (!sectionMatch) {
    return;
  }

  const sectionProperties = sectionMatch[1];
  const content = body.slice(0, sectionMatch.index);
  const pageBreak = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  const pages = content.split(pageBreak);
  const keptPages = pages.slice(0, pageCount);
  const newBody = keptPages.join(pageBreak) + sectionProperties;

  xml = xml.slice(0, bodyMatch.index) + `<w:body>${newBody}</w:body>` + xml.slice(bodyMatch.index + bodyMatch[0].length);
  zip.file("word/document.xml", xml);
}

function sanitizeGeneratedDocxXml(zip) {
  const file = zip.file("word/document.xml");

  if (!file) {
    return;
  }

  let nextDocPrId = 1;
  const xml = file.asText().replace(/<wp:docPr\b[^>]*\/>/g, (tag) => {
    const id = nextDocPrId;
    nextDocPrId += 1;

    let updated = tag.replace(/\sid="\d+"/, ` id="${id}"`);

    if (/\sname="[^"]*"/.test(updated)) {
      updated = updated.replace(/\sname="[^"]*"/, ` name="Drawing ${id}"`);
    }

    return updated;
  });

  zip.file("word/document.xml", xml);
}

function assertDocxVendors() {
  const missing = [];

  if (typeof window.PizZip !== "function") {
    missing.push("PizZip");
  }

  if (typeof window.docxtemplater !== "function") {
    missing.push("Docxtemplater");
  }

  if (typeof window.ImageModule !== "function") {
    missing.push("ImageModule");
  }

  if (missing.length > 0) {
    throw new Error(`DOCX vendor not loaded: ${missing.join(", ")}`);
  }
}

function createDocxtemplater(zip, imageSize, imageMap = {}) {
  const imageModule = new window.ImageModule({
    centered: false,
    fileType: "docx",
    getImage(tagValue, tagName) {
      const imageDataUrl = resolveImageDataUrl(imageMap, tagName, tagValue);
      return dataUrlToArrayBuffer(imageDataUrl);
    },
    getSize() {
      return imageSize;
    }
  });

  return new window.docxtemplater(zip, {
    modules: [imageModule],
    paragraphLoop: true,
    linebreaks: true
  });
}

function convertDoubleBracePlaceholders(zip, placeholderMap) {
  Object.keys(zip.files).forEach((name) => {
    if (!name.startsWith("word/") || !name.endsWith(".xml")) {
      return;
    }

    const file = zip.file(name);

    if (!file) {
      return;
    }

    let xml = file.asText();

    Object.keys(placeholderMap).forEach((key) => {
      const replacement = placeholderMap[key] === "image" ? `{%${key}}` : `{${key}}`;
      xml = xml.split(`{{${key}}}`).join(replacement);
      xml = replaceSplitDoubleBracePlaceholder(xml, key, replacement);
    });

    zip.file(name, xml);
  });
}

function replaceSplitDoubleBracePlaceholder(xml, key, replacement) {
  const escapedKey = escapeRegExp(key);
  const splitPattern = new RegExp(
    `(<w:t[^>]*>)\\{\\{${escapedKey}\\}</w:t>[\\s\\S]*?<w:t[^>]*>\\}</w:t>`,
    "g"
  );

  return xml.replace(splitPattern, `$1${replacement}</w:t>`);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSelfData(context, imageMap = {}) {
  const data = {
    SELF_DOC_NO: "09132-07-QL-01-01",
    SELF_DOC_VERSION: "114.05.28  V03",
    PROJECT_NAME: context.meta.projectName || ""
  };

  for (let index = 0; index < SELF_MAX_PHOTOS; index += 1) {
    const slot = index + 1;
    const photo = context.photos[index] || null;
    const photoKey = `SELF_PHOTO_${slot}`;
    data[photoKey] = photo && imageMap[photoKey] ? getPhotoImageData(photo) : "";
    data[`SELF_DATE_${slot}`] = getPhotoDate(photo, context.meta);
    data[`SELF_LOCATION_${slot}`] = getPhotoLocation(photo, context.meta);
    data[`SELF_DESC_${slot}`] = getPhotoField(photo, "description");
    data[`SELF_DESIGN_VALUE_${slot}`] = getPhotoField(photo, "designValue");
    data[`SELF_MEASURED_VALUE_${slot}`] = getPhotoField(photo, "measuredValue");
  }

  return data;
}

function buildSelfImageMap(context) {
  const imageMap = {};

  for (let index = 0; index < SELF_MAX_PHOTOS; index += 1) {
    const slot = index + 1;
    const photo = context.photos[index] || null;
    const imageData = getPhotoImageData(photo);

    if (imageData) {
      const photoKey = `SELF_PHOTO_${slot}`;
      imageMap[photoKey] = imageData;
      imageMap[`%${photoKey}`] = imageData;
    }
  }

  return imageMap;
}

function resolveImageDataUrl(imageMap, tagName, tagValue) {
  const tagKey = normalizeImageKey(tagName);
  const valueKey = normalizeImageKey(tagValue);

  return imageMap[tagKey] || imageMap[valueKey] || tagValue;
}

function normalizeImageKey(value) {
  return String(value || "").replace(/^%/, "").trim();
}

function getPhotoImageData(photo) {
  if (!photo) {
    return "";
  }

  return photo.dataUrl || photo.imageData || "";
}

function buildSupervisionData(context) {
  const data = {
    SUP_DOC_NO: "09132-07-QL-03-01",
    SUP_DOC_VERSION: "114.03.20  V03",
    COMPANY_NAME: "\u53f0\u7063\u4e16\u66e6\u5de5\u7a0b\u9867\u554f\u80a1\u4efd\u6709\u9650\u516c\u53f8",
    PROJECT_NAME: context.meta.projectName || "",
    CHECK_ITEM: context.meta.inspectionItem || ""
  };

  for (let index = 0; index < SUPERVISION_MAX_PHOTOS; index += 1) {
    const slot = index + 1;
    const photo = context.photos[index] || null;
    data[`SUP_PHOTO_${slot}`] = photo ? photo.dataUrl : "";
    data[`SUP_DATE_${slot}`] = getPhotoDate(photo, context.meta);
    data[`SUP_LOCATION_${slot}`] = getPhotoLocation(photo, context.meta);
    data[`SUP_DESC_${slot}`] = getPhotoField(photo, "description");
    data[`SUP_DESIGN_VALUE_${slot}`] = getPhotoField(photo, "designValue");
    data[`SUP_MEASURED_VALUE_${slot}`] = getPhotoField(photo, "measuredValue");
  }

  return data;
}

function getPhotoDate(photo, meta) {
  return getPhotoField(photo, "date") || meta.inspectionDate || "";
}

function getPhotoLocation(photo, meta) {
  return getPhotoField(photo, "location") || meta.location || "";
}

function getPhotoField(photo, fieldName) {
  if (!photo || typeof photo[fieldName] !== "string") {
    return "";
  }

  return photo[fieldName].trim();
}

function dataUrlToArrayBuffer(dataUrl) {
  const base64 = String(dataUrl || "").split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

function generateDocxBlob(doc) {
  return doc.getZip().generate({
    type: "blob",
    mimeType: DOCX_MIME_TYPE,
    compression: "DEFLATE"
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildFileName(meta, typeLabel) {
  const date = meta.inspectionDate || new Date().toISOString().slice(0, 10);
  const projectName = sanitizeFileName(meta.projectName || "\u5de5\u7a0b\u7167\u7247");

  return `${projectName}-${typeLabel}-${date}.docx`;
}

function sanitizeFileName(value) {
  return String(value).replace(/[\\/:*?"<>|]+/g, "_").slice(0, 80);
}
