"use strict";

import {
  selfCheckDocxExporter,
  supervisionInspectionDocxExporter
} from "./docx-template-exporter.js";

const exporters = [
  selfCheckDocxExporter,
  supervisionInspectionDocxExporter
];

export function getExporters() {
  return exporters.slice();
}

export function getExporter(exporterId) {
  return exporters.find((exporter) => exporter.id === exporterId) || selfCheckDocxExporter;
}
