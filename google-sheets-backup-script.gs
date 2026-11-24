/**
 * STEEZEDRIP GOOGLE APPS SCRIPT WEBHOOK
 * 
 * How to use:
 * 1. Open your Google Sheet (e.g. SteezeDrip Catalog)
 * 2. Click Extensions -> Apps Script
 * 3. Delete any default code, paste this entire file, and click Save (💾)
 * 4. Click "Deploy" -> "New deployment"
 * 5. Click the gear icon next to "Select type" and choose "Web app"
 * 6. Set "Description": "SteezeDrip Live Sheet Sync"
 * 7. Set "Execute as": "Me"
 * 8. Set "Who has access": "Anyone"
 * 9. Click "Deploy" (grant permissions if prompted)
 * 10. Copy the "Web app URL" (starts with https://script.google.com/macros/s/...)
 * 11. Add it to your server/.env:
 *     GOOGLE_SHEET_WEBHOOK_URL="https://script.google.com/macros/s/..."
 * 
 * Once set, every product uploaded, updated, or toggled in Supabase
 * automatically syncs directly to your Google Sheet!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "sync";
    var products = Array.isArray(payload.data) ? payload.data : [payload.data];

    var headers = [
      "name",
      "category",
      "filter",
      "badge",
      "price_ngn",
      "price_usd",
      "description",
      "colors",
      "sizes",
      "image_url",
      "image_label",
      "image2_url",
      "image2_label",
      "image3_url",
      "image3_label",
      "image4_url",
      "image4_label",
      "active"
    ];

    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    if (action === "sync") {
      // Full sync: clear existing data rows (keep row 1 header)
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
      }
      var rows = products.map(formatProductRow);
      if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      }
    } else {
      // Append row
      products.forEach(function(p) {
        sheet.appendRow(formatProductRow(p));
      });
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", count: products.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", service: "SteezeDrip Google Sheet Sync" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatProductRow(p) {
  var colors = Array.isArray(p.colors)
    ? p.colors.map(function(c) { return typeof c === 'string' ? c : (c.name || ''); }).join(',')
    : (p.colors || '');
  var sizes = Array.isArray(p.sizes) ? p.sizes.join(',') : (p.sizes || '');
  var imgs = p.images || [];
  if (imgs.length === 0 && p.img) {
    imgs.push({ src: p.img, label: "Front" });
  }

  return [
    p.name || '',
    p.cat || 'Graphic Tee',
    p.category || 'latest',
    p.tag || '',
    p.priceNGN || p.price_ngn || 60000,
    p.priceUSD || p.price_usd || 45,
    p.desc || p.description || '',
    colors,
    sizes,
    (imgs[0] && imgs[0].src) || p.img || '',
    (imgs[0] && imgs[0].label) || 'Front',
    (imgs[1] && imgs[1].src) || '',
    (imgs[1] && imgs[1].label) || '',
    (imgs[2] && imgs[2].src) || '',
    (imgs[2] && imgs[2].label) || '',
    (imgs[3] && imgs[3].src) || '',
    (imgs[3] && imgs[3].label) || '',
    p.active !== false ? 'TRUE' : 'FALSE'
  ];
}
