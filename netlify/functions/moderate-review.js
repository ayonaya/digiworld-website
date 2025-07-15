// netlify/functions/moderate-review.js
// This secure function handles approving or deleting a review.

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized in moderate-review.");
    } catch (e) {
        console.error("Failed to initialize Firebase Admin SDK in moderate-review:", e);
    }
}
const db = getFirestore();

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { adminPassword, reviewId, action } = JSON.parse(event.body);
        const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        // --- Security Check ---
        if (!SERVER_ADMIN_PASSWORD || adminPassword !== SERVER_ADMIN_PASSWORD) {
            console.warn("Unauthorized moderation attempt.");
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized.' }) };
        }

        if (!reviewId || !action) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Review ID and action are required.' }) };
        }

        const reviewRef = db.collection('reviews').doc(reviewId);

        if (action === 'approve') {
            await reviewRef.update({ isApproved: true });
            console.log(`Review ${reviewId} has been approved.`);
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Review approved.' }) };
        } else if (action === 'delete') {
            await reviewRef.delete();
            console.log(`Review ${reviewId} has been deleted.`);
            return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Review deleted.' }) };
        } else {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid action.' }) };
        }

    } catch (error) {
        console.error('Error in moderate-review function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'An error occurred while moderating the review.'
            }),
        };
    }
};
