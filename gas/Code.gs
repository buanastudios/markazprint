/**
 * MARKAZ PRINTING v3.0 — Google Apps Script Backend
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 *
 * FILE: Code.gs
 *
 * PURPOSE:
 *   This is the server-side Google Apps Script Web App.
 *   Its ONLY job in v3 is to handle file uploads to Google Drive.
 *   All other data (request metadata, status, users) now lives in Firebase Firestore.
 *
 * HOW TO DEPLOY:
 *   1. Go to https://script.google.com → New Project → paste this code
 *   2. Set DRIVE_FOLDER_ID below (the ID of your target Google Drive folder)
 *   3. Click Deploy → New Deployment → Web App
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   4. Copy the Web App URL → paste into js/config.js as GAS_UPLOAD_URL
 *
 * FOLDER ID:
 *   Open your target Google Drive folder in the browser.
 *   The folder ID is the last part of the URL:
 *   https://drive.google.com/drive/folders/THIS_IS_THE_FOLDER_ID
 */

// ─── Configuration ─────────────────────────────────────────────────────────────

/** Target Google Drive folder where all print request files will be stored. */
var DRIVE_FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';

// ─── Web App Entry Points ──────────────────────────────────────────────────────

/**
 * RUN THIS FUNCTION ONCE IN THE APPS SCRIPT EDITOR!
 * Select 'testDriveAuthorization' from the dropdown at the top, and click ▶ Run.
 * This triggers Google's 'Authorization Required' dialog so you can grant Google Drive permissions.
 */
function testDriveAuthorization() {
  var root = DriveApp.getRootFolder();
  Logger.log('Drive Authorization OK! Root folder name: ' + root.getName());
}

/**
 * Handles HTTP GET requests.
 * Used as a health-check to verify the Web App is deployed correctly.
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Markaz Printing v3.0 GAS Endpoint is running.',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handles HTTP POST requests from the frontend.
 * Dispatches to the correct handler based on the 'action' field.
 *
 * Expected body: { action: string, payload: Object }
 */
function doPost(e) {
  // Always return CORS-friendly JSON
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var payload = body.payload || {};

    var result;

    switch (action) {
      case 'uploadFileToDrive':
        result = uploadFileToDrive(payload);
        break;
      default:
        result = { success: false, message: 'Unknown action: ' + action };
    }

    return buildJsonResponse(result);

  } catch (err) {
    return buildJsonResponse({
      success: false,
      message: 'GAS Error: ' + err.message
    });
  }
}

// ─── Action Handlers ───────────────────────────────────────────────────────────

/**
 * Uploads a Base64-encoded file to the designated Google Drive folder.
 *
 * @param {Object} payload
 * @param {string} payload.file_name  - Original file name (e.g., "Soal.pdf")
 * @param {string} payload.file_mime  - MIME type (e.g., "application/pdf")
 * @param {string} payload.file_data  - Base64 data URL (e.g., "data:application/pdf;base64,...")
 *
 * @returns {{ success: boolean, data: { file_id: string, file_url: string, file_name: string } }}
 */
function uploadFileToDrive(payload) {
  if (!payload.file_name || !payload.file_data) {
    return { success: false, message: 'file_name and file_data are required.' };
  }

  // 1. Strip the "data:mime/type;base64," prefix to get raw base64
  var base64Data = payload.file_data;
  if (base64Data.indexOf(',') !== -1) {
    base64Data = base64Data.split(',')[1];
  }

  // 2. Decode Base64 → binary blob
  var decodedBytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decodedBytes, payload.file_mime || 'application/octet-stream', payload.file_name);

  // 3. Get target Drive folder or fallback to Drive root safely
  var folder;
  if (DRIVE_FOLDER_ID && DRIVE_FOLDER_ID !== 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE') {
    try {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } catch (folderErr) {
      Logger.log('Folder ID invalid or inaccessible. Using root folder.');
      folder = DriveApp.getRootFolder();
    }
  } else {
    folder = DriveApp.getRootFolder();
  }

  // 4. Create file in folder (or root if folder failed)
  var file;
  try {
    file = folder.createFile(blob);
  } catch (createErr) {
    // If creating inside folder fails due to permissions, create directly in root
    file = DriveApp.createFile(blob);
  }

  // 5. Try setting public sharing (wrap in try/catch in case domain policies restrict ANYONE_WITH_LINK)
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (sharingErr) {
    Logger.log('Could not set public sharing: ' + sharingErr.message);
  }

  // 6. Build the shareable view URL
  var fileId  = file.getId();
  var fileUrl = 'https://drive.google.com/file/d/' + fileId + '/view';

  Logger.log('Uploaded: ' + payload.file_name + ' → ' + fileUrl);

  return {
    success: true,
    data: {
      file_id:   fileId,
      file_url:  fileUrl,
      file_name: file.getName()
    }
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wraps any result object into a CORS-enabled JSON ContentService response.
 */
function buildJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
