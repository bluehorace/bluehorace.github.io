const SPREADSHEET_ID = "1nMFCiGbw4tPGBrLoRHNU3-lUk1m5NiI2HPknMqG4MxM";
const SHEET_NAME = "Portfolio Projects";

function doGet(event) {
  if (event && event.parameter && event.parameter.dataset === "pricing") {
    return doGetPricing();
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ version: new Date().toISOString(), projects: [] });
  }

  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.shift();
  const projects = values
    .filter(row => row.some(Boolean))
    .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index]])))
    .filter(row => String(row.published).toLowerCase() === "true")
    .map(row => ({
      number: row.number,
      id: row.id,
      published: true,
      featured: String(row.featured).toLowerCase() === "true",
      sort_order: Number(row.sort_order) || 999,
      featured_order: Number(row.featured_order) || 999,
      category: row.category,
      meta: row.meta,
      title: row.title,
      subtitle: row.subtitle,
      image_path: row.image_path,
      fallback_image_path: row.fallback_image_path || row.image_path,
      behance_url: row.behance_url,
      concept: row.concept,
      directions: [row.direction_1, row.direction_2, row.direction_3],
      content: row.content,
      details: [
        [row.detail_1_label, row.detail_1_value],
        [row.detail_2_label, row.detail_2_value],
        [row.detail_3_label, row.detail_3_value]
      ],
      presentation: row.presentation,
      tools: row.tools,
      disciplines: row.disciplines,
      type: row.type
    }));

  return jsonResponse({
    version: new Date().toISOString(),
    projects
  });
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
