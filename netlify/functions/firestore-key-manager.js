// netlify/functions/firestore-key-manager.js
// This module handles retrieving and marking digital keys as used in Firestore.

const { initializeApp, getApps, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');

// Initialize Firebase Admin SDK using the service account key from environment variable.
// This ensures the SDK is initialized only once per function instance.
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: credential.cert(serviceAccount),
            // If you're using Realtime Database, you might also need:
            // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
        });
        console.log("Firebase Admin SDK initialized.");
    } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK:", e);
        // In a production environment, this error should be critical and prevent function execution.
        // Ensure FIREBASE_SERVICE_ACCOUNT_KEY is correctly set as a single-line JSON string in Netlify env vars.
    }
}

const db = getFirestore(); // Get the Firestore instance

/**
 * Retrieves an available digital key from Firestore and marks it as used.
 * It uses a Firestore transaction to ensure atomicity (prevents race conditions).
 * @param {string} customerEmail - The email of the customer receiving the key.
 * @param {string} orderId - The ID of the order associated with this key.
 * @returns {Promise<string|null>} The digital key string, or null if no keys are available or an error occurs.
 */
async function getAndMarkKeyAsUsed(customerEmail, orderId) {
    const keysRef = db.collection('digital_keys');

    try {
        const key = await db.runTransaction(async (transaction) => {
            // 1. Query for an available key (status 'available')
            const querySnapshot = await transaction.get(
                keysRef.where('status', '==', 'available').limit(1)
            );

            if (querySnapshot.empty) {
                console.warn("No available digital keys found in Firestore.");
                return null; // No keys left
            }

            const keyDoc = querySnapshot.docs[0];
            const keyData = keyDoc.data();

            // 2. Mark the key as used within the transaction
            transaction.update(keyDoc.ref, {
                status: 'used',
                assignedToEmail: customerEmail,
                orderId: orderId,
                timestamp: new Date().toISOString() // Record when it was assigned
            });

            console.log(`Key ${keyData.key} marked as used for order ${orderId} by ${customerEmail}`);
            return keyData.key; // Return the actual key string
        });

        return key; // Returns the key or null from the transaction

    } catch (error) {
        console.error('Error in Firestore transaction for key management:', error);
        // Depending on your error handling strategy, you might re-throw or return null.
        return null; // Indicate failure to retrieve/mark key
    }
}

module.exports = {
    getAndMarkKeyAsUsed,
};
