"use strict";

const DATABASE_NAME = "inspection-photo-system";
const DATABASE_VERSION = 1;
const WORK_ITEMS_STORE = "work_items";
const TEXT_TEMPLATES_STORE = "inspection_text_templates";
const PHOTO_METADATA_STORE = "photo_metadata";

const defaultWorkItems = [
  {
    id: "work-item-general",
    name: "一般查驗"
  },
  {
    id: "work-item-concrete",
    name: "混凝土工程"
  },
  {
    id: "work-item-rebar",
    name: "鋼筋工程"
  }
];

const defaultInspectionTextTemplates = [
  {
    id: "template-general",
    workItemId: "work-item-general",
    text: "現場查驗情形符合施工要求。",
    isDefault: true
  },
  {
    id: "template-concrete",
    workItemId: "work-item-concrete",
    text: "混凝土施工前查驗完成，現場狀況符合施工要求。",
    isDefault: true
  },
  {
    id: "template-rebar",
    workItemId: "work-item-rebar",
    text: "鋼筋配置、間距及搭接情形經查驗符合圖說要求。",
    isDefault: true
  }
];

let databasePromise = null;

export async function getWorkItems() {
  return readStoreWithFallback(WORK_ITEMS_STORE, defaultWorkItems);
}

export async function saveWorkItem(workItem) {
  return saveRecord(WORK_ITEMS_STORE, workItem);
}

export async function getInspectionTextTemplates() {
  return readStoreWithFallback(TEXT_TEMPLATES_STORE, defaultInspectionTextTemplates);
}

export async function saveInspectionTextTemplate(template) {
  return saveRecord(TEXT_TEMPLATES_STORE, template);
}

export async function savePhotoMetadata(photoMetadata) {
  const metadata = {
    id: photoMetadata.id,
    name: photoMetadata.name || "",
    workItemId: photoMetadata.workItemId || null,
    date: photoMetadata.date || "",
    location: photoMetadata.location || "",
    description: photoMetadata.description || "",
    designValue: photoMetadata.designValue || "",
    measuredValue: photoMetadata.measuredValue || ""
  };

  return saveRecord(PHOTO_METADATA_STORE, metadata);
}

export async function getPhotoMetadata(photoId) {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(PHOTO_METADATA_STORE, "readonly");
    const store = transaction.objectStore(PHOTO_METADATA_STORE);
    const record = await requestToPromise(store.get(photoId));

    return record || null;
  } catch {
    return null;
  }
}

export function getDefaultWorkItems() {
  return clone(defaultWorkItems);
}

export function getDefaultInspectionTextTemplates() {
  return clone(defaultInspectionTextTemplates);
}

async function readStoreWithFallback(storeName, fallbackRows) {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readonly");
    const store = transaction.objectStore(storeName);
    const rows = await requestToPromise(store.getAll());

    return rows.length > 0 ? rows : clone(fallbackRows);
  } catch {
    return clone(fallbackRows);
  }
}

async function saveRecord(storeName, record) {
  try {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const savedRecord = {
      ...record,
      updatedAt: new Date().toISOString()
    };

    await requestToPromise(store.put(savedRecord));
    return savedRecord;
  } catch {
    return {
      ...record,
      updatedAt: new Date().toISOString()
    };
  }
}

function openDatabase() {
  if (!("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is not available."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        createStore(database, WORK_ITEMS_STORE);
        createStore(database, TEXT_TEMPLATES_STORE);
        createStore(database, PHOTO_METADATA_STORE);
      };

      request.onsuccess = async () => {
        const database = request.result;

        try {
          await seedDefaultRows(database);
        } catch {
          databasePromise = null;
        }

        resolve(database);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  return databasePromise;
}

function createStore(database, storeName) {
  if (!database.objectStoreNames.contains(storeName)) {
    database.createObjectStore(storeName, { keyPath: "id" });
  }
}

async function seedDefaultRows(database) {
  await seedStore(database, WORK_ITEMS_STORE, defaultWorkItems);
  await seedStore(database, TEXT_TEMPLATES_STORE, defaultInspectionTextTemplates);
}

async function seedStore(database, storeName, rows) {
  const transaction = database.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  const existingRows = await requestToPromise(store.getAll());

  if (existingRows.length > 0) {
    return;
  }

  rows.forEach((row) => {
    store.put({
      ...row,
      updatedAt: new Date().toISOString()
    });
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
