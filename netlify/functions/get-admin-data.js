// netlify/functions/get-admin-data.js
// This secure function fetches all necessary data for the admin dashboard.

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
        console.log("Firebase Admin SDK initialized in get-admin-data.");
    } catch (e) {
        console.error("Failed to initialize Firebase Admin SDK in get-admin-data:", e);
    }
}
const db = getFirestore();

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { adminPassword } = JSON.parse(event.body);
        const SERVER_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

        // --- Security Check ---
        if (!SERVER_ADMIN_PASSWORD) {
            console.error("ADMIN_PASSWORD environment variable is not set.");
            return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Admin authentication is not configured.' }) };
        }

        if (adminPassword !== SERVER_ADMIN_PASSWORD) {
            console.warn("Incorrect admin password attempt.");
            return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Unauthorized: Incorrect password.' }) };
        }
        // --- End Security Check ---

        console.log("Admin authorized. Fetching dashboard data...");

        // --- Fetch Data from Firestore ---
        // 1. Get recent orders
        const ordersRef = db.collection('orders').orderBy('createdAt', 'desc').limit(50);
        const ordersSnapshot = await ordersRef.get();
        const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Get unapproved reviews
        const reviewsRef = db.collection('reviews').where('isApproved', '==', false).orderBy('createdAt', 'desc');
        const reviewsSnapshot = await reviewsRef.get();
        const pendingReviews = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 3. Get key inventory counts (optional but useful)
        const keysRef = db.collection('digital_keys');
        const availableKeysSnapshot = await keysRef.where('status', '==', 'available').get();
        const inventory = {};
        availableKeysSnapshot.docs.forEach(doc => {
            const keyData = doc.data();
            inventory[keyData.productId] = (inventory[keyData.productId] || 0) + 1;
        });


        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: {
                    orders: orders,
                    pendingReviews: pendingReviews,
                    inventory: inventory
                }
            }),
        };

    } catch (error) {
        console.error('Error in get-admin-data function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'An error occurred while fetching admin data.'
            }),
        };
    }
};
