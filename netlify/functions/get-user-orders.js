// /netlify/functions/get-user-orders.js

const { db, admin } = require('./firebase-admin'); // We need 'admin' for auth

exports.handler = async (event) => {
    // 1. Get the Firebase ID token from the Authorization header.
    const token = event.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Missing authentication token.' }) };
    }

    try {
        // 2. Verify the token using Firebase Admin SDK. This is the security check.
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        if (!userEmail) {
             return { statusCode: 403, body: JSON.stringify({ message: 'Token is valid, but email is missing.' }) };
        }

        // 3. If the token is valid, query the database for orders matching the user's email.
        const ordersRef = db.collection('orders');
        const snapshot = await ordersRef
            .where('customerEmail', '==', userEmail)
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, orders: [] })
            };
        }

        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, orders: orders })
        };

    } catch (error) {
        console.error('Error verifying token or fetching orders:', error);
        // If the token is invalid, verifyIdToken will throw an error.
        return {
            statusCode: 403, // Forbidden
            body: JSON.stringify({ message: 'Invalid or expired authentication token.' })
        };
    }
};