/**
 * MARKAZ PRINTING v2.0
 * Powered by Buana Studios for Yayasan T.I.B.Y.A.N.
 * firebase.js - Firebase App Initialization & Global SDK Exports
 *
 * Uses the Firebase Compat (v8-API) UMD CDN builds so no bundler is needed.
 * All modules access `db`, `storage`, and `analytics` as globals after this script loads.
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
 * Firebase Storage instance.
 * Used by request.js to upload print documents before creating a Firestore record.
 */
const storage = firebase.storage();

/**
 * Firebase Analytics instance.
 * Passive – automatically tracks page views and custom events.
 */
const analytics = firebase.analytics();

console.log('[Markaz Print] Firebase initialized ✓ | Project:', firebaseConfig.projectId);
