import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = path.resolve(import.meta.dirname, "..");
const sourcePayload = JSON.parse(
  await fs.readFile(path.join(root, "projects/projects-fallback.json"), "utf8")
);
const projects = sourcePayload.projects.sort((a, b) => a.sort_order - b.sort_order);
const payload = {
  version: new Date().toISOString(),
  projects
};

await fs.writeFile(
  path.join(root, "projects/projects-fallback.json"),
  `${JSON.stringify(payload, null, 2)}\n`
);

const headers = [
  "number", "id", "published", "featured", "sort_order", "featured_order",
  "category", "meta", "title", "subtitle", "image_path", "fallback_image_path",
  "behance_url", "concept", "direction_1", "direction_2", "direction_3", "content",
  "detail_1_label", "detail_1_value", "detail_2_label", "detail_2_value",
  "detail_3_label", "detail_3_value", "presentation", "tools", "disciplines", "type"
];

const rows = projects.map(project => [
  project.number, project.id, project.published ? "TRUE" : "FALSE", project.featured ? "TRUE" : "FALSE",
  project.sort_order, project.featured_order, project.category, project.meta,
  project.title, project.subtitle, project.image_path, project.fallback_image_path,
  project.behance_url, project.concept,
  project.directions[0], project.directions[1], project.directions[2], project.content,
  project.details[0][0], project.details[0][1],
  project.details[1][0], project.details[1][1],
  project.details[2][0], project.details[2][1],
  project.presentation, project.tools, project.disciplines, project.type
]);

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Portfolio Projects");
sheet.getRangeByIndexes(0, 0, rows.length + 1, headers.length).values = [headers, ...rows];
sheet.freezePanes.freezeRows(1);
sheet.freezePanes.freezeColumns(2);
sheet.getRange("A1:AB1").format = {
  fill: "#E5E7EB",
  font: { bold: true, color: "#111827" },
  wrapText: true,
  verticalAlignment: "center"
};
sheet.getRange(`A1:AB${rows.length + 1}`).format.borders = {
  insideHorizontal: { style: "thin", color: "#E5E7EB" },
  bottom: { style: "thin", color: "#D1D5DB" }
};
sheet.getRange(`A2:AB${rows.length + 1}`).format.verticalAlignment = "top";
sheet.getRange(`N2:Y${rows.length + 1}`).format.wrapText = true;
sheet.getRange(`C2:D${rows.length + 1}`).dataValidation = {
  rule: { type: "list", values: ["TRUE", "FALSE"] }
};
sheet.getRange(`G2:G${rows.length + 1}`).dataValidation = {
  rule: { type: "list", values: ["web", "ui", "visual", "brand"] }
};
sheet.getRange("A:A").format.columnWidthPx = 58;
sheet.getRange("B:B").format.columnWidthPx = 180;
sheet.getRange("C:D").format.columnWidthPx = 82;
sheet.getRange("E:F").format.columnWidthPx = 86;
sheet.getRange("G:G").format.columnWidthPx = 100;
sheet.getRange("H:H").format.columnWidthPx = 150;
sheet.getRange("I:I").format.columnWidthPx = 240;
sheet.getRange("J:J").format.columnWidthPx = 230;
sheet.getRange("K:M").format.columnWidthPx = 250;
sheet.getRange("N:R").format.columnWidthPx = 300;
sheet.getRange("S:Y").format.columnWidthPx = 200;
sheet.getRange("Z:AB").format.columnWidthPx = 170;
sheet.getRange("1:1").format.rowHeightPx = 36;

const instructions = workbook.worksheets.add("Instructions");
instructions.getRange("A1:B9").values = [
  ["Portfolio content management", "Usage"],
  ["published", "TRUE 顯示、FALSE 隱藏；固定編號不會改變。"],
  ["featured", "TRUE 可進入首頁精選區；最多取 featured_order 最小的四件。"],
  ["sort_order", "首頁排序，數字越小越前面。"],
  ["image_path", "GitHub Pages 圖片相對路徑，例如 assets/behance/project.jpg。"],
  ["fallback_image_path", "image_path 無法載入時使用的備份圖片。"],
  ["category", "僅使用 web、ui、visual、brand。"],
  ["new project", "使用新的固定 number 與唯一 id，完成全部欄位後再設 published=TRUE。"],
  ["privacy", "Apps Script API 會公開輸出資料，請勿在此表放私人或客戶機密。"]
];
instructions.getRange("A1:B1").format = {
  fill: "#E5E7EB",
  font: { bold: true, color: "#111827" }
};
instructions.getRange("A1:B9").format.wrapText = true;
instructions.getRange("A:A").format.columnWidthPx = 170;
instructions.getRange("B:B").format.columnWidthPx = 520;
instructions.freezePanes.freezeRows(1);

const outputDir = path.join(root, "outputs");
await fs.mkdir(outputDir, { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(path.join(outputDir, "Horace Portfolio Projects.xlsx"));

const preview = await workbook.render({
  sheetName: "Portfolio Projects",
  range: "A1:J12",
  scale: 1,
  format: "png"
});
await fs.writeFile(
  path.join(outputDir, "portfolio-projects-preview.png"),
  new Uint8Array(await preview.arrayBuffer())
);

console.log(JSON.stringify({ projects: projects.length, outputDir }, null, 2));
