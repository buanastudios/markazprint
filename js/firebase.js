/**
 * MARKAZ PRINTING v3.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * firebase.js - Firebase App Initialization & Global SDK Exports
 *
 * Uses the Firebase Compat (v8-API) UMD CDN builds so no bundler is needed.
 * File uploads go to Google Drive (via GAS), NOT Firebase Storage.
 * Firebase is used for: Firestore (database) + Analytics only.
 */

const firebaseConfig = {
  apiKey: "AIzaSyCx6-7QWniOmwMOk5zjwnn-PXxRpN8DaSw",
  authDomain: "markazprint-cdacc.firebaseapp.com",
  projectId: "markazprint-cdacc",
  storageBucket: "markazprint-cdacc.firebasestorage.app",
  messagingSenderId: "65747488402",
  appId: "1:65747488402:web:e43ff900b7e5698a37204b",
  measurementId: "G-56263066KE"
};

// Initialize Firebase App (guard against double-init in hot-reload scenarios)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

/**
 * Firestore database instance.
 * Used by api.js for all read/write operations on printRequests and users collections.
 */
const db = firebase.firestore();

/**
 * Firebase Analytics instance.
 * Passive – automatically tracks page views and custom events.
 */
const analytics = firebase.analytics();

console.log('[Markaz Print] Firebase initialized ✓ | Project:', firebaseConfig.projectId);
console.log('[Markaz Print] File storage: Google Drive via GAS | Database: Firestore');
