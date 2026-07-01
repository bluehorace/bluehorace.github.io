const PRICING_SPREADSHEET_ID = "1k1SwK9uKcZBQhjsrS_BFQosx5dH5Fc7EaOCgLYyNSdg";
const PRICING_SHEET_GID = 695559638;
const PRICING_SHEET_NAME = "Pricing";

function doGetPricing() {
  const spreadsheet = SpreadsheetApp.openById(PRICING_SPREADSHEET_ID);
  const sheet = spreadsheet
    .getSheets()
    .find(item => item.getSheetId() === PRICING_SHEET_GID) ||
    spreadsheet.getSheetByName(PRICING_SHEET_NAME);

  if (!sheet) {
    return jsonResponse({ version: new Date().toISOString(), pricing: [] });
  }

  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.shift().map(header => String(header).trim());
  const pricing = values
    .filter(row => row.some(Boolean))
    .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index]])))
    .filter(row => String(row.published).toLowerCase() === "true")
    .sort((a, b) => (Number(a.sort_order) || 999) - (Number(b.sort_order) || 999))
    .map(row => ({
      published: true,
      sort_order: Number(row.sort_order) || 999,
      category: row.category,
      service_name: row.service_name,
      subtitle: row.subtitle,
      price_from: row.price_from,
      price_to: row.price_to,
      price_unit: row.price_unit,
      description: row.description,
      deliverables: row.deliverables,
      timeline: row.timeline,
      note: row.note,
      cta_label: row.cta_label
    }));

  return jsonResponse({
    version: new Date().toISOString(),
    pricing
  });
}
