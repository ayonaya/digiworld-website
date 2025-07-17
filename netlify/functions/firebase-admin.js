// /netlify/functions/firebase-admin.js

// This file centralizes the Firebase Admin SDK initialization.
// This version includes a fix to correctly handle the private key formatting.

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Check if an app is already initialized to prevent errors
if (!getApps().length) {
    try {
        // Get the service account key from environment variables.
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountString) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
        }

        const serviceAccount = JSON.parse(serviceAccountString);

        // IMPORTANT FIX: Replace the escaped newlines ('\\n') in the private key
        // with actual newline characters. This is a common requirement.
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        initializeApp({
            credential: cert(serviceAccount)
        });
        console.log("Firebase Admin SDK Initialized Successfully.");

    } catch (e) {
        // Log the full error to the Netlify function logs for better debugging.
        console.error("CRITICAL: Failed to initialize Firebase Admin SDK. Check your FIREBASE_SERVICE_ACCOUNT_KEY format in the .env file.", e);
    }
}

// Export the Firestore database instance for use in other functions
const db = getFirestore();

module.exports = { db };
