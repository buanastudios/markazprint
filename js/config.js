/**
 * MARKAZ PRINTING v3.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * config.js - Client Application Configuration
 *
 * Backend: Firebase (Firestore + Analytics) — metadata & queue management
 * File Storage: Google Drive via Google Apps Script endpoint
 * Firebase initialization is handled in js/firebase.js
 */

const APP_CONFIG = {
  APP_NAME: 'Markaz Printing',
  VERSION: '3.0.0',
  DEVELOPER: 'Buana Studios',
  ORGANIZATION: 'Yayasan T.I.B.Y.A.N.',

  // Google Apps Script Web App URL — handles ONLY file uploads to Google Drive.
  // The GAS function must handle action='uploadFileToDrive' and return:
  //   { success: true, data: { file_url: '...', file_id: '...' } }
  // Leave empty to run in offline/demo mode (files won't actually upload).
  GAS_UPLOAD_URL: 'https://script.google.com/macros/s/AKfycbwrzuoCdO8J3RKJgC0-AXzGWAo_uxhWdPnw_msT_PfEtQRZIUQ63hleOMA6FcX8Lxra/exec',

  MAX_FILE_SIZE_MB: 25,
  ALLOWED_EXTENSIONS: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'txt'],

  TROUBLE_PRESETS: [
    'Tinta / Toner Printer Habis',
    'Stok Kertas (A4/F4/A5) Habis',
    'File Dokumen Terkunci / Corrupt / Password',
    'Printer Macet (Paper Jam) / Error Mesin',
    'Ukuran Kertas Tidak Sesuai Spesifikasi'
  ]
};
