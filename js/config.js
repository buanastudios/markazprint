/**
 * MARKAZ PRINTING v2.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * config.js - Client Application Configuration
 *
 * Backend: Firebase (Firestore + Storage + Analytics)
 * Firebase initialization is handled in js/firebase.js
 */

const APP_CONFIG = {
  APP_NAME: 'Markaz Printing',
  VERSION: '2.0.0',
  DEVELOPER: 'Buana Studios',
  ORGANIZATION: 'Yayasan T.I.B.Y.A.N.',

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
