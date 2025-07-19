// /netlify/functions/get-user-downloads.js

const { db, admin } = require('./firebase-admin');

exports.handler = async (event) => {
    const token = event.headers.authorization?.split('Bearer ')[1];

    if (!token) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Missing authentication token.' }) };
    }

    try {
        // Securely verify the user's identity
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userEmail = decodedToken.email;

        if (!userEmail) {
             return { statusCode: 403, body: JSON.stringify({ message: 'Token is valid, but email is missing.' }) };
        }

        // Query the digital_keys collection directly for all keys assigned to this user's email
        const keysRef = db.collection('digital_keys');
        const snapshot = await keysRef
            .where('assignedToEmail', '==', userEmail)
            .where('status', '==', 'used') // Ensure we only get assigned keys
            .orderBy('assignedAt', 'desc')
            .get();

        if (snapshot.empty) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, downloads: [] })
            };
        }

        const downloads = snapshot.docs.map(doc => {
            const data = doc.data();
            // Return only the necessary data to the frontend
            return {
                productId: data.productId,
                key: data.key,
                orderId: data.orderId,
                assignedAt: data.assignedAt
            };
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, downloads: downloads })
        };

    } catch (error) {
        console.error('Error verifying token or fetching downloads:', error);
        return {
            statusCode: 403, // Forbidden
            body: JSON.stringify({ message: 'Invalid or expired authentication token.' })
        };
    }
};