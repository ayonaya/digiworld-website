// netlify/functions/get-reviews.js
// This function fetches all approved reviews for a specific product.

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { credential } = require('firebase-admin');

// Initialize Firebase Admin SDK only once per function instance
if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        initializeApp({
            credential: credential.cert(serviceAccount),
        });
        console.log("Firebase Admin SDK initialized in get-reviews.");
    } catch (e) {
        console.error("Failed to initialize Firebase Admin SDK in get-reviews:", e);
    }
}
const db = getFirestore();

exports.handler = async (event) => {
    // This function can be called via a GET request
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // The product ID will be passed as a query parameter
        // e.g., /.netlify/functions/get-reviews?productId=win11pro
        const { productId } = event.queryStringParameters;

        if (!productId) {
            return { 
                statusCode: 400, 
                body: JSON.stringify({ success: false, message: 'Product ID is required.' }) 
            };
        }

        const reviewsRef = db.collection('reviews');
        const snapshot = await reviewsRef
            .where('productId', '==', productId)
            .where('isApproved', '==', true) // Only fetch approved reviews
            .orderBy('createdAt', 'desc') // Show the newest reviews first
            .get();

        if (snapshot.empty) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, reviews: [] }), // Return an empty array if no reviews
            };
        }

        const reviews = snapshot.docs.map(doc => {
            const data = doc.data();
            // We can choose which fields to send back to the client
            return {
                id: doc.id,
                authorName: data.authorName,
                rating: data.rating,
                reviewText: data.reviewText,
                createdAt: data.createdAt
            };
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, reviews: reviews }),
        };

    } catch (error) {
        console.error('Error fetching reviews:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'An error occurred while fetching reviews.'
            }),
        };
    }
};
