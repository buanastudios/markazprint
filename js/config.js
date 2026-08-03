/**
 * MARKAZ PRINTING v2.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * config.js - Client Configuration & API Endpoint Gateway
 */

const APP_CONFIG = {
  APP_NAME: 'Markaz Printing',
  VERSION: '2.0.0',
  DEVELOPER: 'Buana Studios',
  ORGANIZATION: 'Yayasan T.I.B.Y.A.N.',
  
  // Replace with your deployed Google Apps Script Web App URL for GitHub Pages REST API calls:
  // e.g., 'https://script.google.com/macros/s/AKfycbx.../exec'
  API_URL: '', 
  
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
