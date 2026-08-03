/**
 * TIBYAN PRINT SERVICE v2.0
 * config.js - Client Configuration & API Endpoint Gateway
 */

const APP_CONFIG = {
  APP_NAME: 'Tibyan Print Service',
  VERSION: '2.0.0',
  ORGANIZATION: 'Yayasan T.I.B.Y.A.N.',
  // Replace with your deployed Google Apps Script Web App URL for GitHub Pages REST API calls:
  // e.g., 'https://script.google.com/macros/s/AKfycbx.../exec'
  API_URL: 'https://script.google.com/macros/s/AKfycbz1XQmXzGqpBsFER91F50K5pkife7N7OHp6Fx_Uz2t2RjAvBHcYR8UlPd_qg-xXacol/exec',
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
