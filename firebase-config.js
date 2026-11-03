// Firebase configuration for MenuLix Customer Menu
// Automatically configured from existing MenuLix Firebase project (menulix-real)

const firebaseConfig = {
  apiKey: "AIzaSyD-MMqWWNIF7GKG_irLhbUvN8UAPd9EabM",
  authDomain: "menulix-real.firebaseapp.com",
  databaseURL: "https://menulix-real-default-rtdb.firebaseio.com",
  projectId: "menulix-real",
  storageBucket: "menulix-real.firebasestorage.app",
  messagingSenderId: "635981357862",
  appId: "1:635981357862:web:270b4625acb16703ee97e7",
  measurementId: "G-YGZY7C89QR"
};

// Initialize Firebase App if not already initialized
try {
  if (typeof firebase === 'undefined') {
    console.error('[MenuLix Diagnostic] Firebase SDK not loaded! Check <script> tags for firebase-app-compat.js.');
    window.firebaseApp = null;
    window.db = null;
  } else {
    if (!firebase.apps || !firebase.apps.length) {
      window.firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      window.firebaseApp = firebase.app();
    }

    // Explicitly attach Firestore instance to window.db AND var db for universal access
    if (typeof firebase.firestore === 'function') {
      window.db = firebase.firestore();
    } else {
      console.error('[MenuLix Diagnostic] firebase.firestore is not a function. Check <script> tag for firebase-firestore-compat.js.');
      window.db = null;
    }
  }
} catch (initErr) {
  console.error('[MenuLix Diagnostic] Firebase initialization error:', initErr);
  window.firebaseApp = null;
  window.db = null;
}

// Global variable export
var db = window.db;
