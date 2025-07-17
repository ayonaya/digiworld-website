// /netlify/functions/firebase-admin.js

// This file centralizes the Firebase Admin SDK initialization.
// Other functions will import 'db' from here instead of initializing it themselves.

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Check if an app is already initialized to prevent errors
if (!getApps().length) {
    try {
        // Parse the service account key from the environment variable
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log("Firebase Admin SDK Initialized Successfully.");
    } catch (e) {
        console.error("Failed to initialize Firebase Admin SDK:", e);
    }
}

// Export the Firestore database instance for use in other functions
const db = getFirestore();

module.exports = { db };
